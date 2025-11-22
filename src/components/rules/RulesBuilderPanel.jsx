// src/components/rules/RulesBuilderPanel.jsx
import React from 'react';
import { aggregatorOptions, valueTypeOptions } from '../../utils/rulesHelpers.js';
import ParamInput from '../inputs/ParamInput.jsx';
import JsonPathPicker from '../JsonPathPicker.jsx';
import { OperatorSelect, OperatorValueInput } from '../inputs/operators/index.js';

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
  onMoveAction,
  operatorOptions,
  formId,
  hideFooter = false
}) => {
  const canMoveCondition = form.conditions.length > 1;
  const canMoveAction = form.actions.length > 1;
  const availableOperators = Array.isArray(operatorOptions) ? operatorOptions : [];

  return (
    <form
      id={formId}
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

      <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
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
                {item.label || item.name || item.type}
              </option>
            ))}
          </select>
          {events.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {selectedEventDescription || 'Select the event to monitor.'}
            </p>
          )}
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
            className="block w-full max-w-[7rem] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-800 dark:bg-[#090E1A] dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
          />
        </div>
        <div className="space-y-2 sm:justify-self-end">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-50">Activation</span>
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

            {form.conditions.map((condition, index) => {
              const selectedOperator =
                availableOperators.find((option) => option.value === condition.operator) ||
                availableOperators[0];
              const valueRequired = selectedOperator?.valueRequired !== false;
              const multiValue = selectedOperator?.multiValue === true;

              return (
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
                          <JsonPathPicker
                            value={condition.path}
                            onChange={(nextValue) => onConditionChange(index, 'path', nextValue)}
                            placeholder="$.request.path"
                            className="!space-y-1"
                            browseButtonLabel="Browse"
                            enablePreview
                          />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              Operator
                            </label>
                            <OperatorSelect
                              value={condition.operator}
                              options={availableOperators}
                              onChange={(nextValue) =>
                                onConditionChange(index, 'operator', nextValue)
                              }
                              disabled={saving || availableOperators.length === 0}
                            />
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
                              disabled={!valueRequired}
                              className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
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
                          <OperatorValueInput
                            value={condition.value}
                            valueType={condition.valueType}
                            valueRequired={valueRequired}
                            multiValue={multiValue}
                            onChange={(nextValue) => onConditionChange(index, 'value', nextValue)}
                          />
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
              );
            })}
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
              const matchedDefinition = actionsCatalog.find((item) => item.type === action.type);
              const definition = matchedDefinition || {
                params: []
              };
              const isImpacted = !matchedDefinition && Boolean(action.type);
              const cardClassName = [
                'overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-gray-900',
                isImpacted
                  ? 'border-amber-300 dark:border-amber-500/40'
                  : 'border-gray-200 dark:border-gray-800'
              ].join(' ');
              return (
                <div key={action.id} className={cardClassName}>
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
                            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-50 dark:focus:border-blue-700 dark:focus:ring-blue-700/30"
                          >
                            {actionsCatalog.length === 0 && (
                              <option value="">No actions available</option>
                            )}
                            {isImpacted && action.type && (
                              <option value={action.type}>{action.type}</option>
                            )}
                            {actionsCatalog.map((item) => {
                              const baseLabel = item.label || item.name;
                              const optionLabel =
                                baseLabel && baseLabel !== item.type
                                  ? `${baseLabel} (${item.type})`
                                  : item.type;
                              return (
                                <option key={item.type} value={item.type}>
                                  {optionLabel}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                        {isImpacted && (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                              Connector disabled
                            </span>
                          </div>
                        )}
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

                      {isImpacted && (
                        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100">
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
                            className="mt-0.5 size-4 flex-shrink-0"
                            aria-hidden="true"
                          >
                            <path d="M10.29 3.86 1.82 18a1 1 0 0 0 .86 1.5h18.64a1 1 0 0 0 .86-1.5L13.71 3.86a1 1 0 0 0-1.72 0Z" />
                            <path d="M12 9v4" />
                            <path d="M12 17h.01" />
                          </svg>
                          <div>
                            <p className="font-semibold">Action unavailable</p>
                            <p className="mt-1 text-amber-700 dark:text-amber-200/80">
                              This action is unavailable because its connector is disabled. The
                              existing configuration is kept when you save, but the action will be
                              skipped until the connector is enabled again.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        {(definition.params || []).map((param) => {
                          if (param.hidden) return null;
                          const fieldId = `${action.id}-${param.name}`;
                          const currentValue = action.params?.[param.name];
                          const isBoolean = param.type === 'boolean' || param.input === 'boolean';
                          const isArray =
                            typeof param.type === 'string' && param.type.startsWith('array');
                          const isSingleSelect =
                            param.input === 'single_select' && Array.isArray(param.choices);
                          const isMultiSelect =
                            param.input === 'multi_select' && Array.isArray(param.choices);
                          const isNumber =
                            param.type === 'integer' ||
                            param.type === 'number' ||
                            param.input === 'number';
                          const isObject = param.type === 'object' || param.input === 'object';
                          const isPassword = param.input === 'password';
                          const isReadOnly = Boolean(param.readonly);

                          const Label = (
                            <label
                              htmlFor={fieldId}
                              className="text-xs font-medium text-gray-500 dark:text-gray-400"
                            >
                              {param.label || param.name}
                              {param.required && <span className="ml-1 text-red-500">*</span>}
                            </label>
                          );

                          // Object input with variants (e.g., provider_options driven by provider)
                          if (isObject && Array.isArray(param.variants) && param.variants.length) {
                            const controllerValue = action.params?.provider; // convention from API example
                            const selectedVariant = param.variants.find(
                              (v) => v.value === controllerValue
                            );
                            const objectValue =
                              currentValue && typeof currentValue === 'object' ? currentValue : {};
                            return (
                              <div key={param.name} className="space-y-2">
                                {Label}
                                {!controllerValue ? (
                                  <p className="text-xs text-gray-500 dark:text-gray-500">
                                    Select a provider to configure options.
                                  </p>
                                ) : !selectedVariant ? (
                                  <p className="text-xs text-gray-500 dark:text-gray-500">
                                    No options available for provider "{controllerValue}".
                                  </p>
                                ) : (
                                  <div className="space-y-3 rounded-md border border-gray-200 p-3 dark:border-gray-800">
                                    {selectedVariant.description && (
                                      <p className="text-xs text-gray-500 dark:text-gray-500">
                                        {selectedVariant.description}
                                      </p>
                                    )}
                                    {(selectedVariant.params || []).map((sub) => {
                                      if (sub.hidden) return null;
                                      const subId = `${fieldId}-${sub.name}`;
                                      const subIsBoolean =
                                        sub.type === 'boolean' || sub.input === 'boolean';
                                      const subIsNumber =
                                        sub.type === 'integer' ||
                                        sub.type === 'number' ||
                                        sub.input === 'number';
                                      const subIsArray =
                                        typeof sub.type === 'string' &&
                                        sub.type.startsWith('array');
                                      const subIsObject =
                                        sub.type === 'object' || sub.input === 'object';
                                      const subIsSingleSelect =
                                        sub.input === 'single_select' && Array.isArray(sub.choices);
                                      const subIsPassword = sub.input === 'password';
                                      const subReadOnly = Boolean(sub.readonly);
                                      const subValue = objectValue?.[sub.name];
                                      const setSubValue = (val) => {
                                        onActionParamChange(action.id, param.name, {
                                          ...objectValue,
                                          [sub.name]: val
                                        });
                                      };
                                      return (
                                        <ParamInput
                                          key={sub.name}
                                          id={subId}
                                          descriptor={sub}
                                          provider={action.params?.provider}
                                          value={subValue}
                                          onChange={(val) => setSubValue(val)}
                                        />
                                      );
                                    })}
                                  </div>
                                )}
                                {(param.description || param.help) && (
                                  <p className="text-xs text-gray-500 dark:text-gray-500">
                                    {param.description || param.help}
                                  </p>
                                )}
                              </div>
                            );
                          }

                          // Generic object (e.g., headers JSON)
                          if (isObject) {
                            return (
                              <ParamInput
                                key={param.name}
                                id={fieldId}
                                descriptor={param}
                                provider={action.params?.provider}
                                value={currentValue}
                                onChange={(val) => onActionParamChange(action.id, param.name, val)}
                              />
                            );
                          }

                          return (
                            <ParamInput
                              key={param.name}
                              id={fieldId}
                              descriptor={param}
                              provider={action.params?.provider}
                              value={currentValue}
                              onChange={(val) => onActionParamChange(action.id, param.name, val)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <button
              type="button"
              onClick={onAddAction}
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
              Add Action
            </button>
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

      {!hideFooter && (
        <div className="sticky bottom-0 z-10 -mx-4 -mb-4 flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:backdrop-blur dark:border-gray-800 dark:bg-[#090E1A]/95 sm:-mx-6 sm:px-6">
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
      )}
    </form>
  );
};

export default RulesBuilderPanel;
