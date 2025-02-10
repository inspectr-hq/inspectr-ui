// src/utils/getStatusClass.js

export const getStatusClass = (status) => {
    if (status >= 200 && status < 300) return 'bg-green-200 text-green-800';
    if (status >= 300 && status < 400) return 'bg-blue-200 text-blue-800';
    if (status >= 400 && status < 500) return 'bg-orange-600 text-orange-200';
    if (status >= 500) return 'bg-red-800 text-red-100';
    return 'bg-gray-200 text-gray-800';
}
