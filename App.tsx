import React, { useState, useEffect, useMemo } from 'react';
import { AppData, LinkGroup } from './types';
import ProfileHeader from './components/ProfileHeader';
import LinkButton from './components/LinkButton';
import SocialLinks from './components/SocialLinks';
import AskMeAnything from './components/AskMeAnything';
import ThemeToggle from './components/ThemeToggle';
import EditPanel from './components/EditPanel';
import AuthModal from './components/AuthModal';
import { FONTS, MOCK_APP_DATA, SOCIAL_ICONS } from './constants';
import ConfirmationModal from './components/ConfirmationModal';
import { useAuth } from './hooks/useAuth';
import { useAppData } from './hooks/useAppData';
import backendApi from './services/backendApi';
import toast, { Toaster } from 'react-hot-toast';

const EditIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
  </svg>
);

const UndoIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
    <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
  </svg>
);

// --- TOEGEVOEGD: Logout Icoon ---
const LogoutIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
    </svg>
);

const App: React.FC = () => {
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const {
    authInfo,
    login,
    logout
  } = useAuth();

  const [
    appData,
    appLoading,
    appDataActions,
    setConfirmationState,
  ] = useAppData({
    isAuthenticated: authInfo.isAuthenticated,
    loggedInUsername: authInfo.loggedInUsername,
    logout: logout,
  });

  const customization = useMemo(
    () => appData?.customization || MOCK_APP_DATA.customization,
    [appData],
  );

  useEffect(() => {
    if (!appData) return;

    const root = window.document.documentElement;
    const newTheme = customization.theme || 'light';
    root.classList.remove(newTheme === 'light' ? 'dark' : 'light');
    root.classList.add(newTheme);
    setTheme(newTheme);

    const basePalette = appData.palettes.find((p) => p.id === 'default')!;
    let colors = newTheme === 'light' ? basePalette.light : basePalette.dark;

    if (customization.paletteId === 'custom' && customization.customColors) {
      const customThemeColors = customization.customColors[newTheme] || {};
      colors = { ...colors, ...customThemeColors };
    } else {
      const selectedPalette = appData.palettes.find((p) => p.id === customization.paletteId) || basePalette;
      colors = newTheme === 'light' ? selectedPalette.light : selectedPalette.dark;
    }

    Object.entries(colors).forEach(([key, value]) => {
      if (value) root.style.setProperty(key, value as string);
    });
  }, [customization, appData?.palettes, appData]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editMode = params.get('edit') === 'true';
    if (editMode && !authInfo.isAuthenticated) {
      setIsAuthModalOpen(true);
    }
  }, [authInfo.isAuthenticated]);

  const toggleTheme = () => {
    if (!appData) return;
    const newTheme = appData.customization.theme === 'light' ? 'dark' : 'light';
    appDataActions.handleCustomizationChange({ theme: newTheme });
  };

  const handleExport = async () => {
    if (!authInfo.isAuthenticated || !authInfo.loggedInUsername) {
      toast.error("You must be logged in to export your data.");
      return;
    }
    try {
      // De backend geeft nu al de correcte JSON data terug
      const response = await backendApi.appData.exportAppData(authInfo.loggedInUsername);
      
      // De data is al een JSON-object, we hoeven het alleen maar om te zetten naar een string
      // voor de Blob.
      const dataString = JSON.stringify(response.data, null, 2);
      const blob = new Blob([dataString], { type: 'application/json' });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `linkhub_backup_${authInfo.loggedInUsername}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Data exported successfully!");
    } catch (error) {
      console.error("Failed to export data:", error);
      toast.error("Failed to export data. Please try again.");
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!authInfo.isAuthenticated || !authInfo.loggedInUsername) {
      toast.error("You must be logged in to import data.");
      event.target.value = '';
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        if (typeof text === 'string') {
          const importedData: AppData = JSON.parse(text);
          if (
            importedData.profile &&
            importedData.linkGroups &&
            importedData.customization &&
            importedData.socials &&
            importedData.palettes
          ) {
            await backendApi.appData.importAppData(authInfo.loggedInUsername!, importedData);
            toast.success('Data imported successfully!');
            setIsEditPanelOpen(false);
          } else {
            toast.error("Invalid data file format.");
          }
        }
      } catch (error) {
        toast.error('Failed to read or parse the file.');
        console.error("Import error:", error);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  if ((authInfo.loading || appLoading) && !appData) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const displayAppData = appData || MOCK_APP_DATA;
  const selectedFont = FONTS.find(f => f.id === customization.fontId) || FONTS[0];

  const animationDelayValue = `${200 + (displayAppData.linkGroups?.flatMap(g => g.links || []).length || 0) * 100}ms`;

  return (
    <div className={`relative min-h-screen ${selectedFont.className} bg-[var(--background-color)] text-[var(--text-primary)] transition-colors duration-300`}>
      <Toaster />
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: displayAppData.customization.backgroundImageUrl ? `url('${displayAppData.customization.backgroundImageUrl}')` : 'none' }}
      />
      <div
        className="absolute inset-0 z-0 transition-colors duration-500"
        style={{ backgroundColor: displayAppData.customization.backgroundImageUrl ? 'rgba(0,0,0,0.5)' : 'transparent' }}
      />
      <div className="relative z-10">
        <div className="container mx-auto p-4 max-w-lg relative">
          <div className="absolute top-4 right-4 flex items-center space-x-2">
            {authInfo.isAuthenticated && (
              <>
                <button
                  onClick={appDataActions.handleUndo}
                  disabled={!appDataActions || appDataActions.history.length === 0}
                  className="p-2 rounded-full text-[var(--text-secondary)] bg-[var(--surface-color)] hover:bg-[var(--surface-color-hover)] transition-colors duration-200 disabled:opacity-50"
                  aria-label="Undo last action"
                >
                  <UndoIcon />
                </button>
                <button
                  onClick={() => setIsEditPanelOpen(true)}
                  className="p-2 rounded-full text-[var(--text-secondary)] bg-[var(--surface-color)] hover:bg-[var(--surface-color-hover)] transition-colors duration-200"
                  aria-label="Customize page"
                >
                  <EditIcon />
                </button>
                {/* --- TOEGEVOEGD: Logout Knop --- */}
                <button
                    onClick={logout}
                    className="p-2 rounded-full text-[var(--text-secondary)] bg-[var(--surface-color)] hover:bg-[var(--surface-color-hover)] transition-colors duration-200"
                    aria-label="Logout"
                >
                    <LogoutIcon />
                </button>
              </>
            )}
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          </div>
          <main className="flex flex-col items-center pt-12">
            <div className="opacity-0 animate-fade-in-up">
              <ProfileHeader profile={displayAppData.profile} />
            </div>
            <div className="opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <SocialLinks socials={displayAppData.socials} icons={SOCIAL_ICONS} />
            </div>
            <div className="w-full mt-8 space-y-2">
              {displayAppData.linkGroups.map((group: LinkGroup) => (
                <div key={group.id} className="w-full">
                  {group.title && <h2 className="text-lg font-bold text-[var(--text-primary)] text-center my-4 opacity-0 animate-fade-in-up">{group.title}</h2>}
                  <div className="space-y-4">
                    {Array.isArray(group.links) && group.links.map((link, index) => (
                      <div key={link.id} className="opacity-0 animate-fade-in-up" style={{ animationDelay: `${200 + index * 100}ms` }}>
                        <LinkButton
                          link={link}
                          animationId={displayAppData.customization.linkAnimation}
                          ownerUsername={displayAppData.profile.name}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="w-full mt-10 p-6 bg-[var(--surface-color)] rounded-2xl shadow-md border border-[var(--border-color)] opacity-0 animate-fade-in-up" style={{ animationDelay: animationDelayValue }}>
              <AskMeAnything influencerName={displayAppData.profile.name} influencerBio={displayAppData.profile.bio} />
            </div>
            <footer className="text-center mt-12 pb-8">
              <p className="text-sm text-[var(--text-secondary)]">Created with Link Hub</p>
              {!authInfo.isAuthenticated && (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="mt-2 text-xs text-[var(--text-secondary)] underline hover:text-[var(--accent-color)] transition-colors"
                >
                  Admin Login
                </button>
              )}
            </footer>
          </main>
        </div>

        {authInfo.isAuthenticated && appData && appDataActions && (
          <EditPanel
            isOpen={isEditPanelOpen}
            onClose={() => setIsEditPanelOpen(false)}
            appData={appData}
            theme={theme}
            onExport={handleExport}
            onImport={handleImport}
            onProfileChange={appDataActions.handleProfileChange}
            onCustomizationChange={appDataActions.handleCustomizationChange}
            onGeneratedThemeApply={appDataActions.handleGeneratedThemeApply}
            onUpdatePalette={appDataActions.handleUpdatePalette}
            onOverwritePalette={appDataActions.handleOverwritePalette}
            onLinkChange={appDataActions.handleLinkChange}
            onAddLink={appDataActions.handleAddLink}
            onDeleteLink={appDataActions.handleDeleteLink}
            onReorderLink={appDataActions.handleReorderLink}
            onMoveLinkToGroup={appDataActions.handleMoveLinkToGroup}
            onSocialChange={appDataActions.handleSocialChange}
            onAddSocial={appDataActions.handleAddSocial}
            onDeleteSocial={appDataActions.handleDeleteSocial}
            onReorderSocial={appDataActions.handleReorderSocial}
            onAddGroup={appDataActions.handleAddGroup}
            onDeleteGroup={appDataActions.handleDeleteGroup}
            onUpdateGroup={appDataActions.handleUpdateGroup}
            onReorderGroup={appDataActions.handleReorderGroup}
            onApplyAIGroups={appDataActions.handleApplyAIGroups}
            loggedInUsername={authInfo.loggedInUsername}
          />
        )}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={async (token, username) => {
            await login({ token, username });
            setIsAuthModalOpen(false);
          }}
          onRegisterSuccess={async (token, username) => {
             await login({ token, username });
             setIsAuthModalOpen(false)
          }}
        />
        {appDataActions && appDataActions.confirmationState?.isOpen && (
          <ConfirmationModal
            isOpen={appDataActions.confirmationState.isOpen}
            onClose={() => setConfirmationState(null)}
            onConfirm={appDataActions.confirmationState.onConfirm}
            title={appDataActions.confirmationState.title}
            message={appDataActions.confirmationState.message}
          />
        )}
      </div>
    </div>
  );
};

export default App;