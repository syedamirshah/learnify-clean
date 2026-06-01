import React from "react";
import { Link } from "react-router-dom";

const PATHS = [
  { key: "textbook", label: "Textbook View", href: "/learn" },
  { key: "topic-index", label: "Topic Index", href: "/topic-index" },
  { key: "weekly-plan", label: "Weekly Plan", href: "/weekly-plan" },
];

const btnBase =
  "w-full sm:w-auto sm:min-w-[220px] inline-flex items-center justify-center rounded-full border-2 px-7 py-2.5 text-base font-bold text-green-900 shadow-sm transition hover:shadow-md";

const btnActive = `${btnBase} border-green-500 bg-green-200 hover:bg-green-200`;
const btnIdle = `${btnBase} border-green-300 bg-green-100 hover:bg-green-200`;

/**
 * Shared Learning Paths switcher for textbook, topic index, and weekly plan views.
 * @param {"textbook"|"topic-index"|"weekly-plan"} activePath
 */
export default function LearningPathSelector({ activePath = "textbook", className = "" }) {
  return (
    <section className={`mt-6 px-3 md:px-4 max-w-[1400px] mx-auto ${className}`.trim()}>
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-center gap-4 sm:gap-6">
          <div className="h-[2px] w-14 sm:w-20 bg-green-300 rounded-full" />
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-green-700">
            Learning Paths
          </p>
          <div className="h-[2px] w-14 sm:w-20 bg-green-300 rounded-full" />
        </div>

        <div className="mt-2 text-center">
          <h2 className="text-lg sm:text-xl font-bold text-green-900">Choose Your Learning Path</h2>
        </div>

        <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          {PATHS.map((path) => {
            const isActive = activePath === path.key;
            return (
              <Link
                key={path.key}
                to={path.href}
                aria-current={isActive ? "page" : undefined}
                className={isActive ? btnActive : btnIdle}
              >
                {path.label}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
