"""
Usage:
    python manage.py seed_grade4_topics
"""

import re
from collections import defaultdict

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from core.models import Grade, Quiz, Subject, Topic, TopicQuiz


TOPIC_DATA = [
    ("Place Value Foundations", [
        "1 - Understanding Place Value (1-99)",
        "2 - Understanding Place Value (1-999)",
        "3 - Understanding Place Value (1-9999)",
    ]),
    ("Identify Digit Place", [
        "4 - Identify the Digit upto Hundreds Place",
        "5 - Identify the Digit Upto Ten Thousands Place",
        "6 - Identify the Digit Upto Million Place",
    ]),
    ("Value of a Digit", [
        "7 - Value of the digit (1-999)",
        "8 - Value of the digit (1-9999)",
        "9 - Value of the digit (1-999999)",
    ]),
    ("Convert Numbers into Place Value", [
        "10 - Convert Numbers into Place Value (1-999)",
        "11 - Convert Numbers into Place Value (1-99999)",
    ]),
    ("Standard and Expanded Form", [
        "12 - Convert between Standard and Expanded forms",
    ]),
    ("Convert Between Place and Value", [
        "13 - Convert Between Place and Value (1)",
        "14 - Convert Between Place and Value (2)",
        "15 - Convert Between Place and Value (3)",
        "16 - Convert Between Place and Value (4)",
    ]),
    ("Regrouping Numbers", [
        "17 - Re-group Tens and Ones",
        "18 - Re-group Hundreds, Tens, and Ones",
        "19 - Re-group Thousands, Hundreds, Tens, and Ones",
    ]),
    ("Numbers to Words", [
        "20 - Converting Numbers to Words (100-500)",
        "21 - Converting Numbers to Words (500-1000)",
        "22 - Converting Numbers to Words (1000-5000)",
        "23 - Converting Numbers to Words (5000-10000)",
        "24 - Converting Numbers to Words (10000-99999)",
    ]),
    ("Words to Numbers", [
        "25 - Words into Numbers (100-1000)",
        "26 - Words into Numbers (1000-50000)",
        "27 - Words into Numbers (50000-99999)",
    ]),
    ("Ordering Numbers", [
        "28 - Arranging Numbers in Ascending Order (1)",
        "29 - Arranging Numbers in Ascending Order (2)",
        "30 - Arranging Numbers in Descending Order (1)",
        "31 - Arranging Numbers in Descending Order (2)",
    ]),
    ("Roman Numerals Basics", [
        "32 - Introducing Roman Numerals",
        "33 - Translating Roman Numerals",
        "34 - Roman Numbers Sequence",
    ]),
    ("Roman Numerals Operations", [
        "35 - Adding and Subtracting Roman Numerals",
        "36 - Arranging Roman Numerals",
    ]),
    ("Comparing Numbers", [
        "37 - Comparing Numbers (1)",
        "38 - Comparing Numbers (2)",
    ]),
    ("Rounding to Nearest Ten", [
        "39 - Rounding of Numbers to Nearest Ten (1)",
        "40 - Rounding of Numbers to Nearest Ten (2)",
        "41 - Rounding of Numbers to Nearest Ten (3)",
        "42 - Rounding of Numbers to Nearest Ten (4)",
        "43 - Rounding of Numbers to Nearest Ten (5)",
    ]),
    ("Rounding to Nearest Hundred", [
        "44 - Rounding of Numbers to Nearest Hundred (1)",
        "45 - Rounding of Numbers to Nearest Hundred (2)",
        "46 - Rounding of Numbers to Nearest Hundred (3)",
    ]),
    ("Rounding to Nearest Thousand", [
        "47 - Rounding Numbers to Nearest Thousand (1)",
        "48 - Rounding Numbers to Nearest Thousand (2)",
    ]),
    ("Mixed Rounding Practice", [
        "49 - Rounding to Ten, Hundred and Thousand",
    ]),
    ("Addition: Doubles", [
        "1 - Adding the Doubles (1-25)",
        "2 - Adding the Doubles (25-50)",
        "3 - Adding the Doubles (50-75)",
        "4 - Adding the Doubles (75-100)",
    ]),
    ("Addition: Near Doubles", [
        "5 - Adding Near Doubles (1-50)",
        "6 - Adding Near Doubles (50-100)",
    ]),
    ("Addition Strategies & Practice", [
        "7 - Addition Strategies - Adding Pattern",
        "8 - Practicing Addition by 5",
        "9 - Practicing Addition by 6",
        "10 - Practicing Addition by 7",
        "11 - Practicing Addition by 8",
        "12 - Practicing Addition by 9",
        "13 - Practicing Addition by 10",
        "14 - Practicing Addition by 20",
        "15 - Practicing Addition by 50",
        "16 - Practicing Addition by 100",
        "17 - Adding Two Digit Numbers",
        "18 - Addition with Carry-on (1)",
        "19 - Addition with Carry-on (2)",
        "20 - Addition with Carry-on (3)",
        "21 - Addition Word Problems",
        "22 - Finding Missing Digits (1)",
        "23 - Finding Missing Digits (2)",
    ]),
    ("Subtraction Practice", [
        "24 - Practicing Subtraction by 5",
        "25 - Practicing Subtraction by 6",
        "26 - Practicing Subtraction by 7",
        "27 - Practicing Subtraction by 8",
        "28 - Practicing Subtraction by 9",
        "29 - Practicing Subtraction by 10",
        "30 - Practicing Subtraction by 20",
        "31 - Practicing Subtraction by 50",
        "32 - Practicing Subtraction by 100",
    ]),
    ("Subtraction: Multiples of Ten", [
        "33 - Subtraction by the Multiples of Ten (1)",
        "34 - Subtraction by the Multiples of Ten (2)",
    ]),
    ("Subtraction: Missing Numbers & Vertical", [
        "35 - Subtraction by Putting Missing Numbers (1)",
        "36 - Subtraction by Putting Missing Numbers (2)",
        "38 - Subtracting Vertically",
    ]),
    ("Subtraction: Concepts & Regrouping", [
        "37 - Ways to Make a Number Using Subtraction",
        "39 - Subtraction by Re-grouping (1)",
        "40 - Subtraction by Re-grouping (2)",
        "41 - Subtraction Word Problems",
        "42 - Subtraction Strategies - Subtraction Pattern",
        "43 - Evaluating Subtraction Equation",
    ]),
    ("Multiplication & Division Core", [
        "1 - Understanding Multiplication and Addition",
        "2 - Describing Pictures in Mathematical Form (1)",
        "3 - Describing Pictures in Mathematical Form (2)",
        "4 - Multiplication by 5",
        "5 - Multiplication by 6",
        "6 - Multiplication by 7",
        "7 - Multiplication by 8",
        "8 - Multiplication by 9",
        "9 - Multiplication by 10",
        "10 - Multiplication by 11",
        "11 - Multiplication by 12",
        "12 - Multiplication by 15",
        "13 - Multiplication by 20",
        "14 - Complete the Multiplication Equation (1)",
        "15 - Complete the Multiplication Equation (2)",
        "16 - Complete the Multiplication Equation (3)",
        "17 - Multiplying Two Digit Numbers (1)",
        "18 - Multiplying Two Digit Numbers (2)",
        "19 - Multiplication Word Problems",
        "20 - Division Equations (1)",
        "21 - Division Equations (2)",
        "22 - Division Equations (3)",
        "23 - Division by 2",
        "24 - Division by 3",
        "25 - Division by 4",
        "26 - Division by 5",
        "27 - Division by 6",
        "28 - Division by 7",
        "29 - Division by 8",
        "30 - Division by 9",
        "31 - Division by 10",
        "34 - Long Division Method (1)",
        "35 - Long Division Method (2)",
        "36 - Long Division with Remainder",
        "37 - Division Word Problems",
    ]),
    ("Factors, Multiples, Prime/Composite, Divisibility", [
        "32 - Rules of Divisibility (1)",
        "33 - Rules of Divisibility (2)",
        "1 - Divisbility Rules of 2, 3, 5, and 10 (1)",
        "2 - Divisbility Rules of 2, 3, 5, and 10 (2)",
        "3 - Divisbility Rules of 2, 3, 5, and 10 (3)",
        "4 - Prime and Composite Numbers",
        "5 - Finding Factors (1)",
        "6 - Finding Factors (2)",
        "7 - Finding Factors (3)",
        "8 - Finding Prime Factorization (Division Method)",
        "9 - Identifying Prime Factorization",
        "10 - Finding Common Factors",
        "11 - Introducing Multiples (1)",
        "12 - Introducing Multiples (2)",
        "13 - Finding Common Multiples (1)",
        "14 - Finding Common Multiples (2)",
    ]),
    ("Patterns & Expressions", [
        "1 - Complete the Number Pattern (1)",
        "2 - Complete the Number Pattern (2)",
        "3 - Complete the Number Pattern (3)",
        "4 - Number Pattern Word Problems",
        "5 - Writing Numerical Expressions (1)",
        "6 - Writing Numerical Expressions (2)",
        "7 - Evaluating Numerical Expressions (1)",
        "8 - Evaluating Numerical Expressions (2)",
        "9 - Evaluating Numerical Expressions (3)",
        "10 - Finding Correct Expression",
        "11 - Evaluate Expressions with Variables",
    ]),
    ("Extended Skills (Fractions + Decimals + Measurement/Time + Geometry + Data)", []),
]

# Optional explicit list for Topic 28. If left empty, fallback auto-assigns all remaining
# Grade 4 Mathematics quizzes not assigned by Topics 1..27.
EXTENDED_TITLES = []


def _normalize_title(value: str) -> str:
    value = (value or "").strip().lower()
    value = re.sub(r"\s+", " ", value)
    return value


class Command(BaseCommand):
    help = "Seed Grade 4 Mathematics topics and TopicQuiz mappings with ordered sequence."

    def handle(self, *args, **options):
        grade = Grade.objects.filter(name="Grade 4").first()
        if not grade:
            raise CommandError("Grade 'Grade 4' not found.")

        subject_ids = list(Subject.objects.filter(grade=grade, name__icontains="math").values_list("id", flat=True))
        if not subject_ids:
            raise CommandError("No Mathematics subject found for Grade 4.")

        grade4_math_quizzes = list(
            Quiz.objects.select_related("grade", "subject", "chapter")
            .filter(grade=grade, subject_id__in=subject_ids)
            .order_by("id")
        )
        if not grade4_math_quizzes:
            raise CommandError("No Grade 4 Mathematics quizzes found.")

        quiz_by_norm_title = defaultdict(list)
        for quiz in grade4_math_quizzes:
            quiz_by_norm_title[_normalize_title(quiz.title)].append(quiz)

        topics_created = 0
        topics_updated = 0
        mappings_created = 0
        mappings_updated = 0
        mappings_moved = 0
        missing_titles = []
        per_topic_counts = {}
        used_quiz_ids = set()

        with transaction.atomic():
            for topic_order, (topic_name, titles) in enumerate(TOPIC_DATA, start=1):
                topic, created = Topic.objects.get_or_create(
                    grade=grade,
                    name=topic_name,
                    defaults={"order": topic_order},
                )
                if created:
                    topics_created += 1
                elif topic.order != topic_order:
                    topic.order = topic_order
                    topic.save(update_fields=["order"])
                    topics_updated += 1

                assigned_in_topic = 0

                if topic_order < 28:
                    for mapping_order, wanted_title in enumerate(titles, start=1):
                        key = _normalize_title(wanted_title)
                        candidates = [q for q in quiz_by_norm_title.get(key, []) if q.id not in used_quiz_ids]
                        if not candidates:
                            missing_titles.append(f"{topic_name} -> {wanted_title}")
                            continue
                        quiz = candidates[0]
                        used_quiz_ids.add(quiz.id)

                        existing = list(
                            TopicQuiz.objects.filter(quiz=quiz, topic__grade=grade).select_related("topic").order_by("id")
                        )
                        if existing:
                            primary = existing[0]
                            if primary.topic_id != topic.id:
                                primary.topic = topic
                                mappings_moved += 1
                            if primary.order != mapping_order:
                                primary.order = mapping_order
                                mappings_updated += 1
                            primary.save(update_fields=["topic", "order"])
                            if len(existing) > 1:
                                TopicQuiz.objects.filter(id__in=[m.id for m in existing[1:]]).delete()
                        else:
                            TopicQuiz.objects.create(topic=topic, quiz=quiz, order=mapping_order)
                            mappings_created += 1

                        assigned_in_topic += 1

                else:
                    explicit_extended = [
                        q for title in EXTENDED_TITLES
                        for q in quiz_by_norm_title.get(_normalize_title(title), [])
                        if q.id not in used_quiz_ids
                    ]
                    if explicit_extended:
                        fallback_quizzes = explicit_extended
                    else:
                        fallback_quizzes = sorted(
                            [q for q in grade4_math_quizzes if q.id not in used_quiz_ids],
                            key=lambda x: x.title.lower(),
                        )

                    for mapping_order, quiz in enumerate(fallback_quizzes, start=1):
                        used_quiz_ids.add(quiz.id)
                        existing = list(
                            TopicQuiz.objects.filter(quiz=quiz, topic__grade=grade).select_related("topic").order_by("id")
                        )
                        if existing:
                            primary = existing[0]
                            if primary.topic_id != topic.id:
                                primary.topic = topic
                                mappings_moved += 1
                            if primary.order != mapping_order:
                                primary.order = mapping_order
                                mappings_updated += 1
                            primary.save(update_fields=["topic", "order"])
                            if len(existing) > 1:
                                TopicQuiz.objects.filter(id__in=[m.id for m in existing[1:]]).delete()
                        else:
                            TopicQuiz.objects.create(topic=topic, quiz=quiz, order=mapping_order)
                            mappings_created += 1
                        assigned_in_topic += 1

                per_topic_counts[topic_name] = assigned_in_topic

        assigned_quiz_ids = set(
            TopicQuiz.objects.filter(topic__grade=grade, quiz__in=grade4_math_quizzes).values_list("quiz_id", flat=True)
        )
        unassigned_quizzes = [q for q in grade4_math_quizzes if q.id not in assigned_quiz_ids]

        self.stdout.write(self.style.SUCCESS("Grade 4 Mathematics topic seeding complete"))
        self.stdout.write(f"Topics created: {topics_created}, topics updated(order): {topics_updated}")
        self.stdout.write(
            f"Mappings created: {mappings_created}, mappings updated(order): {mappings_updated}, mappings moved: {mappings_moved}"
        )
        self.stdout.write("")
        self.stdout.write("Per-topic quiz counts:")
        for i, (topic_name, _) in enumerate(TOPIC_DATA, start=1):
            self.stdout.write(f"  {i:02d}. {topic_name}: {per_topic_counts.get(topic_name, 0)}")

        self.stdout.write("")
        if missing_titles:
            self.stdout.write("Missing quiz titles:")
            for item in missing_titles:
                self.stdout.write(f"  - {item}")
        else:
            self.stdout.write("Missing quiz titles: none")

        self.stdout.write("")
        self.stdout.write(f"Unassigned Grade 4 Mathematics quizzes count: {len(unassigned_quizzes)}")
        if unassigned_quizzes:
            for quiz in unassigned_quizzes:
                self.stdout.write(f"  - {quiz.title}")
