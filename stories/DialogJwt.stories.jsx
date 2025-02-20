// src/stories/JWTDialog.stories.jsx
import React, { useState } from 'react';
import DialogJwt from '../src/components/DialogJwt';

export default {
  title: 'Components/DialogJwt',
  component: DialogJwt
};

const Template = (args) => {
  const [open, setOpen] = useState(args.open);

  return (
    <div className="p-8">
      <button
        onClick={() => setOpen(true)}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Open JWT Dialog
      </button>
      <DialogJwt {...args} open={open} onClose={() => setOpen(false)} />
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {
  open: true,
  decoded: {
    header: { alg: 'HS256', typ: 'JWT' },
    payload: {
      sub: '1234567890',
      name: 'John Doe',
      admin: true,
      iat: 1516239022
    },
    signature: 'SlHNXLq0UOsu4m0PmnUyD3lpd_KsIOBqkY5wBYDHu90'
  }
};
