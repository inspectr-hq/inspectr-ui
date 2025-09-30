// src/components/RulesBuilderPanel.jsx
import React from 'react';
import { aggregatorOptions, operatorOptions, valueTypeOptions } from '../utils/rulesHelpers.js';

const MoveButtons = ({ onMoveUp, onMoveDown, disableUp, disableDown }) => (
  <div className="flex items-center gap-1">
    <button
      type="button"
      onClick={onMoveUp}
      disabled={disableUp}
      aria-label="Move up"
      className="inline-flex items-center justify-center rounded-md border border-gray-200 p-1 text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-4"
      >
        <path d="m18 15-6-6-6 6" />
      </svg>
    </button>
    <button
      type="button"
      onClick={onMoveDown}
      disabled={disableDown}
      aria-label="Move down"
      className="inline-flex items-center justify-center rounded-md border border-gray-200 p-1 text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-4"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  </div>
);

const RulesBuilderPanel = ({
  form,
  events,
  selectedEventDescription,
  actionsCatalog,
  isEditing,
  saving,
  formErrors,
  onSubmit,
  onReset,
  onFieldChange,
  onConditionChange,
  onAddCondition,
  onRemoveCondition,
  onMoveCondition,
  onActionTypeChange,
  onActionParamChange,
  onAddAction,
  onRemoveAction,
  onMoveAction
}) => {
  const canMoveCondition = form.conditions.length > 1;
  const canMoveAction = form.actions.length > 1;

  return (
    <form
      className="space-y-6 rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm dark:border-gray-800 dark:bg-[#090E1A]/60 sm:p-6"
      onSubmit={onSubmit}
    >
      <div className="flex items-center justify-between">
        <div>
          <label
            htmlFor="rule-name"
            className="text-sm font-medium text-gray-900 dark:text-gray-50"
          >
            {isEditing ? 'Edit Rule' : 'Rule Name'}
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {isEditing
              ? 'Update the selected rule and save your changes.'
              : 'Define a descriptive name for your rule.'}
          </p>
        </div>
        {isEditing && (
          <span className="inline-flex items-center rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">
            Editing
          </span>
        )}
      </div>
      <input
        id="rule-name"
        type="text"
        value={form.name}
        onChange={(event) => onFieldChange('name', event.target.value)}
        placeholder="E.g. Min. Transaction Amount USD"
        className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-800 dark:bg-[#090E1A] dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
      />

      <div className="space-y-2">
        <label
          htmlFor="rule-description"
          className="text-sm font-medium text-gray-900 dark:text-gray-50"
        >
          Description
        </label>
        <textarea
          id="rule-description"
          rows={3}
          value={form.description}
          onChange={(event) => onFieldChange('description', event.target.value)}
          placeholder="Optional summary for this automation rule"
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-800 dark:bg-[#090E1A] dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="rule-event"
            className="text-sm font-medium text-gray-900 dark:text-gray-50"
          >
            Event Trigger
          </label>
          <select
            id="rule-event"
            value={form.event}
            onChange={(event) => onFieldChange('event', event.target.value)}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-800 dark:bg-[#090E1A] dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
          >
            {events.length === 0 && <option value="">No events available</option>}
            {events.map((item) => (
              <option key={item.type} value={item.type}>
                {item.name || item.type}
              </option>
            ))}
          </select>
          {events.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {selectedEventDescription || 'Select the event to monitor.'}
            </p>
          )}
        </div>
        <div className="grid gap-2 sm:justify-items-end">
          <label className="text-sm font-medium text-gray-900 dark:text-gray-50">Activation</label>
          <div className="flex items-center gap-3">
            <input
              id="rule-active"
              type="checkbox"
              checked={form.active}
              onChange={(event) => onFieldChange('active', event.target.checked)}
              className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
            />
            <label htmlFor="rule-active" className="text-sm text-gray-700 dark:text-gray-200">
              Rule is active
            </label>
          </div>
          <div className="space-y-2">
            <label
              htmlFor="rule-priority"
              className="text-sm font-medium text-gray-900 dark:text-gray-50"
            >
              Priority
            </label>
            <input
              id="rule-priority"
              type="number"
              value={form.priority}
              onChange={(event) => onFieldChange('priority', event.target.value)}
              className="block w-24 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-800 dark:bg-[#090E1A] dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#090E1A]">
        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Rule Flow</h4>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Configure the event, matching conditions, and resulting actions.
          </div>
        </div>
        <div className="space-y-6 px-4 py-5">
          <div className="rounded-lg border-l-4 border-orange-600 bg-orange-50/60 p-4 dark:border-orange-500 dark:bg-orange-500/10">
            <div className="flex items-center gap-4">
              <span
                className="flex aspect-square h-10 items-center justify-center rounded-lg bg-orange-600 dark:bg-orange-500"
                aria-hidden="true"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-6 text-white"
                >
                  <path d="M12 2v14" />
                  <path d="m19 9-7 7-7-7" />
                  <circle cx="12" cy="21" r="1" />
                </svg>
              </span>
              <div className="truncate">
                <h5 className="text-sm font-medium capitalize text-gray-900 dark:text-gray-50">
                  Event
                </h5>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Select the operation event you want to monitor.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <label
                className="text-xs font-medium text-gray-900 dark:text-gray-200"
                htmlFor="builder-event"
              >
                Event
              </label>
              <select
                id="builder-event"
                value={form.event}
                onChange={(event) => onFieldChange('event', event.target.value)}
                className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-800 dark:bg-[#090E1A] dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
              >
                {events.map((item) => (
                  <option key={item.type} value={item.type}>
                    {item.name || item.type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Conditions</h5>
              <div className="flex items-center gap-3">
                <label
                  className="text-xs font-medium text-gray-500 dark:text-gray-400"
                  htmlFor="expression-type"
                >
                  Condition Logic
                </label>
                <select
                  id="expression-type"
                  value={form.expressionType}
                  onChange={(event) => onFieldChange('expressionType', event.target.value)}
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-700 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
                >
                  {aggregatorOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {form.conditions.map((condition, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-start gap-4 px-4 py-4">
                  <div className="flex flex-col items-center gap-2">
                    <span
                      className="flex aspect-square h-10 items-center justify-center rounded-lg bg-sky-500"
                      aria-hidden="true"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-6 text-white"
                      >
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <path d="M9 17c2 0 2.8-1 2.8-2.8V10c0-2 1-3.3 3.2-3" />
                        <path d="M9 11.2h5.7" />
                      </svg>
                    </span>
                    <MoveButtons
                      onMoveUp={() => onMoveCondition(index, index - 1)}
                      onMoveDown={() => onMoveCondition(index, index + 1)}
                      disableUp={!canMoveCondition || index === 0}
                      disableDown={!canMoveCondition || index === form.conditions.length - 1}
                    />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          JSON path
                        </label>
                        <input
                          type="text"
                          value={condition.path}
                          onChange={(event) => onConditionChange(index, 'path', event.target.value)}
                          placeholder="$.request.path"
                          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Operator
                          </label>
                          <select
                            value={condition.operator}
                            onChange={(event) =>
                              onConditionChange(index, 'operator', event.target.value)
                            }
                            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
                          >
                            {operatorOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Value Type
                          </label>
                          <select
                            value={condition.valueType}
                            onChange={(event) =>
                              onConditionChange(index, 'valueType', event.target.value)
                            }
                            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
                          >
                            {valueTypeOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Compare value
                        </label>
                        {condition.valueType === 'boolean' ? (
                          (() => {
                            const booleanValue =
                              condition.value === ''
                                ? 'true'
                                : condition.value === true
                                  ? 'true'
                                  : condition.value === false
                                    ? 'false'
                                    : condition.value;
                            return (
                              <select
                                value={booleanValue}
                                onChange={(event) =>
                                  onConditionChange(index, 'value', event.target.value)
                                }
                                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
                              >
                                <option value="true">true</option>
                                <option value="false">false</option>
                              </select>
                            );
                          })()
                        ) : (
                          <input
                            type="text"
                            value={condition.value}
                            onChange={(event) =>
                              onConditionChange(index, 'value', event.target.value)
                            }
                            placeholder={
                              condition.valueType === 'number' ? 'e.g. 200' : 'e.g. /api/payments'
                            }
                            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
                          />
                        )}
                      </div>
                      <div className="flex flex-wrap items-end justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onRemoveCondition(index)}
                          className="inline-flex items-center gap-2 rounded-md border border-transparent px-3 py-2 text-xs font-medium text-red-600 transition hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400 dark:hover:border-red-800 dark:hover:bg-red-900/30"
                          disabled={form.conditions.length === 1}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={onAddCondition}
              className="inline-flex items-center gap-2 rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:bg-gray-900"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4"
                aria-hidden="true"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Condition
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Actions</h5>
              <button
                type="button"
                onClick={onAddAction}
                className="inline-flex items-center gap-2 rounded-md border border-transparent bg-blue-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-4"
                  aria-hidden="true"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Action
              </button>
            </div>

            {form.actions.map((action, index) => {
              const definition = actionsCatalog.find((item) => item.type === action.type) || {
                params: []
              };
              return (
                <div
                  key={action.id}
                  className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="flex items-start gap-4 px-4 py-4">
                    <div className="flex flex-col items-center gap-2">
                      <span
                        className="flex aspect-square h-10 items-center justify-center rounded-lg bg-emerald-500"
                        aria-hidden="true"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="size-6 text-white"
                        >
                          <path d="M22 12A10 10 0 1 1 12 2" />
                          <path d="M22 2 12 12" />
                          <path d="M16 2h6v6" />
                        </svg>
                      </span>
                      <MoveButtons
                        onMoveUp={() => onMoveAction(action.id, index - 1)}
                        onMoveDown={() => onMoveAction(action.id, index + 1)}
                        disableUp={!canMoveAction || index === 0}
                        disableDown={!canMoveAction || index === form.actions.length - 1}
                      />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex-1 min-w-[180px] space-y-1">
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Action Type
                          </label>
                          <select
                            value={action.type}
                            onChange={(event) => onActionTypeChange(action.id, event.target.value)}
                            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark;text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
                          >
                            {actionsCatalog.length === 0 && (
                              <option value="">No actions available</option>
                            )}
                            {actionsCatalog.map((item) => (
                              <option key={item.type} value={item.type}>
                                {item.type}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onRemoveAction(action.id)}
                            className="inline-flex items-center gap-2 rounded-md border border-transparent px-3 py-2 text-xs font-medium text-red-600 transition hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400 dark:hover:border-red-800 dark:hover:bg-red-900/30"
                            disabled={form.actions.length === 1}
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {definition?.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {definition.description}
                        </p>
                      )}

                      <div className="space-y-4">
                        {(definition.params || []).map((param) => {
                          if (param.hidden) return null;
                          const fieldId = `${action.id}-${param.name}`;
                          const currentValue = action.params?.[param.name];
                          const isBoolean = param.type === 'boolean' || param.input === 'boolean';
                          const isArray = typeof param.type === 'string' && param.type.startsWith('array');
                          const isSingleSelect = param.input === 'single_select' && Array.isArray(param.choices);
                          const isMultiSelect = param.input === 'multi_select' && Array.isArray(param.choices);
                          const isNumber = param.type === 'integer' || param.type === 'number' || param.input === 'number';
                          const isObject = param.type === 'object' || param.input === 'object';

                          const Label = (
                            <label htmlFor={fieldId} className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              {param.name}
                              {param.required && <span className="ml-1 text-red-500">*</span>}
                            </label>
                          );

                          // Object input with variants (e.g., provider_options driven by provider)
                          if (isObject && Array.isArray(param.variants) && param.variants.length) {
                            const controllerValue = action.params?.provider; // convention from API example
                            const selectedVariant = param.variants.find((v) => v.value === controllerValue);
                            const objectValue = (currentValue && typeof currentValue === 'object') ? currentValue : {};
                            return (
                              <div key={param.name} className="space-y-2">
                                {Label}
                                {!controllerValue ? (
                                  <p className="text-xs text-gray-500 dark:text-gray-500">Select a provider to configure options.</p>
                                ) : !selectedVariant ? (
                                  <p className="text-xs text-gray-500 dark:text-gray-500">No options available for provider "{controllerValue}".</p>
                                ) : (
                                  <div className="space-y-3 rounded-md border border-gray-200 p-3 dark:border-gray-800">
                                    {selectedVariant.description && (
                                      <p className="text-xs text-gray-500 dark:text-gray-500">{selectedVariant.description}</p>
                                    )}
                                    {(selectedVariant.params || []).map((sub) => {
                                      if (sub.hidden) return null;
                                      const subId = `${fieldId}-${sub.name}`;
                                      const subIsBoolean = sub.type === 'boolean' || sub.input === 'boolean';
                                      const subIsNumber = sub.type === 'integer' || sub.type === 'number' || sub.input === 'number';
                                      const subIsArray = typeof sub.type === 'string' && sub.type.startsWith('array');
                                      const subIsObject = sub.type === 'object' || sub.input === 'object';
                                      const subIsSingleSelect = sub.input === 'single_select' && Array.isArray(sub.choices);
                                      const subValue = objectValue?.[sub.name];
                                      const setSubValue = (val) => {
                                        onActionParamChange(action.id, param.name, { ...objectValue, [sub.name]: val });
                                      };
                                      return (
                                        <div key={sub.name} className="space-y-1">
                                          <label htmlFor={subId} className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                            {sub.label || sub.name}
                                            {sub.required && <span className="ml-1 text-red-500">*</span>}
                                          </label>
                                          {subIsBoolean ? (
                                            <div className="flex items-center gap-3">
                                              <input
                                                id={subId}
                                                type="checkbox"
                                                checked={Boolean(subValue ?? false)}
                                                onChange={(e) => setSubValue(e.target.checked)}
                                                className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                                              />
                                              {sub.description && (
                                                <span className="text-xs text-gray-600 dark:text-gray-400">{sub.description}</span>
                                              )}
                                            </div>
                                          ) : subIsSingleSelect ? (
                                            <select
                                              id={subId}
                                              value={typeof subValue === 'string' ? subValue : (subValue ?? '')}
                                              onChange={(e) => setSubValue(e.target.value)}
                                              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
                                            >
                                              {(sub.choices || []).map((c) => (
                                                <option key={c.value} value={c.value} title={c.description || ''}>
                                                  {c.label || c.value}
                                                </option>
                                              ))}
                                            </select>
                                          ) : subIsNumber ? (
                                            <input
                                              id={subId}
                                              type="number"
                                              step={sub.type === 'integer' ? 1 : 'any'}
                                              value={subValue ?? ''}
                                              onChange={(e) => setSubValue(e.target.value)}
                                              placeholder={sub.help || ''}
                                              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
                                            />
                                          ) : subIsArray ? (
                                            <input
                                              id={subId}
                                              type="text"
                                              value={Array.isArray(subValue) ? subValue.join(', ') : (subValue ?? '')}
                                              onChange={(e) => setSubValue(e.target.value)}
                                              placeholder={sub.help || ''}
                                              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
                                            />
                                          ) : subIsObject ? (
                                            <textarea
                                              id={subId}
                                              rows={3}
                                              value={typeof subValue === 'string' ? subValue : (subValue ? JSON.stringify(subValue, null, 2) : '')}
                                              onChange={(e) => setSubValue(e.target.value)}
                                              placeholder={sub.help || 'Enter JSON object'}
                                              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
                                            />
                                          ) : (
                                            <input
                                              id={subId}
                                              type="text"
                                              value={typeof subValue === 'string' ? subValue : (subValue ?? '')}
                                              onChange={(e) => setSubValue(e.target.value)}
                                              placeholder={sub.help || ''}
                                              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
                                            />
                                          )}
                                          {sub.help && (
                                            <p className="text-[11px] text-gray-500 dark:text-gray-500">{sub.help}</p>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                {(param.description || param.help) && (
                                  <p className="text-xs text-gray-500 dark:text-gray-500">{param.description || param.help}</p>
                                )}
                              </div>
                            );
                          }

                          // Generic object (e.g., headers JSON)
                          if (isObject) {
                            return (
                              <div key={param.name} className="space-y-1">
                                {Label}
                                <textarea
                                  id={fieldId}
                                  rows={4}
                                  value={typeof currentValue === 'string' ? currentValue : (currentValue ? JSON.stringify(currentValue, null, 2) : '')}
                                  onChange={(e) => onActionParamChange(action.id, param.name, e.target.value)}
                                  placeholder={param.help || param.description || 'Enter JSON object'}
                                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
                                />
                                {(param.description || param.help) && (
                                  <p className="text-xs text-gray-500 dark:text-gray-500">{param.description || param.help}</p>
                                )}
                              </div>
                            );
                          }

                          return (
                            <div key={param.name} className="space-y-1">
                              {Label}

                              {isBoolean ? (
                                <div className="flex items-center gap-3">
                                  <input
                                    id={fieldId}
                                    type="checkbox"
                                    checked={Boolean(currentValue)}
                                    onChange={(event) =>
                                      onActionParamChange(
                                        action.id,
                                        param.name,
                                        event.target.checked
                                      )
                                    }
                                    className="size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                                  />
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {param.description}
                                  </span>
                                </div>
                              ) : isSingleSelect ? (
                                <>
                                  <select
                                    id={fieldId}
                                    value={
                                      typeof currentValue === 'string'
                                        ? currentValue
                                        : (currentValue ?? '')
                                    }
                                    onChange={(event) =>
                                      onActionParamChange(action.id, param.name, event.target.value)
                                    }
                                    className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
                                  >
                                    {param.choices.map((choice) => (
                                      <option
                                        key={choice.value}
                                        value={choice.value}
                                        title={choice.description || ''}
                                      >
                                        {choice.label || choice.value}
                                      </option>
                                    ))}
                                  </select>
                                  {param.description && (
                                    <p className="text-xs text-gray-500 dark:text-gray-500">
                                      {param.description}
                                    </p>
                                  )}
                                </>
                              ) : isMultiSelect ? (
                                <div className="space-y-2">
                                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    {(param.choices || [])
                                      .filter((choice) => {
                                        const provider = action.params?.provider;
                                        return (
                                          !choice.group || !provider || choice.group === provider
                                        );
                                      })
                                      .map((choice) => {
                                        const key = choice.meta?.key || choice.value;
                                        const selectedValues =
                                          currentValue &&
                                          typeof currentValue === 'object' &&
                                          currentValue !== null
                                            ? currentValue
                                            : {};
                                        const checked = Object.prototype.hasOwnProperty.call(
                                          selectedValues,
                                          key
                                        );
                                        const handleToggle = (nextChecked) => {
                                          const next = { ...selectedValues };
                                          if (nextChecked) {
                                            if (!(key in next)) next[key] = '';
                                          } else {
                                            delete next[key];
                                          }
                                          onActionParamChange(action.id, param.name, next);
                                        };
                                        const handleValueChange = (val) => {
                                          const next = { ...(selectedValues || {}) };
                                          next[key] = val;
                                          onActionParamChange(action.id, param.name, next);
                                        };
                                        const valueForInput = (() => {
                                          const v = selectedValues[key];
                                          if (typeof v === 'object' && v !== null) {
                                            try {
                                              return JSON.stringify(v);
                                            } catch (e) {
                                              return String(v);
                                            }
                                          }
                                          return v ?? '';
                                        })();
                                        const metaType = choice.meta?.type || 'string';
                                        return (
                                          <div
                                            key={choice.value}
                                            className="rounded-md border border-gray-200 p-2 dark:border-gray-800"
                                          >
                                            <label className="flex items-start gap-2 text-sm">
                                              <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={(e) => handleToggle(e.target.checked)}
                                                className="mt-1 size-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900"
                                              />
                                              <span className="flex-1">
                                                <span className="font-medium text-gray-800 dark:text-gray-200">
                                                  {choice.label || choice.value}
                                                </span>
                                                {choice.description && (
                                                  <p className="text-xs text-gray-500 dark:text-gray-500">
                                                    {choice.description}
                                                  </p>
                                                )}
                                              </span>
                                            </label>
                                            {checked && (
                                              <div className="mt-2">
                                                {metaType === 'object' ? (
                                                  <textarea
                                                    rows={3}
                                                    value={valueForInput}
                                                    onChange={(e) =>
                                                      handleValueChange(e.target.value)
                                                    }
                                                    placeholder={choice.label}
                                                    className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
                                                  />
                                                ) : (
                                                  <input
                                                    type={
                                                      metaType === 'integer' ? 'number' : 'text'
                                                    }
                                                    value={valueForInput}
                                                    onChange={(e) =>
                                                      handleValueChange(e.target.value)
                                                    }
                                                    placeholder={choice.label}
                                                    className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
                                                  />
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                  </div>
                                  {param.description && (
                                    <p className="text-xs text-gray-500 dark:text-gray-500">
                                      {param.description}
                                    </p>
                                  )}
                                </div>
                              ) : isNumber ? (
                                <input
                                  id={fieldId}
                                  type="number"
                                  step={param.type === 'integer' ? 1 : 'any'}
                                  value={currentValue ?? ''}
                                  onChange={(event) => onActionParamChange(action.id, param.name, event.target.value)}
                                  placeholder={param.help || ''}
                                  className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
                                />
                              ) : (
                                <>
                                  <input
                                    id={fieldId}
                                    type="text"
                                    value={
                                      typeof currentValue === 'string'
                                        ? currentValue
                                        : isArray
                                          ? (currentValue || []).join(', ')
                                          : (currentValue ?? '')
                                    }
                                    onChange={(event) =>
                                      onActionParamChange(action.id, param.name, event.target.value)
                                    }
                                    placeholder={isArray ? 'tag.one, tag.two' : (param.help || '')}
                                    className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
                                  />
                                  {param.description && (
                                    <p className="text-xs text-gray-500 dark:text-gray-500">
                                      {param.description}
                                    </p>
                                  )}
                                  {param.help && (
                                    <p className="text-[11px] text-gray-500 dark:text-gray-500">{param.help}</p>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {formErrors.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          <ul className="list-disc space-y-1 pl-4">
            {formErrors.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
        >
          {isEditing ? 'Cancel edit' : 'Reset'}
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-blue-500 dark:hover:bg-blue-400"
        >
          {saving ? 'Saving…' : isEditing ? 'Update Rule' : 'Save Rule'}
        </button>
      </div>
    </form>
  );
};

export default RulesBuilderPanel;
