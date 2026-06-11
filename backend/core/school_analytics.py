from collections import defaultdict

from django.shortcuts import get_object_or_404

from core.models import User
from core.student_monitoring import build_student_score_stats, student_average_score


def school_students_queryset(school):
    return User.objects.filter(school=school, role="student").select_related("grade")


def get_school_student(school, username):
    return get_object_or_404(
        User,
        username__iexact=username,
        role="student",
        school=school,
    )


def _grade_sort_key(name):
    number = int("".join(character for character in name if character.isdigit()) or "99999")
    return (number, name)


def build_school_analytics_summary(school):
    students = list(school_students_queryset(school).order_by("full_name", "username"))
    teachers_count = User.objects.filter(school=school, role="teacher").count()
    student_stats, all_percentages = build_student_score_stats(students)

    overview_average = (
        round(sum(all_percentages) / len(all_percentages), 1)
        if all_percentages
        else None
    )

    grade_groups = defaultdict(list)
    for student in students:
        grade_name = student.grade.name if student.grade else "Unassigned Grade"
        grade_groups[grade_name].append(student)

    grade_snapshot = []
    for grade_name in sorted(grade_groups.keys(), key=_grade_sort_key):
        group = grade_groups[grade_name]
        grade_percentages = []
        for student in group:
            grade_percentages.extend(student_stats[student.id]["percentages"])
        grade_snapshot.append({
            "grade": grade_name,
            "students": len(group),
            "average_score": (
                round(sum(grade_percentages) / len(grade_percentages), 1)
                if grade_percentages
                else None
            ),
        })

    ranked_students = []
    attention_candidates = []
    for stats in student_stats.values():
        student = stats["student"]
        average_score = student_average_score(stats)
        ranked_students.append({
            "id": student.id,
            "full_name": student.full_name or student.username,
            "username": student.username,
            "average_score": average_score,
            "attempt_count": stats["attempt_count"],
        })
        if average_score is None or average_score < 50:
            attention_candidates.append({
                "id": student.id,
                "full_name": student.full_name or student.username,
                "username": student.username,
                "average_score": average_score if average_score is not None else 0,
                "sort_key": average_score if average_score is not None else -1,
            })

    attention_candidates.sort(key=lambda row: row["sort_key"])
    students_requiring_attention = [
        {
            "id": row["id"],
            "full_name": row["full_name"],
            "username": row["username"],
            "average_score": row["average_score"],
        }
        for row in attention_candidates[:10]
    ]

    top_students = [
        {
            "id": row["id"],
            "full_name": row["full_name"],
            "username": row["username"],
            "average_score": row["average_score"],
        }
        for row in sorted(
            [
                row for row in ranked_students
                if row["average_score"] is not None and row["average_score"] >= 50
            ],
            key=lambda row: row["average_score"],
            reverse=True,
        )[:10]
    ]

    return {
        "overview": {
            "students": len(students),
            "teachers": teachers_count,
            "average_score": overview_average,
        },
        "grade_snapshot": grade_snapshot,
        "students_requiring_attention": students_requiring_attention,
        "top_students": top_students,
    }


def build_school_student_summary(student):
    stats, _ = build_student_score_stats([student])
    student_stats = stats[student.id]
    average_score = student_average_score(student_stats)
    username = student.username

    return {
        "student": {
            "id": student.id,
            "username": student.username,
            "full_name": student.full_name or student.username,
            "email": student.email or "",
            "grade": student.grade.name if student.grade else None,
            "account_status": student.account_status,
        },
        "quiz_count": student_stats["attempt_count"],
        "average_score": average_score,
        "quiz_history_url": f"/school/student/{username}/quiz-history",
        "learning_diagnosis_url": f"/school/student/{username}/learning-diagnosis",
    }
