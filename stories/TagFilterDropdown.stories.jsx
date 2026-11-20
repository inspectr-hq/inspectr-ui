import React, { useState } from 'react';
import TagFilterDropdown from '../src/components/TagFilterDropdown.jsx';
import { ruleTags } from './fixtures/inspectrFixtures.js';

const FilterStory = (props) => {
  const [selectedTag, setSelectedTag] = useState('team:checkout');
  return (
    <TagFilterDropdown
      tags={ruleTags}
      selectedTag={selectedTag}
      onSelect={setSelectedTag}
      {...props}
    />
  );
};

export default {
  title: 'Components/Filters/TagFilterDropdown',
  component: TagFilterDropdown,
  parameters: { layout: 'padded' }
};

export const SelectedTag = () => <FilterStory />;
export const Loading = () => <FilterStory tags={[]} selectedTag={null} loading />;
export const Error = () => (
  <FilterStory tags={[]} selectedTag={null} error="Could not load tags." />
);
export const Empty = () => <FilterStory tags={[]} selectedTag={null} />;
