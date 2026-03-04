"""
Usage:
    python manage.py seed_grade5_topics
"""

import re
from collections import defaultdict

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from core.models import Grade, Quiz, Subject, Topic, TopicQuiz


TOPIC_NAMES = [
    "Place Value of Large Numbers",
    "Identifying Digit Positions",
    "Digit Values and Place Values",
    "Standard and Expanded Forms",
    "Converting Place and Value",
    "Regrouping Numbers",
    "Numbers in Words",
    "Words to Numbers",
    "Moving Between Places",
    "Comparing and Ordering Numbers",
    "Rounding Numbers",
    "Addition Strategies",
    "Vertical Addition",
    "Missing Numbers and Addition Word Problems",
    "Subtraction Practice",
    "Subtraction Methods",
    "Subtraction with Regrouping",
    "Subtraction Concepts",
    "Multiplication Tables (11–20)",
    "Multiplication Techniques",
    "Multiplication Word Problems",
    "Division Basics",
    "Long Division",
    "Division Word Problems",
    "Factors, Multiples, HCF and LCM",
    "Fractions",
    "Decimals and Percentages",
    "Measurement, Geometry and Data",
]


EXACT_TITLES = {
    1: [
        "1 - Understanding Place Value (1-999)",
        "2 - Understanding Place Value (1-9999)",
    ],
    2: [
        "3 - Identify the Digit Upto Ten Thousands Place",
        "4 - Identify the Digit Upto Million Place",
        "5 - Identifying the Digit Upto the Billion Place",
        "6 - Putting Commas in Correct Places",
    ],
    3: [
        "7 - Identifying the Value of Digits",
        "8 - Convert Numbers into Place Values",
    ],
    4: [
        "9 - Convert between Standard and Expanded forms",
    ],
    5: [
        "10 - Convert Between Place and Value (1)",
        "11 - Convert Between Place and Value (2)",
        "12 - Convert Between Place and Value (3)",
    ],
    6: [
        "13 - Re-group Hundreds, Tens, and Ones",
        "14 - Re-group Thousands, Hundreds, Tens, and Ones",
    ],
    9: [
        "25 - Moving Between Places (1)",
        "26 - Moving Between Places (2)",
        "27 - Moving Between Places (3)",
    ],
    10: [
        "28 - Arranging Numbers in Ascending Order",
        "29 - Arranging Numbers in Descending Order",
        "30 - Comparing Numbers",
    ],
}


def normalize_title(text: str) -> str:
    value = (text or "").strip().lower()
    value = value.replace("–", "-").replace("—", "-")
    value = re.sub(r"\s*-\s*", " - ", value)
    value = re.sub(r"\s+", " ", value)
    return value


def split_prefix_number(title: str):
    normalized = normalize_title(title)
    match = re.match(r"^(\d+)\s*-\s*(.+)$", normalized)
    if match:
        return int(match.group(1)), match.group(2).strip()
    return None, normalized


def _contains_any(text: str, keywords):
    return any(keyword in text for keyword in keywords)


def _is_multiplication_11_to_20(text: str):
    match = re.search(r"multiplication by\s*(\d+)", text)
    return bool(match and 11 <= int(match.group(1)) <= 20)


class Command(BaseCommand):
    help = "Seed Grade 5 Mathematics topic index mappings."

    def handle(self, *args, **options):
        g5 = Grade.objects.filter(name="Grade 5").first()
        if not g5:
            raise CommandError("Grade 'Grade 5' not found.")

        math = Subject.objects.filter(id=5, grade=g5).filter(name__icontains="math").first()
        if not math:
            math = Subject.objects.filter(grade=g5, name__icontains="math").order_by("id").first()
        if not math:
            raise CommandError("Mathematics subject for Grade 5 not found.")

        self.stdout.write(f"Using Grade: id={g5.id}, name='{g5.name}'")
        self.stdout.write(f"Using Subject: id={math.id}, name='{math.name}'")

        qs = Quiz.objects.select_related("grade", "subject", "chapter").filter(grade=g5, subject=math).order_by("id")
        total_quizzes = qs.count()
        if total_quizzes == 0:
            raise CommandError("No Grade 5 Mathematics quizzes found.")

        quizzes = list(qs)
        quizzes_by_norm = defaultdict(list)
        for quiz in quizzes:
            quizzes_by_norm[normalize_title(quiz.title)].append(quiz)

        topics_created = 0
        topics_updated = 0
        mappings_created = 0
        mappings_updated = 0
        mappings_moved = 0
        missing_exact_titles = []
        keyword_rule_hits = defaultdict(int)
        per_topic_ids = defaultdict(list)

        topic_by_index = {}
        with transaction.atomic():
            for idx, topic_name in enumerate(TOPIC_NAMES, start=1):
                topic, created = Topic.objects.get_or_create(
                    grade=g5,
                    name=topic_name,
                    defaults={"order": idx},
                )
                if created:
                    topics_created += 1
                elif topic.order != idx:
                    topic.order = idx
                    topic.save(update_fields=["order"])
                    topics_updated += 1
                topic_by_index[idx] = topic

            unassigned_ids = {quiz.id for quiz in quizzes}

            # Phase A: exact title match
            for topic_idx in sorted(EXACT_TITLES.keys()):
                for expected in EXACT_TITLES[topic_idx]:
                    n_expected = normalize_title(expected)
                    candidates = [q for q in quizzes_by_norm.get(n_expected, []) if q.id in unassigned_ids]
                    if not candidates:
                        missing_exact_titles.append(f"{TOPIC_NAMES[topic_idx - 1]} -> {expected}")
                        continue
                    quiz = candidates[0]
                    per_topic_ids[topic_idx].append(quiz.id)
                    unassigned_ids.discard(quiz.id)

            # Phase B: keyword/contains rules
            rule_functions = [
                (7, "contains 'converting numbers to words'", lambda t: "converting numbers to words" in t),
                (8, "contains 'words into numbers'", lambda t: "words into numbers" in t),
                (11, "contains 'rounding'", lambda t: "rounding" in t),
                (12, "contains doubles/near doubles", lambda t: "adding the doubles" in t or "adding the near doubles" in t),
                (13, "contains 'adding vertically'", lambda t: "adding vertically" in t),
                (14, "contains missing digits/addition word problems", lambda t: "finding missing digits" in t or "addition word problems" in t),
                (15, "contains 'practicing subtraction by'", lambda t: "practicing subtraction by" in t),
                (
                    16,
                    "contains multiples of ten / putting missing numbers / subtracting vertically",
                    lambda t: "subtraction by the multiples of ten" in t or "subtraction by putting missing numbers" in t or "subtracting vertically" in t,
                ),
                (17, "contains 'subtraction by re-grouping'", lambda t: "subtraction by re-grouping" in t),
                (
                    18,
                    "contains subtraction strategies/evaluating equation/word problem",
                    lambda t: "subtraction strategies" in t or "evaluating subtraction equation" in t or "subtraction word problem" in t,
                ),
                (19, "multiplication by 11..20", _is_multiplication_11_to_20),
                (
                    20,
                    "contains complete multiplication equation OR multiplying two digit numbers",
                    lambda t: "complete the multiplication equation" in t or "multiplying two digit numbers" in t,
                ),
                (21, "contains multiplication word problems", lambda t: "multiplication word problems" in t),
                (22, "contains division equations OR division by", lambda t: "division equations" in t or "division by " in t),
                (23, "contains long division", lambda t: "long division" in t),
                (24, "contains division word problems", lambda t: "division word problems" in t),
                (
                    25,
                    "contains factors/multiples/hcf/lcm/divisibility/prime",
                    lambda t: _contains_any(
                        t,
                        [
                            "divisbility",
                            "divisibility",
                            "prime",
                            "composite",
                            "factor",
                            "factors",
                            "hcf",
                            "lcm",
                            "multiples",
                            "prime factorization",
                            "common factor",
                            "common multiple",
                        ],
                    ),
                ),
                (
                    26,
                    "contains fractions terms",
                    lambda t: _contains_any(
                        t,
                        [
                            "fraction",
                            "fractions",
                            "mixed number",
                            "improper",
                            "equivalent fractions",
                            "simplifying fractions",
                            "like fractions",
                            "unlike fractions",
                            "numerator",
                            "denominator",
                        ],
                    ),
                ),
                (
                    27,
                    "contains decimals/percentages/BODMAS/distributive",
                    lambda t: _contains_any(
                        t,
                        ["decimal", "decimals", "percentage", "percent", "bodmas", "distributive"],
                    ),
                ),
            ]

            for quiz in quizzes:
                if quiz.id not in unassigned_ids:
                    continue
                normalized = normalize_title(quiz.title)
                assigned_topic_idx = None
                matched_rule_label = None

                for topic_idx, rule_label, matcher in rule_functions:
                    if matcher(normalized):
                        assigned_topic_idx = topic_idx
                        matched_rule_label = rule_label
                        break

                if assigned_topic_idx is not None:
                    per_topic_ids[assigned_topic_idx].append(quiz.id)
                    keyword_rule_hits[matched_rule_label] += 1
                    unassigned_ids.discard(quiz.id)

            # Phase C: fallback -> Topic 28
            fallback_titles = []
            for quiz in quizzes:
                if quiz.id in unassigned_ids:
                    per_topic_ids[28].append(quiz.id)
                    fallback_titles.append(quiz.title)

            # Deterministic ordering + idempotent mapping writes
            quiz_index = {q.id: q for q in quizzes}
            for topic_idx in range(1, 29):
                topic = topic_by_index[topic_idx]
                ids = per_topic_ids.get(topic_idx, [])
                ordered_quiz_ids = sorted(
                    ids,
                    key=lambda quiz_id: (
                        split_prefix_number(quiz_index[quiz_id].title)[0] is None,
                        split_prefix_number(quiz_index[quiz_id].title)[0] or 10**9,
                        split_prefix_number(quiz_index[quiz_id].title)[1],
                        quiz_id,
                    ),
                )
                per_topic_ids[topic_idx] = ordered_quiz_ids

                for order_pos, quiz_id in enumerate(ordered_quiz_ids, start=1):
                    quiz = quiz_index[quiz_id]

                    wrong_mappings = TopicQuiz.objects.filter(
                        quiz=quiz,
                        topic__grade=g5,
                    ).exclude(topic=topic)
                    moved_now = wrong_mappings.count()
                    if moved_now:
                        mappings_moved += moved_now
                        wrong_mappings.delete()

                    mapping, created = TopicQuiz.objects.get_or_create(
                        topic=topic,
                        quiz=quiz,
                        defaults={"order": order_pos},
                    )
                    if created:
                        mappings_created += 1
                    elif mapping.order != order_pos:
                        mapping.order = order_pos
                        mapping.save(update_fields=["order"])
                        mappings_updated += 1

        topic_count = Topic.objects.filter(grade=g5).count()
        topic_quiz_count = TopicQuiz.objects.filter(topic__grade=g5, quiz__grade=g5, quiz__subject=math).count()
        unassigned_count = qs.exclude(quiz_topics__topic__grade=g5).count()

        self.stdout.write(self.style.SUCCESS("\nGrade 5 Math Topic seeding complete"))
        self.stdout.write(f"Topics created: {topics_created}, topics updated: {topics_updated}")
        self.stdout.write(
            f"Mappings created: {mappings_created}, mappings updated: {mappings_updated}, mappings moved: {mappings_moved}"
        )
        self.stdout.write(f"Grade 5 topics total: {topic_count} (expected 28)")
        self.stdout.write(f"TopicQuiz count (Grade 5 Math): {topic_quiz_count} / {total_quizzes}")
        self.stdout.write(f"Unassigned Grade 5 Math quizzes: {unassigned_count}")

        self.stdout.write("\nPer-topic assigned counts:")
        for idx, topic_name in enumerate(TOPIC_NAMES, start=1):
            self.stdout.write(f"  {idx:02d}. {topic_name}: {len(per_topic_ids.get(idx, []))}")

        if missing_exact_titles:
            self.stdout.write("\nMissing exact titles:")
            for title in missing_exact_titles:
                self.stdout.write(f"  - {title}")
        else:
            self.stdout.write("\nMissing exact titles: none")

        self.stdout.write("\nKeyword rule hits:")
        if keyword_rule_hits:
            for rule_label, count in sorted(keyword_rule_hits.items()):
                self.stdout.write(f"  - {rule_label}: {count}")
        else:
            self.stdout.write("  - none")

        fallback_titles = [q.title for q in qs if q.id in set(per_topic_ids.get(28, []))]
        self.stdout.write(f"\nFallback to Topic 28 count: {len(fallback_titles)}")
        for title in fallback_titles[:50]:
            self.stdout.write(f"  - {title}")
        if len(fallback_titles) > 50:
            self.stdout.write(f"  ... and {len(fallback_titles) - 50} more")
