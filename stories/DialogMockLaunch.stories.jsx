import React, { useEffect } from 'react';
import DialogMockLaunch from '../src/components/settings/DialogMockLaunch.jsx';
import { InspectrProvider } from '../src/context/InspectrContext';

export default {
  title: 'Components/DialogMockLaunch',
  component: DialogMockLaunch
};

const Template = () => {
  useEffect(() => {
    window.history.replaceState({}, '', '?openapi=https://example.com/openapi.yaml');
  }, []);
  return (
    <InspectrProvider>
      <DialogMockLaunch />
    </InspectrProvider>
  );
};

export const Default = Template.bind({});
