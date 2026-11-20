import React from 'react';
import EndpointMode from '../src/components/insights/EndpointMode.jsx';
import EmptyState from '../src/components/insights/EmptyState.jsx';
import ListMode from '../src/components/insights/ListMode.jsx';
import OperationCard from '../src/components/insights/OperationCard.jsx';
import TimelineMode from '../src/components/insights/TimelineMode.jsx';
import {
  analyticsSummary,
  analyticsSeries,
  insightsOperations
} from './fixtures/inspectrFixtures.js';
import { endpointKey, normalizeOperation } from '../src/components/insights/insightsUtils.js';

const operations = insightsOperations.map(normalizeOperation).filter(Boolean);
const endpoints = analyticsSummary.summaries.map((endpoint) => ({
  ...endpoint,
  key: endpointKey(endpoint.method, endpoint.path),
  chartData: analyticsSeries.series.map((point) => ({ time: point.ts, duration: point.duration })),
  seriesLoading: false,
  seriesError: null
}));

export default {
  title: 'Components/Insights',
  parameters: { layout: 'padded' }
};

export const EndpointOverview = () => (
  <EndpointMode endpoints={endpoints} loading={false} error={null} />
);
export const EndpointLoading = () => <EndpointMode endpoints={[]} loading={true} error={null} />;
export const EndpointError = () => (
  <EndpointMode endpoints={[]} loading={false} error={new Error('Statistics service unavailable')} />
);
export const EndpointEmpty = () => <EndpointMode endpoints={[]} loading={false} error={null} />;
export const OperationCards = () => <ListMode operations={operations} />;
export const OperationCardsEmpty = () => <ListMode operations={[]} />;
export const OperationCardDetail = () => <OperationCard operation={operations[0]} />;
export const Timeline = () => <TimelineMode operations={operations} />;
export const SharedEmptyState = () => (
  <EmptyState message="No operations match the current filters." />
);
