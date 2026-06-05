import React from "react";

export default function NavItemLabel({ label, badgeCount = 0 }) {
  const showBadge = Number(badgeCount) > 0;
  const display = badgeCount > 9 ? "9+" : String(badgeCount);

  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{label}</span>
      {showBadge ? (
        <span
          aria-label={`${display} pending tasks`}
          className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white"
        >
          {display}
        </span>
      ) : null}
    </span>
  );
}
