export interface Link {
  id: string;
  title: string; // The "real" title shown after the countdown
  url: string;
  style?: 'fill' | 'outline';
  isCountdownEnabled?: boolean;
  countdownTitle?: string;
  countdownEndDate?: string; // ISO 8601 date string
}

export interface LinkGroup {
  id: string;
  title: string;
  links: Link[];
}

export type SocialPlatform = string;

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  url:string;
}

export interface Profile {
  name: string;
  handle: string;
  avatarUrl: string;
  bio: string;
}

// New types for customization
export interface ColorSet {
  '--background-color': string;
  '--surface-color': string;
  '--surface-color-hover': string;
  '--text-primary': string;
  '--text-secondary': string;
  '--accent-color': string;
  '--accent-color-hover': string;
  '--border-color': string;
  '--avatar-border-color': string;
  '--input-background-color': string;
  '--response-background-color': string;
  '--disabled-background-color': string;
}

export interface Palette {
  id: string;
  name: string;
  light: ColorSet;
  dark: ColorSet;
}

export interface Font {
  id: string;
  name: string;
  className: string;
}

export interface Customization {
  theme: 'light' | 'dark';
  paletteId: string;
  customPaletteName: string;
  fontId: string;
  backgroundImageUrl?: string;
  linkAnimation?: string;
  customColors: {
    light: Partial<ColorSet>;
    dark: Partial<ColorSet>;
  };
}

export interface AppData {
  profile: Profile;
  linkGroups: LinkGroup[];
  socials: SocialLink[];
  palettes: Palette[];
  customization: Customization;
  adminKey: string | null;
}

export interface LinkAnalyticsData {
  linkId: string; // Backend link IDs are strings
  title: string;
  clicks: number;
}

export type AnalyticsResponse = LinkAnalyticsData[];
// --- Backend API Types ---

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  // You might add other user data here if the backend provides it
}
}