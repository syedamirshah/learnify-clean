import { getDefaultRouteForRole } from "./roleRoutes";

/**
 * Shared top nav items for AppLayout / PublicNav / MobileDrawer.
 * Guest vs student/teacher rules stay consistent across all pages.
 */
export function buildPublicNavItems(role, options = {}) {
  const { includePaymentInSignup = false, paymentChooseUrl = "" } = options;

  if (role === "school_admin") {
    return [
      { key: "home", label: "Home", href: "/school/dashboard" },
      { key: "quizzes", label: "Quizzes", href: "/learn" },
      { key: "analytics", label: "Analytics", href: "/school/analytics" },
      { key: "teachers", label: "Teachers", href: "/school/teachers" },
      { key: "task-monitoring", label: "Task Monitoring", href: "/school/tasks" },
      { key: "upload-roster", label: "Upload Roster", href: "/school/upload" },
      { key: "settings", label: "Settings", href: "/school/settings" },
      { key: "help-center", label: "Help Center", href: "/help-center" },
    ];
  }

  const isStudentOrTeacher = role === "student" || role === "teacher";
  const isSchoolAdmin = role === "school_admin";

  const signUpChildren = [
    { key: "create-account", label: "Create Account", href: "/signup" },
  ];
  if (includePaymentInSignup && paymentChooseUrl) {
    signUpChildren.push({
      key: "make-payment",
      label: "Make Payment",
      onClick: () => {
        window.location.href = paymentChooseUrl;
      },
    });
  }

  return [
    {
      key: "home",
      label: "Home",
      href: getDefaultRouteForRole(role),
    },
    ...(!isStudentOrTeacher && !isSchoolAdmin
      ? [{ key: "why-join", label: "Why Join Learnify?", href: "/why-join" }]
      : []),
    ...(role === "student"
      ? [
          {
            key: "learning-diagnosis",
            label: "Learning Diagnosis",
            href: "/student/learning-diagnosis",
          },
          {
            key: "subject-performance",
            label: "Subject Performance",
            href: "/student/assessment",
          },
          {
            key: "quiz-history",
            label: "Quiz History",
            href: "/student/quiz-history",
          },
          { key: "tasks", label: "Tasks", href: "/student/tasks" },
        ]
      : []),
    ...(role === "teacher"
      ? [
          { key: "quizzes", label: "Quizzes", href: "/learn" },
          { key: "teacher-tasks", label: "My Tasks", href: "/teacher/tasks" },
          {
            key: "assign-task",
            label: "Assign Task",
            href: "/teacher/assign-task",
          },
        ]
      : []),
    { key: "honor-board", label: "Honor Board", href: "/honor-board" },
    ...(!isStudentOrTeacher && !isSchoolAdmin
      ? [{ key: "membership", label: "Membership", href: "/membership" }]
      : []),
    { key: "help-center", label: "Help Center", href: "/help-center" },
    ...(!role
      ? [
          {
            key: "sign-up",
            label: "Sign up",
            href: "/signup",
            children: signUpChildren,
          },
        ]
      : []),
  ];
}
