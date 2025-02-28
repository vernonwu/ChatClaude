import { useState, useRef, useEffect } from 'react';
import { PencilIcon } from '@heroicons/react/24/outline';
import { useStore, Message } from '@/lib/store';
import { sendMessage, streamMessage } from '@/lib/claude';
import { MarkdownMessage } from './MarkdownMessage';
import { MarkdownInput } from './MarkdownInput';
import { ModelSelector } from './ModelSelector';

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
    updateMessage(currentThreadId, messageId, updatedMessage);

    // Delete all messages after this one
    deleteMessagesAfter(currentThreadId, messageIndex);

    // Clear editing state
    setEditingMessageId(null);
    setEditInput('');

    // Start new generation
    setIsLoading(true);

    // Create new AbortController for this stream
    abortControllerRef.current = new AbortController();

    try {
      const messageStream = streamMessage(
        [...currentThread!.messages.slice(0, messageIndex + 1)],
        selectedModel,
        abortControllerRef.current.signal
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

    addMessage(currentThreadId, userMessage);
    setInput('');
    setIsLoading(true);

    // If this is the first message, get a topic summary
    if (currentThread?.messages.length === 0) {
      const summary = await getTopicSummary(userMessage.content);
      updateThreadTitle(currentThreadId, summary);
    }

    // Create new AbortController for this stream
    abortControllerRef.current = new AbortController();

    try {
      const messageStream = streamMessage(
        [...(currentThread?.messages || []), userMessage],
        selectedModel,
        abortControllerRef.current.signal
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage();
  };

  if (!currentThreadId) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--foreground)]">
        Select or create a new chat to get started
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[var(--claude-dark-100)]">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {currentThread?.messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'assistant' ? 'justify-start' : 'justify-end'
            } ${index === 0 ? '' : 'mt-3'}`}
          >
            <div
              className={`relative group max-w-[85%] ${
                message.role === 'assistant' ? 'mr-12' : 'ml-12'
              }`}
            >
              {message.role === 'user' && (
                <button
                  onClick={() => startEditing(message.id, message.content)}
                  className="absolute -left-10 top-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <PencilIcon className="w-4 h-4 text-gray-400 hover:text-white" />
                </button>
              )}
              <div
                className={`rounded-2xl p-4 shadow-sm ${
                  message.role === 'assistant'
                    ? 'bg-[var(--claude-dark-50)] text-[var(--foreground)]'
                    : 'bg-[var(--claude-purple)] text-white'
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
                    className="min-w-[400px]"
                  />
                ) : (
                  <MarkdownMessage content={message.content} />
                )}
              </div>
              <div className={`text-xs mt-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                message.role === 'assistant' ? 'text-left' : 'text-right'
              }`}>
                {new Date(message.createdAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="relative px-4 py-3 border-t border-[var(--claude-dark-300)] bg-[var(--claude-dark-200)] group"
      >
        <div className="absolute bottom-full left-4 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <ModelSelector />
        </div>
        <MarkdownInput
          value={input}
          onChange={setInput}
          onSubmit={submitMessage}
          placeholder="Type your message..."
          disabled={isLoading}
          className="flex-1"
        />
      </form>
    </div>
  );
}