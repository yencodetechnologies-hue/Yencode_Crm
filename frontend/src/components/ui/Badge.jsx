import React from 'react';

const statusStyles = {
  Approved: 'bg-green-100 text-green-800 border-green-200',
  Pending: 'bg-amber-100 text-amber-800 border-amber-200',
  Rejected: 'bg-red-100 text-red-800 border-red-200',
  Present: 'bg-green-100 text-green-800 border-green-200',
  Absent: 'bg-red-100 text-red-800 border-red-200',
  Completed: 'bg-green-100 text-green-800 border-green-200',
  'In Progress': 'bg-blue-100 text-blue-800 border-blue-200',
  default: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function Badge({ children, status, className = '' }) {
  const style = statusStyles[status] || statusStyles.default;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style} ${className}`}
    >
      {children || status}
    </span>
  );
}
