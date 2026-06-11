from collections import defaultdict

from django.db import models
from django.db.models import Max, Sum
from django.utils.timezone import localtime

from core.models import StudentQuizAttempt, User

pk_timezone = None


def _get_pk_timezone():
    global pk_timezone
    if pk_timezone is None:
        import pytz

        pk_timezone = pytz.timezone("Asia/Karachi")
    return pk_timezone


def _quiz_total_marks(quiz):
    total_questions = quiz.assignments.aggregate(total=Sum("num_questions"))["total"] or 0
    return total_questions * quiz.marks_per_question


def attempt_percentage(attempt, quiz=None):
    quiz = quiz or attempt.quiz
    total_marks = _quiz_total_marks(quiz)
    if not total_marks:
        return 0.0
    return round((attempt.score / total_marks) * 100, 2)


def calculate_grade_letter(percentage):
    if percentage >= 95:
        return "A+"
    if percentage >= 90:
        return "A-"
    if percentage >= 85:
        return "B+"
    if percentage >= 80:
        return "B-"
    if percentage >= 75:
        return "C+"
    if percentage >= 70:
        return "C-"
    if percentage >= 65:
        return "D+"
    if percentage >= 60:
        return "D-"
    return "F"


def latest_completed_attempts_queryset(student):
    latest_attempt_times = StudentQuizAttempt.objects.filter(
        student=student,
        completed_at__isnull=False,
    ).values("quiz").annotate(latest=Max("completed_at")).values_list("latest", flat=True)

    return StudentQuizAttempt.objects.filter(
        student=student,
        completed_at__in=list(latest_attempt_times),
    ).select_related("quiz", "quiz__grade", "quiz__subject", "quiz__chapter")


def build_student_quiz_history(student):
    attempts = latest_completed_attempts_queryset(student).order_by("-completed_at")
    results = []
    for attempt in attempts:
        quiz = attempt.quiz
        total_questions = quiz.assignments.aggregate(total=models.Sum("num_questions"))["total"] or 0
        total_marks = total_questions * quiz.marks_per_question
        percentage = attempt_percentage(attempt, quiz)
        results.append({
            "quiz_title": quiz.title,
            "quiz_id": quiz.id,
            "chapter": quiz.chapter.name if quiz.chapter else "",
            "subject": quiz.subject.name if quiz.subject else "",
            "grade": quiz.grade.name if quiz.grade else "",
            "marks_obtained": attempt.score,
            "total_questions": total_questions,
            "marks_per_question": quiz.marks_per_question,
            "percentage": percentage,
            "grade_letter": calculate_grade_letter(percentage),
            "attempted_on": localtime(
                attempt.completed_at,
                timezone=_get_pk_timezone(),
            ).strftime("%d-%m-%Y %I:%M %p"),
            "attempt_id": str(attempt.id),
        })

    return {
        "full_name": student.full_name,
        "results": results,
    }


def _chapter_mastery_status(avg_percentage):
    if avg_percentage >= 80:
        return "strong"
    if avg_percentage >= 50:
        return "improving"
    return "weak"


def build_learning_diagnosis(student, practice_path_template="/student/attempt-quiz/{quiz_id}"):
    from core.views import (
        _learning_diagnosis_v2_fields,
    )

    attempts = latest_completed_attempts_queryset(student)
    quiz_rows = []
    for attempt in attempts:
        quiz = attempt.quiz
        percentage = attempt_percentage(attempt, quiz)
        chapter = quiz.chapter
        quiz_rows.append({
            "quiz_id": quiz.id,
            "quiz_title": quiz.title,
            "chapter_id": chapter.id if chapter else None,
            "chapter_name": chapter.name if chapter else "General",
            "subject_name": quiz.subject.name if quiz.subject else "",
            "percentage": percentage,
            "practice_path": practice_path_template.format(quiz_id=quiz.id),
        })

    if not quiz_rows:
        v2 = _learning_diagnosis_v2_fields(student, 0, [], [], [], [])
        return {
            "full_name": student.full_name,
            "has_data": False,
            "learning_health_score": v2["learning_health_score"],
            "health_status": v2["health_status"],
            "attention_required": [],
            "learning_trend": v2["learning_trend"],
            "overall": {
                "total_attempted_quizzes": 0,
                "overall_average_percentage": 0,
                "strong_chapters_count": 0,
                "improving_chapters_count": 0,
                "weak_chapters_count": 0,
            },
            "chapter_mastery": [],
            "low_score_quizzes": [],
            "recommended_practice": [],
            "parent_friendly_summary": v2["parent_friendly_summary"],
        }

    chapter_buckets = {}
    for row in quiz_rows:
        key = row["chapter_id"] if row["chapter_id"] is not None else f"none:{row['chapter_name']}"
        if key not in chapter_buckets:
            chapter_buckets[key] = {
                "chapter_id": row["chapter_id"],
                "chapter_name": row["chapter_name"],
                "subject_name": row["subject_name"],
                "percentages": [],
                "quiz_ids": set(),
            }
        chapter_buckets[key]["percentages"].append(row["percentage"])
        chapter_buckets[key]["quiz_ids"].add(row["quiz_id"])

    chapter_mastery = []
    for bucket in chapter_buckets.values():
        avg_pct = round(sum(bucket["percentages"]) / len(bucket["percentages"]), 2)
        chapter_mastery.append({
            "chapter_id": bucket["chapter_id"],
            "chapter_name": bucket["chapter_name"],
            "subject_name": bucket["subject_name"],
            "quizzes_attempted": len(bucket["quiz_ids"]),
            "average_percentage": avg_pct,
            "status": _chapter_mastery_status(avg_pct),
        })

    chapter_mastery.sort(key=lambda c: (c["status"] != "weak", c["average_percentage"]))

    low_score_quizzes = [
        {key: value for key, value in row.items() if key != "practice_path"}
        for row in quiz_rows
        if row["percentage"] < 50
    ]
    low_score_quizzes.sort(key=lambda q: q["percentage"])

    strong_chapters = [c for c in chapter_mastery if c["status"] == "strong"]
    improving_chapters = [c for c in chapter_mastery if c["status"] == "improving"]
    weak_chapters = [c for c in chapter_mastery if c["status"] == "weak"]

    recommended_practice = []
    seen_quiz_ids = set()

    for chapter in weak_chapters:
        chapter_quizzes = [
            row for row in quiz_rows
            if (
                row["chapter_id"] == chapter["chapter_id"] and chapter["chapter_id"] is not None
            ) or (
                chapter["chapter_id"] is None and row["chapter_name"] == chapter["chapter_name"]
            )
        ]
        chapter_quizzes.sort(key=lambda row: row["percentage"])
        for row in chapter_quizzes:
            if row["quiz_id"] in seen_quiz_ids:
                continue
            seen_quiz_ids.add(row["quiz_id"])
            recommended_practice.append({
                "quiz_id": row["quiz_id"],
                "quiz_title": row["quiz_title"],
                "chapter_name": row["chapter_name"],
                "subject_name": row["subject_name"],
                "percentage": row["percentage"],
                "reason": "weak_chapter",
                "practice_path": row["practice_path"],
            })

    for row in low_score_quizzes:
        if row["quiz_id"] in seen_quiz_ids:
            continue
        seen_quiz_ids.add(row["quiz_id"])
        full_row = next(item for item in quiz_rows if item["quiz_id"] == row["quiz_id"])
        recommended_practice.append({
            "quiz_id": row["quiz_id"],
            "quiz_title": row["quiz_title"],
            "chapter_name": row["chapter_name"],
            "subject_name": row["subject_name"],
            "percentage": row["percentage"],
            "reason": "low_score",
            "practice_path": full_row["practice_path"],
        })

    overall_avg = round(sum(row["percentage"] for row in quiz_rows) / len(quiz_rows), 2)
    v2 = _learning_diagnosis_v2_fields(
        student,
        overall_avg,
        chapter_mastery,
        quiz_rows,
        strong_chapters,
        weak_chapters,
    )

    return {
        "full_name": student.full_name,
        "has_data": True,
        "learning_health_score": v2["learning_health_score"],
        "health_status": v2["health_status"],
        "attention_required": v2["attention_required"],
        "learning_trend": v2["learning_trend"],
        "overall": {
            "total_attempted_quizzes": len(quiz_rows),
            "overall_average_percentage": overall_avg,
            "strong_chapters_count": len(strong_chapters),
            "improving_chapters_count": len(improving_chapters),
            "weak_chapters_count": len(weak_chapters),
        },
        "chapter_mastery": chapter_mastery,
        "strong_chapters": strong_chapters,
        "improving_chapters": improving_chapters,
        "weak_chapters": weak_chapters,
        "low_score_quizzes": [
            {
                **quiz,
                "practice_path": practice_path_template.format(quiz_id=quiz["quiz_id"]),
            }
            for quiz in low_score_quizzes
        ],
        "recommended_practice": recommended_practice,
        "parent_friendly_summary": v2["parent_friendly_summary"],
    }


def build_student_score_stats(students):
    student_ids = [student.id for student in students]
    student_stats = {
        student.id: {
            "student": student,
            "percentages": [],
            "attempt_count": 0,
        }
        for student in students
    }

    if not student_ids:
        return student_stats, []

    attempts_qs = StudentQuizAttempt.objects.filter(
        student_id__in=student_ids,
        completed_at__isnull=False,
    ).select_related("quiz", "student")

    latest_for_avg = {}
    for attempt in attempts_qs.order_by("student_id", "quiz_id", "-completed_at"):
        key = (attempt.student_id, attempt.quiz_id)
        if key not in latest_for_avg:
            latest_for_avg[key] = attempt

    all_percentages = []
    for attempt in latest_for_avg.values():
        percentage = attempt_percentage(attempt, attempt.quiz)
        all_percentages.append(percentage)
        student_stats[attempt.student_id]["percentages"].append(percentage)
        student_stats[attempt.student_id]["attempt_count"] += 1

    return student_stats, all_percentages


def student_average_score(stats_entry):
    percentages = stats_entry["percentages"]
    if not percentages:
        return None
    return round(sum(percentages) / len(percentages), 1)
