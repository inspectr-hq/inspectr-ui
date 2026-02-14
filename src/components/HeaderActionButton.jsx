import React from 'react';

export default function HeaderActionButton({
  children,
  onClick,
  disabled = false,
  className = ''
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`px-2 py-1 text-cyan-500 hover:text-white border border-cyan-500 hover:bg-cyan-500 rounded text-xs ${className}`}
    >
      {children}
    </button>
  );
}
