import { SparklesIcon, ChatBubbleLeftIcon, EllipsisVerticalIcon, TrashIcon, ArrowDownTrayIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';

interface SidebarProps {
  isHovered: boolean;
}

export function Sidebar({ isHovered }: SidebarProps) {
  const { threads, currentThreadId, addThread, setCurrentThread, deleteThread } = useStore();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = (threadId: string) => {
    const thread = threads.find(t => t.id === threadId);
    if (!thread) return;

    // Convert chat to markdown
    const markdown = thread.messages.map(msg => {
      const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1);
      return `## ${role}\n\n${msg.content}\n\n`;
    }).join('---\n\n');

    // Create and download file
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${thread.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setOpenMenuId(null);
  };

  const handleDelete = (threadId: string) => {
    deleteThread(threadId);
    setOpenMenuId(null);
  };

  return (
    <div
      className={cn(
        "flex flex-col w-full h-full bg-[var(--claude-dark-700)] backdrop-blur-xl text-white shadow-[var(--shadow-lg)] transition-all duration-300 border-r border-[var(--border-color)]",
        !isPinned && !isHovered && "-translate-x-full md:translate-x-auto"
      )}
    >
      <div className="flex items-center justify-between w-full p-4 border-b border-[var(--border-color)]">
        <button
          onClick={addThread}
          className="flex items-center gap-2 py-2 px-4 rounded-[var(--radius-md)] bg-[var(--claude-purple)] hover:bg-[var(--claude-purple-dark)] text-white transition-all duration-200 shadow-[var(--shadow-sm)]"
        >
          <SparklesIcon className="w-5 h-5" />
          <span className="whitespace-nowrap">New Chat</span>
        </button>
        <button
          onClick={() => setIsPinned(!isPinned)}
          className="p-2 hover:bg-[var(--surface-hover)] rounded-full transition-all duration-200 md:block hidden"
        >
          {isPinned ? <ChevronLeftIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto webkit-overflow-scrolling-touch p-3 space-y-1.5 touch-pan-y">
        {threads.length === 0 ? (
          <div className="text-center p-4 text-gray-400 text-sm">
            No conversations yet.<br />
            Start a new chat to begin.
          </div>
        ) : (
          threads.map((thread) => (
            <div key={thread.id} className="relative group" ref={openMenuId === thread.id ? menuRef : null}>
              <button
                onClick={() => {
                  setCurrentThread(thread.id);
                  // Close mobile menu if smaller screen
                  const isMobile = window.innerWidth < 768;
                  if (isMobile) {
                    const event = new CustomEvent('closeMobileMenu');
                    document.dispatchEvent(event);
                  }
                }}
                className={cn(
                  'flex items-center gap-2 w-full py-2.5 px-4 rounded-[var(--radius-md)] hover:bg-[var(--surface-hover)] transition-all duration-200 text-left',
                  currentThreadId === thread.id 
                    ? 'bg-[var(--surface-active)] text-white' 
                    : 'text-gray-300 hover:text-white'
                )}
              >
                <ChatBubbleLeftIcon className="w-5 h-5 shrink-0 text-[var(--claude-purple-light)]" />
                <span className="truncate">{thread.title}</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === thread.id ? null : thread.id);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-full hover:bg-[var(--surface-hover)]"
                aria-label="Thread options"
              >
                <EllipsisVerticalIcon className="w-4 h-4" />
              </button>

              {openMenuId === thread.id && (
                <div className="absolute right-0 top-full mt-1 w-48 py-1 bg-[var(--claude-dark-100)] rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] z-10 border border-[var(--border-color)] overflow-hidden">
                  <button
                    onClick={() => handleExport(thread.id)}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-left hover:bg-[var(--surface-hover)] transition-all duration-200"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4 text-[var(--claude-purple-light)]" />
                    Export as Markdown
                  </button>
                  <button
                    onClick={() => handleDelete(thread.id)}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-left hover:bg-[var(--surface-hover)] transition-all duration-200 text-red-400"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}