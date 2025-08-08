import React from 'react';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const Section: React.FC<SectionProps> = ({ title, children, defaultOpen = false }) => (
    <details className="border-t border-[var(--border-color)] group" open={defaultOpen}>
        <summary className="py-4 text-md font-semibold text-[var(--text-secondary)] cursor-pointer list-none flex justify-between items-center">
            {title}
            <svg className="w-4 h-4 transition-transform transform group-open:rotate-180" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
        </summary>
        <div className="pb-6">
            {children}
        </div>
    </details>
);

export default Section;
