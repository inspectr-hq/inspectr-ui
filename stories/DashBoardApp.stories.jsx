import React from 'react';
import DashBoardApp from '../src/components/DashBoardApp';
import InspectrContext from '../src/context/InspectrContext.jsx';
import { createDashboardClient } from './fixtures/inspectrFixtures.js';

export default {
  title: 'Apps/Dashboard/DashBoardApp',
  component: DashBoardApp
};

const DashboardStory = ({ mode, delay = 0 }) => {
  const client = React.useMemo(() => createDashboardClient({ mode, delay }), [mode, delay]);
  return (
    <InspectrContext.Provider value={{ client }}>
      <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-950 sm:p-6">
        <DashBoardApp />
      </div>
    </InspectrContext.Provider>
  );
};

export const Populated = () => <DashboardStory mode="populated" />;
export const Empty = () => <DashboardStory mode="empty" />;
export const Loading = () => <DashboardStory mode="populated" delay={2500} />;
export const Error = () => <DashboardStory mode="error" />;
