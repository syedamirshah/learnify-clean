import pandas as pd
import logging
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from .forms import SelfRegistrationForm, UploadSCQForm, UploadMCQForm, UploadFIBForm
from core.models import QuestionBank, SCQQuestion, MCQQuestion, FIBQuestion
from django.contrib.admin.views.decorators import staff_member_required
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from core.models import Quiz, QuizQuestionAssignment, MCQQuestion, FIBQuestion, SCQQuestion, StudentQuizAttempt , Subject
from django.utils import timezone
from random import sample, shuffle
import json
from core.models import StudentAnswer
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .permissions import has_active_subscription, HasPaidSubscription
from django.utils.timezone import localtime
from django.db import models
from django.db.models import Prefetch
from django.db.utils import ProgrammingError, OperationalError
from .serializers import (
    QuizListSerializer,
    TopicLandingSerializer,
    WeekLandingSerializer,
)
from rest_framework import status
from .models import (
    StudentQuizAttempt,
    SCQQuestion, MCQQuestion, FIBQuestion,
    QuizAttempt, User, TopicQuiz, WeekQuiz, TopicProgress, WeekProgress
)
import numpy as np
from collections import defaultdict
from django.db.models import Sum
from rest_framework.permissions import AllowAny
from datetime import timedelta
from rest_framework.permissions import IsAdminUser
from django.db.models import Count
from .serializers import UserListSerializer
import re
from django.utils.html import strip_tags
import html
from bs4 import BeautifulSoup
from django.contrib.auth.decorators import user_passes_test
from django.db.models import Count, Sum, Avg
from django.contrib.auth import get_user_model
from .serializers import UserRegistrationSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import parser_classes
from .serializers import PublicSignupSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer
from .serializers import EditProfileSerializer, ChangePasswordSerializer
from .models import Grade, Topic, Week, TopicQuiz, WeekQuiz
from django.utils.timezone import localtime
import pytz
from core.utils import normalize_text, normalize_numeric_commas
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET
from core.emails import send_password_change_email, send_welcome_email
from django.db.models import Q
from django.utils.dateparse import parse_date
from core.models import TeacherTask, TeacherTaskQuiz
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

# Define the Pakistan time zone once
pk_timezone = pytz.timezone('Asia/Karachi')
logger = logging.getLogger(__name__)



def register(request):
    if request.method == 'POST':
        form = SelfRegistrationForm(request.POST, request.FILES)
        if form.is_valid():
            user = form.save(commit=False)

            # capture plain password so the post_save signal can email it
            plain_pw = (
                form.cleaned_data.get('password')     # some forms use 'password'
                or form.cleaned_data.get('password1') # many Django forms use 'password1'
                or form.cleaned_data.get('new_password')
            )
            user._plain_password = plain_pw or ""
            user.set_password(plain_pw or "")

            user.account_status = 'inactive'  # Always inactive
            user.save()

            messages.success(request, "Registration submitted successfully. Please wait for account activation.")
            return redirect('/register/')
    else:
        form = SelfRegistrationForm()
    return render(request, 'core/register.html', {'form': form})

User = get_user_model()

def calculate_grade(percentage):
    if percentage >= 95:
        return "A+"
    elif percentage >= 90:
        return "A-"
    elif percentage >= 85:
        return "B+"
    elif percentage >= 80:
        return "B-"
    elif percentage >= 75:
        return "C+"
    elif percentage >= 70:
        return "C-"
    elif percentage >= 65:
        return "D+"
    elif percentage >= 60:
        return "D-"
    else:
        return "F"


def _attempt_percentage(attempt):
    """Percentage from stored attempt score (same basis as student quiz history)."""
    quiz = attempt.quiz
    total_questions = quiz.assignments.aggregate(total=models.Sum('num_questions'))['total'] or 0
    total_marks = total_questions * quiz.marks_per_question
    if not total_marks:
        return 0.0
    return round((attempt.score / total_marks) * 100, 2)


def _chapter_mastery_status(avg_percentage):
    if avg_percentage >= 80:
        return 'strong'
    if avg_percentage >= 50:
        return 'improving'
    return 'weak'


def _learning_health_from_average(overall_avg):
    score = int(round(overall_avg))
    if score >= 80:
        status = 'Strong'
    elif score >= 50:
        status = 'Improving'
    else:
        status = 'Needs Attention'
    return score, status


def _attention_required(chapter_mastery, limit=3):
    weakest = sorted(chapter_mastery, key=lambda c: c['average_percentage'])
    return [
        {
            'chapter_name': c['chapter_name'],
            'percentage': int(round(c['average_percentage'])),
        }
        for c in weakest[:limit]
    ]


def _compute_learning_trend(student):
    attempts = StudentQuizAttempt.objects.filter(
        student=student,
        completed_at__isnull=False,
    ).select_related('quiz').order_by('-completed_at')

    percentages = [_attempt_percentage(a) for a in attempts]
    if not percentages:
        return {
            'recent_average': 0,
            'previous_average': 0,
            'trend': 'Stable',
        }

    recent_slice = percentages[:5]
    previous_slice = percentages[5:10]
    recent_avg = round(sum(recent_slice) / len(recent_slice), 2)
    if previous_slice:
        previous_avg = round(sum(previous_slice) / len(previous_slice), 2)
    else:
        previous_avg = recent_avg

    diff = recent_avg - previous_avg
    if diff > 5:
        trend = 'Improving'
    elif diff < -5:
        trend = 'Declining'
    else:
        trend = 'Stable'

    return {
        'recent_average': recent_avg,
        'previous_average': previous_avg,
        'trend': trend,
    }


def _primary_subject_name(quiz_rows, chapter_mastery):
    counts = {}
    for row in quiz_rows:
        name = (row.get('subject_name') or '').strip()
        if name:
            counts[name] = counts.get(name, 0) + 1
    for chapter in chapter_mastery:
        name = (chapter.get('subject_name') or '').strip()
        if name:
            counts[name] = counts.get(name, 0) + 1
    if not counts:
        return 'Mathematics'
    return max(counts, key=counts.get)


def _join_chapter_names(names, limit=3):
    if not names:
        return ''
    shown = names[:limit]
    text = ', '.join(shown)
    if len(names) > limit:
        text += f", and {len(names) - limit} more"
    return text


def _build_parent_friendly_summary(
    full_name,
    strong_chapters,
    weak_chapters,
    learning_trend=None,
    primary_subject='Mathematics',
):
    display = (full_name or '').strip() or 'The student'
    first_name = display.split()[0] if display else 'The student'

    if not strong_chapters and not weak_chapters:
        return (
            f"{first_name} has not completed enough quizzes yet for a full learning diagnosis."
        )

    trend = (learning_trend or {}).get('trend', 'Stable')
    if trend == 'Improving':
        progress_phrase = 'making steady progress'
    elif trend == 'Declining':
        progress_phrase = 'would benefit from additional focused review'
    else:
        progress_phrase = 'is progressing steadily'

    subject = (primary_subject or 'Mathematics').strip() or 'Mathematics'
    strong_names = [c['chapter_name'] for c in strong_chapters]
    weak_names = [c['chapter_name'] for c in weak_chapters]

    parts = [f"{first_name} is {progress_phrase} in {subject}."]

    if strong_names:
        parts.append(
            f"Strong performance was observed in {_join_chapter_names(strong_names)}."
        )
    if weak_names:
        parts.append(
            f"Additional practice is recommended in {_join_chapter_names(weak_names)}."
        )
    elif not strong_names:
        parts.append("Keep practicing regularly to build confidence across all chapters.")

    return ' '.join(parts)


def _learning_diagnosis_v2_fields(student, overall_avg, chapter_mastery, quiz_rows,
                                  strong_chapters, weak_chapters):
    learning_health_score, health_status = _learning_health_from_average(overall_avg)
    learning_trend = _compute_learning_trend(student)
    primary_subject = _primary_subject_name(quiz_rows, chapter_mastery)
    return {
        'learning_health_score': learning_health_score,
        'health_status': health_status,
        'attention_required': _attention_required(chapter_mastery),
        'learning_trend': learning_trend,
        'parent_friendly_summary': _build_parent_friendly_summary(
            student.full_name,
            strong_chapters,
            weak_chapters,
            learning_trend=learning_trend,
            primary_subject=primary_subject,
        ),
    }


@staff_member_required
def bulk_upload_scq(request, bank_id):
    from core.forms import UploadSCQForm
    bank = get_object_or_404(QuestionBank, id=bank_id, type='SCQ')

    if request.method == 'POST' and request.FILES.get('file'):
        file = request.FILES['file']
        df = pd.read_excel(file)

        uploaded, skipped = 0, 0
        for _, row in df.iterrows():
            if all(pd.notna(row.get(col)) for col in ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer']):
                SCQQuestion.objects.create(
                    question_bank=bank,
                    question_text=row['question'],
                    option_a=row['option_a'],
                    option_b=row['option_b'],
                    option_c=row['option_c'],
                    option_d=row['option_d'],
                    correct_answer=row['correct_answer']
                )
                uploaded += 1
            else:
                skipped += 1

        messages.success(request, f" {uploaded} SCQ questions uploaded successfully.  {skipped} rows skipped.")
        return redirect(f'/preview-questions/{bank.id}/')

    # FIX: define form in GET branch
    form = UploadSCQForm(initial={'question_bank_id': bank_id})
    return render(request, 'admin/core/scq_upload_form.html', {'form': form, 'bank': bank})

@staff_member_required
def bulk_upload_mcq(request, bank_id):
    from core.forms import UploadMCQForm
    bank = get_object_or_404(QuestionBank, id=bank_id, type='MCQ')

    if request.method == 'POST' and request.FILES.get('file'):
        file = request.FILES['file']
        df = pd.read_excel(file)

        uploaded, skipped = 0, 0
        for _, row in df.iterrows():
            if all(pd.notna(row.get(col)) for col in ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answers']):
                MCQQuestion.objects.create(
                    question_bank=bank,
                    question_text=row['question'],
                    option_a=row['option_a'],
                    option_b=row['option_b'],
                    option_c=row['option_c'],
                    option_d=row['option_d'],
                    correct_answers=row['correct_answers']  # comma-separated
                )
                uploaded += 1
            else:
                skipped += 1

        messages.success(request, f"‚ {uploaded} MCQ questions uploaded. {skipped} rows skipped.")
        return redirect(f'/preview-questions/{bank.id}/')

    form = UploadMCQForm(initial={'question_bank_id': bank_id})
    return render(request, 'admin/core/mcq_upload_form.html', {'form': form, 'bank': bank})

@staff_member_required
def bulk_upload_fib(request, bank_id):
    bank = get_object_or_404(QuestionBank, id=bank_id, type='FIB')

    if request.method == 'POST' and request.FILES.get('file'):
        file = request.FILES['file']
        df = pd.read_excel(file)

        created_count = 0
        for _, row in df.iterrows():
            question_text = row.get('question')
            correct_answers_raw = row.get('correct_answers')

            if pd.isna(question_text) or pd.isna(correct_answers_raw):
                continue

            try:
                correct_answers = json.loads(correct_answers_raw)
                if not isinstance(correct_answers, dict):
                    raise ValueError
            except Exception:
                continue  # Skip if JSON is invalid or not a dict

            FIBQuestion.objects.create(
                question_bank=bank,
                question_text=question_text,
                correct_answers=correct_answers
            )
            created_count += 1

        messages.success(request, f"FIB upload complete: {created_count} question(s) added.")
        return redirect(f'/preview-questions/{bank.id}/')

    return render(request, 'admin/core/fib_upload_form.html', {'bank': bank})

@api_view(['POST'])
@permission_classes([AllowAny])  # ✅ Allow unauthenticated users (guests) to preview
@csrf_exempt
def start_quiz(request, quiz_id):
    user = request.user if request.user.is_authenticated else None

    # Read mode from frontend (defaults to 'learning')
    # learning  = bidirectional, trial & error
    # exam      = one-way, locked questions (frontend will enforce behaviour)
    mode = (request.data.get('mode')
            or request.query_params.get('mode')
            or 'learning').lower()
    if mode not in ['learning', 'exam']:
        mode = 'learning'

    # Always fetch quiz first before role logic
    try:
        quiz = Quiz.objects.get(id=quiz_id)
    except Quiz.DoesNotExist:
        return JsonResponse({'error': 'Quiz not found.'}, status=404)

    preview_mode = False

    # Determine preview mode
    if not user:
        preview_mode = True  # Guest user
    else:
        role = getattr(user, 'role', '')

        if role == 'teacher':
            preview_mode = True
        elif role == 'student':
            user_grade_str = str(user.grade) if user.grade else ""
            quiz_grade_str = str(quiz.grade) if quiz.grade else ""

            if not user_grade_str or not quiz_grade_str or user_grade_str != quiz_grade_str:
                preview_mode = True
            elif not has_active_subscription(user):
                preview_mode = True

    questions_output = []
    selected_question_ids = []

    for assignment in quiz.assignments.all():
        bank = assignment.question_bank
        qtype = bank.type.upper()
        num = assignment.num_questions

        # 🔍 Adjust number of questions in preview mode
        limit = min(num, 3) if preview_mode else num

        if qtype == 'SCQ':
            questions = list(SCQQuestion.objects.filter(question_bank=bank))
            selected = sample(questions, min(limit, len(questions)))
            for q in selected:
                options = [q.option_a, q.option_b, q.option_c, q.option_d]
                shuffle(options)
                questions_output.append({
                    'question_id': str(q.question_id),
                    'type': 'scq',
                    'question_text': q.question_text,
                    'options': options
                })
                selected_question_ids.append(str(q.question_id))

        elif qtype == 'MCQ':
            questions = list(MCQQuestion.objects.filter(question_bank=bank))
            selected = sample(questions, min(limit, len(questions)))
            for q in selected:
                options = [q.option_a, q.option_b, q.option_c, q.option_d]
                shuffle(options)
                questions_output.append({
                    'question_id': str(q.question_id),
                    'type': 'mcq',
                    'question_text': q.question_text,
                    'options': options
                })
                selected_question_ids.append(str(q.question_id))

        elif qtype == 'FIB':
            questions = list(FIBQuestion.objects.filter(question_bank=bank))
            selected = sample(questions, min(limit, len(questions)))
            for q in selected:
                cleaned_text = re.sub(r'value=".*?"', '', q.question_text)
                questions_output.append({
                    'question_id': str(q.question_id),
                    'type': 'fib',
                    'question_text': cleaned_text
                })
                selected_question_ids.append(str(q.question_id))

    # 🟢 Create attempt only if it's NOT preview
    if not preview_mode and user:
        attempt = StudentQuizAttempt.objects.create(student=user, quiz=quiz)
        attempt.meta = {
            'selected_qids': selected_question_ids,  # ✅ fixed key
            'mode': mode,                            # ✅ store mode for this attempt
        }
        attempt.save()
        attempt_id = attempt.id
    else:
        attempt_id = None

    return Response({
        'preview_mode': preview_mode,
        'attempt_id': attempt_id,
        'quiz_title': quiz.title,
        'questions': questions_output,
        'total_expected_questions': len(questions_output),
        'formatting': {
            'font_size': quiz.font_size,
            'text_alignment': quiz.text_alignment,
            'input_box_width': quiz.input_box_width,
            'line_spacing': quiz.line_spacing,
        }
    })

@csrf_exempt
def submit_quiz(request, attempt_id):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST request required.'}, status=400)

    user = request.user
    if not user.is_authenticated or user.role != 'student':
        return JsonResponse({'error': 'Only authenticated students can submit quizzes.'}, status=403)

    if not has_active_subscription(user):
        return JsonResponse({'detail': 'Subscription required'}, status=403)

    try:
        attempt = StudentQuizAttempt.objects.get(id=attempt_id, student=user)
    except StudentQuizAttempt.DoesNotExist:
        return JsonResponse({'error': 'Invalid quiz attempt ID.'}, status=404)

    if attempt.completed_at:
        return JsonResponse({'error': 'Quiz already submitted.'}, status=400)

    try:
        data = json.loads(request.body)
        answers = data.get("answers", [])
    except:
        return JsonResponse({'error': 'Invalid JSON data.'}, status=400)

    correct_count = 0
    quiz = attempt.quiz
    assigned_qs = quiz.assignments.aggregate(total=models.Sum('num_questions'))['total'] or 0
    total_questions = assigned_qs

    for ans in answers:
        qid = ans['question_id']
        qtype = ans['question_type'].lower()
        given = ans['answer']
        is_correct = False

        try:
            if qtype == 'scq':
                q = SCQQuestion.objects.get(question_id=str(qid))
                is_correct = (given == q.correct_answer)

            elif qtype == 'mcq':
                q = MCQQuestion.objects.get(question_id=str(qid))

                correct = set(q.correct_answers.split(','))
                is_correct = set(given) == correct

            elif qtype == 'fib':
                q = FIBQuestion.objects.get(question_id=str(qid))
                correct_answer = q.correct_answers

                if isinstance(given, dict) and isinstance(correct_answer, dict):
                    normalized_student = {
                        str(k).lower(): normalize_numeric_commas(v)
                        for k, v in given.items() if v is not None
                    }
                    normalized_correct = {
                        str(k).lower(): normalize_numeric_commas(v)
                        for k, v in correct_answer.items() if v is not None
                    }
                    is_correct = normalized_student == normalized_correct
                else:
                    is_correct = False

            # Save answer
            StudentAnswer.objects.create(
                attempt=attempt,
                question_id=str(qid),
                question_type=qtype,
                answer_data=given
            )

            if is_correct:
                correct_count += 1

        except Exception:
            continue  # Skip invalid question

    # Calculate score
    marks_per_question = quiz.marks_per_question
    total_marks = correct_count * marks_per_question
    percentage = (total_marks / (total_questions * marks_per_question)) * 100
    duration = (timezone.now() - attempt.started_at).total_seconds()

    def get_grade(score):
        if score >= 95: return "A+"
        elif score >= 90: return "A-"
        elif score >= 85: return "B+"
        elif score >= 80: return "B-"
        elif score >= 75: return "C+"
        elif score >= 70: return "C-"
        elif score >= 65: return "D+"
        elif score >= 60: return "D-"
        return "F"

    grade = get_grade(percentage)

    # Compare with best previous attempt
    previous_best = StudentQuizAttempt.objects.filter(
        student=user, quiz=quiz, completed_at__isnull=False
    ).exclude(id=attempt.id).order_by('-score').first()

    if previous_best and previous_best.score >= total_marks:
        attempt.delete()
        return JsonResponse({
            "result": {
                "message": "Submitted, but score is lower than previous best.",
                "previous_best_score": previous_best.score,
                "current_score": total_marks
            }
        })

    # Save as best attempt
    attempt.score = total_marks
    attempt.completed_at = timezone.now()
    attempt.save()

    if previous_best:
        previous_best.delete()

    return JsonResponse({
        "result": {
            "total_questions": total_questions,
            "correct_answers": correct_count,
            "marks_obtained": total_marks,
            "percentage": round(percentage, 2),
            "grade": grade,
            "duration_seconds": int(duration)
        }
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated, HasPaidSubscription])
def list_student_quiz_results(request):
    user = request.user
    if user.role != 'student':
        return Response({'error': 'Only students can view their quiz results.'}, status=403)

    attempts = StudentQuizAttempt.objects.filter(
        student=user,
        completed_at__isnull=False
    ).order_by('-completed_at')

    results = []
    for attempt in attempts:
        quiz = attempt.quiz
        total_questions = quiz.assignments.aggregate(total=models.Sum('num_questions'))['total'] or 0
        total_marks = total_questions * quiz.marks_per_question

        correct_answers = 0
        for answer in attempt.answers.all():
            qid = answer.question_id
            if answer.question_type == 'scq':
                try:
                    q = SCQQuestion.objects.get(question_id=str(qid))
                    if answer.answer_data.get('selected') == q.correct_answer:
                        correct_answers += 1
                except SCQQuestion.DoesNotExist:
                    continue
            elif answer.question_type == 'mcq':
                try:
                    q = MCQQuestion.objects.get(question_id=str(qid))
                    correct_options = sorted([x.strip() for x in q.correct_answers.split(',')])
                    selected_options = sorted(answer.answer_data.get('selected', []))
                    if selected_options == correct_options:
                        correct_answers += 1
                except MCQQuestion.DoesNotExist:
                    continue
            elif answer.question_type == 'fib':
                try:
                    q = FIBQuestion.objects.get(question_id=str(qid))
                    if q.correct_answers == answer.answer_data:
                        correct_answers += 1
                except FIBQuestion.DoesNotExist:
                    continue

        marks_obtained = correct_answers * quiz.marks_per_question
        percentage = round((marks_obtained / total_marks) * 100, 2) if total_marks else 0
        grade = calculate_grade(percentage) if total_marks else 'F'

        results.append({
            'attempt_id': str(attempt.id),
            'quiz_title': quiz.title,
            'chapter': quiz.chapter.name if quiz.chapter else "",
            'subject': quiz.subject.name if quiz.subject else "",
            'grade': quiz.grade.name if quiz.grade else "",
            'question_banks': [a.question_bank.title for a in quiz.assignments.all()],
            'total_questions': total_questions,
            'marks_per_question': quiz.marks_per_question,
            'marks_obtained': marks_obtained,
            'percentage': percentage,
            'grade_letter': grade,
            'attempted_on': localtime(attempt.completed_at, timezone=pk_timezone).strftime('%d-%m-%Y %I:%M %p')
        })

    return Response({'results': results})


@api_view(['GET'])
@permission_classes([IsAuthenticated, HasPaidSubscription])
def get_quiz_result(request, attempt_id):
    user = request.user

    try:
        attempt = StudentQuizAttempt.objects.get(id=attempt_id, completed_at__isnull=False)
    except StudentQuizAttempt.DoesNotExist:
        return Response({'error': 'Quiz attempt not found or incomplete.'}, status=404)

    # ‚Äö√Ñ√∂‚àö√ë‚àö‚àÇ‚Äö√†√∂‚Äö√†¬¥‚Äö√†√∂‚àö¬± Check authorization
    if user != attempt.student and user.role not in ['admin', 'manager', 'teacher']:
        return Response({'error': 'Unauthorized access to this result.'}, status=403)

    result = QuizAttempt.objects.filter(student=attempt.student, quiz=attempt.quiz).order_by('-end_time').first()
    if not result:
        return Response({'error': 'Result not available for this attempt.'}, status=404)

    answers = attempt.answers.all()
    questions_data = []
    evaluated_qids = set()

    for answer in answers:
        qid = answer.question_id
        qtype = answer.question_type
        student_answer = None
        correct_answer = None
        is_correct = False
        question_text = ""

        try:
            if qtype == 'scq':
                q = SCQQuestion.objects.get(question_id=str(qid))
                question_text = html.unescape(strip_tags(q.question_text)).strip()
                correct_label = (q.correct_answer or "").strip().upper()
                option_map = {'A': q.option_a, 'B': q.option_b, 'C': q.option_c, 'D': q.option_d}
                correct_answer = option_map.get(correct_label)
                student_answer = answer.answer_data.get('selected', '')
                is_correct = (
                    normalize_text(student_answer) == normalize_text(correct_answer)
                    if student_answer and correct_answer else False
                )

            elif qtype == 'mcq':
                q = MCQQuestion.objects.get(question_id=str(qid))
                question_text = html.unescape(strip_tags(q.question_text)).strip()
                correct_labels = [x.strip().lower() for x in q.correct_answers.split(',')]
                options_map = {
                    'a': q.option_a,
                    'b': q.option_b,
                    'c': q.option_c,
                    'd': q.option_d
                }
                correct_answer = sorted([
                    normalize_text(options_map[label]) for label in correct_labels if label in options_map
                ])

                student_answer = answer.answer_data.get('selected', [])
                if isinstance(student_answer, str):
                    student_answer = [student_answer]

                student_answer = sorted([normalize_text(x) for x in student_answer])
                is_correct = student_answer == correct_answer

            elif qtype == 'fib':
                q = FIBQuestion.objects.get(question_id=str(qid))
                question_text = html.unescape(strip_tags(q.question_text)).strip()
                correct_answer = q.correct_answers
                student_answer = answer.answer_data

                if isinstance(student_answer, dict) and isinstance(correct_answer, dict):
                    normalized_student = {
                        str(k).strip().lower(): normalize_numeric_commas(v)
                        for k, v in student_answer.items()
                        if v and str(v).strip()
                    }
                    normalized_correct = {
                        str(k).strip().lower(): normalize_numeric_commas(v)
                        for k, v in correct_answer.items()
                        if v and str(v).strip()
                    }
                    is_correct = normalized_student == normalized_correct
                else:
                    is_correct = False

            questions_data.append({
                'question_type': qtype,
                'question_text': question_text,
                'correct_answer': correct_answer,
                'student_answer': student_answer,
                'is_correct': is_correct
            })
            evaluated_qids.add(qid)

        except (SCQQuestion.DoesNotExist, MCQQuestion.DoesNotExist, FIBQuestion.DoesNotExist):
            print(f"‚Äö√Ñ√∂‚àö√ë‚àö‚àÇ‚Äö√†√∂‚Äö√†√á‚Äö√Ñ√∂‚àö√ë‚Äö√Ñ‚Ä†‚Äö√†√∂‚àö√Ü‚Äö√Ñ√∂‚àö‚Ä†‚àö¬Æ‚Äö√†√∂¬¨√Ü Failed to find question with ID: {qid} for type: {qtype}")
            continue

    intended_questions = attempt.quiz.assignments.aggregate(total=models.Sum('num_questions'))['total'] or 0
    total_marks = intended_questions * attempt.quiz.marks_per_question
    marks_obtained = result.marks_obtained
    percentage = (marks_obtained / total_marks) * 100 if total_marks else 0

    return Response({
        'quiz_title': result.quiz.title,
        'subject': result.quiz.subject.name if result.quiz.subject else None,
        'grade': result.quiz.grade.name if result.quiz.grade else None,
        'total_questions': intended_questions,
        'correct_answers': result.correct_answers,
        'incorrect_answers': intended_questions - result.correct_answers,
        'marks_obtained': marks_obtained,
        'percentage': round(percentage, 2),
        'grade_letter': result.grade(),
        'completed_at': localtime(attempt.completed_at, timezone=pk_timezone).strftime('%d-%m-%Y %I:%M %p'),
        'questions': questions_data
    }, status=200)

def calculate_grade(score):
    if score >= 95: return "A+"
    elif score >= 90: return "A-"
    elif score >= 85: return "B+"
    elif score >= 80: return "B-"
    elif score >= 75: return "C+"
    elif score >= 70: return "C-"
    elif score >= 65: return "D+"
    elif score >= 60: return "D-"
    return "F"


@api_view(['GET'])
@permission_classes([IsAuthenticated, HasPaidSubscription])
def list_quiz_results(request):
    user = request.user

    # If user is not allowed to attempt quizzes, deny access
    if user.role not in ['student', 'teacher', 'admin', 'manager']:
        return Response({"error": "Access denied."}, status=403)

    attempts = StudentQuizAttempt.objects.filter(student=user, completed_at__isnull=False).order_by('-completed_at')

    results = []
    for attempt in attempts:
        quiz = attempt.quiz
        total_questions = attempt.quiz.assignments.aggregate(total=models.Sum('num_questions'))['total'] or 0
        total_marks = total_questions * quiz.marks_per_question
        percentage = (attempt.score / total_marks) * 100 if total_marks else 0

        # Grading logic (same as used in submit_quiz)
        def get_grade(score):
            if score >= 95: return "A+"
            elif score >= 90: return "A-"
            elif score >= 85: return "B+"
            elif score >= 80: return "B-"
            elif score >= 75: return "C+"
            elif score >= 70: return "C-"
            elif score >= 65: return "D+"
            elif score >= 60: return "D-"
            return "F"

        grade = get_grade(percentage)

        results.append({
            'quiz_title': quiz.title,
            'subject': quiz.subject.name,
            'marks_obtained': attempt.score,
            'total_marks': total_marks,
            'percentage': round(percentage, 2),
            'grade': grade,
            'completed_at': localtime(attempt.completed_at, timezone=pk_timezone).strftime('%d-%m-%Y %I:%M %p'),
        })

    return Response({'results': results})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_all_quizzes(request):
    if request.user.role != 'admin':
        return Response({'detail': 'Unauthorized. Only admins can view quizzes.'}, status=status.HTTP_403_FORBIDDEN)

    quizzes = Quiz.objects.all().prefetch_related('assignments__question_bank', 'grade', 'subject', 'chapter')
    serializer = QuizListSerializer(quizzes, many=True)
    return Response(serializer.data)

import traceback

import uuid
import traceback

@api_view(['POST'])
@permission_classes([IsAuthenticated, HasPaidSubscription])
def submit_answer(request):
    user = request.user
    print("DEBUG: Incoming request from user:", user.username)
    print("DEBUG: Role =", user.role)
    print("DEBUG: Authenticated =", user.is_authenticated)

    if user.role != 'student':
        return Response({'detail': 'Only students can submit answers.'}, status=status.HTTP_403_FORBIDDEN)

    data = request.data
    attempt_id = data.get('attempt_id')
    question_id = data.get('question_id')
    question_type = (data.get('question_type') or '').lower()
    answer_data = data.get('answer_data')

    print("DEBUG DATA RECEIVED")
    print("attempt_id:", attempt_id)
    print("question_id:", question_id)
    print("question_type:", question_type)
    print("answer_data:", answer_data)

    # Check all fields exist
    if not all([attempt_id, question_id, question_type, answer_data is not None]):
        print("Missing required fields.")
        return Response({'detail': 'Missing fields.'}, status=status.HTTP_400_BAD_REQUEST)

    # Prevent saving totally empty answers (same as before)
    if isinstance(answer_data, dict):
        if all(str(v).strip() == '' for v in answer_data.values()):
            print("Empty dict answer detected. Not saving.")
            return Response({'detail': 'Answer is empty and was not saved.'}, status=status.HTTP_204_NO_CONTENT)
    elif isinstance(answer_data, str):
        if answer_data.strip() == "":
            print("Empty string answer detected. Not saving.")
            return Response({'detail': 'Answer is empty and was not saved.'}, status=status.HTTP_204_NO_CONTENT)

    # Validate UUID
    try:
        question_uuid = uuid.UUID(str(question_id))
    except ValueError:
        print("Invalid UUID for question_id:", question_id)
        return Response({'detail': 'Invalid question ID.'}, status=status.HTTP_400_BAD_REQUEST)

    # Fetch attempt
    try:
        attempt = StudentQuizAttempt.objects.get(id=attempt_id, student=user, completed_at__isnull=True)
    except StudentQuizAttempt.DoesNotExist:
        print("Attempt not found or already finalized.")
        return Response({'detail': 'Attempt not found or already finalized.'}, status=status.HTTP_404_NOT_FOUND)

    quiz = attempt.quiz

    # Save or replace answer
    try:
        StudentAnswer.objects.filter(attempt=attempt, question_id=question_uuid).delete()

        saved_answer = StudentAnswer.objects.create(
            attempt=attempt,
            question_type=question_type,
            question_id=question_uuid,
            answer_data=answer_data
        )

        print("Answer saved successfully")

        # ================
        # ✅ LIVE EVALUATION
        # ================
        # 1) Check if THIS answer is correct (no correct options revealed)
        is_correct = False
        student_answer = saved_answer.answer_data

        try:
            if question_type == 'scq':
                q = SCQQuestion.objects.get(question_id=question_uuid)
                correct_label = (q.correct_answer or "").strip().upper()
                option_map = {'A': q.option_a, 'B': q.option_b, 'C': q.option_c, 'D': q.option_d}
                correct_answer_text = option_map.get(correct_label)
                selected = student_answer.get('selected') if isinstance(student_answer, dict) else student_answer
                is_correct = (
                    normalize_text(selected) == normalize_text(correct_answer_text)
                    if selected and correct_answer_text else False
                )

            elif question_type == 'mcq':
                q = MCQQuestion.objects.get(question_id=question_uuid)
                correct_labels = [x.strip().lower() for x in q.correct_answers.split(',')]
                options_map = {
                    'a': q.option_a,
                    'b': q.option_b,
                    'c': q.option_c,
                    'd': q.option_d
                }
                correct_answers_text = sorted([
                    normalize_text(options_map[label]) for label in correct_labels if label in options_map
                ])

                selected = student_answer.get('selected', []) if isinstance(student_answer, dict) else student_answer
                if isinstance(selected, str):
                    selected = [selected]
                selected = sorted([normalize_text(x) for x in selected])
                is_correct = selected == correct_answers_text

            elif question_type == 'fib':
                q = FIBQuestion.objects.get(question_id=question_uuid)
                correct_answer_obj = q.correct_answers
                if isinstance(student_answer, dict) and isinstance(correct_answer_obj, dict):
                    normalized_student = {
                        str(k).strip().lower(): normalize_numeric_commas(v)
                        for k, v in student_answer.items()
                        if v and str(v).strip()
                    }
                    normalized_correct = {
                        str(k).strip().lower(): normalize_numeric_commas(v)
                        for k, v in correct_answer_obj.items()
                        if v and str(v).strip()
                    }
                    is_correct = normalized_student == normalized_correct
                else:
                    is_correct = False

        except (SCQQuestion.DoesNotExist, MCQQuestion.DoesNotExist, FIBQuestion.DoesNotExist):
            is_correct = False

        # 2) Recompute current score from ALL answers of this attempt
        all_answers = StudentAnswer.objects.filter(attempt=attempt)
        correct_count = 0

        for ans in all_answers:
            qid = ans.question_id
            qtype = ans.question_type
            ans_data = ans.answer_data

            try:
                if qtype == 'scq':
                    q = SCQQuestion.objects.get(question_id=qid)
                    correct_label = (q.correct_answer or "").strip().upper()
                    option_map = {'A': q.option_a, 'B': q.option_b, 'C': q.option_c, 'D': q.option_d}
                    correct_text = option_map.get(correct_label)
                    selected = ans_data.get('selected') if isinstance(ans_data, dict) else ans_data
                    ok = (
                        normalize_text(selected) == normalize_text(correct_text)
                        if selected and correct_text else False
                    )

                elif qtype == 'mcq':
                    q = MCQQuestion.objects.get(question_id=qid)
                    correct_labels = [x.strip().lower() for x in q.correct_answers.split(',')]
                    options_map = {
                        'a': q.option_a,
                        'b': q.option_b,
                        'c': q.option_c,
                        'd': q.option_d
                    }
                    correct_texts = sorted([
                        normalize_text(options_map[label]) for label in correct_labels if label in options_map
                    ])

                    selected = ans_data.get('selected', []) if isinstance(ans_data, dict) else ans_data
                    if isinstance(selected, str):
                        selected = [selected]
                    selected = sorted([normalize_text(x) for x in selected])
                    ok = selected == correct_texts

                elif qtype == 'fib':
                    q = FIBQuestion.objects.get(question_id=qid)
                    correct_obj = q.correct_answers
                    if isinstance(ans_data, dict) and isinstance(correct_obj, dict):
                        norm_student = {
                            str(k).strip().lower(): normalize_numeric_commas(v)
                            for k, v in ans_data.items()
                            if v and str(v).strip()
                        }
                        norm_correct = {
                            str(k).strip().lower(): normalize_numeric_commas(v)
                            for k, v in correct_obj.items()
                            if v and str(v).strip()
                        }
                        ok = norm_student == norm_correct
                    else:
                        ok = False
                else:
                    ok = False

                if ok:
                    correct_count += 1

            except (SCQQuestion.DoesNotExist, MCQQuestion.DoesNotExist, FIBQuestion.DoesNotExist):
                continue

        # Total questions intended for this quiz
        total_questions = quiz.assignments.aggregate(
            total=models.Sum('num_questions')
        )['total'] or 0

        marks_obtained = correct_count * quiz.marks_per_question

        return Response({
            'message': 'Answer submitted successfully.',
            'is_correct': is_correct,                 # ✅ for circle color
            'current_correct': correct_count,         # ✅ for live score
            'total_questions': total_questions,
            'marks_obtained': marks_obtained,
        }, status=status.HTTP_200_OK)

    except Exception as e:
        print("Exception while saving answer:", e)
        traceback.print_exc()
        return Response({'error': 'Internal Server Error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

def update_topic_progress(user, quiz):
    topic_ids = list(
        TopicQuiz.objects.filter(quiz=quiz).values_list('topic_id', flat=True).distinct()
    )
    if not topic_ids:
        return

    for topic_id in topic_ids:
        assigned_quiz_ids = TopicQuiz.objects.filter(topic_id=topic_id).values_list('quiz_id', flat=True)
        total_quizzes = assigned_quiz_ids.count()
        completed_quizzes = (
            StudentQuizAttempt.objects
            .filter(student=user, completed_at__isnull=False, quiz_id__in=assigned_quiz_ids)
            .values('quiz_id')
            .distinct()
            .count()
        )
        TopicProgress.objects.update_or_create(
            user=user,
            topic_id=topic_id,
            defaults={
                'completed_quizzes': completed_quizzes,
                'total_quizzes': total_quizzes,
            }
        )


def update_week_progress(user, quiz):
    week_ids = list(
        WeekQuiz.objects.filter(quiz=quiz).values_list('week_id', flat=True).distinct()
    )
    if not week_ids:
        return

    for week_id in week_ids:
        assigned_quiz_ids = WeekQuiz.objects.filter(week_id=week_id).values_list('quiz_id', flat=True)
        total_quizzes = assigned_quiz_ids.count()
        completed_quizzes = (
            StudentQuizAttempt.objects
            .filter(student=user, completed_at__isnull=False, quiz_id__in=assigned_quiz_ids)
            .values('quiz_id')
            .distinct()
            .count()
        )
        WeekProgress.objects.update_or_create(
            user=user,
            week_id=week_id,
            defaults={
                'completed_quizzes': completed_quizzes,
                'total_quizzes': total_quizzes,
            }
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated, HasPaidSubscription])
def finalize_quiz(request):
    user = request.user

    if user.role != 'student':
        return Response({'detail': 'Only students can finish quizzes.'}, status=status.HTTP_403_FORBIDDEN)

    attempt_id = request.data.get('attempt_id')
    if not attempt_id:
        return Response({'detail': 'Missing attempt ID.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        attempt = StudentQuizAttempt.objects.get(id=attempt_id, student=user, completed_at__isnull=True)
    except StudentQuizAttempt.DoesNotExist:
        return Response({'detail': 'Attempt not found or already finalized.'}, status=status.HTTP_404_NOT_FOUND)

    quiz = attempt.quiz

    # 🔧 Normalize submitted_qids → strings
    submitted_qids = set(str(qid) for qid in attempt.answers.values_list('question_id', flat=True))

    # 🔧 Support both old and new meta keys
    meta = attempt.meta or {}
    selected_qids_raw = meta.get('selected_qids') or meta.get('selected_question_ids') or []
    selected_qids = set(str(qid) for qid in selected_qids_raw)

    # 🔄 Fill missing answers as "unanswered"
    for q in SCQQuestion.objects.filter(question_id__in=selected_qids):
        if str(q.question_id) not in submitted_qids:
            StudentAnswer.objects.create(
                attempt=attempt,
                question_type='scq',
                question_id=q.question_id,
                answer_data={'selected': None}
            )

    for q in MCQQuestion.objects.filter(question_id__in=selected_qids):
        if str(q.question_id) not in submitted_qids:
            StudentAnswer.objects.create(
                attempt=attempt,
                question_type='mcq',
                question_id=q.question_id,
                answer_data={'selected': []}
            )

    for q in FIBQuestion.objects.filter(question_id__in=selected_qids):
        if str(q.question_id) not in submitted_qids:
            StudentAnswer.objects.create(
                attempt=attempt,
                question_type='fib',
                question_id=q.question_id,
                answer_data={}
            )

    answers = attempt.answers.all()
    correct = 0
    total = 0
    feedback = []

    for answer in answers:
        total += 1
        qid = answer.question_id
        qtype = answer.question_type
        student_answer = answer.answer_data
        is_correct = False
        correct_answer = None

        if qtype == 'scq':
            try:
                q = SCQQuestion.objects.get(question_id=qid)
                correct_label = (q.correct_answer or "").strip().upper()
                option_map = {'A': q.option_a, 'B': q.option_b, 'C': q.option_c, 'D': q.option_d}
                correct_answer = option_map.get(correct_label)
                selected = student_answer.get('selected') if isinstance(student_answer, dict) else student_answer
                is_correct = (
                    normalize_text(selected) == normalize_text(correct_answer)
                    if selected and correct_answer else False
                )
            except SCQQuestion.DoesNotExist:
                continue

        elif qtype == 'mcq':
            try:
                q = MCQQuestion.objects.get(question_id=qid)
                correct_labels = [x.strip().lower() for x in q.correct_answers.split(',')]
                options_map = {
                    'a': q.option_a,
                    'b': q.option_b,
                    'c': q.option_c,
                    'd': q.option_d
                }
                correct_answer = sorted([
                    normalize_text(options_map[label]) for label in correct_labels if label in options_map
                ])
                selected = student_answer.get('selected', []) if isinstance(student_answer, dict) else student_answer
                if isinstance(selected, str):
                    selected = [selected]
                selected = sorted([normalize_text(x) for x in selected])
                is_correct = selected == correct_answer
            except MCQQuestion.DoesNotExist:
                continue

        elif qtype == 'fib':
            try:
                q = FIBQuestion.objects.get(question_id=qid)
                correct_answer = q.correct_answers
                if isinstance(student_answer, dict) and isinstance(correct_answer, dict):
                    normalized_student = {
                        str(k).strip().lower(): normalize_numeric_commas(v)
                        for k, v in student_answer.items()
                        if v and str(v).strip()
                    }
                    normalized_correct = {
                        str(k).strip().lower(): normalize_numeric_commas(v)
                        for k, v in correct_answer.items()
                        if v and str(v).strip()
                    }
                    is_correct = normalized_student == normalized_correct
                else:
                    is_correct = False
            except FIBQuestion.DoesNotExist:
                continue

        if is_correct:
            correct += 1

        feedback.append({
            'question_id': str(qid),
            'question_type': qtype,
            'student_answer': student_answer,
            'correct_answer': correct_answer,
            'is_correct': is_correct
        })

    result = QuizAttempt.objects.create(
        student=user,
        quiz=quiz,
        total_questions=total,
        correct_answers=correct,
        marks_obtained=correct * quiz.marks_per_question,
        end_time=timezone.now()
    )
    result.save()

    # sync back into attempt
    attempt.score = result.marks_obtained
    attempt.completed_at = timezone.now()
    attempt.save()

    # Progress tracking hook (no scoring/attempt logic change).
    update_topic_progress(user, quiz)
    update_week_progress(user, quiz)

    return Response({
        "message": "Quiz finalized.",
        "attempt_id": attempt.id,
        "quiz_title": quiz.title,
        "total_questions": total,
        "correct_answers": correct,
        "marks_obtained": result.marks_obtained,
        "percentage": result.percentage(),
        "grade": result.grade(),
        "duration": str(result.duration()),
        "question_feedback": feedback
    }, status=status.HTTP_200_OK)



@api_view(['GET'])
@permission_classes([IsAuthenticated, HasPaidSubscription])
def student_subject_performance(request):
    user = request.user
    if user.role != 'student':
        return Response({'error': 'Only students can access this view.'}, status=403)

    from collections import defaultdict
    subject_data = defaultdict(lambda: {
        'student_total': 0, 'student_correct': 0,
        'class_total': 0, 'class_correct': 0
    })

    # 1. Student answers grouped by subject
    all_answers = StudentAnswer.objects.filter(
        attempt__student=user,
        attempt__completed_at__isnull=False
    )

    for ans in all_answers:
        try:
            quiz = ans.attempt.quiz
            subject = quiz.subject.name if quiz.subject else "Unknown"
        except:
            continue

        is_correct = False
        try:
            if ans.question_type == 'scq':
                q = SCQQuestion.objects.get(question_id=str(ans.question_id))
                is_correct = ans.answer_data.get('selected') == q.correct_answer
            elif ans.question_type == 'mcq':
                q = MCQQuestion.objects.get(question_id=str(ans.question_id))
                correct_set = sorted([x.strip() for x in q.correct_answers.split(',')])
                selected_set = sorted(ans.answer_data.get('selected', []))
                is_correct = selected_set == correct_set
            elif ans.question_type == 'fib':
                q = FIBQuestion.objects.get(question_id=str(ans.question_id))
                is_correct = ans.answer_data == q.correct_answers
        except Exception:
            continue

        subject_data[subject]['student_total'] += 1
        if is_correct:
            subject_data[subject]['student_correct'] += 1

    # 2. Class average per subject
    for subject in subject_data.keys():
        subject_obj = Subject.objects.filter(name=subject).first()
        if not subject_obj:
            continue

        class_attempts = StudentQuizAttempt.objects.filter(
            quiz__subject=subject_obj,
            quiz__grade__name=user.grade,
            completed_at__isnull=False
        )

        class_answers = StudentAnswer.objects.filter(attempt__in=class_attempts)

        for ans in class_answers:
            is_correct = False
            try:
                if ans.question_type == 'scq':
                    q = SCQQuestion.objects.get(question_id=str(ans.question_id))
                    is_correct = ans.answer_data.get('selected') == q.correct_answer
                elif ans.question_type == 'mcq':
                    q = MCQQuestion.objects.get(question_id=str(ans.question_id))
                    correct_set = sorted([x.strip() for x in q.correct_answers.split(',')])
                    selected_set = sorted(ans.answer_data.get('selected', []))
                    is_correct = selected_set == correct_set
                elif ans.question_type == 'fib':
                    q = FIBQuestion.objects.get(question_id=str(ans.question_id))
                    is_correct = ans.answer_data == q.correct_answers
            except:
                continue

            subject_data[subject]['class_total'] += 1
            if is_correct:
                subject_data[subject]['class_correct'] += 1

    # 3. Final Result Table
    rows = []
    total_student_avg = 0
    total_class_avg = 0
    total_percentile = 0
    count = 0

    for subject, data in subject_data.items():
        student_avg = (data['student_correct'] / data['student_total'] * 100) if data['student_total'] else 0
        class_avg = (data['class_correct'] / data['class_total'] * 100) if data['class_total'] else 0
        percentile = (student_avg / class_avg * 100) if class_avg else 0

        total_student_avg += student_avg
        total_class_avg += class_avg
        total_percentile += percentile
        count += 1

        rows.append({
            'subject': subject,
            'student_avg': round(student_avg, 2),
            'class_avg': round(class_avg, 2),
            'percentile': round(percentile, 2)
        })

    # 4. Overall summary row
    if count:
        rows.append({
            'subject': 'Overall Performance',
            'student_avg': round(total_student_avg / count, 2),
            'class_avg': round(total_class_avg / count, 2),
            'percentile': round(total_percentile / count, 2)
        })

    return Response(rows)


def get_top_performers(days):
    cutoff_date = timezone.now() - timedelta(days=days)

    attempts = StudentQuizAttempt.objects.filter(
        completed_at__gte=cutoff_date
    ).select_related('student', 'quiz__grade')

    student_scores = defaultdict(lambda: {
        'user': None,
        'total': 0,
        'grade': None,
        'quiz_ids': set(),
        'percentage_scores': [],
        'counted_quizzes': set(),
    })

    for attempt in attempts:
        student = attempt.student
        if student.role != 'student':
            continue

        key = student.username
        quiz_id = attempt.quiz.id

        # Prevent counting same quiz more than once
        if key in student_scores and quiz_id in student_scores[key]['counted_quizzes']:
            continue

        # Get the latest score (not the first)
        result = QuizAttempt.objects.filter(student=student, quiz=attempt.quiz).order_by('-id').first()
        if not result:
            continue

        student_scores[key]['counted_quizzes'].add(quiz_id)
        student_scores[key]['user'] = student
        grade = student.grade
        student_scores[key]['grade'] = grade.name if hasattr(grade, 'name') else grade or "Unknown"
        student_scores[key]['quiz_ids'].add(quiz_id)

        total_qs = attempt.quiz.assignments.aggregate(total=models.Sum('num_questions'))['total'] or 0
        total_marks = total_qs * attempt.quiz.marks_per_question
        if total_marks > 0 and result.marks_obtained is not None:
            pct = (result.marks_obtained / total_marks) * 100
            student_scores[key]['percentage_scores'].append(pct)
            student_scores[key]['total'] += result.marks_obtained

    grade_wise = defaultdict(list)
    for data in student_scores.values():
        student = data['user']
        if not student:
            continue
        grade = data['grade']
        quizzes_attempted = len(data['quiz_ids'])
        average_score = (
            round(sum(data['percentage_scores']) / len(data['percentage_scores']), 2)
            if data['percentage_scores'] else 0
        )
        full_name_raw = getattr(student, "full_name", None)
        full_name_clean = (full_name_raw or "").strip()
        fallback_name = (
            f"{getattr(student, 'first_name', '') or ''} {getattr(student, 'last_name', '') or ''}"
        ).strip()
        display_name = full_name_clean or fallback_name or "N/A"

        grade_wise[grade].append({
            'full_name': display_name,
            'username': student.username,
            'school': student.school_name or "N/A",
            'city': student.city or "N/A",
            'province': student.province or "N/A",
            'total_marks': int(data.get('total') or 0),
            'quizzes_attempted': quizzes_attempted,
            'average_score': average_score
        })

    for grade in grade_wise:
        grade_wise[grade] = sorted(
            grade_wise[grade],
            key=lambda x: x['total_marks'],
            reverse=True
        )[:10]

    honor_roll = []
    for grade, students in grade_wise.items():
        honor_roll.append({
            'grade': grade,
            'top_students': students
        })

    return honor_roll

@api_view(['GET'])
@permission_classes([AllowAny])
def get_shining_stars(request):
    honor_roll = get_top_performers(days=30)
    print("Honor Roll Data:", json.dumps(honor_roll, indent=2))
    return Response(honor_roll)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_national_heroes(request):
    honor_roll = get_top_performers(days=90)
    print("Honor Roll Data:", json.dumps(honor_roll, indent=2))
    return Response(honor_roll)



@api_view(['GET'])
def user_list_api(request):
    role = request.GET.get('role')
    if role:
        users = User.objects.filter(role=role)
    else:
        users = User.objects.all()

    serializer = UserListSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_list(request):
    role = request.GET.get('role')
    if role:
        users = User.objects.filter(role=role)
    else:
        users = User.objects.all()
    
    serializer = UserListSerializer(users, many=True)
    return Response(serializer.data)

# Only admin can access
from django.db.models import Count, Sum, Avg, Max

from django.db.models import OuterRef, Subquery, Max

from django.db.models import Max, Q

@user_passes_test(lambda u: u.is_authenticated and u.role == 'admin')
def admin_student_quiz_history(request, student_id):
    student = get_object_or_404(User, id=student_id, role='student')

    # Step 1: Fetch all completed attempts (ordered to make latest ones first)
    all_attempts = (
        StudentQuizAttempt.objects
        .filter(student=student, completed_at__isnull=False)
        .select_related('quiz', 'quiz__subject', 'quiz__grade')
        .order_by('quiz_id', '-completed_at')
    )

    # Step 2: Retain only the latest attempt per quiz
    latest_attempts_map = {}
    for attempt in all_attempts:
        key = attempt.quiz_id
        if key not in latest_attempts_map:
            latest_attempts_map[key] = attempt  # First = latest due to ordering

    # Step 3: Convert to list of attempts
    latest_attempts = list(latest_attempts_map.values())

    # Step 4: Prepare quiz history
    quiz_history = []
    for attempt in latest_attempts:
        quiz = attempt.quiz
        total_questions = quiz.assignments.aggregate(
            total=models.Sum('num_questions')
        )['total'] or 0
        marks_per_question = quiz.marks_per_question
        total_marks = total_questions * marks_per_question

        obtained_marks = attempt.score or 0
        percentage = (obtained_marks / total_marks) * 100 if total_marks else 0
        grade = calculate_grade(percentage)

        quiz_history.append({
            "quiz_title": quiz.title,
            "subject": quiz.subject.name,
            "marks": f"{obtained_marks}/{total_marks}",
            "percentage": round(percentage, 2),
            "grade": grade,
            "attempt_time": attempt.completed_at,
        })

    # Step 5: Sort by latest date
    quiz_history.sort(key=lambda x: x['attempt_time'], reverse=True)

    return render(request, 'admin/core/admin_student_quiz_history.html', {
        "student": student,
        "quiz_history": quiz_history
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    user = request.user

    # mark expired if past expiry
    today = timezone.now().date()
    if user.subscription_expiry and user.subscription_expiry < today:
        if user.account_status != 'expired':
            user.account_status = 'expired'
            user.save(update_fields=["account_status"])

    return Response({
        "id": user.id,
        "username": user.username,
        "role": user.role,
        "full_name": user.full_name,
        "email": user.email,

        "gender": user.gender,
        "language_used_at_home": user.language_used_at_home,
        "schooling_status": user.schooling_status,

        "grade": user.grade.id if user.grade else None,
        "grade_name": user.grade.name if user.grade else "",

        "school_name": user.school_name,
        "city": user.city,
        "province": user.province,

        "subscription_plan": user.subscription_plan,
        "subscription_expiry": user.subscription_expiry.strftime("%Y-%m-%d") if user.subscription_expiry else None,
        "account_status": user.account_status,

        "profile_picture": user.profile_picture.url if user.profile_picture else None,
    })

@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser])
def public_register_user(request):
    """
    Public signup:
    - Accepts multipart/form-data
    - Normalizes common password field names -> 'password'
    - Returns HTTP 201 + {"success": true, ...} on success
    - Returns HTTP 400 + {"success": false, errors: {...}} on failure
    - Sends welcome email with raw password if provided
    """
    data = request.data.copy()

    raw_pw = (
        data.get('password')
        or data.get('password1')
        or data.get('new_password')
        or data.get('newPassword')
        or data.get('rawPassword')
    )
    if raw_pw and 'password' not in data:
        data['password'] = raw_pw

    confirm_pw = (
        data.get('confirm_password')
        or data.get('password2')
        or data.get('confirmPassword')
    )

    # Keep API backward compatible: validate only when a confirmation field is supplied.
    if confirm_pw is not None and raw_pw is not None and str(confirm_pw) != str(raw_pw):
        return Response(
            {"success": False, "errors": {"confirm_password": ["Passwords do not match."]}},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Strip non-model helper fields so serializer doesn't reject unknown keys.
    for extra_key in ('confirm_password', 'password2', 'confirmPassword'):
        data.pop(extra_key, None)

    serializer = PublicSignupSerializer(data=data)
    if serializer.is_valid():
        user = serializer.save()


        return Response(
            {
                "success": True,
                "message": "Account created successfully. Please complete payment to activate your account.",
                "user": {
                    "username": user.username,
                    "email": user.email,
                    "role": getattr(user, "role", None),
                },
            },
            status=status.HTTP_201_CREATED,
        )

    return Response(
        {"success": False, "errors": serializer.errors},
        status=status.HTTP_400_BAD_REQUEST,
    )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def subscription_info(request):
    user = request.user

    # Safety: Only show info for students and teachers
    if user.role not in ['student', 'teacher']:
        return Response({'error': 'Access denied.'}, status=403)

    # Prepare response
    info = {
        'plan': user.subscription_plan or "N/A",
        'status': user.account_status or "inactive",
        'expiry': user.subscription_expiry.strftime('%Y-%m-%d') if user.subscription_expiry else "N/A"
    }

    return Response(info)

from rest_framework.parsers import MultiPartParser, FormParser


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def edit_profile_view(request):
    user = request.user
    old_grade_id = user.grade_id
    new_grade_id = request.data.get('grade')

    today = timezone.now().date()
    current_year = today.year

    # Reset grade_change_count if it's a new year
    if user.last_grade_reset is None or user.last_grade_reset.year < current_year:
        user.grade_change_count = 0
        user.last_grade_reset = today

    # Check if grade is changing and limit applies
    old_grade_id = user.grade_id  # integer or None
    new_grade_id = request.data.get('grade')  # usually "3" or 3 or None

    # Check if grade is changing and limit applies
    if new_grade_id and str(new_grade_id) != str(old_grade_id):
        if user.grade_change_count >= 2:
            return Response({
                'error': 'Grade change limit (2 per year) reached.',
                'grade_changes_left': 0
            }, status=400)
        user.grade_change_count += 1  # Count this change

    serializer = EditProfileSerializer(user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        user.save()  # Save grade_change_count and reset
        return Response({
            'success': 'Profile updated successfully.',
            'grade_changes_left': 2 - user.grade_change_count
        })
    return Response(serializer.errors, status=400)

# core/views.py

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    from core.emails import send_password_change_email  # avoid circulars

    user = request.user

    # Accept both snake_case and camelCase from the frontend
    data = {
        "old_password": (
            request.data.get("old_password")
            or request.data.get("oldPassword")
        ),
        "new_password": (
            request.data.get("new_password")
            or request.data.get("newPassword")
        ),
        "confirm_password": (
            request.data.get("confirm_password")
            or request.data.get("confirmNewPassword")
            or request.data.get("new_password2")
        ),
    }

    # Fast presence checks
    missing = [k for k in ("old_password", "new_password") if not data[k]]
    if missing:
        return Response(
            {"error": f"Missing field(s): {', '.join(missing)}"},
            status=400
        )

    # Optional confirm support (frontend may or may not send it)
    if data["confirm_password"] is not None and data["confirm_password"] != data["new_password"]:
        return Response({"error": "New password and confirmation do not match."}, status=400)

    # If you still want to use the serializer, pass what it expects;
    # otherwise, skip it entirely and validate here.
    # Try serializer first (keeps backward-compat if it exists/validates).
    try:
        serializer = ChangePasswordSerializer(data={
            "old_password": data["old_password"],
            "new_password": data["new_password"],
            # Only pass confirm if the serializer supports it (harmless if ignored)
            "confirm_password": data["confirm_password"],
        })
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        old_pw = serializer.validated_data["old_password"]
        new_pw = serializer.validated_data["new_password"]
    except Exception:
        # Fallback: no/changed serializer—use normalized values
        old_pw = data["old_password"]
        new_pw = data["new_password"]

    # Verify old password
    if not user.check_password(old_pw):
        return Response({"error": "Old password is incorrect."}, status=400)

    # Disallow reusing the same password (optional but helpful)
    if user.check_password(new_pw):
        return Response({"error": "New password cannot be the same as the old password."}, status=400)

    # Django strength validation
    try:
        validate_password(new_pw, user=user)
    except DjangoValidationError as e:
        return Response({"error": e.messages}, status=400)

    # Save + email (non-blocking)
    user.set_password(new_pw)
    user.save()

    try:
        send_password_change_email(user, password=new_pw)
    except Exception:
        pass  # never block the request on email

    return Response({"success": "Password changed successfully."}, status=200)

@api_view(['GET'])
@permission_classes([IsAuthenticated, HasPaidSubscription])
def teacher_student_list(request):
    user = request.user
    if user.role != 'teacher':
        return Response({'error': 'Unauthorized'}, status=403)

    # Normalize teacher fields
    teacher_city = (user.city or "").strip()
    teacher_school = (user.school_name or "").strip()

    qs = User.objects.filter(role='student')

    # Only filter by fields that are actually present on the teacher
    if teacher_city:
        qs = qs.filter(city__iexact=teacher_city)
    else:
        # if teacher has no city, return empty list to be explicit
        return Response([], status=200)

    if teacher_school:
        qs = qs.filter(school_name__iexact=teacher_school)

    # Optional: only active accounts
    # qs = qs.filter(is_active=True, account_status='active')

    student_data = []
    for s in qs.exclude(city__isnull=True).exclude(city__exact=""):
        student_data.append({
            'id': s.id,
            'full_name': s.full_name,
            'email': s.email,
            'grade': getattr(s.grade, "name", "") if s.grade else "",
            'gender': s.gender,
            'school_name': s.school_name,
            'city': s.city,
            'province': s.province,
            'username': s.username,
        })

    return Response(student_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, HasPaidSubscription])
def teacher_student_quiz_history_view(request, username):
    if request.user.role != 'teacher':
        return Response({'error': 'Only teachers can access this view.'}, status=403)

    try:
        student = User.objects.get(username__iexact=username, role='student')
    except User.DoesNotExist:
        return Response({'error': 'Student not found.'}, status=404)

    # Normalize + case-insensitive compare for authorization
    same_city = ((student.city or "").strip().casefold()
                 == (request.user.city or "").strip().casefold())
    same_school = ((student.school_name or "").strip().casefold()
                   == (request.user.school_name or "").strip().casefold())

    if not same_city or not same_school:
        return Response({'error': "You aren't authorized to view this student's data."}, status=403)

    from django.db.models import Max

    latest_attempt_times = StudentQuizAttempt.objects.filter(
        student=student,
        completed_at__isnull=False
    ).values('quiz').annotate(latest=Max('completed_at')).values_list('latest', flat=True)

    attempts = StudentQuizAttempt.objects.filter(
        student=student,
        completed_at__in=list(latest_attempt_times)
    ).select_related('quiz', 'quiz__grade', 'quiz__subject', 'quiz__chapter').order_by('-completed_at')

    results = []
    for attempt in attempts:
        quiz = attempt.quiz
        total_questions = quiz.assignments.aggregate(total=models.Sum('num_questions'))['total'] or 0
        total_marks = total_questions * quiz.marks_per_question
        percentage = round((attempt.score / total_marks) * 100, 2) if total_marks else 0
        letter = calculate_grade(percentage)

        results.append({
            'quiz_title': quiz.title,
            'chapter': quiz.chapter.name if quiz.chapter else "",
            'subject': quiz.subject.name if quiz.subject else "",
            'grade': quiz.grade.name if quiz.grade else "",
            'marks_obtained': attempt.score,
            'total_questions': total_questions,
            'marks_per_question': quiz.marks_per_question,
            'percentage': percentage,
            'grade_letter': letter,
            'attempted_on': localtime(attempt.completed_at, timezone=pk_timezone).strftime('%d-%m-%Y %I:%M %p'),
            'attempt_id': str(attempt.id),
        })

    return Response({'full_name': student.full_name, 'results': results})

@api_view(['GET'])
@permission_classes([IsAuthenticated, HasPaidSubscription])
def student_quiz_history_view(request):
    if request.user.role != 'student':
        return Response({'error': 'Only students can access this view.'}, status=403)

    student = request.user

    from django.db.models import Max
    from django.utils.timezone import localtime

    # Step 1: Get latest attempt per quiz
    latest_attempt_ids = StudentQuizAttempt.objects.filter(
        student=student,
        completed_at__isnull=False
    ).values('quiz').annotate(latest=Max('completed_at')).values_list('latest', flat=True)

    # Step 2: Fetch only those latest attempts
    attempts = StudentQuizAttempt.objects.filter(
        student=student,
        completed_at__in=latest_attempt_ids
    ).order_by('-completed_at')

    results = []
    for attempt in attempts:
        quiz = attempt.quiz
        total_questions = quiz.assignments.aggregate(total=models.Sum('num_questions'))['total'] or 0
        total_marks = total_questions * quiz.marks_per_question
        percentage = round((attempt.score / total_marks) * 100, 2) if total_marks else 0
        grade = calculate_grade(percentage)

        results.append({
            'quiz_title': quiz.title,
            'quiz_id': quiz.id,
            'chapter': quiz.chapter.name if quiz.chapter else "",
            'subject': quiz.subject.name if quiz.subject else "",
            'grade': quiz.grade.name if quiz.grade else "",
            'marks_obtained': attempt.score,
            'total_questions': total_questions,
            'marks_per_question': quiz.marks_per_question,
            'percentage': percentage,
            'grade_letter': grade,
            'attempted_on': localtime(attempt.completed_at, timezone=pk_timezone).strftime('%d-%m-%Y %I:%M %p'),
            'attempt_id': str(attempt.id)
        })

    return Response({
        'full_name': student.full_name,
        'results': results
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, HasPaidSubscription])
def student_learning_diagnosis_view(request):
    if request.user.role != 'student':
        return Response({'error': 'Only students can access this view.'}, status=403)

    student = request.user
    from django.db.models import Max

    latest_attempt_times = StudentQuizAttempt.objects.filter(
        student=student,
        completed_at__isnull=False,
    ).values('quiz').annotate(latest=Max('completed_at')).values_list('latest', flat=True)

    attempts = StudentQuizAttempt.objects.filter(
        student=student,
        completed_at__in=latest_attempt_times,
    ).select_related('quiz', 'quiz__subject', 'quiz__chapter', 'quiz__grade')

    quiz_rows = []
    for attempt in attempts:
        quiz = attempt.quiz
        percentage = _attempt_percentage(attempt)
        chapter = quiz.chapter
        quiz_rows.append({
            'quiz_id': quiz.id,
            'quiz_title': quiz.title,
            'chapter_id': chapter.id if chapter else None,
            'chapter_name': chapter.name if chapter else 'General',
            'subject_name': quiz.subject.name if quiz.subject else '',
            'percentage': percentage,
            'practice_path': f'/student/attempt-quiz/{quiz.id}',
        })

    if not quiz_rows:
        v2 = _learning_diagnosis_v2_fields(student, 0, [], [], [], [])
        return Response({
            'full_name': student.full_name,
            'has_data': False,
            'learning_health_score': v2['learning_health_score'],
            'health_status': v2['health_status'],
            'attention_required': [],
            'learning_trend': v2['learning_trend'],
            'overall': {
                'total_attempted_quizzes': 0,
                'overall_average_percentage': 0,
                'strong_chapters_count': 0,
                'improving_chapters_count': 0,
                'weak_chapters_count': 0,
            },
            'chapter_mastery': [],
            'low_score_quizzes': [],
            'recommended_practice': [],
            'parent_friendly_summary': v2['parent_friendly_summary'],
        })

    chapter_buckets = {}
    for row in quiz_rows:
        key = row['chapter_id'] if row['chapter_id'] is not None else f"none:{row['chapter_name']}"
        if key not in chapter_buckets:
            chapter_buckets[key] = {
                'chapter_id': row['chapter_id'],
                'chapter_name': row['chapter_name'],
                'subject_name': row['subject_name'],
                'percentages': [],
                'quiz_ids': set(),
            }
        chapter_buckets[key]['percentages'].append(row['percentage'])
        chapter_buckets[key]['quiz_ids'].add(row['quiz_id'])

    chapter_mastery = []
    for bucket in chapter_buckets.values():
        avg_pct = round(sum(bucket['percentages']) / len(bucket['percentages']), 2)
        status = _chapter_mastery_status(avg_pct)
        chapter_mastery.append({
            'chapter_id': bucket['chapter_id'],
            'chapter_name': bucket['chapter_name'],
            'subject_name': bucket['subject_name'],
            'quizzes_attempted': len(bucket['quiz_ids']),
            'average_percentage': avg_pct,
            'status': status,
        })

    chapter_mastery.sort(key=lambda c: (c['status'] != 'weak', c['average_percentage']))

    low_score_quizzes = [
        {k: v for k, v in row.items() if k != 'practice_path'}
        for row in quiz_rows
        if row['percentage'] < 50
    ]
    low_score_quizzes.sort(key=lambda q: q['percentage'])

    strong_chapters = [c for c in chapter_mastery if c['status'] == 'strong']
    improving_chapters = [c for c in chapter_mastery if c['status'] == 'improving']
    weak_chapters = [c for c in chapter_mastery if c['status'] == 'weak']

    recommended_practice = []
    seen_quiz_ids = set()

    for chapter in weak_chapters:
        chapter_quizzes = [
            r for r in quiz_rows
            if (r['chapter_id'] == chapter['chapter_id']
                and chapter['chapter_id'] is not None)
            or (chapter['chapter_id'] is None and r['chapter_name'] == chapter['chapter_name'])
        ]
        chapter_quizzes.sort(key=lambda r: r['percentage'])
        for row in chapter_quizzes:
            if row['quiz_id'] in seen_quiz_ids:
                continue
            seen_quiz_ids.add(row['quiz_id'])
            recommended_practice.append({
                'quiz_id': row['quiz_id'],
                'quiz_title': row['quiz_title'],
                'chapter_name': row['chapter_name'],
                'subject_name': row['subject_name'],
                'percentage': row['percentage'],
                'reason': 'weak_chapter',
                'practice_path': row['practice_path'],
            })

    for row in low_score_quizzes:
        if row['quiz_id'] in seen_quiz_ids:
            continue
        seen_quiz_ids.add(row['quiz_id'])
        full_row = next(r for r in quiz_rows if r['quiz_id'] == row['quiz_id'])
        recommended_practice.append({
            'quiz_id': row['quiz_id'],
            'quiz_title': row['quiz_title'],
            'chapter_name': row['chapter_name'],
            'subject_name': row['subject_name'],
            'percentage': row['percentage'],
            'reason': 'low_score',
            'practice_path': full_row['practice_path'],
        })

    overall_avg = round(
        sum(r['percentage'] for r in quiz_rows) / len(quiz_rows),
        2,
    )
    v2 = _learning_diagnosis_v2_fields(
        student, overall_avg, chapter_mastery, quiz_rows, strong_chapters, weak_chapters,
    )

    return Response({
        'full_name': student.full_name,
        'has_data': True,
        'learning_health_score': v2['learning_health_score'],
        'health_status': v2['health_status'],
        'attention_required': v2['attention_required'],
        'learning_trend': v2['learning_trend'],
        'overall': {
            'total_attempted_quizzes': len(quiz_rows),
            'overall_average_percentage': overall_avg,
            'strong_chapters_count': len(strong_chapters),
            'improving_chapters_count': len(improving_chapters),
            'weak_chapters_count': len(weak_chapters),
        },
        'chapter_mastery': chapter_mastery,
        'strong_chapters': strong_chapters,
        'improving_chapters': improving_chapters,
        'weak_chapters': weak_chapters,
        'low_score_quizzes': [
            {**q, 'practice_path': f"/student/attempt-quiz/{q['quiz_id']}"}
            for q in low_score_quizzes
        ],
        'recommended_practice': recommended_practice,
        'parent_friendly_summary': v2['parent_friendly_summary'],
    })


@api_view(['GET'])
def list_public_quizzes(request):
    quizzes = Quiz.objects.select_related('grade', 'subject', 'chapter').all()

    data = {}

    for quiz in quizzes:
        grade = quiz.grade.name if quiz.grade else 'Unknown Grade'
        subject = quiz.subject.name if quiz.subject else 'Unknown Subject'
        chapter = quiz.chapter.name if quiz.chapter else 'Unknown Chapter'

        if grade not in data:
            data[grade] = {}

        if subject not in data[grade]:
            data[grade][subject] = {}

        if chapter not in data[grade][subject]:
            data[grade][subject][chapter] = []

        data[grade][subject][chapter].append({
            'id': quiz.id,
            'title': quiz.title
        })

    # Convert nested dict to list format for frontend
    result = []
    for grade, subjects in data.items():
        grade_block = {'grade': grade, 'subjects': []}
        for subject, chapters in subjects.items():
            subject_block = {'subject': subject, 'chapters': []}
            for chapter, quizzes in chapters.items():
                subject_block['chapters'].append({
                    'chapter': chapter,
                    'quizzes': quizzes
                })
            grade_block['subjects'].append(subject_block)
        result.append(grade_block)

    return Response(result)


def _is_missing_topic_week_table_error(exc):
    msg = str(exc).lower()
    markers = (
        'core_topic',
        'core_topicquiz',
        'core_week',
        'core_weekquiz',
        'no such table',
        'undefinedtable',
        'relation',
    )
    return any(m in msg for m in markers)


def _quiz_leaf_payload(quiz):
    return {
        'id': quiz.id,
        'title': quiz.title,
        'grade': {'id': quiz.grade.id, 'name': quiz.grade.name} if quiz.grade else None,
        'subject': {'id': quiz.subject.id, 'name': quiz.subject.name} if quiz.subject else None,
        'chapter': {'id': quiz.chapter.id, 'name': quiz.chapter.name} if quiz.chapter else None,
    }


@api_view(['GET'])
@permission_classes([AllowAny])
def landing_topics_view(request):
    grade_id = request.GET.get("grade")
    subject_id = request.GET.get("subject")
    chapter_id = request.GET.get("chapter")
    include_quizzes = str(request.GET.get("include_quizzes", "1")).lower() in ("1", "true")

    try:
        topics_qs = Topic.objects.select_related("grade").all()
        if grade_id:
            topics_qs = topics_qs.filter(grade_id=grade_id)

        topicquiz_qs = TopicQuiz.objects.select_related(
            "quiz", "quiz__grade", "quiz__subject", "quiz__chapter"
        ).order_by("order", "quiz__title")
        if grade_id:
            topicquiz_qs = topicquiz_qs.filter(quiz__grade_id=grade_id)
        if subject_id:
            topicquiz_qs = topicquiz_qs.filter(quiz__subject_id=subject_id)
        if chapter_id:
            topicquiz_qs = topicquiz_qs.filter(quiz__chapter_id=chapter_id)

        topics = topics_qs.prefetch_related(
            Prefetch("topic_quizzes", queryset=topicquiz_qs)
        )

        serializer = TopicLandingSerializer(
            topics,
            many=True,
            context={
                "request": request,
                "user": request.user,
                "include_quizzes": include_quizzes,
            }
        )
        return Response({"results": serializer.data})
    except (ProgrammingError, OperationalError) as exc:
        if _is_missing_topic_week_table_error(exc):
            logger.warning("landing_topics_view fallback due to missing topic/week tables: %s", exc)
            return Response({"results": [], "warning": "topic/week tables not available"})
        raise


@api_view(['GET'])
@permission_classes([AllowAny])
def landing_weeks_view(request):
    grade_id = request.GET.get("grade")
    subject_id = request.GET.get("subject")
    chapter_id = request.GET.get("chapter")
    include_quizzes = str(request.GET.get("include_quizzes", "1")).lower() in ("1", "true")

    try:
        weeks_qs = Week.objects.select_related("grade", "subject").all()
        if grade_id:
            weeks_qs = weeks_qs.filter(grade_id=grade_id)
        if subject_id:
            weeks_qs = weeks_qs.filter(subject_id=subject_id)

        weekquiz_qs = WeekQuiz.objects.select_related(
            "quiz", "quiz__grade", "quiz__subject", "quiz__chapter"
        ).order_by("order", "quiz__title")
        if grade_id:
            weekquiz_qs = weekquiz_qs.filter(quiz__grade_id=grade_id)
        if subject_id:
            weekquiz_qs = weekquiz_qs.filter(quiz__subject_id=subject_id)
        if chapter_id:
            weekquiz_qs = weekquiz_qs.filter(quiz__chapter_id=chapter_id)

        weeks = weeks_qs.prefetch_related(
            Prefetch("week_quizzes", queryset=weekquiz_qs)
        ).order_by("grade__name", "subject__name", "order", "name")

        serializer = WeekLandingSerializer(
            weeks,
            many=True,
            context={
                "request": request,
                "user": request.user,
                "include_quizzes": include_quizzes,
            }
        )
        return Response({"results": serializer.data})
    except (ProgrammingError, OperationalError) as exc:
        if _is_missing_topic_week_table_error(exc):
            logger.warning("landing_weeks_view fallback due to missing topic/week tables: %s", exc)
            return Response({"results": [], "warning": "topic/week tables not available"})
        raise

@api_view(['GET'])
@permission_classes([AllowAny])
def get_all_grades(request):
    grades = Grade.objects.all().order_by('name')
    return Response([{'id': grade.id, 'name': grade.name} for grade in grades])  # ✅ Clean format


@require_GET
@ensure_csrf_cookie
def csrf_view(request):
    return JsonResponse({"detail": "CSRF cookie set"})

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


# ================================
# Teacher Tasks / Recommendations
# ================================

def _teacher_scoped_students_queryset(teacher):
    teacher_city = (teacher.city or "").strip()
    teacher_school = (teacher.school_name or "").strip()
    if not teacher_city:
        return User.objects.none()
    qs = User.objects.filter(role="student", city__iexact=teacher_city)
    if teacher_school:
        qs = qs.filter(school_name__iexact=teacher_school)
    return qs.exclude(city__isnull=True).exclude(city__exact="")


def _task_assigned_students(task, teacher):
    scoped = _teacher_scoped_students_queryset(teacher).select_related("grade")
    if task.target_students.exists():
        student_ids = task.target_students.values_list("id", flat=True)
        return list(scoped.filter(id__in=student_ids).order_by("full_name", "username"))
    if task.target_grade_id:
        return list(scoped.filter(grade_id=task.target_grade_id).order_by("full_name", "username"))
    return []


def _quiz_total_marks(quiz):
    total_questions = quiz.assignments.aggregate(total=Sum("num_questions"))["total"] or 0
    return total_questions * quiz.marks_per_question


def _attempt_percentage(attempt, quiz):
    total_marks = _quiz_total_marks(quiz)
    if not total_marks:
        return 0.0
    return round((attempt.score / total_marks) * 100, 2)


def _latest_attempts_map(student_ids, quiz_ids):
    if not student_ids or not quiz_ids:
        return {}

    attempts_map = {}
    attempts_qs = (
        StudentQuizAttempt.objects.filter(
            student_id__in=student_ids,
            quiz_id__in=quiz_ids,
            completed_at__isnull=False,
        )
        .order_by("student_id", "quiz_id", "-completed_at")
    )
    for attempt in attempts_qs:
        key = (attempt.student_id, attempt.quiz_id)
        if key not in attempts_map:
            attempts_map[key] = attempt
    return attempts_map


def _task_status_label(task):
    today = timezone.now().date()
    if not task.is_active:
        return "inactive"
    if task.due_date and task.due_date < today:
        return "expired"
    return "active"


def _serialize_student_task_progress(student, task_quizzes, attempts_map, quiz_totals):
    quiz_rows = []
    completed_count = 0

    for tq in task_quizzes:
        quiz = tq.quiz
        if not quiz:
            continue

        total_marks = quiz_totals.get(quiz.id, 0)
        attempt = attempts_map.get((student.id, quiz.id))

        if attempt:
            completed_count += 1
            percentage = round((attempt.score / total_marks) * 100, 2) if total_marks else 0
            quiz_rows.append({
                "quiz_id": quiz.id,
                "quiz_title": quiz.title,
                "completed": True,
                "marks_obtained": attempt.score,
                "total_marks": total_marks,
                "percentage": percentage,
                "grade": calculate_grade(percentage),
            })
        else:
            quiz_rows.append({
                "quiz_id": quiz.id,
                "quiz_title": quiz.title,
                "completed": False,
                "marks_obtained": None,
                "total_marks": total_marks or None,
                "percentage": None,
                "grade": None,
            })

    total_quizzes = len(quiz_rows)
    return {
        "id": student.id,
        "full_name": student.full_name or student.username,
        "username": student.username,
        "grade": student.grade.name if student.grade else "",
        "school_name": student.school_name or "",
        "city": student.city or "",
        "quizzes": quiz_rows,
        "overall_task_completed": total_quizzes > 0 and completed_count == total_quizzes,
        "completed_count": completed_count,
        "total_quizzes": total_quizzes,
    }


@api_view(['GET'])
@permission_classes([IsAuthenticated, HasPaidSubscription])
def teacher_dashboard_summary(request):
    user = request.user
    if user.role != 'teacher':
        return Response({'error': 'Only teachers can access this endpoint.'}, status=403)

    students = list(
        _teacher_scoped_students_queryset(user).select_related("grade").order_by("full_name", "username")
    )
    student_ids = [s.id for s in students]

    student_stats = {
        s.id: {
            "student": s,
            "pending_task_items": 0,
            "percentages": [],
            "attempt_count": 0,
        }
        for s in students
    }

    active_tasks = list(
        TeacherTask.objects.filter(teacher=user, is_active=True).prefetch_related(
            Prefetch("task_quizzes", queryset=TeacherTaskQuiz.objects.select_related("quiz")),
            "target_students",
            "target_grade",
        )
    )

    pending_task_items_count = 0
    completed_task_items_count = 0
    grade_pending = defaultdict(int)

    for task in active_tasks:
        assigned = _task_assigned_students(task, user)
        task_quizzes = [tq for tq in task.task_quizzes.all() if tq.quiz]
        quiz_ids = [tq.quiz.id for tq in task_quizzes]
        attempts_map = _latest_attempts_map([s.id for s in assigned], quiz_ids)

        for student in assigned:
            grade_name = student.grade.name if student.grade else "Unassigned Grade"
            for tq in task_quizzes:
                if attempts_map.get((student.id, tq.quiz.id)):
                    completed_task_items_count += 1
                else:
                    pending_task_items_count += 1
                    student_stats[student.id]["pending_task_items"] += 1
                    grade_pending[grade_name] += 1

    attempts_qs = StudentQuizAttempt.objects.filter(
        student_id__in=student_ids,
        completed_at__isnull=False,
    ).select_related("quiz", "student")

    latest_for_avg = {}
    for att in attempts_qs.order_by("student_id", "quiz_id", "-completed_at"):
        key = (att.student_id, att.quiz_id)
        if key not in latest_for_avg:
            latest_for_avg[key] = att

    all_percentages = []
    for att in latest_for_avg.values():
        pct = _attempt_percentage(att, att.quiz)
        all_percentages.append(pct)
        student_stats[att.student_id]["percentages"].append(pct)
        student_stats[att.student_id]["attempt_count"] += 1

    average_student_score = (
        round(sum(all_percentages) / len(all_percentages)) if all_percentages else None
    )

    attention_candidates = []
    for stats in student_stats.values():
        s = stats["student"]
        avg = (
            round(sum(stats["percentages"]) / len(stats["percentages"]))
            if stats["percentages"]
            else None
        )
        pending = stats["pending_task_items"]
        attempt_count = stats["attempt_count"]

        if not ((pending > 0) or (avg is not None and avg < 50) or (attempt_count == 0)):
            continue

        if avg is not None and avg < 50:
            reason = "Low average score"
            detail = f"Average score {avg}%"
            tier = 0
            sort_key = avg
        elif pending > 0:
            reason = "Pending assigned work"
            detail = f"{pending} quiz item{'s' if pending != 1 else ''} not completed"
            tier = 1
            sort_key = -pending
        else:
            reason = "No quiz activity"
            detail = "No completed quizzes yet"
            tier = 2
            sort_key = 0

        attention_candidates.append({
            "tier": tier,
            "sort_key": sort_key,
            "student_id": s.id,
            "username": s.username,
            "full_name": s.full_name or s.username,
            "grade": s.grade.name if s.grade else "",
            "reason": reason,
            "detail": detail,
            "quiz_history_path": f"/teacher/student/{s.username}/quiz-history",
        })

    attention_candidates.sort(key=lambda row: (row["tier"], row["sort_key"]))
    students_requiring_attention = [
        {k: v for k, v in row.items() if k not in ("tier", "sort_key")}
        for row in attention_candidates[:5]
    ]

    recent_attempts = (
        StudentQuizAttempt.objects.filter(
            student_id__in=student_ids,
            completed_at__isnull=False,
        )
        .select_related("student", "quiz")
        .order_by("-completed_at")[:5]
    )
    recent_activity = [
        {
            "student_name": att.student.full_name or att.student.username,
            "quiz_title": att.quiz.title,
            "percentage": _attempt_percentage(att, att.quiz),
            "completed_at": att.completed_at.strftime("%Y-%m-%d") if att.completed_at else None,
        }
        for att in recent_attempts
    ]

    grade_groups = defaultdict(list)
    for s in students:
        grade_name = s.grade.name if s.grade else "Unassigned Grade"
        grade_groups[grade_name].append(s)

    def _grade_sort_key(name):
        num = int("".join(ch for ch in name if ch.isdigit()) or "99999")
        return (num, name)

    grade_snapshot = []
    for grade_name in sorted(grade_groups.keys(), key=_grade_sort_key):
        group = grade_groups[grade_name]
        grade_percentages = []
        for s in group:
            grade_percentages.extend(student_stats[s.id]["percentages"])
        grade_snapshot.append({
            "grade": grade_name,
            "students_count": len(group),
            "average_score": (
                round(sum(grade_percentages) / len(grade_percentages))
                if grade_percentages
                else None
            ),
            "pending_tasks_count": grade_pending.get(grade_name, 0),
        })

    return Response({
        "teacher": {
            "full_name": user.full_name or user.username,
            "school_name": user.school_name or "",
            "city": user.city or "",
        },
        "summary": {
            "students_count": len(students),
            "active_tasks_count": len(active_tasks),
            "pending_task_items_count": pending_task_items_count,
            "completed_task_items_count": completed_task_items_count,
            "average_student_score": average_student_score,
        },
        "students_requiring_attention": students_requiring_attention,
        "recent_activity": recent_activity,
        "grade_snapshot": grade_snapshot,
    }, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated, HasPaidSubscription])
def teacher_quizzes_by_grade(request):
    """
    GET /api/teacher/quizzes/?grade=<grade_id>
    Returns quizzes filtered by grade (simple + safe).
    """
    user = request.user
    if user.role != 'teacher':
        return Response({'error': 'Only teachers can access this endpoint.'}, status=403)

    grade_id = request.GET.get('grade')
    if not grade_id:
        return Response({'error': 'grade query param is required.'}, status=400)

    quizzes = Quiz.objects.filter(grade_id=grade_id).select_related('grade', 'subject', 'chapter').order_by('title')

    data = []
    for q in quizzes:
        data.append({
            'id': q.id,
            'title': q.title,
            'grade': q.grade.name if q.grade else "",
            'subject': q.subject.name if q.subject else "",
            'chapter': q.chapter.name if q.chapter else "",
        })

    return Response(data, status=200)


@api_view(['POST'])
@permission_classes([IsAuthenticated, HasPaidSubscription])
def teacher_create_task(request):
    """
    POST /api/teacher/tasks/create/
    Payload (JSON):
    {
      "message": "Do these quizzes",
      "due_date": "2026-01-10",
      "target_grade": 3,              # optional
      "target_students": ["u1","u2"],  # optional (usernames)
      "quizzes": [12, 15, 22]
    }

    Rule:
    - Must provide EITHER target_grade OR target_students (not both empty).
    - If target_students provided -> must be within teacher's school+city.
    """
    user = request.user
    if user.role != 'teacher':
        return Response({'error': 'Only teachers can create tasks.'}, status=403)

    payload = request.data or {}

    message = (payload.get('message') or "").strip()
    due_date_raw = payload.get('due_date')
    target_grade_id = payload.get('target_grade')
    target_students = payload.get('target_students') or []
    quizzes = payload.get('quizzes') or []

    if not message:
        return Response({'error': 'message is required.'}, status=400)

    due_date = parse_date(due_date_raw) if isinstance(due_date_raw, str) else None
    if not due_date:
        return Response({'error': 'Valid due_date (YYYY-MM-DD) is required.'}, status=400)

    if not quizzes or not isinstance(quizzes, list):
        return Response({'error': 'quizzes must be a non-empty list of quiz IDs.'}, status=400)

    if not target_grade_id and not target_students:
        return Response({'error': 'Provide target_grade OR target_students.'}, status=400)

    # Create task
    task = TeacherTask.objects.create(
        teacher=user,
        message=message,
        due_date=due_date,
        target_grade_id=target_grade_id if target_grade_id else None,
        is_active=True
    )

    # If selected students were provided: validate teacher scope (school + city)
    if target_students:
        if not isinstance(target_students, list):
            task.delete()
            return Response({'error': 'target_students must be a list of usernames.'}, status=400)

        teacher_city = (user.city or "").strip()
        teacher_school = (user.school_name or "").strip()

        qs = User.objects.filter(role='student', username__in=target_students)

        # enforce city
        if teacher_city:
            qs = qs.filter(city__iexact=teacher_city)
        else:
            task.delete()
            return Response({'error': 'Teacher city is missing; cannot assign student-specific tasks.'}, status=400)

        # enforce school (only if teacher has it)
        if teacher_school:
            qs = qs.filter(school_name__iexact=teacher_school)

        allowed_students = list(qs)

        if not allowed_students:
            task.delete()
            return Response({'error': 'No valid students found in your school/city.'}, status=400)

        task.target_students.set(allowed_students)

    # Attach quizzes (many per task)
    quiz_objs = Quiz.objects.filter(id__in=quizzes)
    if not quiz_objs.exists():
        task.delete()
        return Response({'error': 'No valid quizzes found.'}, status=400)

    TeacherTaskQuiz.objects.bulk_create([
        TeacherTaskQuiz(task=task, quiz=q) for q in quiz_objs
    ])

    return Response({'success': True, 'task_id': task.id}, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated, HasPaidSubscription])
def teacher_tasks_list(request):
    """
    GET /api/teacher/tasks/
    Returns tasks created by this teacher with student progress.
    """
    user = request.user
    if user.role != 'teacher':
        return Response({'error': 'Only teachers can access this endpoint.'}, status=403)

    tasks = (
        TeacherTask.objects
        .filter(teacher=user)
        .prefetch_related(
            Prefetch('task_quizzes', queryset=TeacherTaskQuiz.objects.select_related('quiz')),
            'target_students',
            'target_grade',
        )
        .order_by('-created_at')
    )

    data = []
    for t in tasks:
        task_quizzes = [tq for tq in t.task_quizzes.all() if tq.quiz]
        quiz_objs = [tq.quiz for tq in task_quizzes]
        quiz_totals = {q.id: _quiz_total_marks(q) for q in quiz_objs}

        assigned_students = _task_assigned_students(t, user)
        student_ids = [s.id for s in assigned_students]
        quiz_ids = [q.id for q in quiz_objs]
        attempts_map = _latest_attempts_map(student_ids, quiz_ids)

        is_grade_wide = bool(t.target_grade_id) and not t.target_students.exists()
        target_type = "grade_wide" if is_grade_wide else "selected_students"

        data.append({
            'task_id': t.id,
            'id': t.id,
            'message': t.message,
            'due_date': t.due_date.strftime('%Y-%m-%d') if t.due_date else None,
            'is_active': t.is_active,
            'status': _task_status_label(t),
            'target_type': target_type,
            'target_grade': t.target_grade.name if t.target_grade else None,
            'target_students_count': len(assigned_students),
            'quizzes': [{'id': q.id, 'title': q.title} for q in quiz_objs],
            'assigned_students': [
                _serialize_student_task_progress(s, task_quizzes, attempts_map, quiz_totals)
                for s in assigned_students
            ],
            'created_at': t.created_at.strftime('%Y-%m-%d') if t.created_at else None,
        })

    return Response(data, status=200)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, HasPaidSubscription])
def teacher_delete_task(request, task_id):
    user = request.user
    if user.role != 'teacher':
        return Response({'error': 'Only teachers can delete tasks.'}, status=403)

    try:
        task = TeacherTask.objects.get(id=task_id, teacher=user)
    except TeacherTask.DoesNotExist:
        return Response({'error': 'Task not found.'}, status=404)

    task.delete()
    return Response({
        'success': True,
        'message': 'Task deleted successfully.',
    }, status=200)



@api_view(['GET'])
@permission_classes([IsAuthenticated, HasPaidSubscription])
def student_tasks_list(request):
    user = request.user

    if user.role != 'student':
        return Response({'error': 'Only students can access tasks.'}, status=403)

    student_grade = user.grade  # can be None

    # Base: active tasks
    qs = TeacherTask.objects.filter(is_active=True)

    # Build safe filters
    filters = Q(target_students=user)
    if student_grade is not None:
        filters |= Q(target_grade=student_grade)

    qs = (
        qs.filter(filters)
        .distinct()
        .select_related('teacher', 'target_grade')
        .prefetch_related('task_quizzes__quiz')
        .order_by('-created_at')
    )

    tasks_out = []
    pending_quiz_count = 0
    pending_tasks_count = 0

    for task in qs:
        quizzes_out = []
        task_has_pending_quiz = False

        # IMPORTANT: quizzes are through TeacherTaskQuiz
        for tq in task.task_quizzes.all():
            quiz = tq.quiz
            if not quiz:
                continue

            attempted = StudentQuizAttempt.objects.filter(
                student=user,
                quiz=quiz,
                completed_at__isnull=False
            ).exists()

            if not attempted:
                pending_quiz_count += 1
                task_has_pending_quiz = True

            quizzes_out.append({
                "quiz_id": quiz.id,
                "title": quiz.title,
                "grade": quiz.grade.name if quiz.grade else "",
                "subject": quiz.subject.name if quiz.subject else "",
                "chapter": quiz.chapter.name if quiz.chapter else "",
                "attempted": attempted,
            })

        if quizzes_out and task_has_pending_quiz:
            pending_tasks_count += 1

        tasks_out.append({
            "task_id": task.id,
            "message": task.message,
            "due_date": task.due_date.strftime('%Y-%m-%d') if task.due_date else None,
            "created_at": task.created_at.strftime('%Y-%m-%d') if task.created_at else None,
            "teacher": {
                "username": task.teacher.username,
                "full_name": getattr(task.teacher, "full_name", "") or "",
                "school_name": getattr(task.teacher, "school_name", "") or "",
                "city": getattr(task.teacher, "city", "") or "",
            },
            "assigned_to": {
                "target_grade": task.target_grade.id if task.target_grade else None,
                "target_grade_name": task.target_grade.name if task.target_grade else None,
                "is_grade_wide": bool(task.target_grade_id),
            },
            "quizzes": quizzes_out,
        })

    return Response({
        "tasks": tasks_out,
        "summary": {
            "tasks_count": len(tasks_out),
            "pending_quiz_count": pending_quiz_count,
            "pending_tasks_count": pending_tasks_count,
        }
    }, status=200)

def privacy_policy(request):
    return render(request, "privacy_policy.html")
