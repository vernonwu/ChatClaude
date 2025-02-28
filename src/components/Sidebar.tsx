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
        "flex flex-col w-full h-full bg-black text-white shadow-lg transition-transform duration-300",
        !isPinned && !isHovered && "-translate-x-full"
      )}
    >
      <div className="flex items-center justify-between w-full p-4">
        <button
          onClick={addThread}
          className="flex items-center gap-2 py-2 px-4 rounded-lg hover:bg-[var(--claude-dark-50)] transition-colors text-orange-500"
        >
          <SparklesIcon className="w-5 h-5" />
          Start new chat
        </button>
        <button
          onClick={() => setIsPinned(!isPinned)}
          className="p-2 hover:bg-[var(--claude-dark-50)] rounded-lg transition-colors text-gray-400 hover:text-white"
        >
          {isPinned ? <ChevronLeftIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-2">
        {threads.map((thread) => (
          <div key={thread.id} className="relative group" ref={openMenuId === thread.id ? menuRef : null}>
            <button
              onClick={() => setCurrentThread(thread.id)}
              className={cn(
                'flex items-center gap-2 w-full py-2 px-4 rounded-lg hover:bg-[var(--claude-dark-50)] transition-colors text-left',
                currentThreadId === thread.id && 'bg-[var(--claude-dark-50)]'
              )}
            >
              <ChatBubbleLeftIcon className="w-5 h-5 shrink-0" />
              <span className="truncate">{thread.title}</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(openMenuId === thread.id ? null : thread.id);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[var(--claude-dark-100)] rounded"
            >
              <EllipsisVerticalIcon className="w-5 h-5" />
            </button>

            {openMenuId === thread.id && (
              <div className="absolute right-0 top-full mt-1 w-48 py-1 bg-[var(--claude-dark-50)] rounded-lg shadow-lg z-10">
                <button
                  onClick={() => handleDelete(thread.id)}
                  className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-[var(--claude-dark-100)] transition-colors text-red-400"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete
                </button>
                <button
                  onClick={() => handleExport(thread.id)}
                  className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-[var(--claude-dark-100)] transition-colors"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Export as Markdown
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}