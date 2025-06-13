// src/components/RequestListPagination.stories.jsx
import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import RequestListPagination from '../src/components/RequestListPagination';

export default {
  title: 'Components/RequestListPagination',
  component: RequestListPagination
};

const Template = (args) => {
  const [currentPage, setCurrentPage] = useState(args.currentPage);

  const onPageChange = (page) => {
    action('onPageChange')(page);
    setCurrentPage(page);
  };

  return <RequestListPagination {...args} currentPage={currentPage} onPageChange={onPageChange} />;
};

export const Default = Template.bind({});
Default.args = {
  currentPage: 1,
  totalPages: 10
};

export const FewPages = Template.bind({});
FewPages.args = {
  currentPage: 1,
  totalPages: 4
};

export const MiddlePage = Template.bind({});
MiddlePage.args = {
  currentPage: 5,
  totalPages: 10
};

export const LastPage = Template.bind({});
LastPage.args = {
  currentPage: 10,
  totalPages: 10
};
