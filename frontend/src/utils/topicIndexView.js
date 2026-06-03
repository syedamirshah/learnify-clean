/**
 * Topic Index skill-map UI helpers.
 * Revert: delete and restore TopicIndexPage.jsx imports.
 */

import { getExerciseStatus } from "./textbookViewExperiment";

export const TOPIC_GROUP_PALETTES = [
  {
    cardBg: "bg-sky-50",
    cardBorder: "border-sky-200",
    headerBg: "bg-sky-100/80",
    accent: "text-sky-900",
    skillHover: "hover:bg-sky-100/60",
  },
  {
    cardBg: "bg-emerald-50",
    cardBorder: "border-emerald-200",
    headerBg: "bg-emerald-100/80",
    accent: "text-emerald-900",
    skillHover: "hover:bg-emerald-100/60",
  },
  {
    cardBg: "bg-teal-50",
    cardBorder: "border-teal-200",
    headerBg: "bg-teal-100/80",
    accent: "text-teal-900",
    skillHover: "hover:bg-teal-100/60",
  },
  {
    cardBg: "bg-lime-50",
    cardBorder: "border-lime-200",
    headerBg: "bg-lime-100/80",
    accent: "text-lime-900",
    skillHover: "hover:bg-lime-100/60",
  },
  {
    cardBg: "bg-amber-50",
    cardBorder: "border-amber-200",
    headerBg: "bg-amber-100/80",
    accent: "text-amber-900",
    skillHover: "hover:bg-amber-100/60",
  },
  {
    cardBg: "bg-rose-50",
    cardBorder: "border-rose-200",
    headerBg: "bg-rose-100/80",
    accent: "text-rose-900",
    skillHover: "hover:bg-rose-100/60",
  },
  {
    cardBg: "bg-violet-50",
    cardBorder: "border-violet-200",
    headerBg: "bg-violet-100/80",
    accent: "text-violet-900",
    skillHover: "hover:bg-violet-100/60",
  },
];

export function getTopicGroupPalette(index) {
  return TOPIC_GROUP_PALETTES[index % TOPIC_GROUP_PALETTES.length];
}

const TOPIC_ICONS = ["🧮", "➕", "🔢", "📐", "✖️", "📊", "🎯"];

export function getTopicGroupIcon(topicName, index) {
  const name = String(topicName || "").toLowerCase();
  if (/add|plus|sum/i.test(name)) return "➕";
  if (/subtract|minus/i.test(name)) return "➖";
  if (/multip|times|product/i.test(name)) return "✖️";
  if (/divid|quotient/i.test(name)) return "➗";
  if (/fraction/i.test(name)) return "🍕";
  if (/decimal|percent/i.test(name)) return "💰";
  if (/geometr|shape|angle/i.test(name)) return "📐";
  if (/data|graph|chart/i.test(name)) return "📊";
  return TOPIC_ICONS[index % TOPIC_ICONS.length];
}

export function getTopicGroupProgress(quizzes, historyMap) {
  const list = Array.isArray(quizzes) ? quizzes : [];
  const total = list.length;
  if (!total) {
    return { total: 0, attempted: 0, progressPercent: 0 };
  }

  let attempted = 0;
  list.forEach((quiz) => {
    const row = historyMap?.[String(quiz.id)];
    if (row && row.percentage !== null && row.percentage !== undefined) {
      attempted += 1;
    }
  });

  return {
    total,
    attempted,
    progressPercent: Math.round((attempted / total) * 100),
  };
}

export function getSkillStatus(quizId, historyMap, isStudent) {
  if (!isStudent) {
    return getExerciseStatus(null);
  }
  const row = historyMap?.[String(quizId)];
  if (!row || row.percentage === null || row.percentage === undefined) {
    return getExerciseStatus(null);
  }
  return getExerciseStatus(Number(row.percentage));
}

export function findContinueLearningTopic(topics, historyMap) {
  const ordered = [];
  (topics || []).forEach((topic) => {
    (topic.quizzes || []).forEach((quiz) => {
      ordered.push({ topic, quiz });
    });
  });
  if (!ordered.length) return null;

  let lowest = null;
  ordered.forEach(({ topic, quiz }) => {
    const row = historyMap?.[String(quiz.id)];
    if (row && Number(row.percentage) < 70) {
      const pct = Number(row.percentage);
      if (!lowest || pct < lowest.percentage) {
        lowest = { topic, quiz, percentage: pct, cta: "Practice Again" };
      }
    }
  });
  if (lowest) return lowest;

  for (const item of ordered) {
    if (!historyMap?.[String(item.quiz.id)]) {
      return { ...item, cta: "Start Practice" };
    }
  }

  const first = ordered[0];
  const row = historyMap?.[String(first.quiz.id)];
  const pct = row ? Number(row.percentage) : null;
  return {
    ...first,
    cta: pct !== null && pct < 60 ? "Practice Again" : "Start Practice",
  };
}
