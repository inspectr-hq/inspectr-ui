// src/components/TagFilterDropdown.jsx
import React, { useEffect, useRef, useState } from 'react';
import { RiPriceTag3Line, RiCheckLine } from '@remixicon/react';
import TagPill from './TagPill.jsx';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function TagFilterDropdown({
  tags = [],
  selectedTag,
  onSelect,
  disabled = false,
  loading = false,
  error
}) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const hasSelection = Boolean(selectedTag);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!menuRef.current || !buttonRef.current) return;
      if (menuRef.current.contains(event.target) || buttonRef.current.contains(event.target)) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleOpen = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
  };

  const closeMenu = () => setIsOpen(false);

  const handleSelect = (tag) => {
    if (disabled) return;
    onSelect?.(tag);
    closeMenu();
  };

  const buttonLabelId = 'tag-filter-dropdown-label';

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        ref={buttonRef}
        onClick={toggleOpen}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && !isOpen) {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-labelledby={buttonLabelId}
        className={cx(
          'inline-flex items-center gap-2 rounded-tremor-small border border-tremor-border bg-tremor-background px-3 py-2 text-sm font-medium text-tremor-content-strong shadow-tremor-input transition focus:z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-tremor-brand/60',
          'hover:bg-tremor-background-subtle disabled:cursor-not-allowed disabled:opacity-70',
          'dark:border-dark-tremor-border dark:bg-gray-950 dark:text-dark-tremor-content-strong dark:shadow-dark-tremor-input dark:hover:bg-gray-950/60'
        )}
      >
        <span id={buttonLabelId} className="sr-only">
          Filter statistics by tag
        </span>
        <RiPriceTag3Line className="h-4 w-4" aria-hidden />
        {hasSelection ? (
          <TagPill tag={selectedTag} />
        ) : (
          <span className="text-xs uppercase tracking-wide">All tags</span>
        )}
      </button>

      {isOpen ? (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby={buttonLabelId}
          className="absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-md border border-tremor-border bg-tremor-background p-2 shadow-xl shadow-black/[2.5%] focus:outline-none dark:border-dark-tremor-border dark:bg-gray-950"
        >
          <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-tremor-content dark:text-dark-tremor-content">
            Select a tag
          </div>
          <div className="max-h-60 overflow-y-auto">
            <button
              type="button"
              role="menuitemradio"
              aria-checked={!hasSelection}
              onClick={() => handleSelect(null)}
              className={cx(
                'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition',
                'text-gray-500 hover:bg-tremor-background-subtle focus:outline-none focus-visible:bg-tremor-background-subtle dark:text-gray-400 dark:hover:bg-dark-tremor-background dark:focus-visible:bg-dark-tremor-background',
                !hasSelection
                  ? 'font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong'
                  : ''
              )}
            >
              <span className="text-xs font-medium uppercase tracking-wide">All tags</span>
              {!hasSelection ? (
                <RiCheckLine
                  className="ml-auto h-4 w-4 text-tremor-brand dark:text-dark-tremor-brand"
                  aria-hidden
                />
              ) : null}
            </button>
            <div className="my-2 h-px bg-tremor-border dark:bg-dark-tremor-border" />
            {loading ? (
              <div className="px-2 py-4 text-center text-xs text-gray-500 dark:text-gray-400">
                Loading tags…
              </div>
            ) : tags.length === 0 ? (
              <div className="px-2 py-4 text-center text-xs text-gray-500 dark:text-gray-400">
                {error ? error : 'No tags available'}
              </div>
            ) : (
              tags.map((tag) => {
                const isSelected = selectedTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isSelected}
                    onClick={() => handleSelect(tag)}
                    className={cx(
                      'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition',
                      'text-tremor-content-strong hover:bg-tremor-background-subtle focus:outline-none focus-visible:bg-tremor-background-subtle dark:text-dark-tremor-content-strong dark:hover:bg-dark-tremor-background dark:focus-visible:bg-dark-tremor-background',
                      isSelected ? 'font-semibold' : ''
                    )}
                  >
                    <TagPill tag={tag} />
                    {isSelected ? (
                      <RiCheckLine
                        className="ml-auto h-4 w-4 text-tremor-brand dark:text-dark-tremor-brand"
                        aria-hidden
                      />
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
