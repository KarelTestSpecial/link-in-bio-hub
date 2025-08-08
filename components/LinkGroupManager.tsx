import React, { useState, useEffect } from 'react';
import { AppData, Link, LinkGroup } from '../types';
import backendApi from '../services/backendApi'; // Import backendApi
import Section from './Section'; // Import the Section wrapper
import { AIGroupSuggestion } from '../services/geminiService'; // Keep for type import

// Icons specific to Link and Group management
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
const MagicIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4"} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M11.3 2.24a.75.75 0 011.06 0l2.25 2.25a.75.75 0 010 1.06l-2.25 2.25a.75.75 0 01-1.06 0l-2.25-2.25a.75.75 0 010-1.06l2.25-2.25zM5.3 8.24a.75.75 0 011.06 0l2.25 2.25a.75.75 0 010 1.06l-2.25 2.25a.75.75 0 01-1.06 0l-2.25-2.25a.75.75 0 010-1.06l2.25-2.25zM15.3 8.24a.75.75 0 011.06 0l2.25 2.25a.75.75 0 010 1.06l-2.25 2.25a.75.75 0 01-1.06 0l-2.25-2.25a.75.75 0 010-1.06l2.25-2.25z" clipRule="evenodd" />
    </svg>
);
const ClockIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
    </svg>
);
const CalendarIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
    </svg>
);

interface LinkGroupManagerProps {
  linkGroups: LinkGroup[];
  theme: 'light' | 'dark'; // Needed for datetime-local colorScheme
  // Link Actions
  onLinkChange: (id: string, updates: Partial<Omit<Link, 'id' | 'clicks' | 'active'>>) => Promise<void>;
  onAddLink: (groupId: string, newLink: Omit<Link, 'id' | 'clicks' | 'active' | 'isCountdownEnabled' | 'countdownTitle' | 'countdownEndDate' | 'style' >) => Promise<void>;
  onDeleteLink: (id: string) => void;
  onReorderLink: (id: string, direction: 'up' | 'down') => Promise<void>;
  onMoveLinkToGroup: (linkId: string, targetGroupId: string) => Promise<void>;
  // Group Actions
  onAddGroup: (title: string) => Promise<void>;
  onDeleteGroup: (groupId: string) => void;
  onUpdateGroup: (groupId: string, updates: Partial<Omit<LinkGroup, 'id' | 'links'>>) => Promise<void>;
  onReorderGroup: (groupId: string, direction: 'up' | 'down') => Promise<void>;
  onApplyAIGroups: (suggestions: AIGroupSuggestion[]) => Promise<void>;
}

const LinkGroupManager: React.FC<LinkGroupManagerProps> = ({
  linkGroups,
  theme,
  onLinkChange,
  onAddLink,
  onDeleteLink,
  onReorderLink,
  onMoveLinkToGroup,
  onAddGroup,
  onDeleteGroup,
  onUpdateGroup,
  onReorderGroup,
  onApplyAIGroups,
}) => {
  // State for centralized link and group management
  const [newGroupName, setNewGroupName] = useState('');
  const [isGeneratingGroups, setIsGeneratingGroups] = useState(false);
  const [newLink, setNewLink] = useState({ title: '', url: '' });
  const [isGeneratingLinkTitle, setIsGeneratingLinkTitle] = useState(false);
  const [selectedGroupIdForNewLink, setSelectedGroupIdForNewLink] = useState<string | null>(null);

  // Effect to manage the selected group for new links
  useEffect(() => {
    if (linkGroups.length > 0 && (!selectedGroupIdForNewLink || !linkGroups.some(g => String(g.id) === selectedGroupIdForNewLink))) {
        setSelectedGroupIdForNewLink(String(linkGroups[0].id));
    } else if (linkGroups.length === 0) {
        setSelectedGroupIdForNewLink(null);
    }
  }, [linkGroups, selectedGroupIdForNewLink]);

  const handleAddNewGroup = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newGroupName.trim()) return;
      onAddGroup(newGroupName);
      setNewGroupName('');
  };

  const handleGenerateGroups = async () => {
      setIsGeneratingGroups(true);
      try {
          // Ensure link IDs are strings when passed to AI service if it expects them.
          const allLinks = linkGroups.flatMap(g => g.links.map(l => ({ ...l, id: String(l.id) })));
          if (allLinks.length === 0) {
              alert("You need at least one link to use the AI organizer.");
              setIsGeneratingGroups(false);
              return;
          }
          const suggestions = await backendApi.ai.generateLinkGroups(allLinks); // Use backendApi.ai
          onApplyAIGroups(suggestions);
      } catch (error) {
          console.error("Failed to generate link groups:", error);
          alert("Sorry, there was an issue organizing your links. Please try again.");
      } finally {
          setIsGeneratingGroups(false);
      }
  };

  const handleGenerateLinkTitle = async () => {
      if (!newLink.title.trim() || isGeneratingLinkTitle) return;
      setIsGeneratingLinkTitle(true);
      try {
          const title = await backendApi.ai.generateLinkTitle(newLink.title); // Use backendApi.ai
          setNewLink(prev => ({ ...prev, title }));
      } catch (error) {
          console.error("Failed to generate link title:", error);
          alert("Sorry, there was an issue generating the link title. Please try again.");
      } finally {
          setIsGeneratingLinkTitle(false);
      }
  };

  const handleAddNewLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLink.title || !newLink.url || !selectedGroupIdForNewLink) {
      if (!selectedGroupIdForNewLink) {
          alert("Please create a group before adding a link.");
      }
      return;
    }
    // onAddLink now expects a newLink object without id, clicks, active, isCountdownEnabled, etc.
    onAddLink(selectedGroupIdForNewLink, newLink);
    setNewLink({ title: '', url: '' });
  };

  return (
    <Section title="Manage Groups & Links" defaultOpen>
      <div className="space-y-4">
          {linkGroups.map((group, groupIndex) => (
              <details key={group.id} className="bg-[var(--background-color)] p-3 rounded-lg border border-[var(--border-color)] group" open>
                  <summary className="font-semibold text-sm list-none cursor-pointer flex justify-between items-center">
                      <input
                          type="text"
                          value={group.title}
                          placeholder="Group Title"
                          onChange={(e) => onUpdateGroup(String(group.id), { title: e.target.value })}
                          className="flex-grow p-1 text-sm font-bold rounded-md bg-transparent focus:bg-[var(--input-background-color)] focus:outline-none"
                      />
                      <div className="flex items-center space-x-1">
                          <button onClick={() => onReorderGroup(String(group.id), 'up')} disabled={groupIndex === 0} className="p-2 rounded-md hover:bg-[var(--surface-color-hover)] text-[var(--text-secondary)] disabled:opacity-50">
                              <UpArrowIcon />
                          </button>
                          <button onClick={() => onReorderGroup(String(group.id), 'down')} disabled={groupIndex === linkGroups.length - 1} className="p-2 rounded-md hover:bg-[var(--surface-color-hover)] text-[var(--text-secondary)] disabled:opacity-50 rotate-180">
                              <UpArrowIcon />
                          </button>
                          <button onClick={() => onDeleteGroup(String(group.id))} className="p-2 rounded-md text-red-500 hover:bg-red-500/10">
                              <TrashIcon />
                          </button>
                          <div className="p-2 text-[var(--text-secondary)] transition-transform transform group-open:rotate-180">
                              <DownArrowIcon />
                          </div>
                      </div>
                  </summary>
                  <div className="mt-4 space-y-3">
                      {group.links.length === 0 && (
                          <p className="text-xs text-center text-[var(--text-secondary)] py-2">This group is empty. Add a link below!</p>
                      )}
                      {group.links.map((link, linkIndex) => (
                          <div key={link.id} className="bg-[var(--surface-color)] p-3 rounded-lg border border-[var(--border-color)] space-y-2">
                              <input
                                  type="text"
                                  value={link.title}
                                  placeholder={link.isCountdownEnabled ? 'Final Link Title (after countdown)' : 'Link Title'}
                                  onChange={(e) => onLinkChange(String(link.id), { title: e.target.value })}
                                  className="w-full p-2 text-sm rounded-md bg-[var(--input-background-color)] border border-[var(--border-color)] focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none"
                              />
                              <input
                                 type="text"
                                 value={link.url}
                                 placeholder="URL"
                                 onChange={(e) => onLinkChange(String(link.id), { url: e.target.value })}
                                 className="w-full p-2 text-sm rounded-md bg-[var(--input-background-color)] border border-[var(--border-color)] focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none"
                              />

                              {link.isCountdownEnabled && (
                                  <div className="space-y-2 p-3 mt-2 bg-[var(--background-color)] rounded-md border border-[var(--border-color)]">
                                      <div>
                                          <label className="text-xs text-[var(--text-secondary)]">Countdown Title</label>
                                          <input
                                              type="text"
                                              placeholder="e.g. 'Secret Revealed in...'"
                                              value={link.countdownTitle || ''}
                                              onChange={(e) => onLinkChange(String(link.id), { countdownTitle: e.target.value })}
                                              className="w-full p-2 mt-1 text-sm rounded-md bg-[var(--input-background-color)] border border-[var(--border-color)] focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none"
                                          />
                                      </div>
                                      <div>
                                          <label className="block text-xs text-[var(--text-secondary)] mb-1">
                                              Countdown End Date & Time
                                          </label>
                                          <div className="relative">
                                              <div
                                                  aria-hidden="true"
                                                  className="w-full p-2 text-sm rounded-md bg-[var(--input-background-color)] border border-[var(--border-color)] flex justify-between items-center text-left"
                                              >
                                                  <span className={link.countdownEndDate ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}>
                                                      {(() => {
                                                          if (!link.countdownEndDate) return 'Select date & time...';
                                                          const date = new Date(link.countdownEndDate);
                                                          if (isNaN(date.getTime())) {
                                                              return 'Invalid Date';
                                                          }
                                                          return date.toLocaleString([], {
                                                              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
                                                          }).replace(',', '');
                                                      })()}
                                                  </span>
                                                  <CalendarIcon />
                                              </div>
                                              <input
                                                  type="datetime-local"
                                                  aria-label="Countdown End Date and Time"
                                                  value={(() => {
                                                      if (!link.countdownEndDate) return '';
                                                      const date = new Date(link.countdownEndDate);
                                                      if (isNaN(date.getTime())) return '';
                                                      const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
                                                      return localDate.toISOString().slice(0, 16);
                                                  })()}
                                                  onChange={(e) => onLinkChange(String(link.id), { countdownEndDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                  style={{ colorScheme: theme }}
                                              />
                                          </div>
                                      </div>
                                  </div>
                              )}

                              <div className="flex justify-between items-center pt-1 flex-wrap gap-2">
                                  <div className="flex items-center space-x-1">
                                      <button
                                          onClick={() => onLinkChange(String(link.id), { 
                                              isCountdownEnabled: !link.isCountdownEnabled,
                                              countdownEndDate: !link.isCountdownEnabled ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined,
                                              countdownTitle: !link.isCountdownEnabled ? '' : undefined
                                          })}
                                          className={`p-2 rounded-md transition-colors ${
                                              link.isCountdownEnabled
                                                  ? 'bg-[var(--accent-color)] text-white'
                                                  : 'bg-[var(--surface-color-hover)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
                                          }`}
                                          title="Toggle Countdown Timer"
                                      >
                                          <ClockIcon />
                                      </button>
                                      <select
                                        value={String(group.id)}
                                        onChange={(e) => onMoveLinkToGroup(String(link.id), e.target.value)}
                                        className="p-1 text-xs rounded-md bg-[var(--input-background-color)] border border-[var(--border-color)] focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none"
                                        title="Move to group"
                                      >
                                        {linkGroups.map(g => <option key={g.id} value={String(g.id)}>{g.title}</option>)}
                                      </select>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                      <div className="flex items-center space-x-1 ml-2">
                                          <button
                                              onClick={() => onLinkChange(String(link.id), { style: 'fill' })}
                                              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                                                  link.style !== 'outline'
                                                      ? 'bg-[var(--accent-color)] text-white'
                                                      : 'bg-[var(--surface-color-hover)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
                                              }`}
                                          >
                                              Fill
                                          </button>
                                          <button
                                              onClick={() => onLinkChange(String(link.id), { style: 'outline' })}
                                              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                                                  link.style === 'outline'
                                                      ? 'bg-[var(--accent-color)] text-white'
                                                      : 'bg-[var(--surface-color-hover)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
                                              }`}
                                          >
                                              Outline
                                          </button>
                                      </div>
                                      <button onClick={() => onReorderLink(String(link.id), 'up')} disabled={linkIndex === 0} className="p-2 rounded-md bg-[var(--surface-color-hover)] text-[var(--text-secondary)] hover:bg-[var(--border-color)] disabled:opacity-50"><UpArrowIcon /></button>
                                      <button onClick={() => onReorderLink(String(link.id), 'down')} disabled={linkIndex === group.links.length - 1} className="p-2 rounded-md bg-[var(--surface-color-hover)] text-[var(--text-secondary)] hover:bg-[var(--border-color)] disabled:opacity-50 rotate-180"><UpArrowIcon /></button>
                                      <button onClick={() => onDeleteLink(String(link.id))} className="p-2 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20"><TrashIcon /></button>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </details>
          ))}
          
          {/* Add New Link Card */}
          <form onSubmit={handleAddNewLink} className="mt-6 p-4 rounded-lg border-2 border-dashed border-[var(--border-color)] space-y-4">
              <h4 className="text-md font-semibold text-[var(--text-primary)]">Add New Link</h4>
              <div>
                  <label htmlFor="group-selector" className="text-xs text-[var(--text-secondary)] mb-1 block">Add to Group</label>
                  <select
                      id="group-selector"
                      value={selectedGroupIdForNewLink || ''}
                      onChange={(e) => setSelectedGroupIdForNewLink(e.target.value)}
                      disabled={linkGroups.length === 0}
                      className="w-full p-2 text-sm rounded-md bg-[var(--input-background-color)] border border-[var(--border-color)] focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none disabled:opacity-50"
                  >
                      {linkGroups.length === 0 ? (
                          <option>Create a group first</option>
                      ) : (
                          linkGroups.map(g => <option key={g.id} value={String(g.id)}>{g.title}</option>)
                      )}
                  </select>
              </div>
              
              <div>
                  <div className="flex justify-between items-center mb-1">
                      <label htmlFor="new-link-title" className="text-xs text-[var(--text-secondary)]">Link Title</label>
                       <button
                          type="button"
                          onClick={async () => {
                              if (!newLink.title.trim() || isGeneratingLinkTitle) return;
                              setIsGeneratingLinkTitle(true);
                              try {
                                  const title = await backendApi.ai.generateLinkTitle(newLink.title);
                                  setNewLink(prev => ({ ...prev, title }));
                              } catch (error) {
                                  console.error("Failed to generate link title:", error);
                                  alert("Sorry, there was an issue generating the link title. Please try again.");
                              } finally {
                                  setIsGeneratingLinkTitle(false);
                              }
                          }} 
                          disabled={!newLink.title.trim() || isGeneratingLinkTitle}
                          className="flex items-center gap-1 text-xs text-[var(--accent-color)] font-semibold hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Generate title with AI"
                      >
                          <MagicIcon className="h-3 w-3" />
                          {isGeneratingLinkTitle ? 'Generating...' : 'Generate with AI'}
                      </button>
                  </div>
                  <input
                      id="new-link-title"
                      type="text"
                      value={newLink.title}
                      placeholder="Keywords for AI, or a full title"
                      onChange={(e) => setNewLink(p => ({...p, title: e.target.value}))}
                      className="w-full p-2 text-sm rounded-md bg-[var(--input-background-color)] border border-[var(--border-color)] focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none"
                  />
                   <p className="text-xs text-[var(--text-secondary)] mt-1 px-1">
                      Pro tip: Start your title with an emoji!
                  </p>
              </div>
              <div>
                  <input
                      id="new-link-url"
                      type="text"
                      value={newLink.url}
                      placeholder="https://example.com"
                      onChange={(e) => setNewLink(p => ({...p, url: e.target.value}))}
                      className="w-full p-2 text-sm rounded-md bg-[var(--input-background-color)] border border-[var(--border-color)] focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none"
                  />
              </div>
              <button type="submit" className="w-full p-2 rounded-md bg-[var(--accent-color)] text-white hover:bg-[var(--accent-color-hover)] text-sm font-semibold disabled:bg-[var(--disabled-background-color)] disabled:cursor-not-allowed" disabled={!selectedGroupIdForNewLink}>Add Link</button>
          </form>

          {/* Group Actions Card */}
          <div className="mt-6 p-4 bg-[var(--background-color)] rounded-lg border border-[var(--border-color)] space-y-4">
              <h4 className="text-md font-semibold text-[var(--text-primary)]">Group Actions</h4>
              <form onSubmit={handleAddNewGroup} className="flex space-x-2">
                  <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="New Group Title"
                      className="flex-grow p-2 text-sm rounded-md bg-[var(--input-background-color)] border border-[var(--border-color)] focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none"
                  />
                  <button type="submit" className="px-4 py-2 rounded-md bg-[var(--accent-color)] text-white hover:bg-[var(--accent-color-hover)] text-sm font-semibold">Add</button>
              </form>
              <button
                  onClick={async () => {
                      setIsGeneratingGroups(true);
                      try {
                          const allLinks = linkGroups.flatMap(g => g.links.map(l => ({ ...l, id: String(l.id) })));
                          if (allLinks.length === 0) {
                              alert("You need at least one link to use the AI organizer.");
                              setIsGeneratingGroups(false);
                              return;
                          }
                          const suggestions = await backendApi.ai.generateLinkGroups(allLinks);
                          onApplyAIGroups(suggestions);
                      } catch (error) {
                          console.error("Failed to generate link groups:", error);
                          alert("Sorry, there was an issue organizing your links. Please try again.");
                      } finally {
                          setIsGeneratingGroups(false);
                      }
                  }}
                  disabled={isGeneratingGroups}
                  className="w-full p-2 rounded-md bg-[var(--accent-color)] text-white hover:bg-[var(--accent-color-hover)] text-sm font-semibold disabled:bg-[var(--disabled-background-color)] disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                  <MagicIcon />
                  {isGeneratingGroups ? 'Organizing...' : 'Organize Groups with AI'}
              </button>
               <p className="text-xs text-center text-[var(--text-secondary)] mt-2">Let AI automatically categorize your links for you.</p>
          </div>
      </div>
    </Section>
  );
};

export default LinkGroupManager;
