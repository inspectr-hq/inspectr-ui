// src/components/RequestDetailsPanel.jsx
import React from 'react';
import RequestDetail from './RequestDetail';
import RequestContent from './RequestContent';
import ResponseContent from './ResponseContent';

const RequestDetailsPanel = ({ request, currentTab, setCurrentTab }) => {
    if (!request) {
        return <div className="text-gray-500">No request selected.</div>;
    }

    return (
        <div>
            <RequestDetail request={request} />

            {/* Tabs for Request and Response */}
            <div className="flex space-x-2">
                <button
                    className={`px-4 py-2 rounded-t ${
                        currentTab === 'request'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700'
                    }`}
                    onClick={() => setCurrentTab('request')}
                >
                    Request
                </button>
                <button
                    className={`px-4 py-2 rounded-t ${
                        currentTab === 'response'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700'
                    }`}
                    onClick={() => setCurrentTab('response')}
                >
                    Response
                </button>
            </div>

            {/* Tab Content */}
            <div className="p-4 bg-white rounded-b shadow">
                {currentTab === 'request' ? (
                    <RequestContent request={request} />
                ) : (
                    <ResponseContent request={request} />
                )}
            </div>
        </div>
    );
};

export default RequestDetailsPanel;
