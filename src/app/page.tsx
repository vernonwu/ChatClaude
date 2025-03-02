'use client';

import { Sidebar } from '@/components/Sidebar';
import { ChatInterface } from '@/components/ChatInterface';
import { Auth } from '@/components/Auth';
import { AccountSettings } from '@/components/AccountSettings';
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { isAuthenticated} from '@/lib/auth';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Home() {
  const [isHovered, setIsHovered] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { loadThreads, isLoading, resetState, setMobileSidebarOpen } = useStore();

  useEffect(() => {
    setIsClient(true);
    const authStatus = isAuthenticated();
    setIsAuthed(authStatus);

    if (authStatus) {
      loadThreads();
    }
  }, [loadThreads]);

  // Sync the local mobile menu state with the global store
  useEffect(() => {
    setMobileSidebarOpen(isMobileMenuOpen);
  }, [isMobileMenuOpen, setMobileSidebarOpen]);

  useEffect(() => {
    // Close sidebar when clicking outside on mobile
    const handleClickOutside = (e: MouseEvent) => {
      if (isMobileMenuOpen) {
        const sidebar = document.getElementById('sidebar');
        const toggle = document.getElementById('mobile-menu-toggle');
        if (sidebar && 
            toggle && 
            !sidebar.contains(e.target as Node) && 
            !toggle.contains(e.target as Node)) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen]);

  // Listen for custom closeMobileMenu event from Sidebar
  useEffect(() => {
    const handleCloseMobileMenu = () => {
      setIsMobileMenuOpen(false);
    };

    document.addEventListener('closeMobileMenu', handleCloseMobileMenu);
    return () => document.removeEventListener('closeMobileMenu', handleCloseMobileMenu);
  }, []);

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
      {/* Mobile menu toggle */}
      <button 
        id="mobile-menu-toggle"
        className="md:hidden fixed z-20 top-4 left-4 p-2 rounded-full bg-[var(--claude-dark-200)] text-white"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? 
          <XMarkIcon className="w-6 h-6" /> : 
          <Bars3Icon className="w-6 h-6" />
        }
      </button>

      {/* Sidebar */}
      <div 
        id="sidebar"
        className={`fixed md:relative z-10 h-full 
                   md:w-[var(--sidebar-width)] w-[var(--sidebar-width-mobile)] max-w-xs
                   transform transition-transform duration-300 ease-in-out
                   ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Sidebar isHovered={isHovered} />
      </div>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-[5]" 
          aria-hidden="true"
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col md:pl-0 pl-0 w-full h-full">
        <ChatInterface />
      </div>
      <AccountSettings onLogout={handleLogout} />
    </main>
  );
}
