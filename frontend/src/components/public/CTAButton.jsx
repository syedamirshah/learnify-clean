import React from "react";
import { Link } from "react-router-dom";

const VARIANTS = {
  primary:
    "bg-[#42b72a] text-white hover:bg-green-700 shadow-sm focus-visible:ring-green-600",
  secondary:
    "border border-green-200 bg-white text-gray-900 hover:border-green-300 hover:bg-green-50 shadow-sm focus-visible:ring-green-600",
};

export default function CTAButton({
  variant = "primary",
  to,
  href,
  onClick,
  download,
  type = "button",
  className = "",
  children,
}) {
  const classes = `inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 ${VARIANTS[variant]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} download={download} className={classes}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
