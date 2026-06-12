from core.models import User


def teacher_students_queryset(teacher):
    """
    Students visible to a teacher.

    School-linked teachers: same school FK only.
    Legacy retail teachers: city + school_name fallback.
    """
    school_id = getattr(teacher, "school_id", None)
    if school_id:
        return User.objects.filter(school_id=school_id, role="student")

    teacher_city = (teacher.city or "").strip()
    teacher_school = (teacher.school_name or "").strip()
    if not teacher_city:
        return User.objects.none()

    qs = User.objects.filter(role="student", city__iexact=teacher_city)
    if teacher_school:
        qs = qs.filter(school_name__iexact=teacher_school)
    return qs.exclude(city__isnull=True).exclude(city__exact="")


def teacher_can_access_student(teacher, student) -> bool:
    if student.role != "student":
        return False
    if teacher.school_id:
        return student.school_id == teacher.school_id
    teacher_city = (teacher.city or "").strip().casefold()
    teacher_school = (teacher.school_name or "").strip().casefold()
    student_city = (student.city or "").strip().casefold()
    student_school = (student.school_name or "").strip().casefold()
    if not teacher_city:
        return False
    return student_city == teacher_city and student_school == teacher_school
