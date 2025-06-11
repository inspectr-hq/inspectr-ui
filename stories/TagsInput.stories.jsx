// stories/TagsInput.stories.jsx
import React, { useState } from 'react';
import TagsInput from '../src/components/TagsInput.jsx';

export default {
  title: 'Components/TagsInput',
  component: TagsInput
};

export const DefaultTagsInput = () => {
  const [selected, setSelected] = useState([]);
  const options = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];

  return (
    <div className="p-4">
      <TagsInput
        options={options}
        selected={selected}
        onChange={setSelected}
        placeholder="Add HTTP method..."
      />
    </div>
  );
};

export const StatusCodesTagsInput = () => {
  const [selected, setSelected] = useState([]);
  const options = ['200', '201', '204', '301', '302', '400', '401', '403', '404', '500', '502', '503'];

  return (
    <div className="p-4">
      <TagsInput
        options={options}
        selected={selected}
        onChange={setSelected}
        placeholder="Add status code..."
      />
    </div>
  );
};

export const PreselectedTags = () => {
  const [selected, setSelected] = useState(['GET', 'POST']);
  const options = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];

  return (
    <div className="p-4">
      <TagsInput
        options={options}
        selected={selected}
        onChange={setSelected}
        placeholder="Add HTTP method..."
      />
    </div>
  );
};
