/**
 * Shared top nav items for AppLayout / PublicNav / MobileDrawer.
 * Guest vs student/teacher rules stay consistent across all pages.
 */
export function buildPublicNavItems(role, options = {}) {
  const { includePaymentInSignup = false, paymentChooseUrl = "" } = options;
  const isStudentOrTeacher = role === "student" || role === "teacher";

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
    { key: "home", label: "Home", href: "/learn" },
    ...(!isStudentOrTeacher
      ? [{ key: "why-join", label: "Why Join Learnify?", href: "/why-join" }]
      : []),
    ...(role === "student"
      ? [
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
          {
            key: "student-results",
            label: "Student Results",
            href: "/teacher/assessment",
          },
          { key: "teacher-tasks", label: "My Tasks", href: "/teacher/tasks" },
          {
            key: "assign-task",
            label: "Assign Task",
            href: "/teacher/assign-task",
          },
        ]
      : []),
    { key: "honor-board", label: "Honor Board", href: "/honor-board" },
    ...(!isStudentOrTeacher
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
