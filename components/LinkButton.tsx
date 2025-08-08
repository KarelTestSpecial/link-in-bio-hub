import React, { useState, useEffect } from 'react';
import type { Link } from '../types';
import { ANIMATIONS } from '../constants';

import backendApi from '../services/backendApi'; 

interface LinkButtonProps {
  link: Link;
  animationId?: string;
  ownerUsername: string; 
}

const useCountdown = (targetDate?: string) => {
    if (!targetDate) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true };
    }
    
    const countDownDate = new Date(targetDate).getTime();

    const [countDown, setCountDown] = useState(
        countDownDate - new Date().getTime()
    );

    useEffect(() => {
        const interval = setInterval(() => {
            const newCountDown = countDownDate - new Date().getTime();
            if (newCountDown <= 0) {
                clearInterval(interval);
                setCountDown(0);
            } else {
                setCountDown(newCountDown);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [countDownDate]);
    
    if (countDown <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true };
    }

    const days = Math.floor(countDown / (1000 * 60 * 60 * 24));
    const hours = Math.floor((countDown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((countDown % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((countDown % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, isOver: false };
};


const LinkButton: React.FC<LinkButtonProps> = ({ link, animationId, ownerUsername }) => {
  const { days, hours, minutes, seconds, isOver } = useCountdown(link.countdownEndDate);
  const isCountdownActive = link.isCountdownEnabled && !isOver;

  const animation = ANIMATIONS.find(a => a.id === animationId) || ANIMATIONS[0];

  if (isCountdownActive) {
    const timerParts = [];
    if (days > 0) timerParts.push(`${String(days).padStart(2, '0')}d`);
    if (hours > 0 || days > 0) timerParts.push(`${String(hours).padStart(2, '0')}h`);
    timerParts.push(`${String(minutes).padStart(2, '0')}m`);
    timerParts.push(`${String(seconds).padStart(2, '0')}s`);
    const formattedTime = timerParts.join(' : ');

    return (
        <div
            className="
                relative block w-full text-center p-4 rounded-xl shadow-md
                bg-[var(--disabled-background-color)] text-[var(--text-secondary)]
                font-semibold flex flex-col items-center justify-center cursor-not-allowed
                overflow-hidden
            "
        >
            <div 
                className="absolute inset-0 bg-repeat"
                style={{
                    backgroundImage: `linear-gradient(45deg, var(--border-color) 25%, transparent 25%, transparent 75%, var(--border-color) 75%, var(--border-color)), linear-gradient(45deg, var(--border-color) 25%, transparent 25%, transparent 75%, var(--border-color) 75%, var(--border-color))`,
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 10px 10px',
                    opacity: 0.3
                }}
            ></div>
            <div className="relative z-10">
                <span className="text-sm">{link.countdownTitle || 'Coming Soon'}</span>
                <span className="block text-lg font-bold tabular-nums tracking-wider text-[var(--text-primary)]" aria-live="polite" aria-atomic="true">
                    {formattedTime}
                </span>
            </div>
        </div>
    );
  }

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

  const handleClick = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    try {
      await backendApi.analytics.registerClick(link.id, ownerUsername); // Pass ownerUsername
      console.log(`Click registered for link ID: ${link.id} by user: ${ownerUsername}`);
    } catch (error) {
      console.error(`Failed to register click for link ID: ${link.id}`, error);
    }
  };

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${baseClasses} ${styleClasses} ${animation.className}`}
      onClick={handleClick}
    >
      <span>{link.title}</span>
    </a>
  );
};

export default LinkButton;