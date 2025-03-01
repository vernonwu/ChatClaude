'use client';

import { Sidebar } from '@/components/Sidebar';
import { ChatInterface } from '@/components/ChatInterface';
import { Auth } from '@/components/Auth';
import { AccountSettings } from '@/components/AccountSettings';
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { isAuthenticated} from '@/lib/auth';

export default function Home() {
  const [isHovered, setIsHovered] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const { loadThreads, isLoading, resetState } = useStore();

  useEffect(() => {
    setIsClient(true);
    const authStatus = isAuthenticated();
    setIsAuthed(authStatus);

    if (authStatus) {
      loadThreads();
    }
  }, [loadThreads]);

  const handleAuthSuccess = () => {
    setIsAuthed(true);
    loadThreads();
  };

  const handleLogout = () => {
    setIsAuthed(false);
    resetState();
  };

  // Don't render anything until we're on the client
  if (!isClient) {
    return null;
  }

  // Show auth screen if not authenticated
  if (!isAuthed) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--claude-dark-300)] text-white">
        <div className="text-lg">Loading your chats...</div>
      </div>
    );
  }

  return (
    <main className="relative flex h-screen bg-[var(--claude-dark-300)]">
      <div 
        className="fixed left-0 top-0 bottom-0 w-64 z-10"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Sidebar isHovered={isHovered} />
      </div>
      <div className="flex-1 flex flex-col pl-64">
        <ChatInterface />
      </div>
      <AccountSettings onLogout={handleLogout} />
    </main>
  );
}
