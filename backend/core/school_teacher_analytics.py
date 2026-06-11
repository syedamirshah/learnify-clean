from django.db.models import Prefetch
from django.shortcuts import get_object_or_404

from core.models import StudentQuizAttempt, TeacherTask, TeacherTaskQuiz, User


def _teacher_helpers():
    from core.views import (
        _attempt_percentage,
        _latest_attempts_map,
        _task_assigned_students,
        _teacher_scoped_students_queryset,
    )

    return {
        "attempt_percentage": _attempt_percentage,
        "latest_attempts_map": _latest_attempts_map,
        "task_assigned_students": _task_assigned_students,
        "teacher_scoped_students_queryset": _teacher_scoped_students_queryset,
    }


def school_teachers_queryset(school):
    return User.objects.filter(school=school, role="teacher")


def get_school_teacher(school, username):
    return get_object_or_404(
        User,
        username__iexact=username,
        role="teacher",
        school=school,
    )


def get_teacher_monitoring_students(teacher, school):
    if teacher.school_id != school.id:
        return User.objects.none()

    helpers = _teacher_helpers()
    scoped = helpers["teacher_scoped_students_queryset"](teacher)
    return scoped.filter(school=school, role="student").select_related("grade")


def _count_task_items(task, teacher):
    helpers = _teacher_helpers()
    assigned = helpers["task_assigned_students"](task, teacher)
    task_quizzes = [tq for tq in task.task_quizzes.all() if tq.quiz]
    quiz_ids = [tq.quiz.id for tq in task_quizzes]
    attempts_map = helpers["latest_attempts_map"]([s.id for s in assigned], quiz_ids)

    completed = 0
    pending = 0
    for student in assigned:
        if student.school_id != teacher.school_id:
            continue
        for tq in task_quizzes:
            if attempts_map.get((student.id, tq.quiz.id)):
                completed += 1
            else:
                pending += 1
    return completed, pending


def _build_attention_students(student_stats):
    attention_candidates = []
    for stats in student_stats.values():
        student = stats["student"]
        average = (
            round(sum(stats["percentages"]) / len(stats["percentages"]))
            if stats["percentages"]
            else None
        )
        pending = stats["pending_task_items"]
        attempt_count = stats["attempt_count"]

        if not ((pending > 0) or (average is not None and average < 50) or (attempt_count == 0)):
            continue

        if average is not None and average < 50:
            reason = "Low average score"
            detail = f"Average score {average}%"
            tier = 0
            sort_key = average
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
            "student_id": student.id,
            "username": student.username,
            "full_name": student.full_name or student.username,
            "grade": student.grade.name if student.grade else "",
            "reason": reason,
            "detail": detail,
            "average_score": average if average is not None else 0,
        })

    attention_candidates.sort(key=lambda row: (row["tier"], row["sort_key"]))
    return [
        {key: value for key, value in row.items() if key not in ("tier", "sort_key")}
        for row in attention_candidates
    ]


def build_teacher_monitoring_snapshot(teacher, school):
    if teacher.school_id != school.id:
        return None

    helpers = _teacher_helpers()
    students = list(get_teacher_monitoring_students(teacher, school).order_by("full_name", "username"))
    student_ids = [student.id for student in students]

    student_stats = {
        student.id: {
            "student": student,
            "pending_task_items": 0,
            "percentages": [],
            "attempt_count": 0,
        }
        for student in students
    }

    active_tasks = list(
        TeacherTask.objects.filter(teacher=teacher, is_active=True).prefetch_related(
            Prefetch("task_quizzes", queryset=TeacherTaskQuiz.objects.select_related("quiz")),
            "target_students",
            "target_grade",
        )
    )

    pending_task_items_count = 0
    completed_task_items_count = 0

    for task in active_tasks:
        completed, pending = _count_task_items(task, teacher)
        completed_task_items_count += completed
        pending_task_items_count += pending

        assigned = helpers["task_assigned_students"](task, teacher)
        task_quizzes = [tq for tq in task.task_quizzes.all() if tq.quiz]
        quiz_ids = [tq.quiz.id for tq in task_quizzes]
        attempts_map = helpers["latest_attempts_map"]([s.id for s in assigned], quiz_ids)

        for student in assigned:
            if student.school_id != school.id:
                continue
            for tq in task_quizzes:
                if attempts_map.get((student.id, tq.quiz.id)):
                    continue
                student_stats[student.id]["pending_task_items"] += 1

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
        percentage = helpers["attempt_percentage"](attempt, attempt.quiz)
        all_percentages.append(percentage)
        student_stats[attempt.student_id]["percentages"].append(percentage)
        student_stats[attempt.student_id]["attempt_count"] += 1

    average_student_score = (
        round(sum(all_percentages) / len(all_percentages), 1) if all_percentages else None
    )

    students_requiring_attention = _build_attention_students(student_stats)

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
            "student_name": attempt.student.full_name or attempt.student.username,
            "quiz_title": attempt.quiz.title,
            "percentage": helpers["attempt_percentage"](attempt, attempt.quiz),
            "completed_at": attempt.completed_at.strftime("%Y-%m-%d") if attempt.completed_at else None,
        }
        for attempt in recent_attempts
    ]

    return {
        "teacher": {
            "id": teacher.id,
            "username": teacher.username,
            "full_name": teacher.full_name or teacher.username,
            "email": teacher.email or "",
        },
        "students_count": len(students),
        "average_student_score": average_student_score,
        "active_tasks_count": len(active_tasks),
        "completed_task_items": completed_task_items_count,
        "pending_task_items": pending_task_items_count,
        "attention_students_count": len(students_requiring_attention),
        "students_requiring_attention": students_requiring_attention[:5],
        "recent_activity": recent_activity,
    }


def build_school_teacher_analytics(school):
    teachers = list(school_teachers_queryset(school).order_by("full_name", "username"))
    teacher_rows = []
    teacher_averages = []
    total_active_tasks = 0
    total_pending_items = 0

    for teacher in teachers:
        snapshot = build_teacher_monitoring_snapshot(teacher, school)
        if not snapshot:
            continue

        if snapshot["average_student_score"] is not None:
            teacher_averages.append(snapshot["average_student_score"])

        total_active_tasks += snapshot["active_tasks_count"]
        total_pending_items += snapshot["pending_task_items"]

        teacher_rows.append({
            "id": snapshot["teacher"]["id"],
            "username": snapshot["teacher"]["username"],
            "full_name": snapshot["teacher"]["full_name"],
            "students_count": snapshot["students_count"],
            "average_student_score": snapshot["average_student_score"],
            "active_tasks_count": snapshot["active_tasks_count"],
            "completed_task_items": snapshot["completed_task_items"],
            "pending_task_items": snapshot["pending_task_items"],
            "attention_students_count": snapshot["attention_students_count"],
        })

    return {
        "teachers": teacher_rows,
        "summary": {
            "teachers": len(teacher_rows),
            "average_school_teacher_score": (
                round(sum(teacher_averages) / len(teacher_averages), 1)
                if teacher_averages
                else None
            ),
            "total_active_tasks": total_active_tasks,
            "total_pending_items": total_pending_items,
        },
    }


def build_school_teacher_summary(teacher, school):
    snapshot = build_teacher_monitoring_snapshot(teacher, school)
    if not snapshot:
        return None
    return {
        "teacher": snapshot["teacher"],
        "students_count": snapshot["students_count"],
        "average_student_score": snapshot["average_student_score"],
        "active_tasks_count": snapshot["active_tasks_count"],
        "completed_task_items": snapshot["completed_task_items"],
        "pending_task_items": snapshot["pending_task_items"],
        "students_requiring_attention": snapshot["students_requiring_attention"],
        "recent_activity": snapshot["recent_activity"],
    }


def build_school_task_monitoring(school):
    teacher_ids = school_teachers_queryset(school).values_list("id", flat=True)
    tasks = (
        TeacherTask.objects.filter(teacher_id__in=teacher_ids, is_active=True)
        .select_related("teacher")
        .prefetch_related(
            Prefetch("task_quizzes", queryset=TeacherTaskQuiz.objects.select_related("quiz")),
            "target_students",
            "target_grade",
        )
        .order_by("-created_at")
    )

    total_completed = 0
    total_pending = 0
    task_rows = []

    for task in tasks:
        if task.teacher.school_id != school.id:
            continue

        completed, pending = _count_task_items(task, task.teacher)
        total_completed += completed
        total_pending += pending
        total_items = completed + pending
        completion_percentage = round((completed / total_items) * 100) if total_items else 0

        task_rows.append({
            "task_id": task.id,
            "teacher_name": task.teacher.full_name or task.teacher.username,
            "teacher_username": task.teacher.username,
            "message": task.message,
            "completion_percentage": completion_percentage,
            "completed_items": completed,
            "pending_items": pending,
        })

    return {
        "summary": {
            "active_tasks": len(task_rows),
            "completed_items": total_completed,
            "pending_items": total_pending,
        },
        "tasks": task_rows,
    }
