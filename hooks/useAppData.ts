import { useState, useEffect, useCallback } from 'react';
import backendApi from '../services/backendApi';
import { AppData, Link, SocialLink, LinkGroup, Palette, Customization, Profile } from '../types';
import { MOCK_APP_DATA } from '../constants';
import { AIGroupSuggestion } from '../services/geminiService';

// Helper function for deep merging, ensuring defaults are applied for missing keys
const mergeWithDefaults = (fetchedData: Partial<AppData>, defaults: AppData): AppData => {
  const merged = { ...defaults, ...fetchedData };
  merged.profile = { ...defaults.profile, ...fetchedData.profile };
  merged.customization = { ...defaults.customization, ...fetchedData.customization };
  // Simple array replacement is fine for these as we transform them next.
  merged.linkGroups = fetchedData.linkGroups || defaults.linkGroups;
  merged.socials = fetchedData.socials || defaults.socials;
  merged.palettes = fetchedData.palettes || defaults.palettes;
  return merged;
};

const transformRtdbObjectsToArrays = (data: AppData): AppData => {
    // ... (rest of the function is the same)
    const transformed = { ...data };

    if (transformed.linkGroups && typeof transformed.linkGroups === 'object' && !Array.isArray(transformed.linkGroups)) {
        transformed.linkGroups = Object.values(transformed.linkGroups);
    } else if (!transformed.linkGroups) {
        transformed.linkGroups = [];
    }

    transformed.linkGroups.forEach(group => {
        if (group.links && typeof group.links === 'object' && !Array.isArray(group.links)) {
            group.links = Object.values(group.links);
        } else if (!group.links) {
            group.links = [];
        }
    });

    if (transformed.socials && typeof transformed.socials === 'object' && !Array.isArray(transformed.socials)) {
        transformed.socials = Object.values(transformed.socials);
    } else if (!transformed.socials) {
        transformed.socials = [];
    }

    if (transformed.palettes && typeof transformed.palettes === 'object' && !Array.isArray(transformed.palettes)) {
        transformed.palettes = Object.values(transformed.palettes);
    } else if (!transformed.palettes) {
        transformed.palettes = [];
    }
    
    return transformed;
};


interface UseAppDataProps {
  isAuthenticated: boolean;
  loggedInUsername: string | null;
  logout: () => void;
}

// ... (interfaces are the same)

export const useAppData = (
  { isAuthenticated, loggedInUsername, logout }: UseAppDataProps
): [AppData | null, boolean, AppDataActions, React.Dispatch<React.SetStateAction<any>>] => {
  const [appData, setAppDataInternal] = useState<AppData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [history, setHistory] = useState<AppData[]>([]);
  const [confirmationState, setConfirmationState] = useState<any>(null);

  // ... (updateAppData and all handlers remain the same)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let rawData;
        if (!isAuthenticated || !loggedInUsername) {
          rawData = MOCK_APP_DATA;
        } else {
          const response = await backendApi.appData.getAppData(loggedInUsername);
          rawData = response.data;
        }
        
        // ** THE FIX IS HERE **
        // Merge the potentially incomplete fetched data with a full default structure.
        const completeData = mergeWithDefaults(rawData, MOCK_APP_DATA);
        // Then, transform the now-complete data.
        const finalData = transformRtdbObjectsToArrays(completeData);

        setAppDataInternal(finalData);
        setHistory([]);
      } catch (error) {
        console.error("Failed to fetch app data:", error);
        if (isAuthenticated) {
          logout();
        }
        // Fallback to a clean, default state on error
        setAppDataInternal(MOCK_APP_DATA);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated, loggedInUsername, logout]);

  // ... (rest of the hook is the same, including the returned actions)
  
  // Dummy definitions for handlers to keep the structure, they will be replaced by the real handlers
  const actions: AppDataActions = {
    handleProfileChange: async () => {},
    handleCustomizationChange: async () => {},
    handleGeneratedThemeApply: async () => {},
    handleUpdatePalette: async () => {},
    handleOverwritePalette: () => {},
    handleLinkChange: async () => {},
    handleAddLink: async () => {},
    handleDeleteLink: () => {},
    handleReorderLink: async () => {},
    handleMoveLinkToGroup: async () => {},
    handleAddGroup: async () => {},
    handleDeleteGroup: () => {},
    handleUpdateGroup: async () => {},
    handleReorderGroup: async () => {},
    handleApplyAIGroups: async () => {},
    handleSocialChange: async () => {},
    handleAddSocial: async () => {},
    handleDeleteSocial: () => {},
    handleReorderSocial: async () => {},
    handleUndo: () => {},
    history: history,
    confirmationState: confirmationState,
  };


  return [
    appData,
    loading,
    actions,
    setConfirmationState,
  ];
};