import React from 'react';
import { SocialPlatform, Palette, Font, AppData } from './types';

export const PREDEFINED_SOCIAL_PLATFORMS: SocialPlatform[] = [
    'Facebook',
    'Instagram',
    'TikTok',
    'Twitter',
    'YouTube',
    'LinkedIn',
    'GitHub',
];

export const SOCIAL_ICONS: Record<SocialPlatform, React.ReactNode> = {
  'TikTok': (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 fill-current">
      <path d="M14.004 0h-3.95v14.129C8.94 13.61 7.82 13.2 6.587 13.2c-2.733 0-4.95 2.217-4.95 4.95s2.217 4.95 4.95 4.95 4.95-2.217 4.95-4.95V4.896c2.473.63 4.212 2.84 4.212 5.484v.04h3.95v-4.45c0-4.434-3.593-8.027-8.027-8.027z"/>
    </svg>
  ),
  'Instagram': (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 fill-current">
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.784.305-1.455.717-2.126 1.387C1.333 2.705.92 3.377.612 4.144.333 4.905.13 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.26 2.148.568 2.912.308.784.717 1.457 1.387 2.126.67.67 1.344 1.078 2.127 1.387.766.298 1.636.498 2.912.568C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.26 2.912-.568.784-.308 1.457-.718 2.126-1.387.67-.67 1.078-1.344 1.387-2.127.298-.766.498-1.636.568-2.912C23.988 15.667 24 15.26 24 12s-.015-3.667-.072-4.947c-.06-1.277-.26-2.148-.568-2.912-.308-.784-.718-1.457-1.387-2.126C21.295 1.334 20.623.92 19.856.612c-.766-.298-1.636-.498-2.912-.568C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.06 1.17-.249 1.805-.413 2.227-.217.562-.477.96-.896 1.381-.42.419-.819.679-1.381-.896-.422-.164-1.057-.36-2.227-.413-1.266.057-1.646.07-4.85.07s-3.585-.015-4.85-.07c-1.17-.06-1.805-.249-2.227-.413-.562-.217-.96-.477-1.381-.896-.419-.42-.679-.819-.896-1.381-.164-.422-.36-1.057-.413-2.227-.057-1.266-.07-1.646-.07-4.85s.015-3.585.07-4.85c.06-1.17.249-1.805.413-2.227.217-.562.477.96.896-1.381.42-.419.819.679 1.381-.896.422-.164 1.057.36 2.227.413C8.415 2.176 8.797 2.16 12 2.16zm0 9.04c-1.933 0-3.5 1.567-3.5 3.5s1.567 3.5 3.5 3.5 3.5-1.567 3.5-3.5-1.567-3.5-3.5-3.5zm0 6c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zm6.406-9.66c-.797 0-1.44.645-1.44 1.44s.645 1.44 1.44 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  ),
  'YouTube': (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 fill-current">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  'Twitter': (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 fill-current">
       <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  'LinkedIn': (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 fill-current">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"></path>
    </svg>
  ),
  'GitHub': (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 fill-current">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
    </svg>
  ),
  'Facebook': (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 fill-current">
      <path d="M22.675 0h-21.35C.59 0 0 .59 0 1.325v21.35C0 23.41.59 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h5.694c.735 0 1.325-.59 1.325-1.325V1.325C24 .59 23.41 0 22.675 0z"></path>
    </svg>
  ),
};

export const DEFAULT_PALETTES: Palette[] = [
  {
    id: 'default', name: 'Default',
    light: {
      '--background-color': '#f3f4f6', '--surface-color': '#ffffff', '--surface-color-hover': '#f9fafb',
      '--text-primary': '#1f2937', '--text-secondary': '#6b7280', '--accent-color': '#3b82f6',
      '--accent-color-hover': '#2563eb', '--border-color': '#e5e7eb', '--avatar-border-color': '#ffffff',
      '--input-background-color': '#f3f4f6', '--response-background-color': '#e5e7eb', '--disabled-background-color': '#d1d5db',
    },
    dark: {
      '--background-color': '#111827', '--surface-color': '#1f2937', '--surface-color-hover': '#374151',
      '--text-primary': '#f9fafb', '--text-secondary': '#9ca3af', '--accent-color': '#60a5fa',
      '--accent-color-hover': '#3b82f6', '--border-color': '#374151', '--avatar-border-color': '#1f2937',
      '--input-background-color': '#374151', '--response-background-color': '#111827', '--disabled-background-color': '#4b5563',
    },
  },
  {
    id: 'ocean', name: 'Ocean Breeze',
    light: {
      '--background-color': '#f0f7ff', '--surface-color': '#ffffff', '--surface-color-hover': '#f8f9fa',
      '--text-primary': '#0d3d56', '--text-secondary': '#5a7d90', '--accent-color': '#0096c7',
      '--accent-color-hover': '#0077b6', '--border-color': '#dee2e6', '--avatar-border-color': '#ffffff',
      '--input-background-color': '#f0f7ff', '--response-background-color': '#e9ecef', '--disabled-background-color': '#adb5bd',
    },
    dark: {
      '--background-color': '#021019', '--surface-color': '#031c2b', '--surface-color-hover': '#04283f',
      '--text-primary': '#e0fbfc', '--text-secondary': '#98c1d9', '--accent-color': '#3dccc7',
      '--accent-color-hover': '#50d4ce', '--border-color': '#053752', '--avatar-border-color': '#031c2b',
      '--input-background-color': '#031c2b', '--response-background-color': '#021019', '--disabled-background-color': '#1c4966',
    },
  },
  {
    id: 'pink', name: 'Pink',
    light: {
      '--background-color': '#FFF5F7', '--surface-color': '#FFE3E9', '--surface-color-hover': '#FFDDE3',
      '--text-primary': '#5D1F32', '--text-secondary': '#986A7A', '--accent-color': '#E54B6D',
      '--accent-color-hover': '#C53756', '--border-color': '#F3DDE1', '--avatar-border-color': '#FFE3E9',
      '--input-background-color': '#FFF5F7', '--response-background-color': '#FFE3E9', '--disabled-background-color': '#EAD5D9',
    },
    dark: {
      '--background-color': '#2B0B1E', '--surface-color': '#4A1D36', '--surface-color-hover': '#5E2645',
      '--text-primary': '#FCEEF2', '--text-secondary': '#C9AAB9', '--accent-color': '#FF75B5',
      '--accent-color-hover': '#FF99C9', '--border-color': '#6B3A54', '--avatar-border-color': '#4A1D36',
      '--input-background-color': '#4A1D36', '--response-background-color': '#2B0B1E', '--disabled-background-color': '#5C4551',
    },
  },
];

export const FONTS: Font[] = [
    { id: 'font-sans', name: 'Inter (Modern & Standaard)', className: 'font-sans' },
    { id: 'font-lora', name: 'Lora (Klassiek & Elegant)', className: 'font-lora' },
    { id: 'font-work-sans', name: 'Work Sans (Vriendelijk & Schoon)', className: 'font-work-sans' },
    { id: 'font-poppins', name: 'Poppins (Professioneel & Vrolijk)', className: 'font-poppins' },
    { id: 'font-playfair-display', name: 'Playfair Display (Karaktervol & Stijlvol)', className: 'font-playfair-display' },
    { id: 'font-caveat', name: 'Caveat (Handgeschreven & Persoonlijk)', className: 'font-caveat' },
    { id: 'font-roboto-mono', name: 'Roboto Mono (Modern & Techy)', className: 'font-roboto-mono' },
];

export const ANIMATIONS: { id: string, name: string, className: string }[] = [
    { id: 'none', name: 'None', className: '' }, 
    { id: 'grow', name: 'Grow', className: 'hover:scale-105' },
    { id: 'pulse', name: 'Pulse', className: 'hover:animate-pulse' },
    { id: 'bounce', name: 'Bounce', className: 'hover:animate-bounce' },
    { id: 'shake', name: 'Shake', className: 'hover:animate-shake' },
];

export const MOCK_APP_DATA: AppData = {
  profile: {
    name: "Alex Doe",
    handle: "@alexdoelife",
    avatarUrl: "https://picsum.photos/id/237/200/200",
    bio: "Digital Creator ✨ | Exploring the world one city at a time ✈️ | Fuelled by coffee and creativity ☕️",
  },
  linkGroups: [
    {
      id: "1",
      title: "⭐️ Featured Content",
      links: [
        { id: "1", title: "🎬 My Latest YouTube Video", url: "#", style: 'fill' },
        { id: "2", title: "🛍️ Shop My Outfits", url: "#", style: 'fill' },
        { 
          id: "5", 
          title: "My New Secret Project", 
          url: "#", 
          style: 'fill', 
          isCountdownEnabled: true,
          countdownTitle: "🤫 Something BIG is Coming...",
          countdownEndDate: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        },
      ],
    },
    {
      id: "2",
      title: "More Links",
      links: [
        { id: "3", title: "✈️ My Travel Blog", url: "#", style: 'outline' },
        { id: "4", title: "💖 Support My Work", url: "#", style: 'fill' },
      ],
    },
  ],
  socials: [
    { id: "1", platform: 'TikTok', url: "#" },
    { id: "2", platform: 'Instagram', url: "#" },
    { id: "3", platform: 'YouTube', url: "#" },
    { id: "4", platform: 'Twitter', url: "#" },
    { id: "5", platform: 'Facebook', url: "#" },
  ],
  palettes: DEFAULT_PALETTES,
  customization: {
    theme: 'light',
    paletteId: 'default',
    customPaletteName: 'Custom',
    fontId: 'font-sans',
    linkAnimation: 'none',
    backgroundImageUrl: '',
    customColors: {
      light: {},
      dark: {},
    },
  },
  adminKey: null,
};