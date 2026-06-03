/**
 * Experimental textbook view UI helpers (/learn).
 * Revert: delete this file and remove imports from LandingPage.jsx.
 */

export const DAILY_GOAL_TARGET = 3;

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

export function getFiveStarFilledCount(average) {
  if (average === null || average === undefined || Number.isNaN(Number(average))) {
    return 0;
  }
  const avg = Number(average);
  if (avg >= 95) return 5;
  if (avg >= 80) return 4;
  if (avg >= 65) return 3;
  if (avg >= 50) return 2;
  return 1;
}

export function getExerciseStatus(percentage) {
  if (percentage === null || percentage === undefined || Number.isNaN(Number(percentage))) {
    return {
      label: "Ready",
      key: "none",
      icon: "⚪",
      badgeClass: "bg-gray-100 text-gray-700",
      cardAccent: "bg-white shadow-sm hover:shadow-md ring-1 ring-gray-100 hover:ring-emerald-200",
      cta: "Start Challenge",
    };
  }

  const pct = Number(percentage);
  if (pct >= 95) {
    return {
      label: "Champion",
      key: "champion",
      icon: "🏆",
      badgeClass: "bg-emerald-100 text-emerald-900",
      cardAccent: "bg-white shadow-sm hover:shadow-md ring-1 ring-emerald-100 hover:ring-emerald-300",
      cta: "Continue",
    };
  }
  if (pct >= 80) {
    return {
      label: "Great Job",
      key: "great",
      icon: "🟢",
      badgeClass: "bg-sky-100 text-sky-900",
      cardAccent: "bg-white shadow-sm hover:shadow-md ring-1 ring-sky-100 hover:ring-sky-300",
      cta: "Continue",
    };
  }
  if (pct >= 60) {
    return {
      label: "Building Skill",
      key: "building",
      icon: "🟡",
      badgeClass: "bg-amber-100 text-amber-900",
      cardAccent: "bg-white shadow-sm hover:shadow-md ring-1 ring-amber-100 hover:ring-amber-300",
      cta: "Continue",
    };
  }
  return {
    label: "Practice Again",
    key: "needs",
    icon: "🔴",
    badgeClass: "bg-red-100 text-red-800",
    cardAccent: "bg-white shadow-sm hover:shadow-md ring-1 ring-red-100 hover:ring-red-300",
    cta: "Practice Again",
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
  return { stars: "", count: 0, label: "" };
}

export function getChapterIcon(chapterName) {
  const name = String(chapterName || "");
  for (const rule of CHAPTER_ICON_RULES) {
    if (rule.test.test(name)) return rule.icon;
  }
  return "📘";
}

export function getChapterLevelStatus(progress) {
  const attempted = progress?.attempted ?? 0;
  const total = progress?.total ?? 0;
  const progressPercent = progress?.progressPercent ?? 0;
  const average = progress?.average;

  if (average !== null && average !== undefined && average >= 90) {
    return { label: "Champion", tone: "champion" };
  }
  if (attempted === 0) {
    return { label: "Ready", tone: "ready" };
  }
  if (total > 0 && progressPercent >= 100) {
    return { label: "Completed", tone: "completed" };
  }
  if (progressPercent >= 50) {
    return { label: "In Progress", tone: "progress" };
  }
  return { label: "Started", tone: "started" };
}

const LEVEL_STATUS_STYLES = {
  ready: "bg-white/90 text-gray-800",
  started: "bg-white/90 text-sky-900",
  progress: "bg-white/90 text-emerald-900",
  completed: "bg-white/90 text-emerald-950",
  champion: "bg-amber-100/95 text-amber-950 font-extrabold",
};

export function getChapterLevelStatusClass(tone) {
  return LEVEL_STATUS_STYLES[tone] || LEVEL_STATUS_STYLES.ready;
}

export function getChapterCoachTip(progress) {
  const attempted = progress?.attempted ?? 0;
  const average = progress?.average;

  if (attempted === 0) {
    return "Start with the first exercise and build your progress step by step.";
  }
  if (average !== null && average >= 80) {
    return "Great work! Keep practicing to stay sharp.";
  }
  if (average !== null && average >= 50) {
    return "You are improving. Try a few more exercises to strengthen this chapter.";
  }
  return "Start with easier exercises and practice again to build confidence.";
}

export function getNextBestAction(sortedQuizzes, historyMap) {
  const list = Array.isArray(sortedQuizzes) ? [...sortedQuizzes] : [];
  if (!list.length) return null;

  let lowest = null;
  list.forEach((quiz) => {
    const row = historyMap?.[String(quiz.id)];
    if (row && Number(row.percentage) < 70) {
      const pct = Number(row.percentage);
      if (!lowest || pct < lowest.percentage) {
        lowest = { quiz, percentage: pct, reason: "low_score" };
      }
    }
  });

  if (lowest) {
    return {
      ...lowest,
      reasonText: "This exercise can help improve your chapter score.",
      cta: "Practice Again",
    };
  }

  for (const quiz of list) {
    if (!historyMap?.[String(quiz.id)]) {
      return {
        quiz,
        percentage: null,
        reason: "not_attempted",
        reasonText: "Ready to start your next challenge.",
        cta: "Start Now",
      };
    }
  }

  const first = list[0];
  const row = historyMap?.[String(first.id)];
  const pct = row ? Number(row.percentage) : null;
  return {
    quiz: first,
    percentage: pct,
    reason: "default",
    reasonText: "Try again to move closer to Champion level.",
    cta: pct !== null && pct < 60 ? "Practice Again" : "Continue",
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

export function getTodayAverage(historyMap) {
  const today = new Date();
  const isToday = (date) =>
    date &&
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const percentages = [];
  Object.values(historyMap || {}).forEach((row) => {
    const date = parseAttemptedOnDate(row?.attempted_on);
    if (
      isToday(date) &&
      row?.percentage !== null &&
      row?.percentage !== undefined
    ) {
      percentages.push(Number(row.percentage));
    }
  });

  if (!percentages.length) return null;
  return Math.round(percentages.reduce((sum, n) => sum + n, 0) / percentages.length);
}

export function getWelcomeMotivation(dailyGoal, stats) {
  if (dailyGoal && !dailyGoal.completed) {
    const remaining = dailyGoal.target - dailyGoal.progress;
    if (remaining === 1) {
      return "Only 1 more exercise to reach today's goal!";
    }
    if (remaining > 0) {
      return `Only ${remaining} more exercises to reach today's goal!`;
    }
  }
  if (stats?.average !== null && stats.average >= 80) {
    return "You are doing great — keep up the momentum!";
  }
  if (stats?.completed > 0) {
    return "Every exercise makes you stronger. Keep going!";
  }
  return "Start your first exercise and begin earning stars!";
}

export function getTodayGoalMessage(dailyGoal) {
  if (!dailyGoal) return "";
  if (dailyGoal.completed) {
    return "Excellent! Today's learning goal completed.";
  }
  const remaining = dailyGoal.target - dailyGoal.progress;
  if (remaining === 1) {
    return "Keep going! One more exercise to reach today's target.";
  }
  return `Keep going! ${remaining} more exercises to reach today's target.`;
}

function getSortedHistoryPercentages(historyMap) {
  const rows = Object.values(historyMap || {})
    .filter(
      (row) => row?.percentage !== null && row?.percentage !== undefined
    )
    .map((row) => ({
      percentage: Number(row.percentage),
      date: parseAttemptedOnDate(row?.attempted_on)?.getTime() ?? 0,
    }));

  const hasDates = rows.some((row) => row.date > 0);
  if (hasDates) {
    return rows.sort((a, b) => b.date - a.date).map((row) => row.percentage);
  }
  return rows.map((row) => row.percentage);
}

export function getProgressTrend(historyMap) {
  const percentages = getSortedHistoryPercentages(historyMap);
  if (percentages.length < 4) {
    return {
      hasData: false,
      message: "Complete more exercises to see your progress trend.",
    };
  }

  const recent = percentages.slice(0, Math.min(5, percentages.length));
  const previous = percentages.slice(5, 10);
  const recentAverage = Math.round(
    recent.reduce((sum, n) => sum + n, 0) / recent.length
  );
  const previousAverage = previous.length
    ? Math.round(previous.reduce((sum, n) => sum + n, 0) / previous.length)
    : recentAverage;

  const diff = recentAverage - previousAverage;
  let trend = "Stable";
  let arrow = "→";
  if (diff > 5) {
    trend = "Improving";
    arrow = "↗";
  } else if (diff < -5) {
    trend = "Declining";
    arrow = "↘";
  }

  return {
    hasData: true,
    recentAverage,
    previousAverage,
    trend,
    arrow,
  };
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

  return { total, attempted, average, progressPercent, status: null };
}

export function formatChapterSummaryMeta(progress) {
  const parts = [];
  if (progress.total) parts.push(`${progress.total} exercises`);
  if (progress.attempted > 0) parts.push(`${progress.attempted} attempted`);
  if (progress.average !== null) parts.push(`Avg ${progress.average}%`);
  return parts.join(" · ");
}

export function getFirstName(fullName) {
  const display = (fullName || "").trim();
  if (!display) return "Learner";
  return display.split(/\s+/)[0];
}
