import React from "react";

export default function PublicSection({
  children,
  className = "",
  muted = false,
  id,
}) {
  return (
    <section
      id={id}
      className={`py-16 md:py-24 ${muted ? "bg-green-50/60 border-y border-green-100" : "bg-white"} ${className}`}
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}
