import React from "react";
import { Link } from "react-router-dom";

function DesktopNavItem({ item }) {
  const baseClass =
    "inline-flex items-center rounded-md px-2 py-2 text-[17px] font-medium text-white transition hover:bg-white/15 lg:px-3 lg:text-lg";

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
    <nav className={`hidden w-full border-t border-white/10 bg-[#42b72a] md:flex md:h-[52px] md:items-center ${className}`}>
      <div className="mx-auto flex h-full w-full flex-1 min-w-0 flex-wrap items-center justify-center gap-x-6 gap-y-1 px-4 md:flex-nowrap md:justify-evenly md:gap-x-0 lg:px-6">
        {items.map((item) => (
          <div key={item.key || item.label} className="relative">
            <DesktopNavItem item={item} />
          </div>
        ))}
      </div>
    </nav>
  );
}
