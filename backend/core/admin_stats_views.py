from django.shortcuts import render
from django.db.models import Avg
from django.utils import timezone
from core.models import User, StudentQuizAttempt

LANGUAGE_CHOICES = [
    "Urdu", "Pashto", "Punjabi", "Brahui", "Sindhi", "Saraiki",
    "Balochi", "Hindko", "Kohistani", "Dari/Farsi", "Chitrali", "Other"
]

def stats_dashboard_view(request):
    today = timezone.now().date()

    # Descriptive Statistics
    total_students = User.objects.filter(role='student').count()
    active_students = User.objects.filter(
        role='student', is_active=True, subscription_expiry__gt=today
    ).count()
    inactive_students = total_students - active_students

    total_teachers = User.objects.filter(role='teacher').count()
    active_teachers = User.objects.filter(
        role='teacher', is_active=True, subscription_expiry__gt=today
    ).count()
    inactive_teachers = total_teachers - active_teachers

    num_quizzes = StudentQuizAttempt.objects.values('quiz').distinct().count()

    descriptive_stats = {
        "totalstudents": total_students,
        "activestudents": active_students,
        "inactivestudents": inactive_students,
        "totalteachers": total_teachers,
        "activeteachers": active_teachers,
        "inactiveteachers": inactive_teachers,
        "numquizzes": num_quizzes,
    }

    # National Overview by Province
    province_data = []
    provinces = User.objects.filter(
        role='student'
    ).exclude(province__isnull=True).exclude(province="").values_list('province', flat=True).distinct()
    total_population = total_students

    for province in provinces:
        users = User.objects.filter(role='student', province=province)
        male_count = users.filter(gender='Male').count()
        female_count = users.filter(gender='Female').count()
        total = male_count + female_count

        avg_score = StudentQuizAttempt.objects.filter(
            student__in=users, completed_at__isnull=False
        ).aggregate(score=Avg('score'))['score'] or 0

        province_data.append({
            "province": province,
            "male": male_count,
            "female": female_count,
            "total": total,
            "percent": round((total / total_population) * 100, 2) if total_population else 0,
            "avg_score": round(avg_score, 1)
        })

    province_data = sorted(province_data, key=lambda x: x['avg_score'], reverse=True)
    for i, item in enumerate(province_data):
        item['ranking'] = i + 1

    # Provincial Overview (City-Level)
    regional = {}
    for item in province_data:
        province = item['province']
        regional[province] = []
        cities = User.objects.filter(
            role='student', province=province
        ).exclude(city__isnull=True).exclude(city="").values_list('city', flat=True).distinct()

        city_stats = []
        for city in cities:
            users = User.objects.filter(role='student', province=province, city=city)
            m = users.filter(gender='Male').count()
            f = users.filter(gender='Female').count()
            total = m + f
            avg_score = StudentQuizAttempt.objects.filter(
                student__in=users, completed_at__isnull=False
            ).aggregate(score=Avg('score'))['score'] or 0

            city_stats.append({
                "city": city,
                "male": m,
                "female": f,
                "total": total,
                "avg_score": round(avg_score, 1)
            })

        # Sort and assign city rankings
        city_stats = sorted(city_stats, key=lambda x: x['avg_score'], reverse=True)
        for idx, row in enumerate(city_stats):
            row['ranking'] = idx + 1

        regional[province] = city_stats

    # Gender × Language Cross-Tab
    crosstab = []
    for lang in LANGUAGE_CHOICES:
        students = User.objects.filter(role='student', language_used_at_home=lang)
        males = students.filter(gender='Male')
        females = students.filter(gender='Female')

        m_score = StudentQuizAttempt.objects.filter(
            student__in=males, completed_at__isnull=False
        ).aggregate(score=Avg('score'))['score'] or 0

        f_score = StudentQuizAttempt.objects.filter(
            student__in=females, completed_at__isnull=False
        ).aggregate(score=Avg('score'))['score'] or 0

        gap = round(f_score - m_score, 1)
        symbol = "F↗" if gap > 0 else "M↗" if gap < 0 else "="

        crosstab.append({
            "language": lang,
            "male_count": males.count(),
            "male_avg_score": round(m_score),
            "female_count": females.count(),
            "female_avg_score": round(f_score),
            "gender_gap": f"{'+' if gap >= 0 else ''}{gap}% ({symbol})"
        })

    return render(request, "admin/core/stats_dashboard.html", {
        "descriptive_stats": descriptive_stats,
        "national_overview": province_data,
        "provincial_overview": regional,
        "gender_language_crosstab": crosstab,
    })