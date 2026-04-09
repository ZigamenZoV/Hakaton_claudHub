import type { Model } from '@/types/model'

export const MODELS: Model[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    capabilities: ['text', 'vision', 'large_context'],
    contextWindow: 128000,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    capabilities: ['text', 'vision'],
    contextWindow: 128000,
  },
  {
    id: 'deepseek-coder',
    name: 'DeepSeek Coder',
    provider: 'ollama',
    capabilities: ['text', 'code'],
    contextWindow: 16384,
  },
  {
    id: 'mistral-7b',
    name: 'Mistral 7B',
    provider: 'ollama',
    capabilities: ['text'],
    contextWindow: 8192,
  },
  {
    id: 'llama3-8b',
    name: 'Llama 3 8B',
    provider: 'ollama',
    capabilities: ['text'],
    contextWindow: 8192,
  },
  {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    provider: 'openai',
    capabilities: ['image_gen'],
    contextWindow: 0,
  },
]

export const AUTO_MODEL_ID = 'auto'
