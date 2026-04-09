import type { FileAttachment } from '@/types/file'
import { isImageFile } from '@/types/file'

type TaskCategory = 'code' | 'image_gen' | 'image_analysis' | 'document' | 'simple' | 'complex'

const MODEL_MAP: Record<TaskCategory, string> = {
  code: 'deepseek-coder',
  image_gen: 'dall-e-3',
  image_analysis: 'gpt-4o',
  document: 'gpt-4o',
  simple: 'mistral-7b',
  complex: 'gpt-4o',
}

const ROUTE_LABELS: Record<TaskCategory, string> = {
  code: 'Код / программирование',
  image_gen: 'Генерация изображений',
  image_analysis: 'Анализ изображения',
  document: 'Работа с документом',
  simple: 'Простой вопрос',
  complex: 'Сложный запрос',
}

function classify(message: string, files: FileAttachment[]): TaskCategory {
  if (files.some((f) => isImageFile(f.type))) return 'image_analysis'
  if (files.length > 0) return 'document'
  if (/\b(нарисуй|сгенерируй изображение|generate image|draw|create.*image)\b/i.test(message))
    return 'image_gen'
  if (
    /\b(код|code|функци|function|debug|баг|bug|implement|class |def |const |import |алгоритм)\b/i.test(
      message
    )
  )
    return 'code'
  if (message.trim().length < 80) return 'simple'
  return 'complex'
}

export function routeModel(message: string, files: FileAttachment[]): string {
  return MODEL_MAP[classify(message, files)]
}

export function getRouteLabel(message: string, files: FileAttachment[]): string {
  return ROUTE_LABELS[classify(message, files)]
}
