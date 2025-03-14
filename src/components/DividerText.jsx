import React from 'react';

const DividerText = ({ text, align = 'center' }) => {
  if (align === 'left') {
    return (
      <div className="flex items-center my-1">
        <span className="px-3 text-xs text-slate-600">{text}</span>
        <div className="flex-grow border-t border-gray-300" />
      </div>
    );
  } else if (align === 'right') {
    return (
      <div className="flex items-center my-1">
        <div className="flex-grow border-t border-gray-300" />
        <span className="px-3 text-xs text-slate-600">{text}</span>
      </div>
    );
  }

  // default: center alignment
  return (
    <div className="flex items-center my-1">
      <div className="flex-grow border-t border-gray-300" />
      <span className="px-3 text-xs text-slate-600">{text}</span>
      <div className="flex-grow border-t border-gray-300" />
    </div>
  );
};

export default DividerText;
