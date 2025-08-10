// --- START OF FILE useAppData.ts ---

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Importeer uuid
import backendApi from '../services/backendApi';
import { AppData, Link, SocialLink, LinkGroup, Palette, Customization, Profile } from '../types';
import { MOCK_APP_DATA } from '../constants';
import { AIGroupSuggestion } from '../services/geminiService';
import toast from 'react-hot-toast';

// Helper functies (blijven ongewijzigd)
const mergeWithDefaults = (fetchedData: Partial<AppData>, defaults: AppData): AppData => {
  const merged = { ...defaults, ...fetchedData };
  merged.profile = { ...defaults.profile, ...fetchedData.profile };
  merged.customization = { ...defaults.customization, ...fetchedData.customization };
  merged.linkGroups = fetchedData.linkGroups || defaults.linkGroups;
  merged.socials = fetchedData.socials || defaults.socials;
  merged.palettes = fetchedData.palettes || defaults.palettes;
  return merged;
};

const transformRtdbObjectsToArrays = (data: AppData): AppData => {
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

// Interfaces voor de acties die de hook retourneert
export interface AppDataActions {
    handleProfileChange: (updates: Partial<Profile>) => Promise<void>;
    handleCustomizationChange: (updates: Partial<Customization>) => Promise<void>;
    handleGeneratedThemeApply: (newTheme: { name: string, colors: AppData['customization']['customColors'] }) => Promise<void>;
    handleUpdatePalette: (paletteId: string, updates: Partial<Palette>) => Promise<void>;
    handleOverwritePalette: (paletteId: string) => void;
    handleLinkChange: (id: string, updates: Partial<Omit<Link, 'id'>>) => Promise<void>;
    handleAddLink: (groupId: string, newLink: Omit<Link, 'id'>) => Promise<void>;
    handleDeleteLink: (id: string) => void;
    handleReorderLink: (id: string, direction: 'up' | 'down') => Promise<void>;
    handleMoveLinkToGroup: (linkId: string, targetGroupId: string) => Promise<void>;
    handleAddGroup: (title: string) => Promise<void>;
    handleDeleteGroup: (groupId: string) => void;
    handleUpdateGroup: (groupId: string, updates: Partial<Omit<LinkGroup, 'id' | 'links'>>) => Promise<void>;
    handleReorderGroup: (groupId: string, direction: 'up' | 'down') => Promise<void>;
    handleApplyAIGroups: (suggestions: AIGroupSuggestion[]) => Promise<void>;
    handleSocialChange: (id: string, field: keyof Omit<SocialLink, 'id'>, value: string) => Promise<void>;
    handleAddSocial: () => Promise<void>;
    handleDeleteSocial: (id: string) => void;
    handleReorderSocial: (id: string, direction: 'up' | 'down') => Promise<void>;
    handleUndo: () => void;
    history: AppData[];
    confirmationState: any;
}

interface UseAppDataProps {
  isAuthenticated: boolean;
  loggedInUsername: string | null;
  logout: () => void;
}

export const useAppData = (
  { isAuthenticated, loggedInUsername, logout }: UseAppDataProps
): [AppData | null, boolean, AppDataActions, React.Dispatch<React.SetStateAction<any>>] => {
  const [appData, setAppDataInternal] = useState<AppData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [history, setHistory] = useState<AppData[]>([]);
  const [confirmationState, setConfirmationState] = useState<any>(null);

  const updateAppData = useCallback((newData: AppData, undoable: boolean = true) => {
    if (undoable) {
      setHistory(prevHistory => {
        const newHistory = [appData!, ...prevHistory];
        if (newHistory.length > 20) newHistory.pop();
        return newHistory;
      });
    }
    setAppDataInternal(newData);
    
    if (isAuthenticated && loggedInUsername) {
      backendApi.appData.updateAppData(loggedInUsername, newData).catch(err => {
        console.error("Failed to sync data with backend:", err);
        toast.error("Could not save changes to the server.");
        // Optioneel: zet de state terug naar de vorige werkende staat
        if (undoable && history.length > 0) {
          setAppDataInternal(history[0]);
        }
      });
    }
  }, [appData, isAuthenticated, loggedInUsername, history]);
  
  const handleUndo = useCallback(() => {
    if (history.length > 0) {
      const previousState = history[0];
      setHistory(history.slice(1));
      updateAppData(previousState, false); // Update de state en stuur naar backend, maar voeg niet opnieuw toe aan geschiedenis
      toast('Undo successful!');
    }
  }, [history, updateAppData]);

  // --- Implementaties ---
  const handleProfileChange = useCallback(async (updates: Partial<Profile>) => {
    if (!appData) return;
    const newData = JSON.parse(JSON.stringify(appData));
    newData.profile = { ...newData.profile, ...updates };
    updateAppData(newData);
    // toast.success('Profile updated!');
  }, [appData, updateAppData]);

  const handleCustomizationChange = useCallback(async (updates: Partial<Customization>) => {
    if (!appData) return;
    const newData = JSON.parse(JSON.stringify(appData));
    newData.customization = { ...newData.customization, ...updates };
    updateAppData(newData);
    // Toon alleen een toast als het NIET de themawissel is, want die heeft al directe visuele feedback.
    if (!updates.theme) {
        toast.success('Appearance updated!');
    }
  }, [appData, updateAppData]);

  const handleAddLink = useCallback(async (groupId: string, newLinkData: Omit<Link, 'id'>) => {
    if (!appData) return;
    const newData = JSON.parse(JSON.stringify(appData));
    const group = newData.linkGroups.find((g: LinkGroup) => g.id === groupId);
    if (group) {
        const newLink: Link = { id: uuidv4(), ...newLinkData };
        group.links.push(newLink);
        updateAppData(newData);
        toast.success('Link added!');
    }
  }, [appData, updateAppData]);

  const handleDeleteLink = useCallback((id: string) => {
    setConfirmationState({
        isOpen: true,
        title: "Delete Link",
        message: "Are you sure you want to delete this link?",
        onConfirm: () => {
            if (!appData) return;
            const newData = JSON.parse(JSON.stringify(appData));
            newData.linkGroups.forEach((group: LinkGroup) => {
                group.links = group.links.filter((link: Link) => link.id !== id);
            });
            updateAppData(newData);
            toast.success('Link deleted!');
            setConfirmationState(null);
        },
    });
  }, [appData, updateAppData]);
  
  const handleLinkChange = useCallback(async (id: string, updates: Partial<Link>) => {
    if (!appData) return;
    const newData = JSON.parse(JSON.stringify(appData));
    for (const group of newData.linkGroups) {
        const link = group.links.find((l: Link) => l.id === id);
        if (link) {
            Object.assign(link, updates);
            break;
        }
    }
    updateAppData(newData, false);
  }, [appData, updateAppData]);

  const handleReorderLink = useCallback(async (id: string, direction: 'up' | 'down') => {
    if (!appData) return;
    const newData = JSON.parse(JSON.stringify(appData));
    for (const group of newData.linkGroups) {
      const index = group.links.findIndex((l: Link) => l.id === id);
      if (index !== -1) {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex >= 0 && newIndex < group.links.length) {
          const [movedLink] = group.links.splice(index, 1);
          group.links.splice(newIndex, 0, movedLink);
          updateAppData(newData);
          break;
        }
      }
    }
  }, [appData, updateAppData]);

  const handleAddGroup = useCallback(async (title: string) => {
    if (!appData) return;
    const newData = JSON.parse(JSON.stringify(appData));
    const newGroup: LinkGroup = { id: uuidv4(), title, links: [] };
    newData.linkGroups.push(newGroup);
    updateAppData(newData);
    toast.success('Group added!');
  }, [appData, updateAppData]);

  const handleDeleteGroup = useCallback((groupId: string) => {
     setConfirmationState({
        isOpen: true,
        title: "Delete Group",
        message: "Are you sure you want to delete this group and all its links?",
        onConfirm: () => {
            if (!appData) return;
            const newData = JSON.parse(JSON.stringify(appData));
            newData.linkGroups = newData.linkGroups.filter((g: LinkGroup) => g.id !== groupId);
            updateAppData(newData);
            toast.success('Group deleted!');
            setConfirmationState(null);
        },
    });
  }, [appData, updateAppData]);
  
   const handleUpdateGroup = useCallback(async (groupId: string, updates: Partial<LinkGroup>) => {
    if (!appData) return;
    const newData = JSON.parse(JSON.stringify(appData));
    const group = newData.linkGroups.find((g: LinkGroup) => g.id === groupId);
    if(group) {
        Object.assign(group, updates);
        updateAppData(newData, false);
    }
  }, [appData, updateAppData]);
  
  const handleAddSocial = useCallback(async () => {
    if(!appData) return;
    const newData = JSON.parse(JSON.stringify(appData));
    const newSocial: SocialLink = { id: uuidv4(), platform: 'Website', url: '' };
    newData.socials.push(newSocial);
    updateAppData(newData);
  }, [appData, updateAppData]);
  
  const handleDeleteSocial = useCallback((id: string) => {
    if (!appData) return;
    const newData = JSON.parse(JSON.stringify(appData));
    newData.socials = newData.socials.filter((s: SocialLink) => s.id !== id);
    updateAppData(newData);
    toast.success('Social link deleted!');
  }, [appData, updateAppData]);

  const handleSocialChange = useCallback(async (id: string, field: keyof Omit<SocialLink, 'id'>, value: string) => {
    if(!appData) return;
    const newData = JSON.parse(JSON.stringify(appData));
    const social = newData.socials.find((s: SocialLink) => s.id === id);
    if(social) {
        social[field] = value;
        updateAppData(newData, false);
    }
  }, [appData, updateAppData]);

  const handleMoveLinkToGroup = useCallback(async (linkId: string, targetGroupId: string) => {
    if (!appData) return;
    const newData = JSON.parse(JSON.stringify(appData));
    let linkToMove: Link | undefined;
    let sourceGroup: LinkGroup | undefined;
    for (const group of newData.linkGroups) {
      const linkIndex = group.links.findIndex((l: Link) => l.id === linkId);
      if (linkIndex > -1) {
        [linkToMove] = group.links.splice(linkIndex, 1);
        sourceGroup = group;
        break;
      }
    }
    if (linkToMove) {
      const targetGroup = newData.linkGroups.find((g: LinkGroup) => g.id === targetGroupId);
      if (targetGroup) {
        targetGroup.links.push(linkToMove);
        updateAppData(newData);
      }
    }
  }, [appData, updateAppData]);

  const handleReorderGroup = useCallback(async (groupId: string, direction: 'up' | 'down') => {
    if (!appData) return;
    const newData = JSON.parse(JSON.stringify(appData));
    const index = newData.linkGroups.findIndex((g: LinkGroup) => g.id === groupId);
    if (index !== -1) {
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex >= 0 && newIndex < newData.linkGroups.length) {
        const [movedGroup] = newData.linkGroups.splice(index, 1);
        newData.linkGroups.splice(newIndex, 0, movedGroup);
        updateAppData(newData);
      }
    }
  }, [appData, updateAppData]);

  const handleReorderSocial = useCallback(async (id: string, direction: 'up' | 'down') => {
    if (!appData) return;
    const newData = JSON.parse(JSON.stringify(appData));
    const index = newData.socials.findIndex((s: SocialLink) => s.id === id);
    if (index !== -1) {
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex >= 0 && newIndex < newData.socials.length) {
        const [movedSocial] = newData.socials.splice(index, 1);
        newData.socials.splice(newIndex, 0, movedSocial);
        updateAppData(newData);
      }
    }
  }, [appData, updateAppData]);

  const handleGeneratedThemeApply = useCallback(async (newTheme: { name: string, colors: AppData['customization']['customColors'] }) => {
    if (!appData) return;
    const newData = JSON.parse(JSON.stringify(appData));
    newData.customization.customColors = newTheme.colors;
    newData.customization.customPaletteName = newTheme.name;
    newData.customization.paletteId = 'custom';
    updateAppData(newData);
    toast.success(`AI theme '${newTheme.name}' applied!`);
  }, [appData, updateAppData]);

  const handleUpdatePalette = useCallback(async (paletteId: string, updates: Partial<Palette>) => {
    if (!appData) return;
    const newData = JSON.parse(JSON.stringify(appData));
    const palette = newData.palettes.find((p: Palette) => p.id === paletteId);
    if(palette) {
        Object.assign(palette, updates);
        updateAppData(newData);
    }
  }, [appData, updateAppData]);

  const handleOverwritePalette = useCallback((paletteId: string) => {
    if (!appData) return;
    const paletteToOverwrite = appData.palettes.find(p => p.id === paletteId);
    if (!paletteToOverwrite) return;

    setConfirmationState({
        isOpen: true,
        title: `Overwrite '${paletteToOverwrite.name}'?`,
        message: "Are you sure you want to overwrite this palette with your current custom colors?",
        onConfirm: () => {
            const newData = JSON.parse(JSON.stringify(appData));
            const palette = newData.palettes.find((p: Palette) => p.id === paletteId);
            if (palette && appData.customization.paletteId === 'custom') {
                palette.name = appData.customization.customPaletteName || palette.name;
                palette.light = { ...MOCK_APP_DATA.palettes[0].light, ...appData.customization.customColors.light };
                palette.dark = { ...MOCK_APP_DATA.palettes[0].dark, ...appData.customization.customColors.dark };
                updateAppData(newData);
                toast.success(`Palette '${palette.name}' updated!`);
            }
            setConfirmationState(null);
        },
    });
  }, [appData, updateAppData]);
  
  const handleApplyAIGroups = useCallback(async (suggestions: AIGroupSuggestion[]) => {
    if (!appData) return;
    const newData = JSON.parse(JSON.stringify(appData));
    const allLinks = newData.linkGroups.flatMap((g: LinkGroup) => g.links);
    
    const newGroups: LinkGroup[] = suggestions.map((suggestion) => ({
        id: uuidv4(),
        title: suggestion.groupTitle, // Backend geeft 'title' terug nu
        links: suggestion.linkIds.map(id => allLinks.find((l: Link) => l.id === id)).filter((l): l is Link => !!l)
    }));
    
    // Check for links that were not categorized by AI and add them to a "Misc" group
    const categorizedLinkIds = new Set(suggestions.flatMap(s => s.linkIds));
    const uncategorizedLinks = allLinks.filter((l: Link) => !categorizedLinkIds.has(l.id));

    if (uncategorizedLinks.length > 0) {
        newGroups.push({
            id: uuidv4(),
            title: "Miscellaneous",
            links: uncategorizedLinks
        });
    }

    newData.linkGroups = newGroups;
    updateAppData(newData);
    toast.success("Links organized with AI!");
  }, [appData, updateAppData]);


  // Effect om data te fetchen
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
        
        const completeData = mergeWithDefaults(rawData, MOCK_APP_DATA);
        // De backend transformeert al, dus deze stap is nu voor de fallback MOCK_DATA
        const finalData = Array.isArray(completeData.linkGroups) ? completeData : transformRtdbObjectsToArrays(completeData);

        setAppDataInternal(finalData);
        setHistory([]);
      } catch (error) {
        console.error("Failed to fetch app data:", error);
        if (isAuthenticated) { logout(); }
        setAppDataInternal(MOCK_APP_DATA);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated, loggedInUsername, logout]);
  
  const actions: AppDataActions = {
    handleProfileChange,
    handleCustomizationChange,
    handleGeneratedThemeApply,
    handleUpdatePalette,
    handleOverwritePalette,
    handleLinkChange,
    handleAddLink,
    handleDeleteLink,
    handleReorderLink,
    handleMoveLinkToGroup,
    handleAddGroup,
    handleDeleteGroup,
    handleUpdateGroup,
    handleReorderGroup,
    handleApplyAIGroups,
    handleSocialChange,
    handleAddSocial,
    handleDeleteSocial,
    handleReorderSocial,
    handleUndo,
    history,
    confirmationState,
  };

  return [
    appData,
    loading,
    actions,
    setConfirmationState,
  ];
};