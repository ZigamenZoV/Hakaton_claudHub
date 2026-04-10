export type MemoryCategory = 'profile' | 'project' | 'team' | 'deadline' | 'stack' | 'preference' | 'context' | 'fact'

export const MEMORY_CATEGORY_LABELS: Record<MemoryCategory, string> = {
  profile: 'ПРОФИЛЬ',
  project: 'ПРОЕКТ',
  team: 'КОМАНДА',
  deadline: 'ДЕДЛАЙН',
  stack: 'СТЕК',
  preference: 'ПРЕДПОЧТЕНИЯ',
  context: 'КОНТЕКСТ',
  fact: 'ФАКТ',
}

export const MEMORY_CATEGORY_COLORS: Record<MemoryCategory, string> = {
  profile: 'text-blue-400 border-blue-500/30 bg-blue-500/5',
  project: 'text-purple-400 border-purple-500/30 bg-purple-500/5',
  team: 'text-rose-400 border-rose-500/30 bg-rose-500/5',
  deadline: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
  stack: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
  preference: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/5',
  context: 'text-orange-400 border-orange-500/30 bg-orange-500/5',
  fact: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5',
}

export interface MemoryEntry {
  id: string
  content: string
  category: MemoryCategory
  createdAt: number
  relevance?: number
}
