import React from 'react';

export default function Card({ children, className = '', hover = false, onClick }) {
  const base = 'bg-white rounded-xl border border-slate-200 shadow-card';
  const hoverClass = hover ? ' hover:shadow-md hover:border-slate-300 transition-shadow cursor-pointer' : '';

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base}${hoverClass} text-left w-full ${className}`}
      >
        {children}
      </button>
    );
  }

  return <div className={`${base}${hoverClass} ${className}`}>{children}</div>;
}
