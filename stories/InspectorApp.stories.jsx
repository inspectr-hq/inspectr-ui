// stories/InspectrApp.stories.jsx
import React from 'react';
import InspectrApp from '../src/components/InspectrApp.jsx';

export default {
  title: 'Apps/Inspectr/InspectrApp',
  component: InspectrApp
};

const Template = (args) => <InspectrApp {...args} />;

export const Default = Template.bind({});
