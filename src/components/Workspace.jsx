// src/components/Workspace.jsx

import React, { useState, useEffect } from 'react';
import DashBoardApp from './DashBoardApp.jsx';
import InspectrApp from './InspectrApp.jsx';
import SettingsApp from './SettingsApp.jsx';
import useHashRouter from '../hooks/useHashRouter.jsx';
import ToastNotification from './ToastNotification.jsx';
import DialogMockLaunch from './DialogMockLaunch.jsx';
import DialogExportOperations from './DialogExportOperations.jsx';
import DialogExportRecords from './DialogExportRecords.jsx';
import DialogImportOperations from './DialogImportOperations.jsx';
import { InspectrProvider, useInspectr } from '../context/InspectrContext';
import { useLiveQuery } from 'dexie-react-hooks';
import eventDB from '../utils/eventDB.js';
import NotificationBadge from './NotificationBadge.jsx';
import useLocalStorage from '../hooks/useLocalStorage.jsx';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const navigation = [
  { name: 'Request History', slug: 'inspectr', component: InspectrApp },
  { name: 'Statistics', slug: 'statistics', component: DashBoardApp },
  { name: 'Settings', slug: 'settings', component: SettingsApp }
];

const Logo = (props) => (
  <svg
    fill="currentColor"
    height="24"
    width="24"
    viewBox="0 0 1648 1648"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="m610 216.654c-66.158 4.092-126.119 35.849-164.917 87.346-8.408 11.16-13.344 19.191-19.983 32.513-12.431 24.946-19.521 50.434-22.11 79.487-1.665 18.687-.854 826.238.841 837.939 7.867 54.284 32.465 101.134 70.706 134.667 16.297 14.291 32.283 24.657 53.963 34.991 16.889 8.05 34.568 13.468 60.5 18.541 9.019 1.764 52.201 1.795 61.5.044 26.487-4.989 43.97-10.341 61-18.675 15.131-7.406 21.53-11.135 60.5-35.267 20.813-12.887 23.095-14.298 29.5-18.24l13-8 13-8c6.901-4.247 12.593-7.767 29.54-18.271 5.796-3.593 12.771-7.863 15.5-9.49 2.728-1.626 8.56-5.19 12.96-7.921 4.4-2.73 72.575-44.711 151.5-93.29s150.925-92.918 160-98.531c9.075-5.612 24.15-14.936 33.5-20.719s23.075-14.234 30.5-18.78c85.169-52.142 120.029-73.942 130.014-81.304 40.974-30.211 68.344-69.764 81.788-118.194 13.864-49.94 8.549-104.847-14.809-153-16.836-34.708-41.252-62.432-74.993-85.154-4.125-2.778-17.625-11.26-30-18.849s-27-16.594-32.5-20.009c-5.5-3.416-109.45-67.427-231-142.246-306.386-188.593-335.221-206.352-350-215.553-30.562-19.028-59.301-29.911-90-34.083-11.697-1.59-30.408-2.514-39.5-1.952m-10.5 77.269c-39.541 6.402-76.013 29.73-97.661 62.467-13.001 19.66-19.718 38.39-22.802 63.584-1.472 12.028-1.434 802.191.04 818.026 1.861 19.998 6.142 35.48 14.415 52.133 17.942 36.114 53.025 64.18 91.508 73.203 3.575.839 8.975 2.118 12 2.844 8.221 1.973 40.343 1.613 49.971-.56 32.301-7.289 65.233-26.686 94.817-55.849 15.26-15.042 22.884-24.803 33.571-42.979 13.939-23.706 20.949-43.36 27.745-77.792 1.004-5.086 1.428-50 1.949-206.5.465-139.686 1.001-201.809 1.777-206 .611-3.3 1.608-9.15 2.217-13 1.672-10.583 4.039-21.117 7.191-32 8.179-28.247 20.714-55.13 37.188-79.751 24.262-36.262 53.189-63.572 93.074-87.872 4.95-3.016 12.825-7.435 17.5-9.82s8.95-4.668 9.5-5.074c3.565-2.63 34.688-13.266 52.465-17.93 6.2-1.627 11.49-3.174 11.754-3.439 1.003-1.002-1.016-2.602-10.967-8.689-5.639-3.449-16.552-10.172-24.252-14.94-13.435-8.319-31.76-19.604-58.5-36.029-6.875-4.222-16.1-9.911-20.5-12.641-7.667-4.758-73.088-45.103-122.5-75.546-75.227-46.348-108.509-66.591-116.5-70.86-9.422-5.033-25.23-10.76-37.043-13.419-7.967-1.794-40.076-2.843-47.957-1.567m473.5 305.564c-5.775.685-11.625 1.491-13 1.792-1.375.3-5.2 1.088-8.5 1.749-7.914 1.587-27.103 7.461-36.5 11.174-38.797 15.33-75.171 44.925-98.829 80.41-11.24 16.86-21.329 38.407-26.167 55.888-2.443 8.825-3.85 14.608-4.866 20-.621 3.3-1.653 8.475-2.292 11.5-.846 4.008-1.345 59.624-1.837 205-.618 182.331-.824 200.361-2.399 209.5-1.629 9.459-4.196 22.506-6.744 34.279-.628 2.903-.881 5.54-.561 5.859.596.596 455.986-279.084 472.195-290.001 17.547-11.819 36.335-33.412 46.291-53.203 3.956-7.863 9.527-23.924 11.597-33.434 4.848-22.272 3.572-48.26-3.506-71.387-6.907-22.572-18.055-40.93-35.316-58.158-12.705-12.681-16.829-15.485-79.066-53.756-7.15-4.397-15.7-9.654-19-11.684-3.3-2.029-8.925-5.504-12.5-7.722-53.826-33.397-67.199-40.611-88.616-47.8-29.343-9.85-61.599-13.421-90.384-10.006m-1066.25 1048.256c3.988.189 10.513.189 14.5 0 3.988-.19.725-.346-7.25-.346s-11.238.156-7.25.346"
      fillRule="evenodd"
    />
  </svg>
);

export default function Workspace() {
  const [currentTab, setCurrentTab] = useState(navigation[0]);
  const { route, currentNav, handleTabClick } = useHashRouter(navigation);
  const ActiveComponent = currentNav.component;
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [recordStart, setRecordStart] = useLocalStorage('recordStart', null);
  const [isRecording, setIsRecording] = useState(() => !!recordStart);
  useEffect(() => {
    setIsRecording(!!recordStart);
  }, [recordStart]);

  const [isRecordExportOpen, setIsRecordExportOpen] = useState(false);
  const recordCount = useLiveQuery(async () => {
    if (!isRecording || !recordStart) return 0;
    return await eventDB.db.events.where('time').above(recordStart).count();
  }, [isRecording, recordStart]);

  return (
    <InspectrProvider>
      <DialogMockLaunch />

      <div className="flex flex-col min-h-screen">
        <div className="border-b border-tremor-border dark:border-dark-tremor-border relative h-full overflow-hidden bg-gray-50 dark:bg-dark-tremor-background-subtle">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="overflow flex h-16 sm:space-x-7 items-center">
              <div className="hidden shrink-0 sm:flex sm:items-center">
                <a href="/" className="p-1.5">
                  <Logo
                    className="size-4 shrink-0 w-8 h-8 text-tremor-content-strong dark:text-dark-tremor-content-strong"
                    aria-hidden={true}
                  />
                </a>
              </div>
              <nav className="flex-1 -mb-px flex space-x-6" aria-label="Tabs">
                {navigation.map((navItem) => (
                  <button
                    key={navItem.slug}
                    onClick={() => handleTabClick(navItem)}
                    className={classNames(
                      navItem.slug === currentNav.slug
                        ? 'dark:text-tremor-dark-brand border-tremor-brand text-tremor-brand'
                        : 'border-transparent text-tremor-content-emphasis hover:border-tremor-content-subtle hover:text-tremor-content-strong dark:text-dark-tremor-content-emphasis hover:dark:border-dark-tremor-content-subtle hover:dark:text-dark-tremor-content-strong',
                      'inline-flex items-center whitespace-nowrap border-b-2 px-2 text-tremor-default font-medium'
                    )}
                    aria-current={navItem.name === currentTab.name ? 'page' : undefined}
                  >
                    {navItem.name}
                  </button>
                ))}
              </nav>
              <div className="ml-auto flex items-center space-x-2">
                <button
                  className="px-2 py-1 text-cyan-500 hover:text-white border border-cyan-500 hover:bg-cyan-500 rounded text-xs"
                  onClick={() => setIsExportOpen(true)}
                >
                  Export
                </button>
                <button
                  className="px-2 py-1 text-cyan-500 hover:text-white border border-cyan-500 hover:bg-cyan-500 rounded text-xs"
                  onClick={() => setIsImportOpen(true)}
                >
                  Import
                </button>
                <div className="relative">
                  <button
                    disabled={isRecordExportOpen}
                    className={`px-2 py-1 rounded text-xs flex items-center border border-green-500 ${isRecording ? 'text-white bg-green-500' : 'text-green-500 hover:text-white  hover:bg-green-500'} `}
                    onClick={() => {
                      if (isRecording) {
                        if (recordCount > 0) {
                          setIsRecordExportOpen(true);
                        } else {
                          setIsRecording(false);
                          setRecordStart(null);
                        }
                      } else {
                        setRecordStart(new Date().toISOString());
                        setIsRecording(true);
                      }
                    }}
                  >
                    <span
                      className={`mr-1 block w-2 h-2 ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-red-600 rounded-full'}`}
                    ></span>
                    {isRecording ? `Stop Recording` : 'Start Recording'}
                  </button>
                  {isRecording && recordCount > 0 && (
                    <span className="absolute -top-3 -right-2">
                      <NotificationBadge count={recordCount} />
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ——— Content Area ——— */}
        <div className="flex-grow overflow-auto">
          {['statistics', 'settings'].includes(currentNav.slug) ? (
            <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-950">
              <ActiveComponent key={currentNav.slug} />
            </div>
          ) : (
            // InspectrApp takes care of its own layout now
            <InspectrApp key="inspectr" />
          )}
        </div>

        {/* Toast Notification from context */}
        <ToastNotificationFromContext />

        {/* Export/Import/Record dialogs */}
        <DialogExportOperations open={isExportOpen} onClose={() => setIsExportOpen(false)} />
        <DialogImportOperations open={isImportOpen} onClose={() => setIsImportOpen(false)} />

        <DialogExportRecords
          open={isRecordExportOpen}
          onContinue={() => {
            // Simply close and keep recording
            setIsRecordExportOpen(false);
          }}
          onCancelRecording={() => {
            // Stop recording and clear start time
            setIsRecordExportOpen(false);
            setIsRecording(false);
            setRecordStart(null);
          }}
          onClose={() => setIsRecordExportOpen(false)}
          startTime={recordStart}
        />
      </div>
    </InspectrProvider>
  );
}

// Component to display toast notifications from context
const ToastNotificationFromContext = () => {
  const { toast, setToast } = useInspectr();

  if (!toast) return null;

  return (
    <ToastNotification
      message={toast.message}
      subMessage={toast.subMessage}
      type={toast.type}
      onClose={() => setToast(null)}
    />
  );
};
