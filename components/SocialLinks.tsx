import React from 'react';
import type { SocialLink } from '../types';

interface SocialLinksProps {
  socials: SocialLink[];
  icons: Record<string, React.ReactNode>;
}

const DefaultLinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
)

const SocialLinks: React.FC<SocialLinksProps> = ({ socials, icons }) => {
  return (
    <div className="flex justify-center items-center space-x-5 mt-6">
      {socials.map((social) => (
        <a
          key={social.id}
          href={social.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={social.platform}
          title={social.platform}
          className="text-[var(--accent-color)] hover:text-[var(--text-secondary)] transition-colors duration-200"
        >
          {icons[social.platform] || <DefaultLinkIcon />}
        </a>
      ))}
    </div>
  );
};

export default SocialLinks;