import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Highlight, themes } from 'prism-react-renderer';
import { cn } from '@/lib/utils';
import { CheckIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export function MarkdownMessage({ content, className }: MarkdownMessageProps) {
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});

  const handleCopy = async (code: string, blockId: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedMap(prev => ({ ...prev, [blockId]: true }));
    setTimeout(() => {
      setCopiedMap(prev => ({ ...prev, [blockId]: false }));
    }, 2000);
  };

  return (
    <div className={cn('prose prose-invert max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const blockId = Math.random().toString(36).substring(7);

            if (language) {
              return (
                <div className="relative group">
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopy(String(children), blockId)}
                      className="text-xs bg-[var(--claude-dark-300)] hover:bg-[var(--claude-dark-200)] rounded px-2 py-1 text-gray-300 flex items-center gap-1"
                    >
                      {copiedMap[blockId] ? (
                        <>
                          <CheckIcon className="w-4 h-4" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        'Copy'
                      )}
                    </button>
                  </div>
                  <Highlight
                    theme={themes.nightOwl}
                    code={String(children).replace(/\n$/, '')}
                    language={language}
                  >
                    {({ className, style, tokens, getLineProps, getTokenProps }) => (
                      <pre
                        className={cn(
                          className,
                          'rounded-lg p-4 bg-[var(--claude-dark-300)] overflow-x-auto'
                        )}
                        style={style}
                      >
                        {tokens.map((line, i) => (
                          <div key={i} {...getLineProps({ line })}>
                            {line.map((token, key) => (
                              <span key={key} {...getTokenProps({ token })} />
                            ))}
                          </div>
                        ))}
                      </pre>
                    )}
                  </Highlight>
                </div>
              );
            }

            return (
              <code
                className={cn(
                  'bg-[var(--claude-dark-300)] rounded px-1.5 py-0.5',
                  className
                )}
                {...props}
              >
                {children}
              </code>
            );
          },
          // Style other markdown elements
          p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-6 mb-4">{children}</ul>,
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 mb-4">{children}</ol>
          ),
          li: ({ children }) => <li className="mb-1">{children}</li>,
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mb-4">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold mb-3">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-bold mb-2">{children}</h3>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[var(--claude-dark-300)] pl-4 italic mb-4">
              {children}
            </blockquote>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--claude-purple-light)] hover:underline"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}