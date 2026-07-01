import React from 'react';

export default function Input({ className = '', ...props }) {
  return (
    <input
      className={`
        w-full px-3 py-2 text-sm text-slate-900 bg-white
        border border-slate-300 rounded-lg
        focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
        disabled:bg-slate-100 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    />
  );
}
