import React, { useState, useCallback, useEffect } from 'react'; // Added useEffect
import { AnalyticsResponse } from '../types';
import backendApi from '../services/backendApi'; // Import backendApi as default

interface AnalyticsSectionProps {
  loggedInUsername: string | null;
}

// Re-defined Section component locally for clarity, or import if it's a shared component
// Assuming Section is a shared component and should be imported from './Section'
import Section from './Section';

const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ loggedInUsername }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsResponse | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [error, setError] = useState<string | null>(null); // Added error state

  const handleLoadAnalytics = useCallback(async () => {
    if (!loggedInUsername) {
      console.warn("Attempted to load analytics without a logged-in user.");
      setAnalyticsData(null); // Clear previous data if user logs out
      setError(null);
      return; // Cannot load analytics without a logged-in user
    }
    setLoadingAnalytics(true);
    setAnalyticsData(null); // Clear previous data
    setError(null); // Clear previous errors
    try {
      // Corrected function call: Access getAnalytics via backendApi.analytics
      const response = await backendApi.analytics.getAnalytics(loggedInUsername);
      // Assuming response.data contains the AnalyticsResponse
      setAnalyticsData(response.data);
    } catch (err: any) {
      console.error("Failed to load analytics:", err);
      setError(err.message || "Could not load analytics data."); // Set error state
      setAnalyticsData(null); // Clear data on error
    } finally {
      setLoadingAnalytics(false);
    }
  }, [loggedInUsername]); // Dependency array includes loggedInUsername

  // Optional: Load analytics automatically when username is available
  useEffect(() => {
    if (loggedInUsername && !analyticsData && !loadingAnalytics && !error) {
      handleLoadAnalytics();
    }
  }, [loggedInUsername, analyticsData, loadingAnalytics, error, handleLoadAnalytics]); // Added dependencies

  return (
    <Section title="Analytics">
      <p className="text-xs text-[var(--text-secondary)] mb-3">View click data for your links.</p>
      <button
        onClick={handleLoadAnalytics}
        disabled={loadingAnalytics || !loggedInUsername}
        className="w-full p-2 rounded-md bg-[var(--accent-color)] text-white hover:bg-[var(--accent-color-hover)] text-sm font-semibold disabled:bg-[var(--disabled-background-color)] disabled:cursor-not-allowed transition-colors"
      >
        {loadingAnalytics ? 'Loading...' : 'Load Analytics'}
      </button>

      {loadingAnalytics && (
        <p className="text-center text-sm text-[var(--text-secondary)] mt-3">Loading analytics data...</p>
      )}
      {error && !loadingAnalytics && ( // Display error if present and not loading
        <p className="text-center text-sm text-red-500 mt-3">Error: {error}</p>
      )}
      {analyticsData && analyticsData.length > 0 && !loadingAnalytics && !error && ( // Display data only if available, not loading, and no error
        <ul className="mt-4 space-y-2">
          {analyticsData.map((item, index) => (
            <li key={index} className="flex justify-between items-center text-sm p-2 bg-[var(--background-color)] rounded-md border border-[var(--border-color)]">
              <span>{item.linkId} - {item.timestamp ? new Date(item.timestamp._seconds * 1000).toLocaleString() : 'N/A'}</span>
              {/* Assuming the analytics response contains a clicks count per link */}
              <span className="font-semibold text-[var(--accent-color)]">{item.clicks || 0} clicks</span>
            </li>
          ))}
        </ul>
      )}
      {analyticsData && analyticsData.length === 0 && !loadingAnalytics && !error && ( // Display message if no clicks and not loading/error
        <p className="text-center text-sm text-[var(--text-secondary)] mt-3">No clicks recorded yet.</p>
      )}
    </Section>
  );
};

export default AnalyticsSection;