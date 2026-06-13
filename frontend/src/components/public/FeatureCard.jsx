import React from "react";

const ACCENT_STYLES = {
  green: {
    icon: "bg-green-50 text-[#42b72a]",
    border: "border-green-100 hover:border-green-200",
  },
  gold: {
    icon: "bg-amber-50 text-amber-600",
    border: "border-amber-100 hover:border-amber-200",
  },
  blue: {
    icon: "bg-blue-50 text-blue-600",
    border: "border-blue-100 hover:border-blue-200",
  },
};

export default function FeatureCard({
  title,
  description,
  icon,
  accent = "green",
  children,
  className = "",
}) {
  const styles = ACCENT_STYLES[accent] || ACCENT_STYLES.green;

  return (
    <article
      className={`flex h-full flex-col rounded-2xl border bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${styles.border} ${className}`}
    >
      {icon ? (
        <div
          className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold ${styles.icon}`}
          aria-hidden="true"
        >
          {icon}
        </div>
      ) : null}
      {title ? <h3 className="text-xl font-black text-gray-900">{title}</h3> : null}
      {description ? (
        <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600 sm:text-base">
          {description}
        </p>
      ) : null}
      {children}
    </article>
  );
}
