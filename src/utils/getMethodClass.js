// src/utils/getMethodClass.js

/**
 * Returns a Tailwind class string for text color based on the HTTP method.
 * @param {string} method - The HTTP method.
 * @returns {string} Tailwind CSS classes for text color.
 */
export const getMethodTextClass = (method) => {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'text-green-700';
    case 'POST':
      return 'text-sky-700';
    case 'PUT':
      return 'text-fuchsia-700';
    case 'PATCH':
      return 'text-purple-700';
    case 'DELETE':
      return 'text-red-700';
    case 'OPTIONS':
      return 'text-rose-700';
    case 'HEAD':
      return 'text-pink-700';
    default:
      return 'text-gray-700';
  }
};

/**
 * Returns a Tailwind class string for both text and border color based on the HTTP method.
 * @param {string} method - The HTTP method.
 * @returns {string} Tailwind CSS classes for text and border colors.
 */
export const getMethodTagClass = (method) => {
  switch (method.toUpperCase()) {
    case 'GET':
      return 'text-green-700 border border-green-700';
    case 'POST':
      return 'text-sky-700 border border-sky-700';
    case 'PUT':
      return 'text-fuchsia-700 border border-fuchsia-700';
    case 'PATCH':
      return 'text-purple-700 border border-purple-700';
    case 'DELETE':
      return 'text-red-700 border border-red-700';
    case 'OPTIONS':
      return 'text-rose-700 border border-rose-700';
    case 'HEAD':
      return 'text-pink-700 border border-pink-700';
    default:
      return 'text-gray-700 border border-gray-700';
  }
};
