from collections import defaultdict

from core.models import (
    FIBQuestion,
    MCQQuestion,
    SCQQuestion,
    StudentAnswer,
    StudentQuizAttempt,
    Subject,
)


def _grade_name_for_filter(user):
    grade = getattr(user, "grade", None)
    if grade is None:
        return None
    return getattr(grade, "name", grade)


def _is_answer_correct(ans):
    try:
        if ans.question_type == "scq":
            q = SCQQuestion.objects.get(question_id=str(ans.question_id))
            return ans.answer_data.get("selected") == q.correct_answer
        if ans.question_type == "mcq":
            q = MCQQuestion.objects.get(question_id=str(ans.question_id))
            correct_set = sorted([x.strip() for x in q.correct_answers.split(",")])
            selected_set = sorted(ans.answer_data.get("selected", []))
            return selected_set == correct_set
        if ans.question_type == "fib":
            q = FIBQuestion.objects.get(question_id=str(ans.question_id))
            return ans.answer_data == q.correct_answers
    except Exception:
        return False
    return False


def build_subject_performance_rows(student_user):
    """
    Same row structure as GET student/subject-performance/, including
    the trailing 'Overall Performance' summary row when data exists.
    """
    subject_data = defaultdict(
        lambda: {"student_total": 0, "student_correct": 0, "class_total": 0, "class_correct": 0}
    )

    all_answers = StudentAnswer.objects.filter(
        attempt__student=student_user,
        attempt__completed_at__isnull=False,
    )

    for ans in all_answers:
        try:
            quiz = ans.attempt.quiz
            subject = quiz.subject.name if quiz.subject else "Unknown"
        except Exception:
            continue

        is_correct = _is_answer_correct(ans)
        subject_data[subject]["student_total"] += 1
        if is_correct:
            subject_data[subject]["student_correct"] += 1

    grade_name = _grade_name_for_filter(student_user)
    for subject in list(subject_data.keys()):
        subject_obj = Subject.objects.filter(name=subject).first()
        if not subject_obj:
            continue

        class_filters = {
            "quiz__subject": subject_obj,
            "completed_at__isnull": False,
        }
        if grade_name:
            class_filters["quiz__grade__name"] = grade_name

        class_attempts = StudentQuizAttempt.objects.filter(**class_filters)
        class_answers = StudentAnswer.objects.filter(attempt__in=class_attempts)

        for ans in class_answers:
            is_correct = _is_answer_correct(ans)
            subject_data[subject]["class_total"] += 1
            if is_correct:
                subject_data[subject]["class_correct"] += 1

    rows = []
    total_student_avg = 0
    total_class_avg = 0
    total_percentile = 0
    count = 0

    for subject, data in subject_data.items():
        student_avg = (
            (data["student_correct"] / data["student_total"] * 100) if data["student_total"] else 0
        )
        class_avg = (data["class_correct"] / data["class_total"] * 100) if data["class_total"] else 0
        percentile = (student_avg / class_avg * 100) if class_avg else 0

        total_student_avg += student_avg
        total_class_avg += class_avg
        total_percentile += percentile
        count += 1

        rows.append(
            {
                "subject": subject,
                "student_avg": round(student_avg, 2),
                "class_avg": round(class_avg, 2),
                "percentile": round(percentile, 2),
            }
        )

    if count:
        rows.append(
            {
                "subject": "Overall Performance",
                "student_avg": round(total_student_avg / count, 2),
                "class_avg": round(total_class_avg / count, 2),
                "percentile": round(total_percentile / count, 2),
            }
        )

    return rows


def overall_performance_metrics(student_user):
    """
    Returns (student_average, class_average, percentile) from Overall Performance,
    or (None, None, None) when the student has no completed-attempt answer data.
    """
    rows = build_subject_performance_rows(student_user)
    overall = next((row for row in rows if row.get("subject") == "Overall Performance"), None)
    if not overall:
        return None, None, None
    return overall["student_avg"], overall["class_avg"], overall["percentile"]
