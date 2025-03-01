import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, DbThread, DbMessage } from './supabase'
import { getLoggedInUser } from './auth'

// Check if Supabase is configured
const isSupabaseConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Storage interface for different backends
interface StorageBackend {
  loadThreads: (userId: string) => Promise<Thread[]>
  createThread: (thread: Thread, userId: string) => Promise<void>
  addMessage: (threadId: string, message: Message) => Promise<void>
  updateMessage: (messageId: string, message: Partial<Message>) => Promise<void>
  deleteMessages: (messageIds: string[]) => Promise<void>
  updateThread: (threadId: string, data: Partial<DbThread>) => Promise<void>
  deleteThread: (threadId: string) => Promise<void>
}

// Supabase storage implementation
const supabaseStorage: StorageBackend = {
  loadThreads: async (userId: string) => {
    const { data: threads, error: threadsError } = await supabase
      .from('threads')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (threadsError) throw threadsError

    const threadsWithMessages = await Promise.all(
      threads.map(async (thread: DbThread) => {
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('thread_id', thread.id)
          .order('created_at', { ascending: true })

        if (messagesError) throw messagesError

        return {
          id: thread.id,
          title: thread.title,
          messages: messages.map((msg: DbMessage) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            createdAt: new Date(msg.created_at),
          })),
          createdAt: new Date(thread.created_at),
          updatedAt: new Date(thread.updated_at),
        }
      })
    )

    return threadsWithMessages
  },

  createThread: async (thread: Thread, userId: string) => {
    await supabase.from('threads').insert({
      id: thread.id,
      title: thread.title,
      user_id: userId,
      created_at: thread.createdAt.toISOString(),
      updated_at: thread.updatedAt.toISOString(),
    })
  },

  addMessage: async (threadId: string, message: Message) => {
    await Promise.all([
      supabase.from('messages').insert({
        id: message.id,
        thread_id: threadId,
        role: message.role,
        content: message.content,
        created_at: message.createdAt.toISOString(),
      }),
      supabase
        .from('threads')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', threadId),
    ])
  },

  updateMessage: async (messageId: string, message: Partial<Message>) => {
    await supabase
      .from('messages')
      .update({
        content: message.content,
        role: message.role,
      })
      .eq('id', messageId)
  },

  deleteMessages: async (messageIds: string[]) => {
    await supabase
      .from('messages')
      .delete()
      .in('id', messageIds)
  },

  updateThread: async (threadId: string, data: Partial<DbThread>) => {
    await supabase
      .from('threads')
      .update(data)
      .eq('id', threadId)
  },

  deleteThread: async (threadId: string) => {
    await Promise.all([
      supabase
        .from('messages')
        .delete()
        .eq('thread_id', threadId),
      supabase
        .from('threads')
        .delete()
        .eq('id', threadId)
    ])
  },
}

// Local storage implementation (no-op since Zustand already handles persistence)
const localStorage: StorageBackend = {
  loadThreads: async () => [],
  createThread: async () => {},
  addMessage: async () => {},
  updateMessage: async () => {},
  deleteMessages: async () => {},
  updateThread: async () => {},
  deleteThread: async () => {},
}

// Select storage backend based on configuration
const storage = isSupabaseConfigured ? supabaseStorage : localStorage

export type Message = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: Date
  isPartial?: boolean
}

export type Thread = {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

type ChatStore = {
  threads: Thread[]
  currentThreadId: string | null
  selectedModel: 'claude-3-opus-20240229' | 'claude-3-5-sonnet-20240620' | 'claude-3-7-sonnet-20250219'
  isLoading: boolean
  loadThreads: () => Promise<void>
  addThread: () => Promise<void>
  setCurrentThread: (threadId: string) => void
  addMessage: (threadId: string, message: Message) => Promise<void>
  updateMessage: (threadId: string, messageId: string, message: Message) => Promise<void>
  deleteMessagesAfter: (threadId: string, messageIndex: number) => Promise<void>
  setSelectedModel: (model: ChatStore['selectedModel']) => void
  updateThreadTitle: (threadId: string, title: string) => Promise<void>
  deleteThread: (threadId: string) => Promise<void>
  resetState: () => void
}

export const useStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      threads: [],
      currentThreadId: null,
      selectedModel: 'claude-3-7-sonnet-20250219',
      isLoading: false,

      loadThreads: async () => {
        if (typeof window !== 'undefined') {
          set({ isLoading: true })
        }

        try {
          const user = getLoggedInUser()
          const userId = user?.id || 'default-user'
          const threads = await storage.loadThreads(userId)
          set({ threads, isLoading: false })
        } catch (error) {
          console.error('Error loading threads:', error)
          set({ isLoading: false })
        }
      },

      addThread: async () => {
        const user = getLoggedInUser()
        const userId = user?.id || 'default-user'
        const threadId = Math.random().toString(36).substring(7)
        const now = new Date()

        const newThread: Thread = {
          id: threadId,
          title: 'New Chat',
          messages: [],
          createdAt: now,
          updatedAt: now,
        }

        set((state) => ({
          threads: [newThread, ...state.threads],
          currentThreadId: newThread.id,
        }))

        try {
          await storage.createThread(newThread, userId)
        } catch (error) {
          console.error('Error creating thread:', error)
        }
      },

      setCurrentThread: (threadId) => {
        set({ currentThreadId: threadId })
      },

      addMessage: async (threadId, message) => {
        set((state) => ({
          threads: state.threads.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  messages: [...thread.messages, message],
                  updatedAt: new Date(),
                }
              : thread
          ),
        }))

        try {
          await storage.addMessage(threadId, message)
          return Promise.resolve()
        } catch (error) {
          console.error('Error adding message:', error)
          return Promise.reject(error)
        }
      },

      updateMessage: async (threadId, messageId, message) => {
        set((state) => ({
          threads: state.threads.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  messages: thread.messages.map((msg) =>
                    msg.id === messageId ? message : msg
                  ),
                  updatedAt: new Date(),
                }
              : thread
          ),
        }))

        try {
          await storage.updateMessage(messageId, message)
          return Promise.resolve()
        } catch (error) {
          console.error('Error updating message:', error)
          return Promise.reject(error)
        }
      },

      deleteMessagesAfter: async (threadId, messageIndex) => {
        const thread = get().threads.find((t) => t.id === threadId)
        if (!thread) return Promise.resolve()

        const messagesToDelete = thread.messages.slice(messageIndex + 1)
        const messageIds = messagesToDelete.map((msg) => msg.id)

        set((state) => ({
          threads: state.threads.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  messages: thread.messages.slice(0, messageIndex + 1),
                  updatedAt: new Date(),
                }
              : thread
          ),
        }))

        try {
          if (messageIds.length > 0) {
            await storage.deleteMessages(messageIds)
          }
          return Promise.resolve()
        } catch (error) {
          console.error('Error deleting messages:', error)
          return Promise.reject(error)
        }
      },

      updateThreadTitle: async (threadId, title) => {
        set((state) => ({
          threads: state.threads.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  title,
                  updatedAt: new Date(),
                }
              : thread
          ),
        }))

        try {
          await storage.updateThread(threadId, { title })
          return Promise.resolve()
        } catch (error) {
          console.error('Error updating thread title:', error)
          return Promise.reject(error)
        }
      },

      deleteThread: async (threadId) => {
        set((state) => {
          const newThreads = state.threads.filter((thread) => thread.id !== threadId)
          return {
            threads: newThreads,
            currentThreadId: state.currentThreadId === threadId
              ? (newThreads[0]?.id || null)
              : state.currentThreadId,
          }
        })

        try {
          await storage.deleteThread(threadId)
        } catch (error) {
          console.error('Error deleting thread:', error)
        }
      },

      setSelectedModel: (model) => {
        set({ selectedModel: model })
      },

      resetState: () => {
        set({
          threads: [],
          currentThreadId: null,
          isLoading: false
        })
      }
    }),
    {
      name: 'chat-storage',
      skipHydration: true,
    }
  )
) 