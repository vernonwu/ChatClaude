import Anthropic from '@anthropic-ai/sdk';
import { Message } from './store';
import axios from 'axios';

const anthropic = new Anthropic({
  apiKey: process.env.NEXT_PUBLIC_CLAUDE_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

// Configure axios for the proxy
const proxyHost = process.env.HTTP_PROXY_HOST;
const proxyPort = process.env.HTTP_PROXY_POST ?
  parseInt(process.env.HTTP_PROXY_POST) : undefined;

if (proxyHost && proxyPort) {
  axios.defaults.proxy = {
    host: proxyHost,
    port: proxyPort
  };
  console.log(`Proxy configured: ${proxyHost}:${proxyPort}`);
}

export async function sendMessage(messages: Message[], model: string, system?: string) {
  try {
    const response = await anthropic.messages.create({
      model: model,
      max_tokens: 4096,
      messages: messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
      system: system,
    });

    const content = response.content[0].type === 'text'
      ? response.content[0].text
      : 'Unable to process response';

    return {
      id: response.id,
      role: 'assistant' as const,
      content,
      createdAt: new Date(),
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error calling Claude API:', error.message);
    } else {
      console.error('Error calling Claude API:', error);
    }
    throw error;
  }
}

export async function* streamMessage(
  messages: Message[],
  model: string,
  signal?: AbortSignal,
  system?: string
) {
  try {
    const defaultSystemPrompt = "You are a helpful assistant. Always respond in markdown format. Use code blocks with appropriate language tags for any code examples, like ```javascript ... ``` for JavaScript code.";
    
    const systemPrompt = system || defaultSystemPrompt;
    
    const stream = await anthropic.messages.stream({
      model: model,
      max_tokens: 4096,
      messages: messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
      system: systemPrompt,
    }, { signal });

    let messageId = '';
    let fullContent = '';

    for await (const chunk of stream) {
      if ('message' in chunk && chunk.message?.id) {
        messageId = chunk.message.id;
      }

      if (chunk.type === 'content_block_delta' &&
          'delta' in chunk &&
          chunk.delta.type === 'text_delta') {
        const textChunk = chunk.delta.text;
        fullContent += textChunk;

        yield {
          id: messageId || Math.random().toString(36).substring(7),
          role: 'assistant' as const,
          content: fullContent,
          createdAt: new Date(),
          isPartial: true,
        };
      }
    }

    // Return the final complete message
    return {
      id: messageId,
      role: 'assistant' as const,
      content: fullContent,
      createdAt: new Date(),
      isPartial: false,
    };
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    if (error instanceof Error) {
      console.error('Error streaming from Claude API:', error.message);
    } else {
      console.error('Error streaming from Claude API:', error);
    }
    throw error;
  }
}