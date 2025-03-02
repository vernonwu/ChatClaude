import { useState, useRef, useEffect } from 'react';
import { PencilIcon } from '@heroicons/react/24/outline';
import { useStore, Message } from '@/lib/store';
import { sendMessage, streamMessage } from '@/lib/claude';
import { MarkdownMessage } from './MarkdownMessage';
import { MarkdownInput } from './MarkdownInput';
import { ModelSelector } from './ModelSelector';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

export function ChatInterface() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { threads, currentThreadId, selectedModel, addMessage, updateMessage, deleteMessagesAfter, updateThreadTitle } = useStore();

  const currentThread = threads.find((t) => t.id === currentThreadId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentThread?.messages]);

  // Handle Ctrl+C to abort generation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'c' && isLoading) {
        abortControllerRef.current?.abort();
        setIsLoading(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLoading]);

  const startEditing = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditInput(content);
  };

  const handleEdit = async (messageId: string) => {
    if (!editInput.trim() || !currentThreadId) return;

    // Find the index of the message being edited
    const messageIndex = currentThread?.messages.findIndex(m => m.id === messageId) ?? -1;
    if (messageIndex === -1) return;

    // Update the message content
    const updatedMessage = {
      ...currentThread!.messages[messageIndex],
      content: editInput.trim()
    };
    
    // Clear editing state
    setEditingMessageId(null);
    setEditInput('');
    
    // Start new generation
    setIsLoading(true);
    
    // First update the message and delete messages after this one
    await updateMessage(currentThreadId, messageId, updatedMessage);
    await deleteMessagesAfter(currentThreadId, messageIndex);
    
    // Create new AbortController for this stream
    abortControllerRef.current = new AbortController();

    try {
      // Get the updated thread state after the updates
      const updatedThread = useStore.getState().threads.find(t => t.id === currentThreadId);
      if (!updatedThread) {
        setIsLoading(false);
        return;
      }
      
      const messageStream = streamMessage(
        [...updatedThread.messages],
        selectedModel,
        abortControllerRef.current.signal,
        "You are a helpful assistant. Always respond in markdown format. Use code blocks with appropriate language tags for any code examples, like ```javascript ... ``` for JavaScript code. Format headers with # for main headings and ## for subheadings."
      );

      let lastMessageId: string | null = null;

      for await (const message of messageStream) {
        if (!lastMessageId) {
          addMessage(currentThreadId, message);
          lastMessageId = message.id;
        } else {
          updateMessage(currentThreadId, lastMessageId, message);
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Silently handle abort errors
      } else {
        console.error('Error sending message:', error);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const getTopicSummary = async (message: string) => {
    try {
      const response = await sendMessage([{
        id: 'user',
        role: 'user',
        content: message,
        createdAt: new Date(),
      }], selectedModel, 'You are a helpful assistant. Please provide a brief 2-4 word summary of the topic or main question being asked. Respond with ONLY the summary, no other text.');

      return response.content.trim();
    } catch (error) {
      console.error('Error getting topic summary:', error);
      return 'New Chat';
    }
  };

  const submitMessage = async () => {
    if (!input.trim() || !currentThreadId || isLoading) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: input.trim(),
      createdAt: new Date(),
    };

    setInput('');
    setIsLoading(true);

    // Add user message to the store
    await addMessage(currentThreadId, userMessage);

    // If this is the first message, get a topic summary
    if (currentThread?.messages.length === 0) {
      const summary = await getTopicSummary(userMessage.content);
      await updateThreadTitle(currentThreadId, summary);
    }

    // Create new AbortController for this stream
    abortControllerRef.current = new AbortController();

    try {
      // Get the updated thread state after adding the user message
      const updatedThread = useStore.getState().threads.find(t => t.id === currentThreadId);
      if (!updatedThread) {
        setIsLoading(false);
        return;
      }
      
      const messageStream = streamMessage(
        [...updatedThread.messages],
        selectedModel,
        abortControllerRef.current.signal,
        "You are a helpful assistant. Always respond in markdown format. Use code blocks with appropriate language tags for any code examples, like ```javascript ... ``` for JavaScript code. Format headers with # for main headings and ## for subheadings."
      );

      let lastMessageId: string | null = null;

      for await (const message of messageStream) {
        if (!lastMessageId) {
          await addMessage(currentThreadId, message);
          lastMessageId = message.id;
        } else {
          await updateMessage(currentThreadId, lastMessageId, message);
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Silently handle abort errors
      } else {
        console.error('Error sending message:', error);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage();
  };

  if (!currentThreadId) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--foreground)] bg-gradient-to-br from-[var(--claude-dark-300)] to-[var(--claude-dark-700)]">
        <div className="text-center p-8 max-w-md">
          <div className="mb-6 mx-auto w-16 h-16 rounded-full bg-[var(--surface-light)] flex items-center justify-center">
            <ChatBubbleLeftIcon className="w-8 h-8 text-[var(--claude-purple-light)]" />
          </div>
          <h2 className="text-xl font-medium mb-2">Welcome to ChatClaude</h2>
          <p className="text-gray-400">Select an existing conversation or create a new chat to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-b from-[var(--claude-dark-200)] to-[var(--claude-dark-300)]">
      <div className="flex-1 overflow-y-auto px-2 md:px-4 py-6 space-y-6">
        {currentThread?.messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'assistant' ? 'justify-start' : 'justify-end'
            } ${index === 0 ? '' : 'mt-6'}`}
          >
            <div
              className={`relative group max-w-[90%] md:max-w-[85%] ${
                message.role === 'assistant' ? 'mr-2 md:mr-12' : 'ml-2 md:ml-12'
              }`}
            >
              {message.role === 'user' && (
                <button
                  onClick={() => startEditing(message.id, message.content)}
                  className="absolute -left-8 md:-left-10 top-3 opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-full bg-[var(--surface-light)] hover:bg-[var(--surface-hover)] text-gray-400 hover:text-white"
                  aria-label="Edit message"
                >
                  <PencilIcon className="w-3.5 h-3.5" />
                </button>
              )}
              <div
                className={`rounded-[var(--radius-lg)] p-3 md:p-5 shadow-[var(--shadow-md)] ${
                  message.role === 'assistant'
                    ? 'bg-[var(--claude-dark-100)] border border-[var(--border-color)] text-[var(--foreground)]'
                    : 'bg-gradient-to-br from-[var(--claude-purple)] to-[var(--claude-purple-dark)] text-white'
                }`}
              >
                {editingMessageId === message.id ? (
                  <MarkdownInput
                    value={editInput}
                    onChange={setEditInput}
                    onSubmit={() => handleEdit(message.id)}
                    onCancel={() => {
                      setEditingMessageId(null);
                      setEditInput('');
                    }}
                    className="min-w-full md:min-w-[400px]"
                  />
                ) : (
                  <MarkdownMessage content={message.content} />
                )}
              </div>
              <div className={`text-xs mt-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-all duration-200 ${
                message.role === 'assistant' ? 'text-left' : 'text-right'
              }`}>
                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-[var(--border-color)] bg-[var(--claude-dark-200)] p-2 md:p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="relative">
            <MarkdownInput
              value={input}
              onChange={setInput}
              onSubmit={submitMessage}
              disabled={isLoading}
              placeholder={isLoading ? "Claude is thinking..." : "Message Claude..."}
              className="w-full py-3 pl-4 pr-[120px] rounded-[var(--radius-lg)] border border-[var(--border-color)] bg-[var(--claude-dark-100)] text-[var(--foreground)] shadow-[var(--shadow-sm)] hover:border-[var(--claude-purple-light)] focus:border-[var(--claude-purple-light)] transition-all duration-200"
            />
            <div className="absolute right-2 bottom-2 flex space-x-2">
              <ModelSelector />
              
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="px-3.5 py-1.5 rounded-[var(--radius-md)] bg-[var(--claude-purple)] hover:bg-[var(--claude-purple-dark)] text-white font-medium text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "..." : "Send"}
              </button>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500 flex flex-wrap md:flex-nowrap justify-between">
            <div className="hidden md:block">Pro tip: Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--claude-dark-300)] text-xs font-mono">Shift + Enter</kbd> to submit</div>
            <div>
              {isLoading && (
                <span>Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--claude-dark-300)] text-xs font-mono">Ctrl + C</kbd> to stop</span>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}