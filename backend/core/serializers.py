from rest_framework import serializers
from .models import (
    Quiz, QuizQuestionAssignment, Topic, Week, TopicProgress, WeekProgress, StudentQuizAttempt
)
from .models import User
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed
from django.utils import timezone



class QuizListSerializer(serializers.ModelSerializer):
    grade = serializers.CharField(source='grade.name')
    subject = serializers.CharField(source='subject.name')
    chapter = serializers.CharField(source='chapter.name')
    question_banks = serializers.SerializerMethodField()
    total_questions = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = [
            'id',
            'title',
            'chapter',
            'subject',
            'grade',
            'marks_per_question',
            'question_banks',
            'total_questions',
        ]

    def get_question_banks(self, quiz):
        assignments = QuizQuestionAssignment.objects.filter(quiz=quiz)
        return [assignment.question_bank.title for assignment in assignments]

    def get_total_questions(self, quiz):
        return sum(a.num_questions for a in quiz.assignments.all())
    
class UserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'role', 'full_name', 'email', 'gender',
            'schooling_status', 'grade', 'school_name', 'city', 'province',
            'subscription_plan', 'subscription_expiry', 'account_status'
        ]

class UserRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'username', 'password', 'full_name', 'email', 'gender',
            'language_used_at_home', 'schooling_status', 'school_name',
            'grade', 'city', 'province', 'subscription_plan', 'profile_picture', 'role'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def create(self, validated_data):
        password = validated_data.pop('password')
        role = validated_data.pop('role', 'student')

        user = User(
            role=role,
            is_active=False,  # wait for approval
            **validated_data
        )
        # --- IMPORTANT: prevent the signal from sending a 2nd email ---
        user._suppress_welcome_email = True     # signal will see this and skip
        user._plain_password = password or ""   # keep for consistency/debug

        user.set_password(password)
        user.save()
        return user

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_role(self, value):
        if value not in ['student', 'teacher']:
            raise serializers.ValidationError("Invalid role.")
        return value
    
class PublicSignupSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'username', 'password', 'full_name', 'email', 'gender',
            'language_used_at_home', 'schooling_status', 'school_name',
            'grade', 'city', 'province', 'subscription_plan',
            'profile_picture', 'role'  # ✅ add role
        ]
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_role(self, value):
        if value not in ['student', 'teacher']:
            raise serializers.ValidationError("Invalid role.")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        role = validated_data.pop('role', 'student')  # ✅ use role from form
        user = User(
            role=role,
            is_active=False,  # Wait for approval
            **validated_data
        )
        user._plain_password = password          # ← so the signal can include it
        user.set_password(password)
        user.save()
        return user
    
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        user = self.user
        today = timezone.now().date()

        # ‚Äö√∫√ñ Check expiry and mark status
        if user.subscription_expiry and user.subscription_expiry < today:
            user.account_status = 'expired'
            user.is_active = True  # ‚Äö√∫√ñ Allow login so frontend can redirect
            user.save()

        # ‚Äö√∫√ñ Pass extra info to frontend
        data['username'] = user.username
        data['role'] = user.role
        data['account_status'] = user.account_status

        return data
    
class EditProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'full_name', 'email', 'schooling_status', 'school_name', 'city', 'province',
            'grade', 'profile_picture'
        ]

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)


class GradeMiniSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()


class SubjectMiniSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()


class ChapterMiniSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()


class QuizMiniSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    grade = GradeMiniSerializer(allow_null=True)
    subject = SubjectMiniSerializer(allow_null=True)
    chapter = ChapterMiniSerializer(allow_null=True)


class TopicLandingSerializer(serializers.ModelSerializer):
    grade = GradeMiniSerializer(allow_null=True)
    quiz_count = serializers.SerializerMethodField()
    quizzes = serializers.SerializerMethodField()
    progress_percent = serializers.SerializerMethodField()
    completed_quizzes = serializers.SerializerMethodField()
    total_quizzes = serializers.SerializerMethodField()

    class Meta:
        model = Topic
        fields = [
            'id', 'name', 'grade', 'quiz_count', 'quizzes',
            'progress_percent', 'completed_quizzes', 'total_quizzes',
        ]

    def _prefetched_topic_links(self, obj):
        return list(getattr(obj, 'topic_quizzes', []).all()) if hasattr(obj, 'topic_quizzes') else []

    def get_quiz_count(self, obj):
        return len(self._prefetched_topic_links(obj))

    def get_quizzes(self, obj):
        include_quizzes = self.context.get("include_quizzes", True)
        if not include_quizzes:
            return []
        quizzes = [link.quiz for link in self._prefetched_topic_links(obj) if getattr(link, 'quiz', None)]
        return QuizMiniSerializer(quizzes, many=True).data

    def get_progress_percent(self, obj):
        user = self.context.get("user")
        if not user or not getattr(user, "is_authenticated", False):
            return None

        progress = TopicProgress.objects.filter(user=user, topic=obj).first()
        if not progress or progress.total_quizzes == 0:
            return 0
        return int((progress.completed_quizzes / progress.total_quizzes) * 100)

    def get_completed_quizzes(self, obj):
        user = self.context.get("user")
        if not user or not getattr(user, "is_authenticated", False):
            return None
        progress = TopicProgress.objects.filter(user=user, topic=obj).first()
        return progress.completed_quizzes if progress else 0

    def get_total_quizzes(self, obj):
        user = self.context.get("user")
        if not user or not getattr(user, "is_authenticated", False):
            return None
        progress = TopicProgress.objects.filter(user=user, topic=obj).first()
        return progress.total_quizzes if progress else 0


class WeekLandingSerializer(serializers.ModelSerializer):
    grade = GradeMiniSerializer(allow_null=True)
    subject = SubjectMiniSerializer(allow_null=True)
    order = serializers.IntegerField()
    quiz_count = serializers.SerializerMethodField()
    quizzes = serializers.SerializerMethodField()
    progress_percent = serializers.SerializerMethodField()
    completed_quizzes = serializers.SerializerMethodField()
    total_quizzes = serializers.SerializerMethodField()

    class Meta:
        model = Week
        fields = [
            'id', 'name', 'order', 'grade', 'subject', 'quiz_count', 'quizzes',
            'progress_percent', 'completed_quizzes', 'total_quizzes',
        ]

    def _prefetched_week_links(self, obj):
        return list(getattr(obj, 'week_quizzes', []).all()) if hasattr(obj, 'week_quizzes') else []

    def get_quiz_count(self, obj):
        return len(self._prefetched_week_links(obj))

    def get_quizzes(self, obj):
        include_quizzes = self.context.get("include_quizzes", True)
        if not include_quizzes:
            return []
        quizzes = [link.quiz for link in self._prefetched_week_links(obj) if getattr(link, 'quiz', None)]
        return QuizMiniSerializer(quizzes, many=True).data

    def get_progress_percent(self, obj):
        user = self.context.get("user")
        if not user or not getattr(user, "is_authenticated", False):
            return None

        total = self.get_total_quizzes(obj)
        completed = self.get_completed_quizzes(obj)
        if not total:
            return 0
        return int((completed / total) * 100)

    def get_completed_quizzes(self, obj):
        user = self.context.get("user")
        if not user or not getattr(user, "is_authenticated", False):
            return None
        week_quiz_ids = [link.quiz_id for link in self._prefetched_week_links(obj)]
        if not week_quiz_ids:
            return 0
        return (
            StudentQuizAttempt.objects
            .filter(student=user, completed_at__isnull=False, quiz_id__in=week_quiz_ids)
            .values('quiz_id')
            .distinct()
            .count()
        )

    def get_total_quizzes(self, obj):
        user = self.context.get("user")
        if not user or not getattr(user, "is_authenticated", False):
            return None
        return len(self._prefetched_week_links(obj))
