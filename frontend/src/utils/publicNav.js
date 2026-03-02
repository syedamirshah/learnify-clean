export function buildPublicNavItems(role) {
  return [
    { key: "home", label: "Home", href: "/" },
    { key: "why-join", label: "Why Join Learnify?", href: "/why-join" },
    ...(role === "student"
      ? [
          {
            key: "assessment",
            label: "Assessment",
            href: "/student/assessment",
            children: [
              { key: "subject-wise", label: "Subject-wise Performance", href: "/student/assessment" },
              { key: "quiz-history", label: "Quiz History", href: "/student/quiz-history" },
              { key: "tasks", label: "Tasks", href: "/student/tasks" },
            ],
          },
        ]
      : []),
    ...(role === "teacher"
      ? [
          {
            key: "assessment",
            label: "Assessment",
            href: "/teacher/assessment",
            children: [
              { key: "student-results", label: "Student Results", href: "/teacher/assessment" },
              { key: "teacher-tasks", label: "My Tasks", href: "/teacher/tasks" },
              { key: "assign-task", label: "Assign Task", href: "/teacher/assign-task" },
            ],
          },
        ]
      : []),
    { key: "honor-board", label: "Honor Board", href: "/honor-board" },
    { key: "membership", label: "Membership", href: "/membership" },
    { key: "help-center", label: "Help Center", href: "/help-center" },
    ...(!role
      ? [
          {
            key: "sign-up",
            label: "Sign up",
            href: "/signup",
            children: [{ key: "create-account", label: "Create Account", href: "/signup" }],
          },
        ]
      : []),
  ];
}
