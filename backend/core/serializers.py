from rest_framework import serializers
from .models import Quiz, QuizQuestionAssignment
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
            'grade', 'city', 'province', 'subscription_plan', 'profile_picture', 'fee_receipt', 'role'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def create(self, validated_data):
        role = validated_data.get('role', 'student')
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            role=role,
            is_active=False,  # account inactive until approved
            **{k: v for k, v in validated_data.items() if k not in ['username', 'password', 'role']}
        )
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
            'profile_picture', 'fee_receipt', 'role'  # ✅ add role
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

