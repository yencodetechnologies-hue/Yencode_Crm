import React from 'react';

export default function Label({ children, className = '', required = false, ...props }) {
  return (
    <label
      className={`block text-sm font-medium text-slate-700 mb-1.5 ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}
