import re
import uuid

from django.contrib import messages
from django.db.models import Q
from django.http import HttpResponseForbidden
from django.shortcuts import get_object_or_404, redirect, render
from django.utils.html import strip_tags
from django.views.decorators.http import require_http_methods
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.models import (
    FIBQuestion,
    MCQQuestion,
    QuestionReport,
    Quiz,
    SCQQuestion,
    StudentQuizAttempt,
)

REPORT_ALLOWED_ROLES = frozenset({"student", "teacher", "admin", "manager"})


def _can_report(user):
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    return getattr(user, "role", None) in REPORT_ALLOWED_ROLES


def _resolve_question(question_uuid, question_type):
    qtype = (question_type or "").lower()
    if qtype == "scq":
        return SCQQuestion.objects.filter(question_id=question_uuid).first(), qtype
    if qtype == "mcq":
        return MCQQuestion.objects.filter(question_id=question_uuid).first(), qtype
    if qtype == "fib":
        return FIBQuestion.objects.filter(question_id=question_uuid).first(), qtype
    return None, qtype


def _question_in_quiz(quiz, question_uuid, question_type):
    bank_ids = list(quiz.assignments.values_list("question_bank_id", flat=True))
    if not bank_ids:
        return False
    qtype = (question_type or "").lower()
    if qtype == "scq":
        return SCQQuestion.objects.filter(
            question_id=question_uuid, question_bank_id__in=bank_ids
        ).exists()
    if qtype == "mcq":
        return MCQQuestion.objects.filter(
            question_id=question_uuid, question_bank_id__in=bank_ids
        ).exists()
    if qtype == "fib":
        return FIBQuestion.objects.filter(
            question_id=question_uuid, question_bank_id__in=bank_ids
        ).exists()
    return False


def _short_text(raw_html, max_len=120):
    text = re.sub(r"\s+", " ", strip_tags(raw_html or "")).strip()
    if len(text) <= max_len:
        return text
    return f"{text[: max_len - 1]}…"


def _question_detail_payload(question_obj, question_type):
    qtype = (question_type or "").lower()
    payload = {
        "type": qtype,
        "question_text": getattr(question_obj, "question_text", ""),
        "options": None,
        "correct_answer": None,
    }
    if qtype == "scq":
        payload["options"] = {
            "A": question_obj.option_a,
            "B": question_obj.option_b,
            "C": question_obj.option_c,
            "D": question_obj.option_d,
        }
        payload["correct_answer"] = question_obj.correct_answer
    elif qtype == "mcq":
        payload["options"] = {
            "A": question_obj.option_a,
            "B": question_obj.option_b,
            "C": question_obj.option_c,
            "D": question_obj.option_d,
        }
        payload["correct_answer"] = question_obj.correct_answers
    elif qtype == "fib":
        payload["correct_answer"] = question_obj.correct_answers
    return payload


def _duplicate_exists(user, quiz, question_uuid, attempt):
    filters = Q(reported_by=user, quiz=quiz, question_id=question_uuid)
    if attempt:
        filters &= Q(attempt=attempt)
    else:
        filters &= Q(attempt__isnull=True)
    return QuestionReport.objects.filter(filters).exists()


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def report_question(request):
    user = request.user
    if not _can_report(user):
        return Response(
            {"detail": "You are not allowed to report questions."},
            status=status.HTTP_403_FORBIDDEN,
        )

    quiz_id = request.data.get("quiz_id")
    question_id = request.data.get("question_id")
    attempt_id = request.data.get("attempt_id")
    message = (request.data.get("message") or "").strip()

    if not quiz_id or not question_id:
        return Response(
            {"detail": "quiz_id and question_id are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        quiz = Quiz.objects.get(id=quiz_id)
    except Quiz.DoesNotExist:
        return Response({"detail": "Quiz not found."}, status=status.HTTP_404_NOT_FOUND)

    try:
        question_uuid = uuid.UUID(str(question_id))
    except (ValueError, TypeError, AttributeError):
        return Response({"detail": "Invalid question_id."}, status=status.HTTP_400_BAD_REQUEST)

    question_type = (request.data.get("question_type") or "").lower()
    question_obj, resolved_type = _resolve_question(question_uuid, question_type)
    if not question_obj:
        if not question_type:
            for candidate in ("scq", "mcq", "fib"):
                question_obj, resolved_type = _resolve_question(question_uuid, candidate)
                if question_obj:
                    break
        if not question_obj:
            return Response({"detail": "Question not found."}, status=status.HTTP_404_NOT_FOUND)
    elif question_type and resolved_type != question_type:
        return Response({"detail": "Question not found."}, status=status.HTTP_404_NOT_FOUND)

    if not _question_in_quiz(quiz, question_uuid, resolved_type):
        return Response(
            {"detail": "Question does not belong to this quiz."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    attempt = None
    if attempt_id:
        try:
            attempt = StudentQuizAttempt.objects.get(id=attempt_id)
        except StudentQuizAttempt.DoesNotExist:
            return Response({"detail": "Attempt not found."}, status=status.HTTP_404_NOT_FOUND)
        if attempt.student_id != user.id:
            return Response(
                {"detail": "Attempt does not belong to you."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if attempt.quiz_id != quiz.id:
            return Response(
                {"detail": "Attempt does not match this quiz."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    if _duplicate_exists(user, quiz, question_uuid, attempt):
        return Response(
            {"detail": "You have already reported this question."},
            status=status.HTTP_409_CONFLICT,
        )

    client_snapshot = (request.data.get("question_snapshot") or "").strip()
    question_snapshot = client_snapshot or getattr(question_obj, "question_text", "") or ""

    report = QuestionReport.objects.create(
        reported_by=user,
        quiz=quiz,
        question_id=question_uuid,
        question_type=resolved_type,
        question_snapshot=question_snapshot,
        attempt=attempt,
        message=message,
    )

    return Response(
        {
            "detail": "Thank you. This question has been reported for review.",
            "report_id": report.id,
        },
        status=status.HTTP_201_CREATED,
    )


def _require_platform_admin(request):
    user = request.user
    if not user.is_authenticated:
        return HttpResponseForbidden("Authentication required.")
    if not (user.is_superuser or getattr(user, "role", None) == "admin"):
        return HttpResponseForbidden("Only admins are allowed to access this page.")
    return None


@require_http_methods(["GET"])
def question_reports_list(request):
    guard = _require_platform_admin(request)
    if guard:
        return guard

    status_filter = (request.GET.get("status") or "").strip()
    reports = (
        QuestionReport.objects.select_related(
            "reported_by", "quiz", "quiz__grade", "quiz__subject", "attempt"
        )
        .order_by("-created_at")
    )
    if status_filter in dict(QuestionReport.STATUS_CHOICES):
        reports = reports.filter(status=status_filter)

    rows = []
    for report in reports:
        rows.append({"report": report})

    return render(
        request,
        "admin/core/question_reports_list.html",
        {
            "rows": rows,
            "status_filter": status_filter,
            "status_choices": QuestionReport.STATUS_CHOICES,
        },
    )


@require_http_methods(["GET", "POST"])
def question_report_detail(request, report_id):
    guard = _require_platform_admin(request)
    if guard:
        return guard

    report = get_object_or_404(
        QuestionReport.objects.select_related(
            "reported_by", "quiz", "quiz__grade", "quiz__subject", "quiz__chapter", "attempt"
        ),
        id=report_id,
    )

    if request.method == "POST":
        action = (request.POST.get("action") or "").strip()
        admin_note = (request.POST.get("admin_note") or "").strip()

        status_map = {
            "reviewed": QuestionReport.STATUS_REVIEWED,
            "fixed": QuestionReport.STATUS_FIXED,
            "dismiss": QuestionReport.STATUS_DISMISSED,
        }
        if action in status_map:
            report.status = status_map[action]
        if admin_note or "admin_note" in request.POST:
            report.admin_note = admin_note
        report.save()
        messages.success(request, "Report updated.")
        return redirect("question-report-detail", report_id=report.id)

    question_obj, _ = _resolve_question(report.question_id, report.question_type)
    question_detail = (
        _question_detail_payload(question_obj, report.question_type) if question_obj else None
    )
    snapshot_html = report.question_snapshot or (
        question_detail["question_text"] if question_detail else ""
    )

    return render(
        request,
        "admin/core/question_report_detail.html",
        {
            "report": report,
            "question_detail": question_detail,
            "snapshot_html": snapshot_html,
            "question_short": _short_text(snapshot_html),
        },
    )
