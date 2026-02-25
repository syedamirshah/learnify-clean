import React from "react";
import { Link } from "react-router-dom";

function DrawerLink({ item, onClose }) {
  const baseClass =
    "block w-full rounded-md px-3 py-2 text-left text-base font-medium text-gray-800 hover:bg-gray-100";

  if (item.href) {
    return (
      <Link to={item.href} onClick={onClose} className={baseClass}>
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

export default function MobileDrawer({
  isOpen = false,
  onClose,
  items = [],
  headerTitle = "Menu",
  authContent = null,
}) {
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
        className={`relative h-full w-[86vw] max-w-sm overflow-y-auto bg-white p-4 shadow-xl transition-transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="truncate text-lg font-bold text-gray-900">{headerTitle}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-200 px-3 py-1 text-sm font-semibold text-gray-700"
            aria-label="Close menu"
          >
            Close
          </button>
        </div>

        {authContent ? <div className="mb-4">{authContent}</div> : null}

        <nav className="space-y-1">
          {items.map((item) => (
            <div key={item.key || item.label} className="rounded-lg border border-gray-100 p-1">
              <DrawerLink item={item} onClose={onClose} />
              {Array.isArray(item.children) && item.children.length > 0 ? (
                <div className="mt-1 space-y-1 border-t border-gray-100 pt-1">
                  {item.children.map((child) => (
                    <DrawerLink
                      key={child.key || child.label}
                      item={child}
                      onClose={onClose}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </nav>
      </aside>
    </div>
  );
}
