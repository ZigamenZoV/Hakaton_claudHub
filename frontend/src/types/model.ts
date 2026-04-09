export type ModelCapability = 'text' | 'vision' | 'image_gen' | 'code' | 'large_context'

export interface Model {
  id: string
  name: string
  provider: string
  capabilities: ModelCapability[]
  contextWindow: number
  icon?: string
}
