import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from ckeditor_uploader.fields import RichTextUploadingField

USER_ROLES = (
    ('admin', 'Admin'),
    ('manager', 'Manager'),
    ('teacher', 'Teacher'),
    ('student', 'Student'),
)

GENDERS = (
    ('Male', 'Male'),
    ('Female', 'Female'),
    ('Other', 'Other'),
)

PROVINCES = (
    ('Balochistan', 'Balochistan'),
    ('Gilgit-Baltistan', 'Gilgit-Baltistan'),
    ('Azad Kashmir', 'Azad Kashmir'),
    ('Khyber-Pakhtunkhwa', 'Khyber-Pakhtunkhwa'),
    ('Punjab', 'Punjab'),
    ('Sindh', 'Sindh'),
    ('Federal Territory', 'Federal Territory'),  # ‚úÖ NEW
)

SCHOOLING_STATUSES = (
    ('Public school', 'Public school'),
    ('Private school', 'Private school'),
    ('Homeschool', 'Homeschool'),
    ('Madrassah', 'Madrassah'),
    ('I am teacher', 'I am teacher'),
)

SUBSCRIPTION_PLANS = (
    ('monthly', 'Monthly'),
    ('yearly', 'Yearly'),
)

ACCOUNT_STATUSES = (
    ('inactive', 'Inactive'),
    ('active', 'Active'),
    ('expired', 'Expired'),
)

QUESTION_BANK_TYPES = (
    ('SCQ', 'Single Correct Question'),
    ('MCQ', 'Multiple Correct Question'),
    ('FIB', 'Fill in the Blank'),
)

LANGUAGE_CHOICES = [
    ('Balochi', 'Balochi'),
    ('Brahui', 'Brahui'),
    ('Chitrali', 'Chitrali'),
    ('Dari/Farsi', 'Dari/Farsi'),
    ('Hindko', 'Hindko'),
    ('Kohistani', 'Kohistani'),
    ('Other', 'Other'),
    ('Pashto', 'Pashto'),
    ('Punjabi', 'Punjabi'),
    ('Saraiki', 'Saraiki'),
    ('Sindhi', 'Sindhi'),
    ('Urdu', 'Urdu'),
]


class User(AbstractUser):
    role = models.CharField(max_length=20, choices=USER_ROLES)
    full_name = models.CharField(max_length=255, blank=True, null=True)
    gender = models.CharField(max_length=10, choices=GENDERS, blank=True, null=True)
    language_used_at_home = models.CharField(max_length=20, choices=LANGUAGE_CHOICES, blank=True, null=True, help_text="Language spoken at home")
    email = models.EmailField(unique=False, blank=True, null=True)
    schooling_status = models.CharField(max_length=30, choices=SCHOOLING_STATUSES, blank=True, null=True)
    grade = models.ForeignKey(
        'core.Grade',  # ✅ Reference Grade model by string
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users'
    )
    school_name = models.CharField(max_length=200, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    province = models.CharField(max_length=50, choices=PROVINCES, blank=True, null=True)
    subscription_plan = models.CharField(max_length=20, choices=SUBSCRIPTION_PLANS, blank=True, null=True)
    subscription_expiry = models.DateField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    fee_receipt = models.ImageField(upload_to='fee_receipts/', blank=True, null=True)
    account_status = models.CharField(max_length=20, choices=ACCOUNT_STATUSES, default='inactive')
    is_active = models.BooleanField(default=True)
    grade_change_count = models.IntegerField(default=0)
    last_grade_reset = models.DateField(null=True, blank=True)    

    # ‚úÖ Added renewal request fields inside User
    renewal_requested = models.BooleanField(default=False)
    renewal_plan_requested = models.CharField(
        max_length=20,
        choices=SUBSCRIPTION_PLANS,
        blank=True,
        null=True
    )

    def is_expired(self):
        return self.subscription_expiry and timezone.now().date() > self.subscription_expiry

    def mark_expired_if_due(self):
        if self.is_expired():
            self.account_status = 'expired'
            self.save()

    def __str__(self):
        return f"{self.username} ({self.role})"


class QuestionBank(models.Model):
    title = models.CharField(max_length=255)
    type = models.CharField(max_length=3, choices=QUESTION_BANK_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.get_type_display()})"

    class Meta:
        verbose_name = "Question Bank"
        verbose_name_plural = "Question Banks"


class SCQQuestion(models.Model):
    question_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    question_bank = models.ForeignKey('QuestionBank', on_delete=models.CASCADE, related_name='scq_questions')
    question_text = RichTextUploadingField()

    option_a = models.CharField(max_length=255)
    option_b = models.CharField(max_length=255)
    option_c = models.CharField(max_length=255)
    option_d = models.CharField(max_length=255)

    correct_answer = models.CharField(max_length=255)

    def __str__(self):
        return f"SCQ: {self.question_text[:50]}"


class MCQQuestion(models.Model):
    question_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    question_bank = models.ForeignKey('QuestionBank', on_delete=models.CASCADE, related_name='mcq_questions')
    question_text = RichTextUploadingField()

    option_a = models.CharField(max_length=255, default="")
    option_b = models.CharField(max_length=255, default="")
    option_c = models.CharField(max_length=255, default="")
    option_d = models.CharField(max_length=255, default="")

    correct_answers = models.CharField(
        max_length=255, default="", help_text="Comma-separated e.g., A,C"
    )

    def __str__(self):
        return f"MCQ: {self.question_text[:50]}"


class FIBQuestion(models.Model):
    question_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    question_bank = models.ForeignKey('QuestionBank', on_delete=models.CASCADE, related_name='fib_questions')
    question_text = RichTextUploadingField(help_text="Use [a], [b], etc. for blanks")
    correct_answers = models.JSONField(help_text="Example: {\"a\": \"answer1\", \"b\": \"answer2\"}")

    def __str__(self):
        return f"FIB: {self.question_text[:50]}"


class Grade(models.Model):
    name = models.CharField(max_length=100, unique=True, default="Grade Temp")

    def __str__(self):
        return self.name


class Subject(models.Model):
    name = models.CharField(max_length=100)
    grade = models.ForeignKey(Grade, on_delete=models.CASCADE, related_name='subjects')

    class Meta:
        unique_together = ('name', 'grade')

    def __str__(self):
        return f"{self.name} ({self.grade.name})"


class Chapter(models.Model):
    name = models.CharField(max_length=100)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='chapters')

    class Meta:
        unique_together = ('name', 'subject')

    def __str__(self):
        return f"{self.name} ({self.subject.name})"


class Quiz(models.Model):
    title = models.CharField(max_length=255)
    grade = models.ForeignKey(Grade, on_delete=models.SET_NULL, null=True)
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True)
    chapter = models.ForeignKey(Chapter, on_delete=models.SET_NULL, null=True)
    marks_per_question = models.PositiveIntegerField()

    input_box_width = models.PositiveIntegerField(default=2, help_text="Width of input box for FIB questions.")
    text_alignment = models.CharField(
        max_length=10,
        choices=[('left', 'Left'), ('center', 'Center'), ('right', 'Right')],
        default='left',
        help_text="Text alignment for quiz content."
    )
    font_size = models.PositiveIntegerField(default=16, help_text="Font size (in pixels) for question text.")
    line_spacing = models.FloatField(default=1.5, help_text="Line spacing multiplier (e.g., 1.5 or 2.0).")

    def __str__(self):
        return self.title


class QuizQuestionAssignment(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='assignments')
    question_bank = models.ForeignKey(QuestionBank, on_delete=models.CASCADE)
    num_questions = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.quiz.title} ‚Üí {self.question_bank.title} ({self.num_questions} questions)"


class StudentQuizAttempt(models.Model):
    student = models.ForeignKey('User', on_delete=models.CASCADE, limit_choices_to={'role': 'student'})
    quiz = models.ForeignKey('Quiz', on_delete=models.CASCADE)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    score = models.IntegerField(default=0)
    total = models.IntegerField(default=0)
    meta = models.JSONField(default=dict, blank=True, null=True)

    def __str__(self):
        return f"{self.student.username} - {self.quiz.title}"


class StudentAnswer(models.Model):
    attempt = models.ForeignKey(StudentQuizAttempt, on_delete=models.CASCADE, related_name='answers')
    question_id = models.UUIDField()
    question_type = models.CharField(max_length=10)
    answer_data = models.JSONField()

    def __str__(self):
        return f"Answer for Question {self.question_id} in Attempt {self.attempt.id}"


class QuizAttempt(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'student'})
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    start_time = models.DateTimeField(default=timezone.now)
    end_time = models.DateTimeField(null=True, blank=True)
    total_questions = models.PositiveIntegerField()
    correct_answers = models.PositiveIntegerField(default=0)
    marks_obtained = models.PositiveIntegerField(default=0)

    def duration(self):
        if self.end_time and self.start_time:
            return self.end_time - self.start_time
        return None

    def percentage(self):
        if self.total_questions == 0:
            return 0
        return round((self.correct_answers / self.total_questions) * 100, 2)

    def grade(self):
        pct = self.percentage()
        if pct >= 95:
            return "A+"
        elif pct >= 90:
            return "A-"
        elif pct >= 85:
            return "B+"
        elif pct >= 80:
            return "B-"
        elif pct >= 75:
            return "C+"
        elif pct >= 70:
            return "C-"
        elif pct >= 65:
            return "D+"
        elif pct >= 60:
            return "D-"
        else:
            return "F"

    def __str__(self):
        return f"{self.student.username} - {self.quiz.title}"
