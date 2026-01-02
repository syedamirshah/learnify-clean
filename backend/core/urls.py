from django.urls import path
from django.views.generic import TemplateView
from django.contrib.auth.views import LoginView, LogoutView
from django.shortcuts import redirect

# --- Public/API views (core.views) ---
from core.views import (
    # uploads
    bulk_upload_scq, bulk_upload_mcq, bulk_upload_fib,
    # users
    user_list_api, user_list,
    # quiz flow
    start_quiz, submit_answer, finalize_quiz, get_quiz_result,
    # honors & listings
    get_shining_stars, get_national_heroes, list_all_quizzes, list_public_quizzes,
    # teacher lists
    teacher_student_list,
    # admin history view actually lives here
    admin_student_quiz_history,
    # student results
    list_student_quiz_results,
)

from core import admin_views  # for admin/api/subjects & admin/api/chapters helpers

# --- Admin views / dashboards (core.admin_views) ---
from core.admin_views import (
    preview_questions, assign_questions_view,
    admin_list_quizzes_view, duplicate_question,
    list_backups, download_backup, restore_backup, upload_restore_backup,
    user_dashboard, admin_question_bank_view, admin_quiz_dashboard,
    create_metadata_view, quiz_question_assignment_view, quiz_formatting_view,
    edit_question_bank, delete_question_bank, delete_question,
    bulk_delete_users,
)

# --- Stats dashboard ---
from core.admin_stats_views import stats_dashboard_view

# --- Auth / profile / subscription endpoints (this app’s views) ---
from .views import (
    get_current_user,
    public_register_user,
    subscription_info,
    CustomTokenObtainPairView,
    edit_profile_view, change_password_view,
    teacher_student_quiz_history_view,
    student_subject_performance as student_subject_performance_view,  # keep the alias only
    student_quiz_history_view,
    get_all_grades,
)
from core.views import teacher_quizzes_by_grade

urlpatterns = [

    # ---------- Question Bank Upload ----------
    path('upload/scq/<int:bank_id>/', bulk_upload_scq, name='bulk_upload_scq'),
    path('upload/mcq/<int:bank_id>/', bulk_upload_mcq, name='bulk_upload_mcq'),
    path('upload/fib/<int:bank_id>/', bulk_upload_fib, name='bulk_upload_fib'),

    # ---------- Preview + Assignment ----------
    path('preview-questions/<int:bank_id>/', preview_questions, name='preview_questions'),
    path('admin/core/assign_questions/<int:quiz_id>/', assign_questions_view, name='assign-questions'),

    # ---------- Quiz Actions ----------
    path('student/quiz/<int:quiz_id>/start/', start_quiz, name='start-quiz'),
    path('student/submit-answer/', submit_answer, name='submit-answer'),
    path('student/quiz/finalize/', finalize_quiz, name='finalize-quiz'),
    path('student/results/', list_student_quiz_results, name='student-quiz-results'),
    path('student/subject-performance/', student_subject_performance_view, name='student_subject_performance'),

    path('student/quiz-result/<int:attempt_id>/', get_quiz_result),
    # API aliases
    path('api/quiz/start/<int:quiz_id>/', start_quiz, name='start_quiz_api'),
    path('api/student/quiz-result/<int:attempt_id>/', get_quiz_result),

    # ---------- Users ----------
    path('api/users/', user_list_api, name='user-list'),
    path('users/', user_list, name='user-list'),

    # ---------- Quiz Management ----------
    path('admin/quizzes/', list_all_quizzes, name='admin-list-quizzes'),
    path('internal/quiz-list/', admin_list_quizzes_view, name='admin-quiz-list'),
    path('admin/quizzes/create-metadata/', create_metadata_view, name='create-metadata'),
    path('admin/core/list-quizzes/', admin_list_quizzes_view, name='admin-list-quizzes'),
    path('admin/core/quiz-format/<int:quiz_id>/', quiz_formatting_view, name='quiz-format'),
    path('admin/core/quiz-question-assignments/', quiz_question_assignment_view, name='quiz-question-assignments'),
    path('admin/dashboard/quizzes/', admin_quiz_dashboard, name='admin-quiz-dashboard'),

    # ---------- Question Bank ----------
    path('admin/question-bank/edit/<int:bank_id>/', edit_question_bank, name='edit-question-bank'),
    path('admin/question-bank/delete/<int:bank_id>/', delete_question_bank, name='delete-question-bank'),

    # ---------- Questions ----------
    path('admin/core/duplicate/<str:question_type>/<int:question_id>/', duplicate_question, name='duplicate_question'),
    path('delete-question/<str:q_type>/<uuid:q_id>/<int:bank_id>/', delete_question, name='delete_question'),

    # ---------- Honors ----------
    path('api/honors/shining-stars/', get_shining_stars, name='get_shining_stars'),
    path('api/honors/national-heroes/', get_national_heroes, name='get_national_heroes'),
    path('honor-roll', TemplateView.as_view(template_name="admin/core/honor_roll.html"), name="honor_roll"),

    # ---------- Backups ----------
    path('admin/backups/', list_backups, name='list_backups'),
    path('admin/backups/<str:filename>/download/', download_backup, name='download_backup'),
    path('admin/backups/<str:filename>/restore/', restore_backup, name='restore_backup'),
    path('admin/backups/upload/', upload_restore_backup, name='upload_restore_backup'),

    # ---------- Final Stats Dashboard ----------
    path('admin/stats-dashboard/', stats_dashboard_view, name='admin-stats-dashboard'),

    # ---------- Auth / Profile / Subscription ----------
    path('api/user/me/', get_current_user),
    path('api/register/', public_register_user, name='public_register_user'),
    path('api/account/subscription-info/', subscription_info, name='subscription_info'),
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/user/edit-profile/', edit_profile_view),
    path('api/user/change-password/', change_password_view),

    # ---------- Teacher / Student ----------
    path('api/teacher/students/', teacher_student_list, name='teacher-student-list'),
    path('api/teacher/student/<str:username>/quiz-history/', teacher_student_quiz_history_view, name='teacher-student-quiz-history'),
    path('api/student/subject-performance/', student_subject_performance_view, name='student-subject-performance'),
    path('student/quiz-history/', student_quiz_history_view, name='student_quiz_history'),

    # ---------- Admin dashboard shortcuts ----------
    path('admin/dashboard/users/', user_dashboard, name='admin-user-dashboard'),
    path('admin/dashboard/question-bank/', admin_question_bank_view, name='admin-question-bank'),
    path('admin/dashboard/student-results/<int:student_id>/', admin_student_quiz_history, name='admin_student_quiz_history'),

    # ---------- Admin helpers / dropdowns ----------
    path('admin/user/bulk_delete/', bulk_delete_users, name='admin_bulk_delete_users'),
    path('admin/api/subjects/', admin_views.get_subjects_by_grade, name='admin-api-subjects'),
    path('admin/api/chapters/', admin_views.get_chapters_by_subject, name='admin-api-chapters'),

    # ---------- Public landing data ----------
    path('api/landing/quizzes/', list_public_quizzes, name='list_public_quizzes'),

    # ---------- Grades for public signup ----------
    path('api/grades/', get_all_grades, name='get_all_grades'),

    # ---------- Auth pages ----------
    path('login/', LoginView.as_view(template_name='registration/login.html'), name='login'),
    path('logout/', LogoutView.as_view(next_page='login'), name='logout'),

    # ---------- Default redirect ----------
    path('', lambda request: redirect('/admin/', permanent=False)),

    path('api/teacher/quizzes/', teacher_quizzes_by_grade, name='teacher-quizzes-by-grade'),
]
