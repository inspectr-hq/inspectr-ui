// src/components/DialogVersionUpdate.jsx

import React, { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import useLocalStorage from '../hooks/useLocalStorage.jsx';
import { useInspectr } from '../context/InspectrContext.jsx';

const VERSION_CHECK_STORAGE_KEY = 'inspectrVersionMuteUntil';
const VERSION_CHECK_DELAY_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

export default function DialogVersionUpdate() {
  const { client } = useInspectr();
  const [snoozeUntil, setSnoozeUntil] = useLocalStorage(VERSION_CHECK_STORAGE_KEY, '');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [versionInfo, setVersionInfo] = useState(null);

  useEffect(() => {
    if (!client?.service?.getVersion) return;

    const parsedSnooze = snoozeUntil ? Date.parse(snoozeUntil) : 0;
    if (parsedSnooze && parsedSnooze > Date.now()) {
      setIsUpdateAvailable(false);
      setIsDialogOpen(false);
      return;
    }

    let cancelled = false;
    client.service
      .getVersion()
      .then((info) => {
        if (cancelled) return;
        setVersionInfo(info);
        if (info?.update_available) {
          setIsUpdateAvailable(true);
        } else {
          setIsUpdateAvailable(false);
          setIsDialogOpen(false);
          const nextCheck = new Date(Date.now() + VERSION_CHECK_DELAY_MS).toISOString();
          setSnoozeUntil(nextCheck);
        }
      })
      .catch((err) => {
        console.error('Version check failed', err);
      });

    return () => {
      cancelled = true;
    };
  }, [client, snoozeUntil]);

  const handleClose = () => {
    setIsDialogOpen(false);
  };

  const applySnooze = () => {
    const nextCheck = new Date(Date.now() + VERSION_CHECK_DELAY_MS).toISOString();
    setSnoozeUntil(nextCheck);
    setIsUpdateAvailable(false);
    handleClose();
  };

  const handleSkip = () => {
    applySnooze();
  };

  const handleUpdate = () => {
    window.open(
      'https://inspectr.dev/docs/getting-started/upgrade',
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleOpen = () => {
    if (versionInfo?.update_available) {
      setIsDialogOpen(true);
    }
  };

  if (!isUpdateAvailable) return null;

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-2 rounded-md border border-amber-400 bg-amber-500 px-1 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
      >
        <span className="h-2 w-2 rounded-full bg-white/90 shadow-sm" />
        <span className="uppercase tracking-wide">Update available</span>
      </button>

      <Transition show={isDialogOpen} as={Fragment}>
        <Dialog
          as="div"
          className="pointer-events-none fixed inset-x-0 top-6 z-40 flex justify-center px-4 sm:top-8"
          onClose={handleClose}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 -translate-y-2"
            enterTo="opacity-100 translate-y-0"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 -translate-y-2"
          >
            <Dialog.Panel className="pointer-events-auto relative w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <div className="flex items-start gap-3 sm:min-w-[220px]">
                  <span className="mt-1 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shadow-sm dark:bg-emerald-900/30 dark:text-emerald-200">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.4668 8.69379L19.7134 8.12811C20.1529 7.11947 20.9445 6.31641 21.9323 5.87708L22.6919 5.53922C23.1027 5.35653 23.1027 4.75881 22.6919 4.57612L21.9748 4.25714C20.9616 3.80651 20.1558 2.97373 19.7238 1.93083L19.4706 1.31953C19.2942 0.893489 18.7058 0.893489 18.5293 1.31953L18.2761 1.93083C17.8442 2.97373 17.0384 3.80651 16.0252 4.25714L15.3081 4.57612C14.8973 4.75881 14.8973 5.35653 15.3081 5.53922L16.0677 5.87708C17.0555 6.31641 17.8471 7.11947 18.2866 8.12811L18.5331 8.69379C18.7136 9.10792 19.2864 9.10792 19.4668 8.69379ZM5 6C4.68525 6 4.38886 6.14819 4.2 6.4L1.2 10.4C0.913337 10.7822 0.937093 11.3138 1.25671 11.669L10.2567 21.669C10.4464 21.8797 10.7165 22 11 22C11.2835 22 11.5537 21.8797 11.7433 21.669L20.7433 11.669L19.2567 10.331L11 19.5052L3.29335 10.9422L5.5 8H14V6H5Z"></path>
                    </svg>
                  </span>
                  <div className="space-y-1">
                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                      New Inspectr version available
                    </Dialog.Title>
                    <Dialog.Description className="text-sm text-gray-700 dark:text-gray-200">
                      {versionInfo?.latest_version
                        ? `Update to ${versionInfo.latest_version} to get the latest improvements.`
                        : 'A new build is ready for you. Grab the latest to get new features.'}
                    </Dialog.Description>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Current: {versionInfo?.current_version || 'Unknown'} • Latest:{' '}
                      {versionInfo?.latest_version || '—'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdate}
                    className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                  >
                    Update
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>
    </>
  );
}
