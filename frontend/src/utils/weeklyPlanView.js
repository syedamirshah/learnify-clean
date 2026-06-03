/**
 * Weekly Plan UI helpers.
 * Revert: delete and restore WeeklyPlanPage.jsx imports.
 */

export const DEFAULT_WEEK_COUNT = 30;

export function getWeekTotals(week) {
  const completed = Number(week?.completed_quizzes || 0);
  const total = Number(week?.total_quizzes || week?.quiz_count || 0);
  const progressPercent =
    total > 0
      ? Math.round((completed / total) * 100)
      : Number(week?.progress_percent ?? 0);

  return { completed, total, progressPercent };
}

export function getWeekStatus(completed, total) {
  if (!total || completed <= 0) {
    return { label: "Not Started", tone: "not_started" };
  }
  if (completed >= total) {
    return { label: "Completed", tone: "completed" };
  }
  return { label: "In Progress", tone: "in_progress" };
}

export const WEEK_CARD_STYLES = {
  completed: {
    card: "border-emerald-200 bg-emerald-50",
    badge: "bg-emerald-100 text-emerald-900 ring-emerald-200",
  },
  in_progress: {
    card: "border-sky-200 bg-sky-50",
    badge: "bg-sky-100 text-sky-900 ring-sky-200",
  },
  not_started: {
    card: "border-gray-200 bg-gray-50",
    badge: "bg-gray-100 text-gray-700 ring-gray-200",
  },
};

export function getWeekAverageScore(week, historyMap) {
  const percentages = [];
  (week?.quizzes || []).forEach((quiz) => {
    const row = historyMap?.[String(quiz.id)];
    if (row?.percentage !== null && row?.percentage !== undefined) {
      percentages.push(Number(row.percentage));
    }
  });
  if (!percentages.length) return null;
  return Math.round(percentages.reduce((sum, n) => sum + n, 0) / percentages.length);
}

export function findCurrentWeek(weeks) {
  const list = Array.isArray(weeks) ? [...weeks] : [];
  if (!list.length) return null;

  const sorted = list.sort((a, b) => {
    const orderA = Number.isFinite(Number(a?.order)) ? Number(a.order) : Number.MAX_SAFE_INTEGER;
    const orderB = Number.isFinite(Number(b?.order)) ? Number(b.order) : Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return Number(a?.id || 0) - Number(b?.id || 0);
  });

  const incomplete = sorted.find((week) => {
    const { completed, total } = getWeekTotals(week);
    return total > 0 && completed < total;
  });

  if (incomplete) return incomplete;
  return sorted[sorted.length - 1];
}

export function getPlanSummary(weeks, weekCount = DEFAULT_WEEK_COUNT) {
  const list = Array.isArray(weeks) ? weeks : [];
  let weeksCompleted = 0;
  let exercisesCompleted = 0;
  let exercisesTotal = 0;

  list.forEach((week) => {
    const { completed, total } = getWeekTotals(week);
    exercisesCompleted += completed;
    exercisesTotal += total;
    if (total > 0 && completed >= total) weeksCompleted += 1;
  });

  const overallPercent =
    exercisesTotal > 0 ? Math.round((exercisesCompleted / exercisesTotal) * 100) : 0;

  let pace = "Getting Started";
  if (exercisesTotal > 0 && exercisesCompleted >= exercisesTotal && weeksCompleted >= list.length) {
    pace = "Completed";
  } else if (overallPercent >= 50) {
    pace = "On Track";
  } else if (exercisesCompleted > 0) {
    pace = "In Progress";
  }

  return {
    weeksCompleted,
    weekCount: Math.max(weekCount, list.length) || weekCount,
    exercisesCompleted,
    exercisesTotal,
    overallPercent,
    pace,
  };
}

export function getCurrentWeekMotivation(completed, total) {
  if (!total || completed <= 0) {
    return "Start this week's exercises and build your learning habit.";
  }
  if (completed >= total) {
    return "Great work! This week is completed.";
  }
  return "Keep going! You are making progress this week.";
}

export function getWeekActionLabel(completed, total, isExpanded) {
  if (isExpanded) return "Hide";
  if (!total || completed <= 0) return "View Week";
  if (completed >= total) return "Review";
  return "Continue";
}
