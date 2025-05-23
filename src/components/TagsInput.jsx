// src/components/TagsInput.jsx
import React, { useState, useRef, useEffect } from 'react';

const TagsInput = ({ options, selected, onChange, placeholder = 'Add option...', colorFn }) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef(null);

  // Filter options based on input while excluding already selected items.
  const filteredOptions = options.filter(
    (option) =>
      option.toLowerCase().includes(inputValue.toLowerCase()) && !selected.includes(option)
  );

  // Reset highlighted index when the filtered list changes.
  useEffect(() => {
    setHighlightedIndex(0);
  }, [inputValue, selected]);

  const addTag = (tag) => {
    if (!selected.includes(tag)) {
      onChange([...selected, tag]);
    }
    setInputValue('');
  };

  const removeTag = (tag) => {
    onChange(selected.filter((item) => item !== tag));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      // Move highlight down
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1 < filteredOptions.length ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      // Move highlight up
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      console.log('enter', highlightedIndex);
      e.preventDefault();
      // If there are any filtered options, add the highlighted one
      if (filteredOptions.length > 0) {
        addTag(filteredOptions[highlightedIndex]);
      }
    } else if (e.key === 'Backspace' && !inputValue) {
      // Remove the last tag if input is empty
      if (selected.length > 0) {
        removeTag(selected[selected.length - 1]);
      }
    }
  };

  return (
    <div className="w-full max-w-md relative">
      <div className="flex flex-wrap items-center border border-gray-300 dark:border-dark-tremor-border rounded-md shadow-sm px-2 py-1 bg-white dark:bg-dark-tremor-background-subtle">
        {selected.map((tag) => (
          <div
            key={tag}
            className={`flex items-center rounded-full px-2 py-1 mr-2 my-1 text-xs ${
              colorFn
                ? colorFn(tag)
                : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
            }`}
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 focus:outline-none cursor-pointer"
              aria-label={`Remove ${tag}`}
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414
                     1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293
                     4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        ))}
        <input
          ref={inputRef}
          type="text"
          className="flex-grow outline-none p-1 text-gray-900 dark:text-dark-tremor-content placeholder-gray-400 dark:placeholder-dark-tremor-content-subtle bg-transparent dark:bg-dark-tremor-background-subtle border-0"
          placeholder={selected.length > 0 ? '' : placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 100)}
        />
      </div>
      {isFocused && filteredOptions.length > 0 && (
        <ul className="absolute left-0 right-0 border border-gray-300 dark:border-dark-tremor-border mt-1 rounded-md shadow-lg bg-white dark:bg-dark-tremor-background-subtle max-h-40 overflow-y-auto z-10">
          {filteredOptions.map((option, index) => (
            <li
              key={option}
              className={`cursor-pointer px-2 py-1 hover:bg-indigo-100 dark:hover:bg-dark-tremor-background ${
                index === highlightedIndex
                  ? 'bg-indigo-200 dark:bg-dark-tremor-background-muted'
                  : ''
              } text-gray-900 dark:text-dark-tremor-content`}
              onMouseEnter={() => setHighlightedIndex(index)}
              onMouseDown={() => addTag(option)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TagsInput;
