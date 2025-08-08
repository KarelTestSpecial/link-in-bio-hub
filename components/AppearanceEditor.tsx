import React, { useState, useCallback } from 'react';
import { AppData, ColorSet, Palette } from '../types';
import { FONTS, ANIMATIONS, DEFAULT_PALETTES } from '../constants';
import { generateTheme } from '../services/geminiService';
import Section from './Section';

// Icons specific to Appearance Editor
const MagicIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4"} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M11.3 2.24a.75.75 0 011.06 0l2.25 2.25a.75.75 0 010 1.06l-2.25 2.25a.75.75 0 01-1.06 0l-2.25-2.25a.75.75 0 010-1.06l2.25-2.25zM5.3 8.24a.75.75 0 011.06 0l2.25 2.25a.75.75 0 010 1.06l-2.25 2.25a.75.75 0 01-1.06 0l-2.25-2.25a.75.75 0 010-1.06l2.25-2.25zM15.3 8.24a.75.75 0 011.06 0l2.25 2.25a.75.75 0 010 1.06l-2.25 2.25a.75.75 0 01-1.06 0l-2.25-2.25a.75.75 0 010-1.06l2.25-2.25z" clipRule="evenodd" />
    </svg>
);

interface AppearanceEditorProps {
  customization: AppData['customization'];
  palettes: AppData['palettes'];
  theme: 'light' | 'dark';
  onCustomizationChange: (newCustomization: Partial<AppData['customization']>) => Promise<void>;
  onGeneratedThemeApply: (newTheme: { name: string, colors: AppData['customization']['customColors'] }) => Promise<void>;
  onUpdatePalette: (paletteId: string, updates: Partial<Palette>) => Promise<void>;
  onOverwritePalette: (paletteId: string) => void;
}

const editableColors: { name: keyof ColorSet; label: string }[] = [
    { name: '--background-color', label: 'Page Background' },
    { name: '--surface-color', label: 'Card/Panel Background' },
    { name: '--accent-color', label: 'Accent / Links' },
    { name: '--text-primary', label: 'Primary Text' },
    { name: '--text-secondary', label: 'Secondary Text' },
    { name: '--border-color', label: 'Border Color' },
    { name: '--input-background-color', label: 'Input Background' },
];

const AppearanceEditor: React.FC<AppearanceEditorProps> = ({
  customization,
  palettes,
  theme,
  onCustomizationChange,
  onGeneratedThemeApply,
  onUpdatePalette,
  onOverwritePalette,
}) => {
  const [imageUrl, setImageUrl] = useState(customization.backgroundImageUrl || '');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);
  const [editingPaletteId, setEditingPaletteId] = useState<string | null>(null);

  const handleApplyImage = useCallback(() => {
    onCustomizationChange({ backgroundImageUrl: imageUrl });
  }, [imageUrl, onCustomizationChange]);

  const handleRemoveImage = useCallback(() => {
    setImageUrl('');
    onCustomizationChange({ backgroundImageUrl: '' });
  }, [onCustomizationChange]);

  const handleColorChange = useCallback((name: keyof ColorSet, value: string) => {
    const newCustomColors = {
      ...customization.customColors,
      [theme]: {
        ...customization.customColors?.[theme],
        [name]: value,
      },
    };
    onCustomizationChange({ customColors: newCustomColors, paletteId: 'custom' });
  }, [customization, theme, onCustomizationChange]);

  const handleGenerateTheme = useCallback(async () => {
    if (!aiPrompt.trim() || isGeneratingTheme) return;
    setIsGeneratingTheme(true);
    try {
        const newTheme = await generateTheme(aiPrompt);
        onGeneratedThemeApply(newTheme);
    } catch (error) {
        console.error("Failed to generate theme:", error);
        alert("Sorry, there was an issue generating the theme. Please try a different prompt or check if your API key is configured.");
    } finally {
        setIsGeneratingTheme(false);
    }
  }, [aiPrompt, isGeneratingTheme, onGeneratedThemeApply]);

  const basePalette = (palettes.find(p => p.id === 'default') || palettes[0]);
  const baseColors = basePalette[theme];

  return (
    <Section title="Appearance">
      <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Background Image</h3>
      <div className="flex flex-col space-y-2">
        <input
          type="text"
          placeholder="Image URL..."
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full p-2 rounded-md bg-[var(--input-background-color)] border border-[var(--border-color)] focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none"
        />
        <div className="flex space-x-2">
          <button onClick={handleApplyImage} className="flex-1 p-2 rounded-md bg-[var(--accent-color)] text-white hover:bg-[var(--accent-color-hover)] text-sm font-semibold">Apply</button>
          <button onClick={handleRemoveImage} className="flex-1 p-2 rounded-md bg-[var(--surface-color-hover)] border border-[var(--border-color)] text-sm">Remove</button>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-[var(--text-secondary)] mt-6 mb-3">Color Palette</h3>
      <div className="space-y-2">
        {palettes.map((palette) => (
          <div key={palette.id} className={`p-2 rounded-lg border-2 transition ${customization.paletteId === palette.id ? 'border-[var(--accent-color)]' : 'border-transparent'}`}>
              <div className="flex items-center justify-between">
                  <button
                      onClick={() => onCustomizationChange({ paletteId: String(palette.id), customColors: { light: {}, dark: {} } })}
                      onDoubleClick={() => palette.id !== 'default' && setEditingPaletteId(String(palette.id))}
                      className="flex-grow flex items-center space-x-3 text-left disabled:cursor-default"
                      disabled={editingPaletteId === palette.id}
                      aria-label={`Select ${palette.name} theme`}
                  >
                      <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: palette[theme]['--accent-color'] }}></div>
                       {editingPaletteId === palette.id ? (
                          <input
                              type="text"
                              value={palette.name}
                              onChange={(e) => onUpdatePalette(String(palette.id), { name: e.target.value })}
                              onBlur={() => setEditingPaletteId(null)}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') { setEditingPaletteId(null); e.preventDefault(); } }}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                              className="text-sm bg-transparent focus:outline-none w-full cursor-text bg-[var(--input-background-color)] rounded-sm px-1"
                          />
                      ) : (
                          <span className="text-sm">{palette.name}</span>
                      )}
                  </button>

                  {palette.id !== 'default' && customization.paletteId === 'custom' && (
                      <button
                          onClick={() => onOverwritePalette(String(palette.id))}
                          className="ml-2 text-xs font-semibold text-[var(--accent-color)] hover:opacity-80 transition-opacity px-2 py-1 rounded-md bg-[var(--surface-color-hover)] flex-shrink-0"
                          title={`Overwrite '${palette.name}' with the current custom theme.`}
                      >
                          Save Current
                      </button>
                  )}
              </div>
          </div>
        ))}
         <button
            onClick={() => onCustomizationChange({ paletteId: 'custom' })}
            className={`w-full text-left p-2 rounded-lg border-2 transition mt-2 ${
              customization.paletteId === 'custom' ? 'border-[var(--accent-color)]' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500"></div>
              <span className="text-sm">{customization.customPaletteName || 'Custom'}</span>
            </div>
          </button>
      </div>

      <h3 className="text-sm font-semibold text-[var(--text-secondary)] mt-6 mb-3 flex items-center gap-2">
        AI Theme Generator
        <span className="text-xs bg-[var(--accent-color)] text-white px-1.5 py-0.5 rounded-full font-bold">AI</span>
      </h3>
      <div className="flex flex-col space-y-2 p-3 bg-[var(--background-color)] rounded-lg border border-[var(--border-color)]">
        <textarea
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="Describe your theme... e.g., 'a calm ocean vibe' or 'dark mode for a retro gaming channel'"
          rows={3}
          className="w-full p-2 text-sm rounded-md bg-[var(--input-background-color)] border border-[var(--border-color)] focus:ring-2 focus:ring-[var(--accent-color)] focus:outline-none"
          disabled={isGeneratingTheme}
        />
        <button
          onClick={handleGenerateTheme}
          disabled={!aiPrompt.trim() || isGeneratingTheme}
          className="w-full p-2 rounded-md bg-[var(--accent-color)] text-white hover:bg-[var(--accent-color-hover)] text-sm font-semibold disabled:bg-[var(--disabled-background-color)] disabled:cursor-not-allowed transition-colors"
        >
          {isGeneratingTheme ? 'Generating...' : 'Generate with AI'}
        </button>
      </div>

      {customization.paletteId === 'custom' && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Custom Colors ({theme} mode)</h3>
          <div className="space-y-3">
            {editableColors.map(({name, label}) => (
                <div key={name} className="flex justify-between items-center">
                    <label className="text-sm">{label}</label>
                    <input
                        type="color"
                        value={customization.customColors?.[theme]?.[name] || baseColors[name]}
                        onChange={(e) => handleColorChange(name, e.target.value)}
                        className="w-24 p-1 h-8 rounded-md bg-transparent border border-[var(--border-color)] cursor-pointer"
                    />
                </div>
            ))}
          </div>
        </div>
      )}

      <h3 className="text-sm font-semibold text-[var(--text-secondary)] mt-6 mb-3">Font</h3>
      <div className="space-y-2">
        {FONTS.map((font) => (
          <button
            key={font.id}
            onClick={() => onCustomizationChange({ fontId: font.id })}
            className={`w-full text-left p-3 rounded-lg border transition ${
              customization.fontId === font.id
                ? 'bg-[var(--accent-color)] text-white border-transparent'
                : 'bg-[var(--surface-color-hover)] border-[var(--border-color)]'
            }`}
          >
            <span className={font.className}>{font.name}</span>
          </button>
        ))}
      </div>

      <h3 className="text-sm font-semibold text-[var(--text-secondary)] mt-6 mb-3">Link Hover Animation</h3>
      <div className="grid grid-cols-2 gap-2">
          {ANIMATIONS.map(animation => (
              <button
                  key={animation.id}
                  onClick={() => onCustomizationChange({ linkAnimation: animation.id })}
                  className={`p-2 rounded-md text-sm transition ${
                      (customization.linkAnimation || 'none') === animation.id
                      ? 'bg-[var(--accent-color)] text-white'
                      : 'bg-[var(--surface-color-hover)] border border-[var(--border-color)]'
                  }`}
              >
                  {animation.name}
              </button>
          ))}
      </div>
    </Section>
  );
};

export default AppearanceEditor;
