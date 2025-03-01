import { useState } from 'react';
import { MarkdownMessage } from './MarkdownMessage';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface MarkdownInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MarkdownInput({
  value,
  onChange,
  onSubmit,
  onCancel,
  placeholder,
  disabled,
  className,
}: MarkdownInputProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className={className}>
      <div className="relative">
        <div className="absolute right-2 top-2 z-10">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="p-1.5 rounded-full bg-[var(--surface-light)] hover:bg-[var(--surface-hover)] text-gray-400 hover:text-white transition-all duration-200"
            aria-label={showPreview ? "Switch to edit mode" : "Switch to preview mode"}
          >
            {showPreview ? (
              <EyeSlashIcon className="w-4 h-4" />
            ) : (
              <EyeIcon className="w-4 h-4" />
            )}
          </button>
        </div>
        {showPreview ? (
          <div 
            className="min-h-[100px] max-h-[400px] overflow-y-auto p-4 rounded-[var(--radius-md)] border border-[var(--border-color)] bg-[var(--claude-dark-100)] text-[var(--foreground)] shadow-[var(--shadow-sm)]"
          >
            <MarkdownMessage content={value || '*No content*'} />
          </div>
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "w-full min-h-[100px] max-h-[400px] px-4 py-3 rounded-[var(--radius-md)] border border-[var(--border-color)] bg-[var(--claude-dark-100)] text-[var(--foreground)] placeholder-gray-400",
              "focus:outline-none focus:border-[var(--claude-purple-light)] shadow-[var(--shadow-sm)] resize-y transition-all duration-200",
              disabled && "opacity-70 cursor-not-allowed"
            )}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                onSubmit();
              } else if (e.key === 'Escape' && onCancel) {
                e.preventDefault();
                onCancel();
              }
            }}
          />
        )}
      </div>
      <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
        <div>{showPreview ? 'Preview Mode' : 'Edit Mode'}</div>
        <div className="space-x-2">
          {onCancel && (
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--claude-dark-300)] text-xs font-mono">Esc</kbd> to cancel
            </span>
          )}
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--claude-dark-300)] text-xs font-mono">
              {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter
            </kbd> to submit
          </span>
        </div>
      </div>
    </div>
  );
} 