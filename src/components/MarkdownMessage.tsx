import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Highlight, themes } from 'prism-react-renderer';
import { cn } from '@/lib/utils';
import { CheckIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export function MarkdownMessage({ content, className }: MarkdownMessageProps) {
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});

  // Reset copied state when content changes
  useEffect(() => {
    setCopiedMap({});
  }, [content]);

  const handleCopy = async (code: string, blockId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedMap(prev => ({ ...prev, [blockId]: true }));
      setTimeout(() => {
        setCopiedMap(prev => ({ ...prev, [blockId]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy code to clipboard:', error);
    }
  };

  return (
    <div className={cn('prose prose-invert max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            // Generate a stable ID based on the code content
            const blockId = btoa(String(children).slice(0, 20)).replace(/[+/=]/g, '').slice(0, 10);
            
            if (language) {
              // Handle code blocks (with language)
              return (
                <div className="relative group my-6 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-color)] shadow-[var(--shadow-sm)]">
                  <div className="flex items-center justify-between px-4 py-2 bg-[var(--claude-dark-700)] border-b border-[var(--border-color)]">
                    <div className="text-xs text-gray-300 font-mono">{language}</div>
                    <button
                      onClick={() => handleCopy(String(children), blockId)}
                      className="text-xs bg-[var(--surface-light)] hover:bg-[var(--surface-hover)] rounded-[var(--radius-sm)] px-2.5 py-1 text-gray-300 flex items-center gap-1.5 transition-all duration-200"
                      aria-label={copiedMap[blockId] ? "Copied!" : "Copy code"}
                    >
                      {copiedMap[blockId] ? (
                        <>
                          <CheckIcon className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
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
                          'p-4 bg-[var(--claude-dark-700)] overflow-x-auto m-0'
                        )}
                        style={{
                          ...style,
                          backgroundColor: 'var(--claude-dark-700)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        <code className="font-mono text-sm">
                          {tokens.map((line, i) => {
                            const lineProps = getLineProps({ line });
                            return (
                              <div key={i} {...lineProps} style={{ display: 'flex' }}>
                                <span className="text-gray-500 mr-4 select-none text-right w-6" style={{ userSelect: 'none' }}>
                                  {i + 1}
                                </span>
                                <span>
                                  {line.map((token, key) => {
                                    const tokenProps = getTokenProps({ token });
                                    return <span key={key} {...tokenProps} />;
                                  })}
                                </span>
                              </div>
                            );
                          })}
                        </code>
                      </pre>
                    )}
                  </Highlight>
                </div>
              );
            }

            // Handle inline code (no language)
            return (
              <code
                className={cn(
                  'bg-[var(--surface-light)] rounded-[var(--radius-sm)] px-1.5 py-0.5 font-mono text-sm text-[var(--claude-purple-light)]',
                  className
                )}
                {...props}
              >
                {children}
              </code>
            );
          },
          // Style other markdown elements
          p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>
          ),
          li: ({ children }) => <li className="mb-1">{children}</li>,
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mb-4 pb-2 border-b border-[var(--border-color)] text-white">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold mb-3 pb-1 text-white">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-bold mb-2 text-white">{children}</h3>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[var(--claude-purple)] bg-[var(--surface-light)] pl-4 py-1 italic mb-4 rounded-r-[var(--radius-sm)]">
              {children}
            </blockquote>
          ),
          a: ({ children, href = "#" }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--claude-purple-light)] hover:text-[var(--claude-purple)] underline decoration-[0.5px] underline-offset-2 transition-colors duration-200"
            >
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4 rounded-[var(--radius-md)] border border-[var(--border-color)] shadow-[var(--shadow-sm)]">
              <table className="min-w-full divide-y divide-[var(--border-color)]">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[var(--surface-light)]">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-[var(--border-color)]">
              {children}
            </tbody>
          ),
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children }) => (
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-sm">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}