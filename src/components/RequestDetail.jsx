// src/components/RequestDetail.jsx
import React from 'react';
import {getStatusClass} from "../utils/getStatusClass.js";

const RequestDetail = ({ request }) => {

    const formatTimestamp = (isoString) => {
        if (!isoString) return "N/A"; // Handle missing timestamp
        const date = new Date(isoString);

        const formattedDate = date.toLocaleDateString("en-CA", { // YYYY-MM-DD format
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });

        const formattedTime = date.toLocaleTimeString([], { // HH:MM:SS in local time
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false, // 24-hour format
        });

        return `${formattedDate} at ${formattedTime}`;
    };

    return (
        <div className="mb-4 p-4 bg-white rounded shadow">
            <h2 className="font-bold text-lg mb-2">Request Details</h2>
            <div className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2 font-mono text-lg">
                    <span className="font-bold">{request.request.method}</span>
                    <span className="text-blue-600">{request.endpoint}</span>
                    <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusClass(
                            request.response.status
                        )}`}
                    >
            {request.response.status}
          </span>
                </div>
                <div className="text-gray-600">{request.url}</div>
                <div className="text-gray-500 text-xs">
                    Received on {formatTimestamp(request.timestamp)} • Took {request.latency}ms to respond
                </div>
            </div>
        </div>
    );
};

export default RequestDetail;
