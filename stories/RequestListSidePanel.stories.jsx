// src/components/RequestListSidePanel.stories.jsx
import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import RequestListSidePanel from '../src/components/operations/RequestListSidePanel.jsx';

export default {
  title: 'Components/RequestListSidePanel',
  component: RequestListSidePanel
};

const Template = (args) => {
  // Local state to control the panel and its values.
  const [isOpen, setIsOpen] = useState(args.isOpen);
  const [sortField, setSortField] = useState(args.sortField);
  const [sortDirection, setSortDirection] = useState(args.sortDirection);
  const [filters, setFilters] = useState(args.filters);

  const handleClose = () => {
    action('onClose')();
    setIsOpen(false);
  };

  return (
    <>
      {/* A button to open the panel */}
      <button
        onClick={() => setIsOpen(true)}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Open Side Panel
      </button>

      <RequestListSidePanel
        {...args}
        isOpen={isOpen}
        onClose={handleClose}
        sortField={sortField}
        sortDirection={sortDirection}
        filters={filters}
        setSortField={(value) => {
          action('setSortField')(value);
          setSortField(value);
        }}
        setSortDirection={(value) => {
          action('setSortDirection')(value);
          setSortDirection(value);
        }}
        setFilters={(newFilters) => {
          action('setFilters')(newFilters);
          setFilters(newFilters);
        }}
      />
    </>
  );
};

export const OpenPanel = Template.bind({});
OpenPanel.args = {
  isOpen: true,
  sortField: 'time',
  sortDirection: 'asc',
  filters: {}
};

export const ClosedPanel = Template.bind({});
ClosedPanel.args = {
  isOpen: false,
  sortField: 'time',
  sortDirection: 'asc',
  filters: {}
};
