import React, { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function UserMenu({ userFullName = "" }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonId = useId();
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e) => {
      const root = rootRef.current;
      if (!root) return;
      if (!root.contains(e.target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!userFullName) return null;

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        id={buttonId}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex max-w-full items-center gap-1 truncate rounded-md px-2 py-1 text-sm font-semibold text-gray-700 hover:bg-green-50 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
      >
        <span className="truncate">Welcome, {userFullName}</span>
        <span className="shrink-0 text-xs text-gray-500">▾</span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-labelledby={buttonId}
          className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-green-100 bg-white shadow-md"
        >
          <Link
            to="/my-profile"
            role="menuitem"
            className="block px-4 py-2 text-sm font-medium text-gray-900 hover:bg-green-50 focus:bg-green-50 focus:outline-none"
            onClick={() => setOpen(false)}
          >
            My Profile
          </Link>
        </div>
      ) : null}
    </div>
  );
}

