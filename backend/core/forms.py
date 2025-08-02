from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import User
from core.models import SCQQuestion, MCQQuestion, FIBQuestion
from core.models import Quiz, Subject, Chapter


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

class UserAdminCreationForm(UserCreationForm):
    language_used_at_home = forms.ChoiceField(choices=LANGUAGE_CHOICES, required=False)

    class Meta:
        model = User
        fields = '__all__'


class UserAdminChangeForm(UserChangeForm):
    language_used_at_home = forms.ChoiceField(choices=LANGUAGE_CHOICES, required=False)

    class Meta:
        model = User
        fields = '__all__'


class UploadForm(forms.Form):
    excel_file = forms.FileField()


class SelfRegistrationForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput)
    language_used_at_home = forms.ChoiceField(choices=LANGUAGE_CHOICES, required=False)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'full_name', 'password', 'role', 'gender', 'schooling_status',
            'grade', 'school_name', 'city', 'province',
            'subscription_plan', 'profile_picture', 'fee_receipt', 'language_used_at_home'
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # ‚úÖ Limit role choices to only student and teacher
        self.fields['role'].choices = [
            ('student', 'Student'),
            ('teacher', 'Teacher'),
        ]


class UploadSCQForm(forms.Form):
    question_bank_id = forms.IntegerField(widget=forms.HiddenInput())
    file = forms.FileField(label='Upload SCQ Excel File')


class UploadMCQForm(forms.Form):
    question_bank_id = forms.IntegerField(widget=forms.HiddenInput())
    file = forms.FileField(label='Upload MCQ Excel File')


class UploadFIBForm(forms.Form):
    question_bank_id = forms.IntegerField(widget=forms.HiddenInput())
    file = forms.FileField(label='Upload FIB Excel File')


class QuizAdminForm(forms.ModelForm):
    class Meta:
        model = Quiz
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Restrict subject queryset based on selected grade (if editing existing object)
        if 'grade' in self.data:
            try:
                grade_id = int(self.data.get('grade'))
                self.fields['subject'].queryset = Subject.objects.filter(grade_id=grade_id)
            except (ValueError, TypeError):
                pass
        elif self.instance.pk and self.instance.grade:
            self.fields['subject'].queryset = Subject.objects.filter(grade=self.instance.grade)
        else:
            self.fields['subject'].queryset = Subject.objects.none()

        # Restrict chapter queryset based on selected subject
        if 'subject' in self.data:
            try:
                subject_id = int(self.data.get('subject'))
                self.fields['chapter'].queryset = Chapter.objects.filter(subject_id=subject_id)
            except (ValueError, TypeError):
                pass
        elif self.instance.pk and self.instance.subject:
            self.fields['chapter'].queryset = Chapter.objects.filter(subject=self.instance.subject)
        else:
            self.fields['chapter'].queryset = Chapter.objects.none()