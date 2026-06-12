from rest_framework import serializers
from .models import (
    Quiz, QuizQuestionAssignment, Topic, Week, TopicProgress, WeekProgress, StudentQuizAttempt
)
from .models import User, School, PROVINCES, SCHOOL_PLAN_TIERS, SCHOOL_BILLING_CYCLES
from django.db import transaction
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
        # Public signup is student-only. Teachers are created via admin tools.
        if value and value != 'student':
            raise serializers.ValidationError("Public signup is available for students only.")
        return 'student'

    def create(self, validated_data):
        password = validated_data.pop('password')
        # Force public signup to student only (even if role was manipulated client-side)
        validated_data.pop('role', None)
        role = 'student'
        user = User(
            role=role,
            is_active=True,
            account_status='inactive',
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

        if user.subscription_expiry and user.subscription_expiry < today:
            if user.account_status != 'expired':
                user.account_status = 'expired'
                user.save(update_fields=['account_status'])

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


class SchoolSignupSerializer(serializers.Serializer):
    school_name = serializers.CharField(max_length=200)
    city = serializers.CharField(max_length=100)
    province = serializers.CharField(max_length=50)
    contact_email = serializers.EmailField()
    contact_phone = serializers.CharField(required=False, allow_blank=True, default="")
    principal_full_name = serializers.CharField(max_length=255)
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    plan_tier = serializers.ChoiceField(choices=[tier for tier, _ in SCHOOL_PLAN_TIERS])
    billing_cycle = serializers.ChoiceField(choices=[cycle for cycle, _ in SCHOOL_BILLING_CYCLES])

    def validate_username(self, value):
        username = value.strip()
        if not username:
            raise serializers.ValidationError("Username is required.")
        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError("This username is already taken.")
        return username

    def validate_province(self, value):
        valid_provinces = {choice[0] for choice in PROVINCES}
        if value not in valid_provinces:
            raise serializers.ValidationError("Invalid province.")
        return value

    def validate_plan_tier(self, value):
        valid_tiers = {tier for tier, _ in SCHOOL_PLAN_TIERS}
        if value not in valid_tiers:
            raise serializers.ValidationError("Invalid plan tier.")
        return value

    def validate_billing_cycle(self, value):
        valid_cycles = {cycle for cycle, _ in SCHOOL_BILLING_CYCLES}
        if value not in valid_cycles:
            raise serializers.ValidationError("Invalid billing cycle.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({
                "confirm_password": ["Passwords do not match."],
            })

        school_name = attrs["school_name"].strip()
        city = attrs["city"].strip()
        if not school_name:
            raise serializers.ValidationError({"school_name": ["School name is required."]})
        if not city:
            raise serializers.ValidationError({"city": ["City is required."]})

        if School.objects.filter(name__iexact=school_name, city__iexact=city).exists():
            raise serializers.ValidationError({
                "school_name": ["A school with this name already exists in this city."],
            })

        attrs["school_name"] = school_name
        attrs["city"] = city
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        from django.db import IntegrityError

        password = validated_data.pop("password")
        validated_data.pop("confirm_password")

        try:
            school = School.objects.create(
                name=validated_data["school_name"],
                city=validated_data["city"],
                province=validated_data["province"],
                contact_email=validated_data["contact_email"],
                contact_phone=validated_data.get("contact_phone") or "",
                plan_tier=validated_data["plan_tier"],
                billing_cycle=validated_data["billing_cycle"],
                account_status="pending_payment",
                onboarding_status="registered",
            )
        except IntegrityError:
            raise serializers.ValidationError({
                "school_name": ["A school with this name already exists in this city."],
            })

        user = User(
            username=validated_data["username"],
            full_name=validated_data["principal_full_name"],
            email=validated_data["contact_email"],
            role="school_admin",
            school=school,
            school_name=school.name,
            city=school.city,
            province=school.province,
            account_status="inactive",
            is_active=True,
        )
        user.set_password(password)
        user.save()

        return {"school": school, "user": user}


class SchoolSettingsUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    city = serializers.CharField(max_length=100)
    province = serializers.CharField(max_length=50)
    contact_email = serializers.EmailField()
    contact_phone = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_province(self, value):
        valid_provinces = {choice[0] for choice in PROVINCES}
        if value not in valid_provinces:
            raise serializers.ValidationError("Invalid province.")
        return value

    def validate(self, attrs):
        name = attrs.get("name", "").strip()
        city = attrs.get("city", "").strip()
        if not name:
            raise serializers.ValidationError({"name": ["School name is required."]})
        if not city:
            raise serializers.ValidationError({"city": ["City is required."]})

        school = self.context.get("school")
        duplicate_qs = School.objects.filter(name__iexact=name, city__iexact=city)
        if school is not None:
            duplicate_qs = duplicate_qs.exclude(pk=school.pk)
        if duplicate_qs.exists():
            raise serializers.ValidationError({
                "name": ["A school with this name already exists in this city."],
            })

        attrs["name"] = name
        attrs["city"] = city
        return attrs

    @transaction.atomic
    def save(self, school, principal):
        from django.db import IntegrityError

        school.name = self.validated_data["name"]
        school.city = self.validated_data["city"]
        school.province = self.validated_data["province"]
        school.contact_email = self.validated_data["contact_email"]
        school.contact_phone = self.validated_data.get("contact_phone") or ""

        try:
            school.save()
        except IntegrityError:
            raise serializers.ValidationError({
                "name": ["A school with this name already exists in this city."],
            })

        if principal.role == "school_admin" and principal.school_id == school.id:
            principal.school_name = school.name
            principal.city = school.city
            principal.province = school.province
            principal.save(update_fields=["school_name", "city", "province"])

        return school
