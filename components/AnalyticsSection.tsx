import React, { useState, useCallback, useEffect } from 'react';
import { AnalyticsResponse, LinkGroup } from '../types';
import backendApi from '../services/backendApi';
import Section from './Section';

interface AnalyticsSectionProps {
  loggedInUsername: string | null;
  linkGroups: LinkGroup[];
}

const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ loggedInUsername, linkGroups }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleMap = new Map(linkGroups.flatMap(g => g.links).map(l => [l.id, l.title]));

  const handleLoadAnalytics = useCallback(async () => {
    if (!loggedInUsername) {
      console.warn("Attempted to load analytics without a logged-in user.");
      setAnalyticsData(null);
      setError(null);
      return;
    }
    setLoadingAnalytics(true);
    setAnalyticsData(null);
    setError(null);
    try {
      const response = await backendApi.analytics.getAnalytics(loggedInUsername);
      setAnalyticsData(response.data);
    } catch (err: any) {
      console.error("Failed to load analytics:", err);
      setError(err.message || "Could not load analytics data.");
      setAnalyticsData(null);
    } finally {
      setLoadingAnalytics(false);
    }
  }, [loggedInUsername]);

  useEffect(() => {
    if (loggedInUsername && !analyticsData && !loadingAnalytics && !error) {
      handleLoadAnalytics();
    }
  }, [loggedInUsername, analyticsData, loadingAnalytics, error, handleLoadAnalytics]);

  return (
    <Section title="Analytics">
      <p className="text-xs text-[var(--text-secondary)] mb-3">View click data for your links.</p>
      <button
        onClick={handleLoadAnalytics}
        disabled={loadingAnalytics || !loggedInUsername}
        className="w-full p-2 rounded-md bg-[var(--accent-color)] text-white hover:bg-[var(--accent-color-hover)] text-sm font-semibold disabled:bg-[var(--disabled-background-color)] disabled:cursor-not-allowed transition-colors"
      >
        {loadingAnalytics ? 'Loading...' : 'Refresh Analytics'}
      </button>

      {loadingAnalytics && (
        <p className="text-center text-sm text-[var(--text-secondary)] mt-3">Loading analytics data...</p>
      )}
      {error && !loadingAnalytics && (
        <p className="text-center text-sm text-red-500 mt-3">Error: {error}</p>
      )}
      {analyticsData && analyticsData.length > 0 && !loadingAnalytics && !error && (
        <ul className="mt-4 space-y-2">
          {analyticsData.map((item) => (
            <li key={item.linkId} className="flex justify-between items-center text-sm p-2 bg-[var(--background-color)] rounded-md border border-[var(--border-color)]">
              <span className="truncate pr-2">{item.title && item.title !== 'N/A' ? item.title : titleMap.get(item.linkId) || item.linkId}</span>
              <span className="font-semibold text-[var(--accent-color)] whitespace-nowrap">{item.clicks || 0} clicks</span>
            </li>
          ))}
        </ul>
      )}
      {analyticsData && analyticsData.length === 0 && !loadingAnalytics && !error && (
        <p className="text-center text-sm text-[var(--text-secondary)] mt-3">No clicks recorded yet.</p>
      )}
    </Section>
  );
};

export default AnalyticsSection;