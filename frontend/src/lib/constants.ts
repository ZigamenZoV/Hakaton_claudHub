import type { Model } from '@/types/model'

export const MODELS: Model[] = [
  {
    id: 'mws-gpt-alpha',
    name: 'MWS GPT Alpha',
    provider: 'mws',
    capabilities: ['text', 'vision', 'large_context'],
    contextWindow: 128000,
  },
  {
    id: 'kodify-2.0',
    name: 'Kodify 2.0',
    provider: 'mws',
    capabilities: ['text', 'code'],
    contextWindow: 32000,
  },
  {
    id: 'cotype-preview-32k',
    name: 'CoType Preview 32K',
    provider: 'mws',
    capabilities: ['text', 'large_context'],
    contextWindow: 32768,
  },
]

export const AUTO_MODEL_ID = 'auto'

export const MWS_API_BASE = 'https://api.gpt.mws.ru'
