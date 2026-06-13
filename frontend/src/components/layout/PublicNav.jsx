import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import NavItemLabel from "./NavItemLabel";

const NAV_ITEM_BASE =
  "inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60";

const NAV_ITEM_IDLE = "hover:bg-white/15";
const NAV_ITEM_ACTIVE = "bg-white/20 font-bold shadow-sm ring-1 ring-white/25";

function isNavItemActive(href, pathname) {
  if (!href || !pathname) return false;
  if (pathname === href) return true;
  if (href !== "/" && pathname.startsWith(`${href}/`)) return true;
  return false;
}

function DesktopChildItem({ child, onSelect }) {
  const itemClass =
    "block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 transition hover:bg-green-50 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600";

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

function DesktopNavItem({ item, isOpen, isActive, onToggle, onClose }) {
  const itemClass = `${NAV_ITEM_BASE} ${isActive ? NAV_ITEM_ACTIVE : NAV_ITEM_IDLE}`;

  if (Array.isArray(item.children) && item.children.length > 0) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={onToggle}
          className={`${itemClass} ${isOpen ? NAV_ITEM_ACTIVE : ""}`}
          aria-expanded={isOpen}
          aria-controls={`desktop-menu-${item.key || item.label}`}
          aria-current={isActive ? "page" : undefined}
        >
          <NavItemLabel label={item.label} badgeCount={item.badgeCount} />
        </button>

        {isOpen ? (
          <div
            id={`desktop-menu-${item.key || item.label}`}
            className="absolute left-0 top-full z-50 mt-1.5 w-60 rounded-xl border border-green-100 bg-white p-2 shadow-md"
          >
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
      <Link
        to={item.href}
        className={itemClass}
        aria-current={isActive ? "page" : undefined}
      >
        <NavItemLabel label={item.label} badgeCount={item.badgeCount} />
      </Link>
    );
  }

  return (
    <button type="button" onClick={item.onClick} className={itemClass}>
      <NavItemLabel label={item.label} badgeCount={item.badgeCount} />
    </button>
  );
}

export default function PublicNav({ items = [], className = "" }) {
  const [openMenuKey, setOpenMenuKey] = useState(null);
  const navRef = useRef(null);
  const location = useLocation();

  const handleToggle = (key) => {
    setOpenMenuKey((prev) => (prev === key ? null : key));
  };

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!openMenuKey) return;
      if (navRef.current && navRef.current.contains(event.target)) return;
      setOpenMenuKey(null);
    };

    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setOpenMenuKey(null);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenuKey]);

  return (
    <nav
      ref={navRef}
      className={`hidden w-full border-t border-white/15 bg-[#42b72a] md:flex md:h-12 md:items-center ${className}`}
    >
      <div className="mx-auto flex h-full w-full min-w-0 flex-1 flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 md:flex-nowrap md:justify-evenly md:gap-x-0 lg:px-6">
        {items.map((item) => {
          const itemKey = item.key || item.label;
          const active =
            isNavItemActive(item.href, location.pathname) ||
            (Array.isArray(item.children) &&
              item.children.some((child) => isNavItemActive(child.href, location.pathname)));

          return (
            <div key={itemKey} className="relative">
              <DesktopNavItem
                item={item}
                isActive={active}
                isOpen={openMenuKey === itemKey}
                onToggle={() => handleToggle(itemKey)}
                onClose={() => setOpenMenuKey(null)}
              />
            </div>
          );
        })}
      </div>
    </nav>
  );
}
