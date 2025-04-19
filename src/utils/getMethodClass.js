// src/utils/getMethodClass.js

/**
 * Returns a Tailwind class string for text color based on the HTTP method.
 * @param {string} method - The HTTP method.
 * @returns {string} Tailwind CSS classes for text color.
 */
export const getMethodTextClass = (method) => {
  if(!method) return ''; // TO REVIEW

  switch (method.toUpperCase()) {
    case 'GET':
      return 'text-[rgb(0,107,230)]';//'text-green-700'; //text-[rgb(0,107,230)];
    case 'POST':
      return 'text-[rgb(23,131,135)]';//'text-sky-700'; // text-[rgb(23,131,135)];
    // case 'PUT':
    //   return 'text-fuchsia-700';
    case 'PATCH':
      return  'text-[rgb(204,75,0)]';//'text-purple-700'; // text-[rgb(204,75,0)];
    case 'DELETE':
      return 'text-red-700';
    // case 'OPTIONS':
    //   return 'text-rose-700';
    // case 'HEAD':
    //   return 'text-pink-700';
    default:
      return '';
  }
};

/**
 * Returns a Tailwind class string for both text and border color based on the HTTP method.
 * @param {string} method - The HTTP method.
 * @returns {string} Tailwind CSS classes for text and border colors.
 */
export const getMethodTagClass = (method) => {
  if(!method) return 'text-gray-700 dark:text-gray-200 border border-gray-700 dark:border-gray-200';

  switch (method.toUpperCase()) {
    case 'GET':
      return 'text-green-700 dark:text-green-300 border border-green-700 dark:border-green-300';
    case 'POST':
      return 'text-sky-700 dark:text-white border border-sky-700 dark:border-sky-300';
    case 'PUT':
      return 'text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-700 dark:border-fuchsia-300';
    case 'PATCH':
      return 'text-purple-700 dark:text-purple-300 border border-purple-700 dark:border-purple-300';
    case 'DELETE':
      return 'text-red-700 dark:text-red-300 border border-red-700 dark:border-red-300';
    case 'OPTIONS':
      return 'text-rose-700 dark:text-rose-300 border border-rose-700 dark:border-rose-300';
    case 'HEAD':
      return 'text-pink-700 dark:text-pink-300 border border-pink-700 dark:border-pink-300';
    default:
      return 'text-gray-700 dark:text-gray-200 border border-gray-700 dark:border-gray-200';
  }
};
