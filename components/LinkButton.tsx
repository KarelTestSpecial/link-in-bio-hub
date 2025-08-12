import React from 'react';
import type { Link } from '../types';
import { ANIMATIONS } from '../constants';
import backendApi from '../services/backendApi';

interface LinkButtonProps {
  link: Link;
  animationId?: string;
  ownerUsername: string;
  onClick?: () => void;
}

const LinkButton: React.FC<LinkButtonProps> = ({ link, animationId, ownerUsername, onClick }) => {
  // Defensive check to prevent crashes on invalid data
  if (!link || typeof link.url !== 'string' || typeof link.title !== 'string') {
    return null;
  }

  const animation = ANIMATIONS.find(a => a.id === animationId) || ANIMATIONS[0];

  const isOutline = link.style === 'outline';
  const baseClasses = `
    block w-full text-center p-4 rounded-xl shadow-md
    transition-all duration-200 ease-in-out
    font-semibold flex items-center justify-center
  `;

  const styleClasses = isOutline
    ? `
      bg-transparent text-[var(--accent-color)] border-2 border-[var(--accent-color)]
      hover:bg-[var(--accent-color)] hover:text-white
    `
    : `
      bg-[var(--surface-color)] text-[var(--text-primary)] border border-[var(--border-color)]
      hover:bg-[var(--surface-color-hover)]
    `;

  const isExternal = link.url.startsWith('http://') || link.url.startsWith('https');

  const handleClick = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      event.preventDefault();
      onClick();
      return;
    }

    if (ownerUsername && link.id) {
        try {
            await backendApi.analytics.registerClick(ownerUsername, link.id);
        } catch (error) {
            console.error(`Failed to register click for link ID: ${link.id}`, error);
        }
    }
  };

  return (
    <a
      href={link.url}
      target={isExternal ? '_blank' : '_self'}
      rel={isExternal ? 'noopener noreferrer' : ''}
      className={`${baseClasses} ${styleClasses} ${animation.className}`}
      onClick={handleClick}
    >
      <span>{link.title}</span>
    </a>
  );
};

export default LinkButton;