"""
Usage:
    python manage.py seed_grade3_topics
"""

import re
from collections import defaultdict

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from core.models import Grade, Quiz, Subject, Topic, TopicQuiz


TOPIC_DATA = [
    ("Roman Numerals", [
        "Introducing Roman Numerals",
        "Translating Roman Numerals",
        "Roman Numbers Sequence",
        "Adding and Subtracting Roman Numerals",
    ]),
    ("Even and Odd Numbers", [
        "Even and Odd Numbers",
        "Identifying Even and Odd Numbers",
        "Even and Odd on the Number Line",
        "Identifying Even and Odd from Random Numbers",
        "Identifying Even and Odd from Equation",
    ]),
    ("Place Value Foundations", [
        "Understanding Place Value (1-99)",
        "Understanding Place Value (1-999)",
        "Understanding Place Value (1-9999)",
    ]),
    ("Place and Value Skills", [
        "Identify the Digit upto Hundreds Place",
        "Identify the Digit Upto Ten Thousands Place",
        "Identify the Digit Upto Million Place",
        "Value of the digit (1-999)",
        "Value of the digit (1-9999)",
        "Value of the digit (1-999999)",
    ]),
    ("Expanded Form and Conversions", [
        "Convert Numbers into Place Value (1-999)",
        "Convert Numbers into Place Value (1-99999)",
        "Convert between Standard and Expanded forms",
        "Convert Between Place and Value (1)",
        "Convert Between Place and Value (2)",
    ]),
    ("Regrouping Place Values", [
        "Re-group Tens and Ones",
        "Re-group Hundreds, Tens, and Ones",
        "Re-group Thousands, Hundreds, Tens, and Ones",
    ]),
    ("Numbers to Words", [
        "Converting Numbers to Words (1-20)",
        "Converting Numbers to Words (20-50)",
        "Converting Numbers to Words (50-75)",
        "Converting Numbers to Words (75-100)",
        "Converting Numbers to Words (100-500)",
        "Converting Numbers to Words (500-1000)",
    ]),
    ("Comparing and Ordering Numbers", [
        "Comparing Numbers (1)",
        "Comparing Numbers (2)",
        "Arranging Numbers in Ascending Order (1)",
        "Arranging Numbers in Ascending Order (2)",
        "Arranging Numbers in Descending Order (1)",
        "Arranging Numbers in Descending Order (2)",
    ]),
    ("Rounding Numbers", [
        "Rounding of Numbers to Nearest Ten (1)",
        "Rounding of Numbers to Nearest Ten (2)",
        "Rounding of Numbers to Nearest Ten (3)",
        "Rounding of Numbers to Nearest Ten (4)",
        "Rounding of Numbers to Nearest Ten (5)",
        "Rounding of Numbers to Nearest Hundred (1)",
        "Rounding of Numbers to Nearest Hundred (2)",
        "Rounding of Numbers to Nearest Hundred (3)",
    ]),
    ("Addition Strategies", [
        "Adding the Doubles (1)",
        "Adding the Doubles (2)",
        "Adding the Near Doubles",
        "Addition Strategies - Adding Pattern",
    ]),
    ("Multi-Addends Addition", [
        "Adding Three Numbers",
        "Adding Four Numbers",
    ]),
    ("Addition by Patterns (Skip/Add)", [
        "Addition by 5",
        "Addition by 10",
        "Addition by 20",
        "Addition by 50",
        "Addition by 100",
    ]),
    ("Missing Numbers in Addition", [
        "Addition by Entering Missing Numbers",
        "Finding Missing Digits",
    ]),
    ("Add 2-Digit Numbers and Carrying", [
        "Adding Two Digit Numbers (1)",
        "Adding Two Digit Numbers (2)",
        "Addition with Carry-on (1)",
        "Addition with Carry-on (2)",
        "Addition with Carry-on (3)",
    ]),
    ("Addition Word Problems", [
        "Addition Word Problems",
    ]),
    ("Subtraction Core Skills", [
        "Subtraction on Number Line",
        "Subtraction by 5",
        "Subtraction by 10",
        "Subtraction by 20",
        "Subtraction by 50",
        "Subtraction by 100",
    ]),
    ("Subtraction Patterns and Multiples of 10", [
        "Subtraction by the Multiples of 10 (1)",
        "Subtraction by the Multiples of 10 (2)",
        "Subtraction Strategies - Subtraction Pattern",
        "Evaluating Subtraction Equation",
    ]),
    ("Missing Numbers in Subtraction", [
        "Subtraction by Putting Missing Numbers (1)",
        "Subtraction by Putting Missing Numbers (2)",
        "Finding Missing Digits",
    ]),
    ("Vertical Subtraction and Regrouping", [
        "Ways to Make a Number Using Subtraction",
        "Subtracting Vertically (1)",
        "Subtracting Vertically (2)",
        "Subtraction by Re-grouping (1)",
        "Subtraction by Re-grouping (2)",
    ]),
    ("Subtraction Word Problems", [
        "Subtraction Word Problems",
    ]),
    ("Multiplication Foundations and Times Tables", [
        "Counting by 2s",
        "Counting by 3s",
        "Counting by 4s",
        "Counting by 5s",
        "Counting by 10s",
        "Understanding Multiplication and Addition",
        "Describing Pictures in Mathematical Form (1)",
        "Describing Pictures in Mathematical Form (2)",
    ]),
    ("Multiplication Facts Practice", [
        "Multiplication by 2",
        "Multiplication by 3",
        "Multiplication by 4",
        "Multiplication by 5",
        "Multiplication by 6",
        "Multiplication by 7",
        "Multiplication by 8",
        "Multiplication by 9",
        "Multiplication by 10",
    ]),
    ("Multiplication Equations and 2-Digit Multiplication", [
        "Complete the Multiplication Equation (1)",
        "Complete the Multiplication Equation (2)",
        "Complete the Multiplication Equation (3)",
        "Multiplying Two Digit Numbers",
        "Multiplication Word Problems",
    ]),
    ("Division Skills", [
        "Division Equations (1)",
        "Division Equations (2)",
        "Division Equations (3)",
        "Division by 2",
        "Division by 3",
        "Division by 4",
        "Division by 5",
        "Division by 6",
        "Division by 7",
        "Division by 8",
        "Division by 9",
        "Division by 10",
        "Long Division Method",
        "Division Word Problems",
    ]),
    ("Divisibility Rules", [
        "Rules of Divisibility (1)",
        "Rules of Divisibility (2)",
    ]),
]


def _normalize_title(value: str) -> str:
    value = (value or "").strip().lower()
    value = re.sub(r"^\s*\d+\s*[-–—]\s*", "", value)
    value = re.sub(r"\s+", " ", value)
    return value


class Command(BaseCommand):
    help = "Seed Grade 3 Math topics and TopicQuiz mappings with ordered sequence."

    def handle(self, *args, **options):
        grade = Grade.objects.filter(name__iexact="Grade 3").first() or Grade.objects.filter(name__icontains="3").first()
        if not grade:
            raise CommandError("Grade 3 not found.")

        subject_ids = list(
            Subject.objects.filter(grade=grade, name__icontains="math").values_list("id", flat=True)
        )
        if not subject_ids:
            raise CommandError("No Math subject found for Grade 3.")

        grade3_math_quizzes = list(
            Quiz.objects.select_related("grade", "subject", "chapter")
            .filter(grade=grade, subject_id__in=subject_ids)
            .order_by("id")
        )
        if not grade3_math_quizzes:
            raise CommandError("No Grade 3 Math quizzes found.")

        title_pool = defaultdict(list)
        for quiz in grade3_math_quizzes:
            title_pool[_normalize_title(quiz.title)].append(quiz)

        topics_created = 0
        topics_updated = 0
        mappings_created = 0
        mappings_updated = 0
        moved_mappings = 0
        missing_titles = []
        per_topic_assigned_counts = {}

        with transaction.atomic():
            for idx, (topic_name, quiz_titles) in enumerate(TOPIC_DATA, start=1):
                topic, created = Topic.objects.get_or_create(
                    grade=grade,
                    name=topic_name,
                    defaults={"order": idx},
                )
                if created:
                    topics_created += 1
                elif topic.order != idx:
                    topic.order = idx
                    topic.save(update_fields=["order"])
                    topics_updated += 1

                assigned_count = 0
                for quiz_order, wanted_title in enumerate(quiz_titles, start=1):
                    key = _normalize_title(wanted_title)
                    if not title_pool.get(key):
                        missing_titles.append(f"{topic_name} -> {wanted_title}")
                        continue

                    quiz = title_pool[key].pop(0)

                    moved = TopicQuiz.objects.filter(
                        quiz=quiz,
                        topic__grade=grade,
                    ).exclude(topic=topic).delete()[0]
                    if moved:
                        moved_mappings += moved

                    mapping, mapping_created = TopicQuiz.objects.get_or_create(
                        topic=topic,
                        quiz=quiz,
                        defaults={"order": quiz_order},
                    )
                    if mapping_created:
                        mappings_created += 1
                    elif mapping.order != quiz_order:
                        mapping.order = quiz_order
                        mapping.save(update_fields=["order"])
                        mappings_updated += 1

                    assigned_count += 1

                per_topic_assigned_counts[topic_name] = assigned_count

        all_grade3_math_quiz_ids = set(q.id for q in grade3_math_quizzes)
        assigned_ids = set(
            TopicQuiz.objects.filter(
                topic__grade=grade,
                quiz_id__in=all_grade3_math_quiz_ids,
            ).values_list("quiz_id", flat=True)
        )
        unassigned_quizzes = [
            q.title for q in grade3_math_quizzes if q.id not in assigned_ids
        ]

        self.stdout.write(self.style.SUCCESS("Grade 3 Math Topic seeding complete"))
        self.stdout.write(
            f"Topics created: {topics_created}, topics order-updated: {topics_updated}"
        )
        self.stdout.write(
            f"TopicQuiz created: {mappings_created}, order-updated: {mappings_updated}, moved from other Grade 3 topics: {moved_mappings}"
        )
        self.stdout.write("")
        self.stdout.write("Per-topic mapping counts:")
        for order, (topic_name, _) in enumerate(TOPIC_DATA, start=1):
            self.stdout.write(f"  {order:02d}. {topic_name}: {per_topic_assigned_counts.get(topic_name, 0)}")

        self.stdout.write("")
        if missing_titles:
            self.stdout.write("Missing quiz titles (not found in Grade 3 Math):")
            for title in missing_titles:
                self.stdout.write(f"  - {title}")
        else:
            self.stdout.write("Missing quiz titles: none")

        self.stdout.write("")
        if unassigned_quizzes:
            self.stdout.write("Unassigned Grade 3 Math quizzes:")
            for title in unassigned_quizzes:
                self.stdout.write(f"  - {title}")
        else:
            self.stdout.write("Unassigned Grade 3 Math quizzes: none")
