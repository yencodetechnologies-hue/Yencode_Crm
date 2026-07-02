import React from 'react';

export default function PageShell({ title, description, actions, children, className = '' }) {
  return (
    <div className={`max-w-7xl mx-auto px-6 pt-8 pb-10 ${className}`}>
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            {title && (
              <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
            )}
            {description && (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
