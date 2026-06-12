import React from "react";
import {
  getOnboardingPercent,
  getOnboardingSteps,
  shouldShowOnboardingProgress,
} from "../../utils/schoolDashboardHelpers";

function ChecklistItem({ done, label }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <span
        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
          done ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-500"
        }`}
      >
        {done ? "✓" : "·"}
      </span>
      <span className={done ? "font-semibold text-emerald-950" : "text-gray-600"}>{label}</span>
    </li>
  );
}

export default function SchoolOnboardingProgress({ onboarding, counts, school }) {
  if (!shouldShowOnboardingProgress(onboarding)) return null;

  const steps = getOnboardingSteps({ onboarding, counts, school });
  const percent = getOnboardingPercent(steps);

  return (
    <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-emerald-950">Onboarding Progress</h2>
          <p className="mt-1 text-sm text-gray-600">
            Complete these steps to get your school ready for learning.
          </p>
        </div>
        <p className="text-2xl font-black text-emerald-700">{percent}%</p>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-emerald-100">
        <div
          className="h-full rounded-full bg-emerald-600 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {steps.map((step) => (
          <ChecklistItem key={step.key} done={step.done} label={step.label} />
        ))}
      </ul>
    </section>
  );
}
