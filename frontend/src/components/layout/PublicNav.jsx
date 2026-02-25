import React from "react";
import { Link } from "react-router-dom";

function DesktopNavItem({ item }) {
  const baseClass =
    "inline-flex items-center rounded-md px-2 py-2 text-base font-semibold text-white transition hover:bg-white/15 lg:px-3 lg:text-lg";

  if (item.href) {
    return (
      <Link to={item.href} className={baseClass}>
        {item.label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={item.onClick} className={baseClass}>
      {item.label}
    </button>
  );
}

export default function PublicNav({ items = [], className = "" }) {
  return (
    <nav className={`hidden w-full border-t border-white/10 bg-[#42b72a] md:block ${className}`}>
      <div className="mx-auto flex w-full max-w-[1400px] min-w-0 flex-wrap items-center justify-center gap-x-6 gap-y-1 px-4 py-2 md:gap-x-8 lg:max-w-[1600px] lg:gap-x-10 lg:px-6">
        {items.map((item) => (
          <div key={item.key || item.label} className="relative">
            <DesktopNavItem item={item} />
          </div>
        ))}
      </div>
    </nav>
  );
}
