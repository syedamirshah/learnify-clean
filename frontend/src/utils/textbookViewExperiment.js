/**
 * Experimental textbook view UI helpers (/learn) — V4 adventure mode.
 * Revert: delete this file and remove imports from LandingPage.jsx.
 */

export const DAILY_GOAL_TARGET = 3;

const LEARNING_RANKS = [
  { min: 60, title: "Learning Hero" },
  { min: 30, title: "Problem Solver" },
  { min: 15, title: "Number Champion" },
  { min: 5, title: "Math Adventurer" },
  { min: 0, title: "Beginner Explorer" },
];

const CHAPTER_ICON_RULES = [
  { test: /hcf|lcm/i, icon: "➗" },
  { test: /fraction/i, icon: "🍕" },
  { test: /decimal/i, icon: "💰" },
  { test: /distance|time|speed/i, icon: "🕒" },
  { test: /perimeter|area/i, icon: "🏠" },
  { test: /geometr/i, icon: "📐" },
  { test: /money|rupee|price/i, icon: "💵" },
  { test: /data|graph|chart/i, icon: "📊" },
  {
    test: /number|counting|whole|addition|subtraction|multiplication|division|place.?value/i,
    icon: "🔢",
  },
];

export function getExerciseStatus(percentage) {
  if (percentage === null || percentage === undefined || Number.isNaN(Number(percentage))) {
    return {
      label: "Ready to Start",
      key: "none",
      icon: "⚪",
      badgeClass: "text-gray-700",
      cardAccent: "border-gray-200 bg-white hover:border-emerald-200 hover:shadow-emerald-100/50",
    };
  }

  const pct = Number(percentage);
  if (pct >= 90) {
    return {
      label: "Champion",
      key: "mastered",
      icon: "🏆",
      badgeClass: "text-emerald-800",
      cardAccent:
        "border-emerald-200 bg-gradient-to-br from-emerald-50/90 to-white hover:border-emerald-300",
    };
  }
  if (pct >= 70) {
    return {
      label: "Great Job",
      key: "good",
      icon: "🟢",
      badgeClass: "text-sky-800",
      cardAccent: "border-sky-200 bg-gradient-to-br from-sky-50/80 to-white hover:border-sky-300",
    };
  }
  if (pct >= 50) {
    return {
      label: "Improving",
      key: "improving",
      icon: "🟡",
      badgeClass: "text-amber-800",
      cardAccent:
        "border-amber-200 bg-gradient-to-br from-amber-50/70 to-white hover:border-amber-300",
    };
  }
  return {
    label: "Practice Again",
    key: "needs",
    icon: "🔴",
    badgeClass: "text-red-800",
    cardAccent: "border-red-200 bg-gradient-to-br from-red-50/60 to-white hover:border-red-300",
  };
}

export function getStarRating(percentage) {
  if (percentage === null || percentage === undefined || Number.isNaN(Number(percentage))) {
    return { stars: "", count: 0, label: "" };
  }
  const pct = Number(percentage);
  if (pct >= 95) return { stars: "⭐⭐⭐", count: 3, label: "3 stars" };
  if (pct >= 80) return { stars: "⭐⭐", count: 2, label: "2 stars" };
  if (pct >= 60) return { stars: "⭐", count: 1, label: "1 star" };
  return { stars: "", count: 0, label: "No stars yet" };
}

export function getChapterIcon(chapterName) {
  const name = String(chapterName || "");
  for (const rule of CHAPTER_ICON_RULES) {
    if (rule.test.test(name)) return rule.icon;
  }
  return "📘";
}

export function getLearningRank(completed) {
  const count = Math.max(0, Number(completed) || 0);
  let currentIndex = LEARNING_RANKS.length - 1;
  for (let i = 0; i < LEARNING_RANKS.length; i += 1) {
    if (count >= LEARNING_RANKS[i].min) {
      currentIndex = i;
      break;
    }
  }

  const current = LEARNING_RANKS[currentIndex];
  const next = currentIndex > 0 ? LEARNING_RANKS[currentIndex - 1] : null;
  const remaining = next ? Math.max(0, next.min - count) : 0;

  return {
    title: current.title,
    completed: count,
    nextTitle: next?.title ?? null,
    remaining,
    isMaxRank: !next,
  };
}

export function parseAttemptedOnDate(attemptedOn) {
  if (!attemptedOn) return null;
  const match = String(attemptedOn).match(/(\d{2})-(\d{2})-(\d{4})/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]) - 1;
  const year = Number(match[3]);
  const date = new Date(year, month, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function countCompletedToday(historyMap) {
  const today = new Date();
  const isToday = (date) =>
    date &&
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  let count = 0;
  Object.values(historyMap || {}).forEach((row) => {
    const date = parseAttemptedOnDate(row?.attempted_on);
    if (isToday(date)) count += 1;
  });
  return count;
}

export function historyHasAttemptDates(historyMap) {
  return Object.values(historyMap || {}).some((row) =>
    Boolean(parseAttemptedOnDate(row?.attempted_on))
  );
}

export function getDailyGoalProgress(historyMap, stats, target = DAILY_GOAL_TARGET) {
  const todayCount = countCompletedToday(historyMap);
  const hasDates = historyHasAttemptDates(historyMap);
  const fallback = Math.min(stats?.completed ?? 0, target);
  const progress = hasDates ? todayCount : fallback;

  return {
    target,
    progress,
    completed: progress >= target,
    usedFallback: !hasDates,
  };
}

export function getCelebrationBanner(average) {
  if (average === null || average === undefined) return null;
  const avg = Number(average);
  if (avg >= 90) {
    return { icon: "🏆", text: "Outstanding Performance!", tone: "gold" };
  }
  if (avg >= 80) {
    return { icon: "🎉", text: "Excellent Progress!", tone: "emerald" };
  }
  return null;
}

export function collectQuizzesFromGradeData(gradeData) {
  const quizzes = [];
  (gradeData || []).forEach((grade) => {
    (grade.subjects || []).forEach((subject) => {
      (subject.chapters || []).forEach((chapter) => {
        (chapter.quizzes || []).forEach((quiz) => quizzes.push(quiz));
      });
    });
  });
  return quizzes;
}

export function getStudentTextbookStats(visibleGradeData, historyMap) {
  const quizzes = collectQuizzesFromGradeData(visibleGradeData);
  const total = quizzes.length;
  let completed = 0;
  const percentages = [];

  quizzes.forEach((quiz) => {
    const row = historyMap?.[String(quiz.id)];
    if (row && row.percentage !== null && row.percentage !== undefined) {
      completed += 1;
      percentages.push(Number(row.percentage));
    }
  });

  const average =
    percentages.length > 0
      ? Math.round(percentages.reduce((sum, n) => sum + n, 0) / percentages.length)
      : null;

  const progressPercent = total ? Math.round((completed / total) * 100) : 0;

  return { total, completed, average, progressPercent };
}

export function getChapterProgress(quizzes, historyMap) {
  const list = Array.isArray(quizzes) ? quizzes : [];
  const total = list.length;
  if (!total) {
    return { total: 0, attempted: 0, average: null, progressPercent: 0, status: null };
  }

  const percentages = [];
  let attempted = 0;

  list.forEach((quiz) => {
    const row = historyMap?.[String(quiz.id)];
    if (row && row.percentage !== null && row.percentage !== undefined) {
      attempted += 1;
      percentages.push(Number(row.percentage));
    }
  });

  const average =
    percentages.length > 0
      ? Math.round(percentages.reduce((sum, n) => sum + n, 0) / percentages.length)
      : null;

  const progressPercent = Math.round((attempted / total) * 100);
  const status = average !== null ? getExerciseStatus(average).label : null;

  return { total, attempted, average, progressPercent, status };
}

export function formatProgressBlocks(percent, segments = 10) {
  const filled = Math.min(
    segments,
    Math.max(0, Math.round((Number(percent) / 100) * segments))
  );
  return {
    visual: `${"█".repeat(filled)}${"░".repeat(segments - filled)}`,
    filled,
    segments,
  };
}

export function formatChapterSummaryMeta(progress) {
  const parts = [];
  if (progress.total) parts.push(`${progress.total} exercises`);
  if (progress.attempted > 0) parts.push(`${progress.attempted} attempted`);
  if (progress.average !== null) parts.push(`Avg ${progress.average}%`);
  return parts.join(" · ");
}

export function findContinueLearningQuiz(sortedQuizzes, historyMap) {
  const list = Array.isArray(sortedQuizzes) ? sortedQuizzes : [];
  if (!list.length) return null;

  for (const quiz of list) {
    const row = historyMap?.[String(quiz.id)];
    if (row && Number(row.percentage) < 60) {
      return { quiz, reason: "needs_practice", percentage: Number(row.percentage) };
    }
  }

  for (const quiz of list) {
    if (!historyMap?.[String(quiz.id)]) {
      return { quiz, reason: "not_attempted", percentage: null };
    }
  }

  for (let i = list.length - 1; i >= 0; i -= 1) {
    const quiz = list[i];
    const row = historyMap?.[String(quiz.id)];
    if (row) {
      return {
        quiz,
        reason: "continue",
        percentage: Number(row.percentage),
      };
    }
  }

  return null;
}

export function getMissionReasonText(reason, percentage) {
  if (reason === "not_attempted") {
    return "Ready to start this challenge.";
  }
  if (reason === "needs_practice" || (percentage !== null && percentage < 60)) {
    return "Practice again to improve your score.";
  }
  return "Try again to become a champion.";
}

export function getMissionRecommendation(sortedQuizzes, historyMap) {
  const pick = findContinueLearningQuiz(sortedQuizzes, historyMap);
  if (!pick) return null;
  return {
    ...pick,
    reasonText: getMissionReasonText(pick.reason, pick.percentage),
  };
}

export function getFirstName(fullName) {
  const display = (fullName || "").trim();
  if (!display) return "Learner";
  return display.split(/\s+/)[0];
}
