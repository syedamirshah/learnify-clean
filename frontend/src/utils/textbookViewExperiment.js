/**
 * Experimental textbook view UI helpers (/learn) — V3 child-friendly.
 * Revert: delete this file and remove imports from LandingPage.jsx.
 */

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

export function getAchievement(stats) {
  const completed = stats?.completed ?? 0;

  if (completed >= 5) {
    return {
      icon: "⭐",
      title: "Quiz Explorer",
      subtitle: `Completed ${completed} exercises`,
    };
  }
  if (completed >= 1) {
    return {
      icon: "🏅",
      title: "First Exercise Completed",
      subtitle: "You started your learning journey!",
    };
  }
  return {
    icon: "🌱",
    title: "Ready to Learn",
    subtitle: "Complete your first exercise to earn a badge!",
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

export const missionReasonLabel = {
  needs_practice: "Let's boost your score on this one!",
  not_attempted: "A new exercise is waiting for you!",
  continue: "Continue where you left off.",
};

export function getFirstName(fullName) {
  const display = (fullName || "").trim();
  if (!display) return "Learner";
  return display.split(/\s+/)[0];
}
