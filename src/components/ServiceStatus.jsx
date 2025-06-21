// src/components/ServiceStatus.jsx

import React, { useEffect, useState, useRef } from 'react';
import { useInspectr } from '../context/InspectrContext';
import { Tooltip } from './ToolTip.jsx';
import { cx } from '../utils/cx.js';

export default function ServiceStatus({ component }) {
  const { client } = useInspectr();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  // Hold a ref to the ping function
  const pingRef = useRef(() => {});

  // Ensure loading animation lasts at least this long (ms)
  const MIN_LOADING_TIME = 500;

  useEffect(() => {
    let cancelled = false;

    // Ping the service (with cancellation guard)
    async function ping() {
      if (!cancelled) {
        setStatus('loading');
        setError(null);
      }
      const start = Date.now();

      try {
        const res = await client.service.ping(component);
        const elapsed = Date.now() - start;

        const applySuccess = () => {
          if (!cancelled) {
            setStatus(res.status);
            setError(res.error || null);
          }
        };

        if (elapsed < MIN_LOADING_TIME) {
          setTimeout(applySuccess, MIN_LOADING_TIME - elapsed);
        } else {
          applySuccess();
        }
      } catch (err) {
        const elapsed = Date.now() - start;

        const applyError = () => {
          if (!cancelled) {
            setStatus('down');
            setError(err.message);
          }
        };

        if (elapsed < MIN_LOADING_TIME) {
          setTimeout(applyError, MIN_LOADING_TIME - elapsed);
        } else {
          applyError();
        }
      }
    }

    // On mount, trigger ping
    pingRef.current = ping;
    ping();

    return () => {
      cancelled = true;
    };
  }, [client.service, component]);

  // Set color on/off status
  const colorClasses =
    status === 'up'
      ? 'fill-green-500'
      : status === 'down'
        ? 'fill-red-500'
        : 'fill-gray-400 animate-pulse';

  const tooltip = error ? `${error}` : `${component}: ${status}`;

  return (
    <Tooltip content={tooltip} sideOffset={4} side="left" onClick={() => pingRef.current()}>
      <svg
        viewBox="0 0 6 6"
        aria-hidden="true"
        className={cx('w-3 h-3 cursor-pointer', colorClasses)}
      >
        <circle r="3" cx="3" cy="3" />
      </svg>
    </Tooltip>
  );
}
