export function formatSchoolScore(value) {
  if (value === null || value === undefined) return "—";
  return `${value}%`;
}

export function getOnboardingSteps({ onboarding = {}, counts = {}, school = {} } = {}) {
  const schoolActivated =
    school.account_status === "active" || Boolean(onboarding.subscription_active);

  return [
    { key: "activated", label: "School Activated", done: schoolActivated },
    {
      key: "subscription",
      label: "Subscription Active",
      done: Boolean(onboarding.subscription_active),
    },
    {
      key: "roster",
      label: "Roster Uploaded",
      done: Boolean(onboarding.roster_uploaded),
    },
    {
      key: "teachers",
      label: "Teachers Added",
      done: (counts.teachers ?? 0) >= 1,
    },
  ];
}

export function getOnboardingPercent(steps) {
  if (!Array.isArray(steps) || steps.length === 0) return 0;
  const completed = steps.filter((step) => step.done).length;
  return Math.round((completed / steps.length) * 100);
}

export function shouldShowOnboardingProgress(onboarding) {
  return !onboarding?.ready;
}

export function extractTopStudent(topStudents) {
  if (!Array.isArray(topStudents) || topStudents.length === 0) {
    return {
      student: null,
      displayName: "No ranked students yet",
      scoreLabel: "—",
    };
  }

  const student = topStudents[0];
  return {
    student,
    displayName: student.full_name || student.username || "—",
    scoreLabel: formatSchoolScore(student.average_score),
  };
}

export function getAttentionSummary(attentionList) {
  const list = Array.isArray(attentionList) ? attentionList : [];

  if (list.length === 0) {
    return {
      count: 0,
      displayValue: "0",
      hint: "No students need attention",
    };
  }

  const lead = list[0];
  return {
    count: list.length,
    displayValue: String(list.length),
    hint: lead?.full_name ? `Lowest: ${lead.full_name}` : undefined,
  };
}

export function getActiveTasksSummary(taskMonitoring) {
  const count = taskMonitoring?.summary?.active_tasks ?? 0;

  return {
    count,
    displayValue: String(count),
    hint: count === 0 ? "No active tasks" : "School-wide teacher tasks",
  };
}
