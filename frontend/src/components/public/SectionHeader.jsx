import React from "react";

export default function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
  className = "",
}) {
  const alignClass =
    align === "left" ? "text-left mx-0" : "text-center mx-auto max-w-4xl";

  return (
    <div className={`${alignClass} ${className}`}>
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#42b72a]">
          {eyebrow}
        </p>
      ) : null}
      {title ? (
        <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
          {title}
        </h2>
      ) : null}
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}
