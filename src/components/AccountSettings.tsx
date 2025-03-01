'use client';

import { useState } from 'react';
import { getLoggedInUser, clearAuthCookies, User } from '@/lib/auth';
import { UserIcon, ArrowRightStartOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';

type AccountSettingsProps = {
  onLogout: () => void;
};

export function AccountSettings({ onLogout }: AccountSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [user] = useState<User | null>(getLoggedInUser());
  const [activeTab, setActiveTab] = useState<'info' | 'logout'>('info');

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    clearAuthCookies();
    onLogout();
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-5 left-5 z-20">
      <button
        onClick={toggleOpen}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--claude-dark-200)] text-[var(--claude-purple-light)] hover:bg-[var(--claude-dark-100)] border border-[var(--border-color)] shadow-[var(--shadow-md)] transition-all duration-200"
        aria-label="Account settings"
      >
        <UserCircleIcon className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="absolute bottom-14 left-0 w-72 rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--claude-dark-200)] shadow-[var(--shadow-lg)] overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-bottom-5">
          <div className="flex border-b border-[var(--border-color)]">
            <button
              className={`flex-1 p-3 text-sm font-medium transition-all duration-200 ${
                activeTab === 'info'
                  ? 'bg-[var(--surface-light)] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[var(--surface-hover)]'
              }`}
              onClick={() => setActiveTab('info')}
            >
              <div className="flex items-center justify-center">
                <UserIcon className="mr-2 h-4 w-4" />
                Profile Info
              </div>
            </button>
            <button
              className={`flex-1 p-3 text-sm font-medium transition-all duration-200 ${
                activeTab === 'logout'
                  ? 'bg-[var(--surface-light)] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[var(--surface-hover)]'
              }`}
              onClick={() => setActiveTab('logout')}
            >
              <div className="flex items-center justify-center">
                <ArrowRightStartOnRectangleIcon className="mr-2 h-4 w-4" />
                Log Out
              </div>
            </button>
          </div>

          <div className="p-5">
            {activeTab === 'info' && (
              <div className="space-y-4">
                <div className="bg-[var(--surface-light)] p-4 rounded-[var(--radius-md)]">
                  <label className="block text-xs font-medium text-gray-400 mb-1">User ID</label>
                  <div className="font-medium text-[var(--claude-purple-light)]">{user?.id || 'Not logged in'}</div>
                </div>
                <div className="text-sm text-gray-400 leading-relaxed">
                  You are currently logged in with this ID. All your chat threads are associated with this account.
                </div>
              </div>
            )}

            {activeTab === 'logout' && (
              <div className="space-y-4">
                <div className="text-sm text-gray-300 bg-[var(--surface-light)] p-4 rounded-[var(--radius-md)] leading-relaxed">
                  Are you sure you want to log out? You will need to log in again to access your chat threads.
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full rounded-[var(--radius-md)] bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-medium text-white hover:shadow-[var(--shadow-md)] transition-all duration-200"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 