/**
 * Experimental textbook view UI helpers (/learn).
 * Revert: delete this file and remove imports from LandingPage.jsx.
 */

export function getExerciseStatus(percentage) {
  if (percentage === null || percentage === undefined || Number.isNaN(Number(percentage))) {
    return {
      label: "Not Attempted",
      key: "none",
      badgeClass:
        "bg-gray-100 text-gray-700 ring-gray-200",
      cardAccent: "border-gray-200 bg-white hover:border-emerald-200",
    };
  }

  const pct = Number(percentage);
  if (pct >= 90) {
    return {
      label: "Mastered",
      key: "mastered",
      badgeClass: "bg-emerald-100 text-emerald-900 ring-emerald-200",
      cardAccent: "border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white hover:border-emerald-300",
    };
  }
  if (pct >= 70) {
    return {
      label: "Good",
      key: "good",
      badgeClass: "bg-sky-100 text-sky-900 ring-sky-200",
      cardAccent: "border-sky-200 bg-gradient-to-br from-sky-50/80 to-white hover:border-sky-300",
    };
  }
  if (pct >= 50) {
    return {
      label: "Improving",
      key: "improving",
      badgeClass: "bg-amber-100 text-amber-900 ring-amber-200",
      cardAccent: "border-amber-200 bg-gradient-to-br from-amber-50/60 to-white hover:border-amber-300",
    };
  }
  return {
    label: "Needs Practice",
    key: "needs",
    badgeClass: "bg-red-100 text-red-800 ring-red-200",
    cardAccent: "border-red-200 bg-gradient-to-br from-red-50/60 to-white hover:border-red-300",
  };
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
      ? Math.round(
          percentages.reduce((sum, n) => sum + n, 0) / percentages.length
        )
      : null;

  const progressPercent = Math.round((attempted / total) * 100);
  const status =
    average !== null ? getExerciseStatus(average).label : null;

  return { total, attempted, average, progressPercent, status };
}

export function formatChapterSummaryLine(chapterName, progress) {
  const title = chapterName || "Chapter";
  const parts = [`${progress.total} exercises`];

  if (progress.attempted > 0) {
    parts.push(`${progress.attempted} attempted`);
  }
  if (progress.average !== null) {
    parts.push(`Avg ${progress.average}%`);
  }
  if (progress.status) {
    parts.push(progress.status);
  }

  return { title, meta: parts.join(" • ") };
}

export function findContinueLearningQuiz(sortedQuizzes, historyMap) {
  const list = Array.isArray(sortedQuizzes) ? sortedQuizzes : [];
  if (!list.length) return null;

  for (const quiz of list) {
    const row = historyMap?.[String(quiz.id)];
    if (row && Number(row.percentage) < 50) {
      return { quiz, reason: "needs_practice" };
    }
  }

  for (const quiz of list) {
    if (!historyMap?.[String(quiz.id)]) {
      return { quiz, reason: "not_attempted" };
    }
  }

  for (let i = list.length - 1; i >= 0; i -= 1) {
    const quiz = list[i];
    if (historyMap?.[String(quiz.id)]) {
      return { quiz, reason: "continue" };
    }
  }

  return null;
}

export const continueReasonLabel = {
  needs_practice: "Needs more practice",
  not_attempted: "Up next",
  continue: "Pick up where you left off",
};
