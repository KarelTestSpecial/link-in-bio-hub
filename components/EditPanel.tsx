import React, { useState } from 'react';
import { AppData } from '../types';

// Import extracted components
import Section from './Section';
import AnalyticsSection from './AnalyticsSection';
import LinkGroupManager from './LinkGroupManager'; 
import QRCodeDisplay from './QRCodeDisplay';
import ProfileAndSocialsEditor from './ProfileAndSocialsEditor';
import AppearanceEditor from './AppearanceEditor';

// Define icons that are ONLY used in EditPanel's direct JSX (like CloseIcon)
const CloseIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Define interfaces for props that EditPanel will pass down to its children
// This helps in planning the props for the new components
interface EditPanelProps {
  isOpen: boolean;
  onClose: () => void;
  appData: AppData;
  theme: 'light' | 'dark';
  loggedInUsername: string | null;

  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;

  // Handlers from useAppData (all expected to be here)
  onProfileChange: (updates: Partial<AppData['profile']>) => Promise<void>;
  onCustomizationChange: (newCustomization: Partial<AppData['customization']>) => Promise<void>;
  onGeneratedThemeApply: (newTheme: { name: string, colors: AppData['customization']['customColors'] }) => Promise<void>;
  onUpdatePalette: (paletteId: string, updates: Partial<Palette>) => Promise<void>;
  onOverwritePalette: (paletteId: string) => void;
  onLinkChange: (id: string, updates: Partial<Omit<Link, 'id' | 'clicks' | 'active'>>) => Promise<void>;
  onAddLink: (groupId: string, newLink: Omit<Link, 'id' | 'clicks' | 'active'>) => Promise<void>;
  onDeleteLink: (id: string) => void;
  onReorderLink: (id: string, direction: 'up' | 'down') => Promise<void>;
  onMoveLinkToGroup: (linkId: string, targetGroupId: string) => Promise<void>;
  onSocialChange: (id: string, field: keyof Omit<SocialLink, 'id'>, value: string) => Promise<void>;
  onAddSocial: () => Promise<void>;
  onDeleteSocial: (id: string) => void;
  onReorderSocial: (id: string, direction: 'up' | 'down') => Promise<void>;
  onAddGroup: (title: string) => Promise<void>;
  onDeleteGroup: (groupId: string) => void;
  onUpdateGroup: (groupId: string, updates: Partial<Omit<LinkGroup, 'id' | 'links'>>) => Promise<void>;
  onReorderGroup: (groupId: string, direction: 'up' | 'down') => Promise<void>;
  onApplyAIGroups: (suggestions: AIGroupSuggestion[]) => Promise<void>;
}

const EditPanel: React.FC<EditPanelProps> = ({
  isOpen,
  onClose,
  appData,
  theme,
  loggedInUsername,
  onExport,
  onImport,
  onProfileChange,
  onCustomizationChange,
  onGeneratedThemeApply,
  onUpdatePalette,
  onOverwritePalette,
  onLinkChange,
  onAddLink,
  onDeleteLink,
  onReorderLink,
  onMoveLinkToGroup,
  onSocialChange,
  onAddSocial,
  onDeleteSocial,
  onReorderSocial,
  onAddGroup,
  onDeleteGroup,
  onUpdateGroup,
  onReorderGroup,
  onApplyAIGroups,
}) => {
  // Destructure appData for easier access when passing to children
  const { customization, profile, linkGroups, socials, palettes } = appData;
  

  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/50 transition-opacity" aria-hidden="true" onClick={onClose}></div>
      <div className="relative ml-auto h-full w-full max-w-sm bg-[var(--surface-color)] text-[var(--text-primary)] shadow-xl flex flex-col transition-transform transform translate-x-0">
        <header className="p-4 flex justify-between items-center border-b border-[var(--border-color)]">
          <h2 className="text-lg font-semibold">Customize Page</h2>
          <button onClick={onClose} className="p-1 rounded-full text-[var(--text-secondary)] hover:bg-[var(--surface-color-hover)]" aria-label="Close customization panel">
            <CloseIcon />
          </button>
        </header>

        <div className="p-6 overflow-y-auto flex-grow">
          {/* Link Group Manager Component */}
          <LinkGroupManager
            linkGroups={linkGroups}
            theme={theme}
            onLinkChange={onLinkChange}
            onAddLink={onAddLink}
            onDeleteLink={onDeleteLink}
            onReorderLink={onReorderLink}
            onMoveLinkToGroup={onMoveLinkToGroup}
            onAddGroup={onAddGroup}
            onDeleteGroup={onDeleteGroup}
            onUpdateGroup={onUpdateGroup}
            onReorderGroup={onReorderGroup}
            onApplyAIGroups={onApplyAIGroups}
          />

          {/* Profile & Socials Editor Component */}
          <ProfileAndSocialsEditor
            profile={profile}
            socials={socials}
            onProfileChange={onProfileChange}
            onSocialChange={onSocialChange}
            onAddSocial={onAddSocial}
            onDeleteSocial={onDeleteSocial}
            onReorderSocial={onReorderSocial}
          />


          {/* Appearance Editor Component */}
          <AppearanceEditor
            customization={customization}
            palettes={palettes}
            theme={theme}
            onCustomizationChange={onCustomizationChange}
            onGeneratedThemeApply={onGeneratedThemeApply}
            onUpdatePalette={onUpdatePalette}
            onOverwritePalette={onOverwritePalette}
          />


          {/* QR Code Display Component */}
          <QRCodeDisplay
            isOpen={isOpen} 
            theme={theme}
          />

          {/* Analytics Section Component */}
          <AnalyticsSection loggedInUsername={loggedInUsername} />

          {/* Import/Export (remains in EditPanel as it impacts overall appData) */}
          <Section title="Data Management">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Backup & Restore</h3>
                <button
                  onClick={onExport}
                  className="w-full p-2 rounded-md bg-[var(--accent-color)] text-white hover:bg-[var(--accent-color-hover)] text-sm font-semibold transition-colors"
                >
                  Export All Data (.json)
                </button>
                <label className="w-full mt-2 p-2 rounded-md border-2 border-dashed border-[var(--border-color)] hover:border-[var(--accent-color)] text-sm font-semibold text-center block cursor-pointer">
                  Import Data (.json)
                  <input type="file" accept=".json" className="hidden" onChange={onImport} />
                </label>
              </div>
            </div>
          </Section>

        </div> {/* Closes p-6 overflow-y-auto flex-grow */}
      </div> {/* Closes relative ml-auto h-full w-full max-w-sm ... */}
    </div> // Closes fixed inset-0 z-50 flex
  );
};

export default EditPanel;
