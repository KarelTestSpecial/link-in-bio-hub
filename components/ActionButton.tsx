import React from 'react';
import type { Link } from '../types';
import { ANIMATIONS } from '../constants';

interface ActionButtonProps {
  link: Omit<Link, 'url'>;
  animationId?: string;
  onClick: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ link, animationId, onClick }) => {
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

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${styleClasses} ${animation.className}`}
    >
      <span>{link.title}</span>
    </button>
  );
};

export default ActionButton;
