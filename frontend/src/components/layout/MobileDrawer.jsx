import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function DrawerLink({ item, onClose, className = "" }) {
  const baseClass =
    "block w-full rounded-md px-3 py-3 text-left text-base font-medium text-gray-800 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600";
  const mergedClass = `${baseClass} ${className}`.trim();

  if (item.href) {
    return (
      <Link to={item.href} onClick={onClose} className={mergedClass}>
        {item.label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={item.onClick} className={mergedClass}>
      {item.label}
    </button>
  );
}

export default function MobileDrawer({
  id = "primary-mobile-drawer",
  isOpen = false,
  onClose,
  items = [],
  headerTitle = "Menu",
  authContent = null,
}) {
  const [openSections, setOpenSections] = useState({});

  useEffect(() => {
    const next = {};
    items.forEach((item) => {
      if (Array.isArray(item.children) && item.children.length > 0) {
        next[item.key || item.label] = true;
      }
    });
    setOpenSections((prev) => ({ ...next, ...prev }));
  }, [items]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div
      className={`fixed inset-0 z-50 md:hidden ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        onClick={onClose}
        className={`absolute inset-0 bg-black/35 transition-opacity ${isOpen ? "opacity-100" : "opacity-0"}`}
        aria-label="Close menu overlay"
      />

      <aside
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label={headerTitle}
        tabIndex={-1}
        className={`relative h-full w-[86vw] max-w-sm overflow-y-auto bg-white p-4 shadow-xl transition-transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="truncate text-lg font-bold text-gray-900">{headerTitle}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
            aria-label="Close menu"
          >
            Close
          </button>
        </div>

        {authContent ? <div className="mb-4">{authContent}</div> : null}

        <nav className="space-y-1">
          {items.map((item) => (
            <div key={item.key || item.label} className="rounded-lg border border-gray-100 p-1">
              {Array.isArray(item.children) && item.children.length > 0 ? (
                <>
                  <div className="flex items-center gap-1">
                    <DrawerLink item={item} onClose={onClose} className="flex-1 py-2" />
                    <button
                      type="button"
                      onClick={() => toggleSection(item.key || item.label)}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-gray-200 text-sm text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                      aria-label={`Toggle ${item.label} submenu`}
                      aria-expanded={Boolean(openSections[item.key || item.label])}
                      aria-controls={`drawer-section-${item.key || item.label}`}
                    >
                      {openSections[item.key || item.label] ? "−" : "+"}
                    </button>
                  </div>
                  <div
                    id={`drawer-section-${item.key || item.label}`}
                    className={`mt-1 space-y-1 border-t border-gray-100 pt-1 ${
                      openSections[item.key || item.label] ? "block" : "hidden"
                    }`}
                  >
                    {item.children.map((child) => (
                      <DrawerLink
                        key={child.key || child.label}
                        item={child}
                        onClose={onClose}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <DrawerLink item={item} onClose={onClose} />
              )}
            </div>
          ))}
        </nav>
      </aside>
    </div>
  );
}
