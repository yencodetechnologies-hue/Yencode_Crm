import React from 'react';

export default function Spinner({ className = '', size = 'md' }) {
  const sizeClass = { sm: 'w-6 h-6', md: 'w-10 h-10', lg: 'w-12 h-12' }[size] || 'w-10 h-10';

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeClass} border-4 border-primary border-t-transparent rounded-full animate-spin`}
      />
    </div>
  );
}
