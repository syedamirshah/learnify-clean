import React, { useState } from "react";
import { Link } from "react-router-dom";

function DesktopChildItem({ child, onSelect }) {
  const itemClass =
    "block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-gray-800 hover:bg-gray-100";

  if (child.href) {
    return (
      <Link to={child.href} onClick={onSelect} className={itemClass}>
        {child.label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={child.onClick} className={itemClass}>
      {child.label}
    </button>
  );
}

function DesktopNavItem({ item, isOpen, onToggle, onClose }) {
  const baseClass =
    "inline-flex items-center rounded-md px-2 py-2 text-[17px] font-medium text-white transition hover:bg-white/15 lg:px-3 lg:text-lg";

  if (Array.isArray(item.children) && item.children.length > 0) {
    return (
      <div className="relative">
        <button type="button" onClick={onToggle} className={baseClass}>
          {item.label}
        </button>

        {isOpen ? (
          <div className="absolute left-0 top-full z-50 mt-1 w-60 rounded-md border bg-white p-2 shadow-lg">
            {item.children.map((child) => (
              <DesktopChildItem
                key={child.key || child.label}
                child={child}
                onSelect={onClose}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

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
  const [openMenuKey, setOpenMenuKey] = useState(null);

  const handleToggle = (key) => {
    setOpenMenuKey((prev) => (prev === key ? null : key));
  };

  return (
    <nav className={`hidden w-full border-t border-white/10 bg-[#42b72a] md:flex md:h-[52px] md:items-center ${className}`}>
      <div className="mx-auto flex h-full w-full flex-1 min-w-0 flex-wrap items-center justify-center gap-x-6 gap-y-1 px-4 md:flex-nowrap md:justify-evenly md:gap-x-0 lg:px-6">
        {items.map((item) => (
          <div key={item.key || item.label} className="relative">
            <DesktopNavItem
              item={item}
              isOpen={openMenuKey === (item.key || item.label)}
              onToggle={() => handleToggle(item.key || item.label)}
              onClose={() => setOpenMenuKey(null)}
            />
          </div>
        ))}
      </div>
    </nav>
  );
}
