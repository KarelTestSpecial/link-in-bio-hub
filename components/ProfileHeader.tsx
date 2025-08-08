import React from 'react';
import type { Profile } from '../types';

interface ProfileHeaderProps {
  profile: Profile;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile }) => {
  return (
    <div className="flex flex-col items-center text-center">
      <img
        src={profile.avatarUrl}
        alt={profile.name}
        className="w-24 h-24 rounded-full object-cover shadow-lg mb-4 border-4 border-[var(--avatar-border-color)]"
      />
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">{profile.name}</h1>
      <p className="text-md font-medium text-[var(--accent-color)]">{profile.handle}</p>
      <p className="mt-3 max-w-xs text-center text-[var(--text-secondary)]">{profile.bio}</p>
    </div>
  );
};

export default ProfileHeader;