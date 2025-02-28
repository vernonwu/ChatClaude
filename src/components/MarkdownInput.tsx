import { useState } from 'react';
import { MarkdownMessage } from './MarkdownMessage';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

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
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            {showPreview ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
        </div>
        {showPreview ? (
          <div 
            className="min-h-[100px] max-h-[400px] overflow-y-auto p-4 rounded-lg border border-[var(--claude-dark-300)] bg-[var(--claude-dark-50)] text-[var(--foreground)]"
          >
            <MarkdownMessage content={value || '*No content*'} />
          </div>
        ) : (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full min-h-[100px] max-h-[400px] px-4 py-2 rounded-lg border border-[var(--claude-dark-300)] bg-[var(--claude-dark-50)] text-[var(--foreground)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--claude-purple)] focus:border-[var(--claude-purple)] resize-y"
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
      <div className="mt-2 text-xs text-gray-400">
        {showPreview ? 'Preview Mode' : 'Edit Mode'} • Press {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter to submit
        {onCancel && ' • Esc to cancel'}
      </div>
    </div>
  );
} 