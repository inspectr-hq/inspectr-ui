// src/components/BadgeIndicator.jsx
import React from 'react';

/**
 * @param {'success'|'error'|'neutral'|'auto'} variant
 *   'auto' will infer from children text; other values override.
 * @param {boolean} filled
 *   if true, use a solid background instead of just border/text
 * @param {string} backgroundClass
 *   extra Tailwind bg-* classes to apply
 * @param {*} children
 *   usually a string like "OK", "NOK", "Running", etc.
 */
export default function BadgeIndicator({
  variant = 'auto',
  filled = false,
  backgroundClass = '',
  children
}) {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border';

  const borderText = {
    success: 'border-green-500 text-green-500',
    error: 'border-red-500   text-red-500',
    neutral: 'border-gray-300  text-gray-800 dark:border-gray-600 dark:text-gray-200'
  };

  const solid = {
    success: 'bg-green-500  text-white border-green-500',
    error: 'bg-red-500    text-white border-red-500',
    neutral: 'bg-gray-300  text-gray-800 border-gray-300 dark:bg-gray-600 dark:text-gray-200'
  };

  // Words that imply success or error
  const successWords = ['ok', 'active', 'running', 'on', 'yes'];
  const errorWords = ['nok', 'inactive', 'stopped', 'off', 'no'];

  // Get the content string in lowercase
  const content = String(children).trim().toLowerCase();

  // Determine effective variant
  let effective;
  if (variant === 'auto') {
    if (successWords.includes(content.toLowerCase())) {
      effective = 'success';
    } else if (errorWords.includes(content.toLowerCase())) {
      effective = 'error';
    } else {
      effective = 'neutral';
    }
  } else {
    effective = variant; // honor explicit override
  }

  const variantClasses = filled ? solid[effective] : borderText[effective];

  return <span className={`${base} ${variantClasses} ${backgroundClass}`}>{children}</span>;
}
