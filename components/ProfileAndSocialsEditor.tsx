import React, { useState } from 'react';
import { AppData, SocialLink } from '../types';
import { PREDEFINED_SOCIAL_PLATFORMS } from '../constants';
import backendApi from '../services/backendApi'; // Import backendApi
import Section from './Section';

// Icons specific to Profile and Socials Editor
const MagicIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4"} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M11.3 2.24a.75.75 0 011.06 0l2.25 2.25a.75.75 0 010 1.06l-2.25 2.25a.75.75 0 01-1.06 0l-2.25-2.25a.75.75 0 010-1.06l2.25-2.25zM5.3 8.24a.75.75 0 011.06 0l2.25 2.25a.75.75 0 010 1.06l-2.25 2.25a.75.75 0 01-1.06 0l-2.25-2.25a.75.75 0 010-1.06l2.25-2.25zM15.3 8.24a.75.75 0 011.06 0l2.25 2.25a.75.75 0 010 1.06l-2.25 2.25a.75.75 0 01-1.06 0l-2.25-2.25a.75.75 0 010-1.06l2.25-2.25z" clipRule="evenodd" />
    </svg>
);
const TrashIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);
const UpArrowIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0L10 10.06l3.72 4.72a.75.75 0 101.06-1.06l-4.25-5.25a.75.75 0 00-1.06 0L5.22 13.72a.75.75 0 000 1.06z" clipRule="evenodd" />
    </svg>
);
const DownArrowIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9.47 5.22a.75.75 0 011.06 0l4.25 5.25a.75.75 0 11-1.06 1.06L10 6.781l-3.72 4.72a.75.75 0 01-1.06-1.06l4.25-5.25z" clipRule="evenodd" />
    </svg>
);

interface ProfileAndSocialsEditorProps {
  profile: AppData['profile'];
  socials: AppData['socials'];
  onProfileChange: (updates: Partial<AppData['profile']>) => Promise<void>;
  onSocialChange: (id: string, field: keyof Omit<SocialLink, 'id'>, value: string) => Promise<void>;
  onAddSocial: () => Promise<void>;
  onDeleteSocial: (id: string) => void;
  onReorderSocial: (id: string, direction: 'up' | 'down') => Promise<void>;
}

const ProfileAndSocialsEditor: React.FC<ProfileAndSocialsEditorProps> = ({
  profile,
  socials,
  onProfileChange,
  onSocialChange,
  onAddSocial,
  onDeleteSocial,
  onReorderSocial,
}) => {
  const [isBioGeneratorOpen, setIsBioGeneratorOpen] = useState(false);
  const [bioKeywords, setBioKeywords] = useState('');
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);

  const handleGenerateBio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bioKeywords.trim() || isGeneratingBio) return;
    setIsGeneratingBio(true);
    try {
        const newBio = await backendApi.ai.generateBio(bioKeywords, profile.name); // Use backendApi.ai
        onProfileChange({ bio: newBio });
        setIsBioGeneratorOpen(false);
        setBioKeywords('');
    } catch (error) {
        console.error("Failed to generate bio:", error);
        alert("Sorry, there was an issue generating the bio. Please try again.");
    } finally {
        setIsGeneratingBio(false);
    }
  };

  return (
    <Section title="Profile & Socials">
      <datalist id="social-platforms-list">
        {PREDEFINED_SOCIAL_PLATFORMS.map(p => <option key={p} value={p} />)}
      </datalist>
      <div className="space-y-3">
        <div>
            <label className="text-xs text-[var(--text-secondary)]">Name</label>
            <input type="text" value={profile.name} onChange={(e) => onProfileChange({ name: e.target.value })} className="w-full p-2 text-sm rounded-md bg-[var(--input-background-color)] border border-[var(--border-color)] focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none" />
        </div>
        <div>
            <label className="text-xs text-[var(--text-secondary)]">Handle</label>
            <input type="text" value={profile.handle} onChange={(e) => onProfileChange({ handle: e.target.value })} className="w-full p-2 text-sm rounded-md bg-[var(--input-background-color)] border border-[var(--border-color)] focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none" />
        </div>
        <div>
            <label className="text-xs text-[var(--text-secondary)]">Avatar URL</label>
            <input type="text" value={profile.avatarUrl} onChange={(e) => onProfileChange({ avatarUrl: e.target.value })} className="w-full p-2 text-sm rounded-md bg-[var(--input-background-color)] border border-[var(--border-color)] focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none" />
        </div>
        <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-[var(--text-secondary)]">Bio</label>
              <button
                  onClick={() => setIsBioGeneratorOpen(true)}
                  className="flex items-center gap-1 text-xs text-[var(--accent-color)] font-semibold hover:opacity-80 transition-opacity"
                  title="Generate bio with AI"
              >
                  <MagicIcon />
                  Generate
              </button>
            </div>
            <textarea value={profile.bio} onChange={(e) => onProfileChange({ bio: e.target.value })} rows={3} className="w-full p-2 text-sm rounded-md bg-[var(--input-background-color)] border border-[var(--border-color)] focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none" />
        </div>
        <h4 className="text-sm font-semibold text-[var(--text-secondary)] pt-2">Social Links</h4>
        {socials.map((social, index) => (
          <div key={social.id} className="bg-[var(--background-color)] p-3 rounded-lg border border-[var(--border-color)] space-y-2">
              <div className="flex items-center justify-between space-x-2">
                  <input
                      list="social-platforms-list"
                      value={social.platform}
                      placeholder="Platform"
                      onChange={(e) => onSocialChange(String(social.id), 'platform', e.target.value)}
                      className="flex-grow p-2 text-sm rounded-md bg-[var(--input-background-color)] border border-[var(--border-color)] focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none min-w-0"
                  />
                  <div className="flex items-center space-x-1 flex-shrink-0">
                      <button onClick={() => onReorderSocial(String(social.id), 'up')} disabled={index === 0} className="p-2 rounded-md bg-[var(--surface-color-hover)] text-[var(--text-secondary)] hover:bg-[var(--border-color)] disabled:opacity-50">
                          <UpArrowIcon />
                      </button>
                      <button onClick={() => onReorderSocial(String(social.id), 'down')} disabled={index === socials.length - 1} className="p-2 rounded-md bg-[var(--surface-color-hover)] text-[var(--text-secondary)] hover:bg-[var(--border-color)] disabled:opacity-50 rotate-180">
                          <UpArrowIcon />
                      </button>
                      <button onClick={() => onDeleteSocial(String(social.id))} className="p-2 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20">
                         <TrashIcon />
                      </button>
                  </div>
              </div>
              <input
                  type="text"
                  value={social.url}
                  placeholder="URL"
                  onChange={(e) => onSocialChange(String(social.id), 'url', e.target.value)}
                  className="w-full p-2 text-sm rounded-md bg-[var(--input-background-color)] border border-[var(--border-color)] focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none"
              />
          </div>
        ))}
        <button onClick={onAddSocial} className="w-full p-2 mt-2 rounded-md border-2 border-dashed border-[var(--border-color)] hover:border-[var(--accent-color)] text-sm font-semibold">Add Social Link</button>
      </div>
    </Section>
  );
};

export default ProfileAndSocialsEditor;
