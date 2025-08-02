from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User
from .forms import UserAdminCreationForm, UserAdminChangeForm
from .admin_views import bulk_upload_students, complete_user_data_view
from django.utils.html import format_html
from django.urls import reverse
from .models import QuestionBank, SCQQuestion, MCQQuestion, FIBQuestion
from ckeditor_uploader.widgets import CKEditorUploadingWidget
from django.utils.safestring import mark_safe
from django.shortcuts import redirect , render , get_object_or_404
from .models import Quiz, QuizQuestionAssignment, StudentQuizAttempt
from .models import Grade, Subject, Chapter
from django.contrib import messages
from django import forms
from .admin_views import QuizFormattingForm
from django.urls import path
from core.forms import QuizAdminForm  # ✅ Custom form


# User Admin
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    add_form = UserAdminCreationForm
    form = UserAdminChangeForm
    model = User

    list_display = (
        'username', 'email', 'full_name', 'role', 'account_status',
        'school_name', 'city', 'province', 'language_used_at_home'
    )
    list_filter = (
        'role', 'account_status', 'province', 'grade', 'language_used_at_home'
    )
    search_fields = (
        'username', 'email', 'full_name', 'school_name', 'city'
    )

    fieldsets = (
        (None, {'fields': ('username', 'password', 'email', 'full_name')}),
        ('Additional Info', {
            'fields': (
                'role', 'gender', 'schooling_status', 'school_name', 'grade',
                'city', 'province', 'language_used_at_home',
                'subscription_plan', 'subscription_expiry',
                'profile_picture', 'fee_receipt', 'account_status',
                'is_active',  # ✅ NEW — allows enabling/disabling from edit form
            ),
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2', 'email', 'full_name'),
        }),
        ('Additional Info', {
            'fields': (
                'role', 'gender', 'schooling_status', 'school_name', 'grade',
                'city', 'province', 'language_used_at_home',
                'subscription_plan', 'subscription_expiry',
                'profile_picture', 'fee_receipt', 'account_status',
                'is_active',  # ✅ NEW — ensures activation works during creation
            ),
        }),
    )

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('bulk_upload/', self.admin_site.admin_view(bulk_upload_students), name='bulk_upload_students'),
            path('complete_user_data/', self.admin_site.admin_view(complete_user_data_view), name='admin_complete_user_data'),
        ]
        return custom_urls + urls

    def response_add(self, request, obj, post_url_continue=None):
        if "_addanother" not in request.POST and "_continue" not in request.POST:
            return redirect('/admin/core/user/complete_user_data/')
        return super().response_add(request, obj, post_url_continue)

    def response_change(self, request, obj):
        return redirect('/admin/core/user/complete_user_data/')

    def response_delete(self, request, obj_display, obj_id):
        return redirect('/admin/core/user/complete_user_data/')

    def has_add_permission(self, request):
        return request.user.is_superuser or getattr(request.user, 'role', None) in ['admin', 'manager']

    def has_change_permission(self, request, obj=None):
        return request.user.is_superuser or getattr(request.user, 'role', None) in ['admin', 'manager']

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser or getattr(request.user, 'role', None) in ['admin', 'manager']

    def save_model(self, request, obj, form, change):
        if request.user.role == 'manager' and obj.role == 'admin':
            messages.error(request, "Managers are not allowed to create Admin accounts.")
            return  # Abort save
        super().save_model(request, obj, form, change)    

# Inline Classes
class SCQInline(admin.TabularInline):
    model = SCQQuestion
    fields = ('question_id', 'short_question_text', 'correct_answer')
    readonly_fields = fields
    extra = 0
    can_delete = False
    show_change_link = True

    def short_question_text(self, obj):
        return mark_safe(obj.question_text)
    short_question_text.short_description = 'Question'

class MCQInline(admin.TabularInline):
    model = MCQQuestion
    fields = ('question_id', 'short_question_text', 'correct_options_display')
    readonly_fields = fields
    extra = 0
    can_delete = False
    show_change_link = True

    def short_question_text(self, obj):
        return mark_safe(obj.question_text)
    short_question_text.short_description = 'Question'

    def correct_options_display(self, obj):
        if isinstance(obj.correct_options, (list, tuple)):
            return ", ".join(obj.correct_options)
        if isinstance(obj.correct_options, str):
            return obj.correct_options
        return "-"

class FIBInline(admin.TabularInline):
    model = FIBQuestion
    fields = ('question_id', 'short_question_text', 'answer_summary')
    readonly_fields = fields
    extra = 0
    can_delete = False
    show_change_link = True

    def short_question_text(self, obj):
        return mark_safe(obj.question_text)
    short_question_text.short_description = 'Question'

    def answer_summary(self, obj):
        if isinstance(obj.correct_answers, dict):
            return ", ".join(f"{k}: {v}" for k, v in obj.correct_answers.items())
        elif isinstance(obj.correct_answers, list):
            return ", ".join(obj.correct_answers)
        else:
            return str(obj.correct_answers)

# Question Bank Admin
@admin.register(QuestionBank)
class QuestionBankAdmin(admin.ModelAdmin):
    list_display = ('title', 'get_question_type', 'upload_link')
    search_fields = ('title',)

    def get_question_type(self, obj):
        return obj.get_type_display()
    get_question_type.short_description = 'Question Type'

    def upload_link(self, obj):
        links = []

        if obj.type == 'SCQ':
            upload_url = reverse('bulk_upload_scq', args=[obj.id])
            add_url = reverse('admin:core_scqquestion_add') + f'?question_bank={obj.id}'
            links.append(f'<a class="button" href="{upload_url}">Upload SCQ</a>')
            links.append(f'<a class="button" href="{add_url}">Add SCQ</a>')

        elif obj.type == 'MCQ':
            upload_url = reverse('bulk_upload_mcq', args=[obj.id])
            add_url = reverse('admin:core_mcqquestion_add') + f'?question_bank={obj.id}'
            links.append(f'<a class="button" href="{upload_url}">Upload MCQ</a>')
            links.append(f'<a class="button" href="{add_url}">Add MCQ</a>')

        elif obj.type == 'FIB':
            upload_url = reverse('bulk_upload_fib', args=[obj.id])
            add_url = reverse('admin:core_fibquestion_add') + f'?question_bank={obj.id}'
            links.append(f'<a class="button" href="{upload_url}">Upload FIB</a>')
            links.append(f'<a class="button" href="{add_url}">Add FIB</a>')

        # Add Preview Questions link for all types
        preview_url = reverse('preview_questions', args=[obj.id])
        links.append(f'<a class="button" href="{preview_url}" style="margin-left: 5px;">Preview Questions</a>')

        return format_html(' &nbsp; '.join(links))

    upload_link.short_description = 'Bulk Upload'
    upload_link.allow_tags = True

    def get_inline_instances(self, request, obj=None):
        if not obj:
            return []
        if obj.type == 'SCQ':
            return [SCQInline(self.model, self.admin_site)]
        elif obj.type == 'MCQ':
            return [MCQInline(self.model, self.admin_site)]
        elif obj.type == 'FIB':
            return [FIBInline(self.model, self.admin_site)]
        return []

    def change_view(self, request, object_id, form_url='', extra_context=None):
        bank = QuestionBank.objects.get(pk=object_id)
        upload_url = None

        if bank.type == 'SCQ':
            upload_url = reverse('bulk_upload_scq', args=[bank.id])
        elif bank.type == 'MCQ':
            upload_url = reverse('bulk_upload_mcq', args=[bank.id])
        elif bank.type == 'FIB':
            upload_url = reverse('bulk_upload_fib', args=[bank.id])

        if upload_url:
            extra_context = extra_context or {}
            extra_context['additional_button'] = format_html(
                f'<a class="button" style="margin:10px;padding:8px;background:#3c8dbc;color:white;border-radius:5px;" href="{upload_url}">Bulk Upload Questions</a>'
            )

        return super().change_view(request, object_id, form_url, extra_context=extra_context)

# Individual Question Admins
from django.shortcuts import redirect
from django.http import QueryDict

@admin.register(SCQQuestion)
class SCQQuestionAdmin(admin.ModelAdmin):
    list_display = ('question_id', 'question_bank', 'short_question_text', 'correct_answer')
    list_filter = ('question_bank',)
    search_fields = ('question_text',)

    def short_question_text(self, obj):
        return obj.question_text[:50]
    short_question_text.short_description = 'Question'

    def get_changeform_initial_data(self, request):
        query = QueryDict(request.META.get('QUERY_STRING'))
        return {'question_bank': query.get('question_bank') or query.get('bank')}

    def response_add(self, request, obj, post_url_continue=None):
        if 'question_bank' in request.GET or 'bank' in request.GET:
            return redirect(f"/preview-questions/{request.GET.get('question_bank') or request.GET.get('bank')}/")
        return super().response_add(request, obj, post_url_continue)

    def response_change(self, request, obj):
        if 'from_preview' in request.GET and 'bank_id' in request.GET:
            return redirect(f"/preview-questions/{request.GET['bank_id']}/")
        return super().response_change(request, obj)

    def has_add_permission(self, request):
        return request.user.is_superuser or request.user.role == 'admin'

    def has_change_permission(self, request, obj=None):
        return request.user.is_superuser or request.user.role == 'admin'

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser or request.user.role == 'admin'


@admin.register(MCQQuestion)
class MCQQuestionAdmin(admin.ModelAdmin):
    list_display = ('question_id', 'question_bank', 'short_question_text', 'correct_options_list')
    list_filter = ('question_bank',)
    search_fields = ('question_text',)

    def short_question_text(self, obj):
        return obj.question_text[:50]
    short_question_text.short_description = 'Question'

    def correct_options_list(self, obj):
        return ", ".join(obj.correct_answers.split(","))
    correct_options_list.short_description = 'Correct Options'

    def get_changeform_initial_data(self, request):
        query = QueryDict(request.META.get('QUERY_STRING'))
        return {'question_bank': query.get('question_bank') or query.get('bank')}

    def response_add(self, request, obj, post_url_continue=None):
        if 'question_bank' in request.GET or 'bank' in request.GET:
            return redirect(f"/preview-questions/{request.GET.get('question_bank') or request.GET.get('bank')}/")
        return super().response_add(request, obj, post_url_continue)

    def response_change(self, request, obj):
        if 'from_preview' in request.GET and 'bank_id' in request.GET:
            return redirect(f"/preview-questions/{request.GET['bank_id']}/")
        return super().response_change(request, obj)

    def save_model(self, request, obj, form, change):
        if isinstance(obj.correct_answers, list):
            obj.correct_answers = ",".join(obj.correct_answers)
        super().save_model(request, obj, form, change)

    def has_add_permission(self, request):
        return request.user.is_superuser or request.user.role == 'admin'

    def has_change_permission(self, request, obj=None):
        return request.user.is_superuser or request.user.role == 'admin'

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser or request.user.role == 'admin'


@admin.register(FIBQuestion)
class FIBQuestionAdmin(admin.ModelAdmin):
    list_display = ('question_id', 'question_bank', 'short_question_text', 'answer_summary')
    list_filter = ('question_bank',)
    search_fields = ('question_text',)

    def short_question_text(self, obj):
        return obj.question_text[:50]
    short_question_text.short_description = 'Question'

    def answer_summary(self, obj):
        if isinstance(obj.correct_answers, dict):
            return ", ".join(f"{k}: {v}" for k, v in obj.correct_answers.items())
        elif isinstance(obj.correct_answers, list):
            return ", ".join(obj.correct_answers)
        else:
            return str(obj.correct_answers)

    def get_changeform_initial_data(self, request):
        query = QueryDict(request.META.get('QUERY_STRING'))
        return {'question_bank': query.get('question_bank') or query.get('bank')}

    def response_add(self, request, obj, post_url_continue=None):
        if 'question_bank' in request.GET or 'bank' in request.GET:
            return redirect(f"/preview-questions/{request.GET.get('question_bank') or request.GET.get('bank')}/")
        return super().response_add(request, obj, post_url_continue)

    def response_change(self, request, obj):
        if 'from_preview' in request.GET and 'bank_id' in request.GET:
            return redirect(f"/preview-questions/{request.GET['bank_id']}/")
        return super().response_change(request, obj)

    def has_add_permission(self, request):
        return request.user.is_superuser or request.user.role == 'admin'

    def has_change_permission(self, request, obj=None):
        return request.user.is_superuser or request.user.role == 'admin'

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser or request.user.role == 'admin'
    

from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from django.shortcuts import redirect
from django.http import HttpResponseRedirect
from .models import Quiz

@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    form = QuizAdminForm  # ✅ Use custom form
    change_form_template = "admin/core/quiz/change_form.html"  # ✅ Custom template for JS

    list_display = [
        'title',
        'chapter',
        'subject',
        'grade',
        'get_question_banks',
        'get_total_questions',
        'marks_per_question',
        'assign_link'
    ]

    def get_question_banks(self, obj):
        return ", ".join([a.question_bank.title for a in obj.assignments.all()])
    get_question_banks.short_description = "Question Bank(s)"

    def get_total_questions(self, obj):
        return sum([a.num_questions for a in obj.assignments.all()])
    get_total_questions.short_description = "Total Questions"

    def assign_link(self, obj):
        url = reverse("assign-questions", args=[obj.id])
        return format_html('<a class="button" href="{}">Assign Questions</a>', url)
    assign_link.short_description = "Assign Questions"

    fieldsets = (
        ("Basic Info", {
            'fields': (
                'title',
                'grade',
                'subject',
                'chapter',
                'marks_per_question'
            )
        }),
    )

    def response_change(self, request, obj):
        next_url = request.GET.get('next')
        if next_url:
            return HttpResponseRedirect(next_url)
        return super().response_change(request, obj)

    def response_delete(self, request, obj_display, obj_id):
        return HttpResponseRedirect(reverse('admin-list-quizzes'))

    def add_view(self, request, form_url='', extra_context=None):
        response = super().add_view(request, form_url, extra_context)

        if isinstance(response, HttpResponseRedirect) and response.status_code == 302:
            try:
                latest_quiz = Quiz.objects.latest('id')
                return redirect(reverse('quiz-question-assignments') + f'?quiz_id={latest_quiz.id}')
            except Quiz.DoesNotExist:
                pass

        return response


@admin.register(StudentQuizAttempt)
class StudentQuizAttemptAdmin(admin.ModelAdmin):
    list_display = ['student', 'quiz', 'started_at', 'completed_at']
    list_filter = ['quiz']

@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ['name']

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'grade']

@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ['name', 'subject']

def quiz_formatting_view(request, quiz_id):
    quiz = get_object_or_404(Quiz, id=quiz_id)

    if request.method == 'POST':
        form = QuizFormattingForm(request.POST, instance=quiz)
        if form.is_valid():
            form.save()
            messages.success(request, "Formatting updated successfully!")
            return redirect('admin-list-quizzes')
    else:
        form = QuizFormattingForm(instance=quiz)

    return render(request, 'admin/core/quiz_formatting.html', {
        'quiz': quiz,
        'form': form
    })




