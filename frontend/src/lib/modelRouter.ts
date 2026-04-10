import type { FileAttachment } from '@/types/file'
import { isImageFile } from '@/types/file'

export type TaskCategory =
  | 'code'
  | 'image_gen'
  | 'image_analysis'
  | 'document'
  | 'simple'
  | 'complex'
  | 'research'
  | 'web_search'
  | 'presentation'

const MODEL_MAP: Record<TaskCategory, string> = {
  code: 'kodify-2.0',
  image_gen: 'mws-gpt-alpha',
  image_analysis: 'mws-gpt-alpha',
  document: 'cotype-preview-32k',
  simple: 'mws-gpt-alpha',
  complex: 'cotype-preview-32k',
  research: 'cotype-preview-32k',
  web_search: 'mws-gpt-alpha',
  presentation: 'cotype-preview-32k',
}

const ROUTE_LABELS: Record<TaskCategory, string> = {
  code: 'Код / программирование',
  image_gen: 'Генерация изображений',
  image_analysis: 'Анализ изображения',
  document: 'Работа с документом',
  simple: 'Простой вопрос',
  complex: 'Сложный запрос',
  research: 'Deep Research',
  web_search: 'Поиск в интернете',
  presentation: 'Генерация презентации',
}

function classify(
  message: string,
  files: FileAttachment[],
  options?: { webSearch?: boolean; researchMode?: boolean; presentationMode?: boolean }
): TaskCategory {
  if (options?.presentationMode) return 'presentation'
  if (options?.researchMode) return 'research'
  if (options?.webSearch) return 'web_search'
  if (files.some((f) => isImageFile(f.type))) return 'image_analysis'
  if (files.length > 0) return 'document'
  if (/\b(презентаци|слайд|pptx|powerpoint|presentation|slides)/i.test(message))
    return 'presentation'
  if (/\b(нарисуй|сгенерируй изображение|generate image|draw|create.*image|картинк)/i.test(message))
    return 'image_gen'
  if (
    /\b(код|code|функци|function|debug|баг|bug|implement|class |def |const |import |алгоритм|python|typescript|javascript|react)/i.test(
      message
    )
  )
    return 'code'
  // URL detection → web search
  if (/https?:\/\/\S+/.test(message)) return 'web_search'
  if (message.trim().length < 80) return 'simple'
  return 'complex'
}

export function routeModel(
  message: string,
  files: FileAttachment[],
  options?: { webSearch?: boolean; researchMode?: boolean; presentationMode?: boolean }
): string {
  return MODEL_MAP[classify(message, files, options)]
}

export function getRouteLabel(
  message: string,
  files: FileAttachment[],
  options?: { webSearch?: boolean; researchMode?: boolean; presentationMode?: boolean }
): string {
  return ROUTE_LABELS[classify(message, files, options)]
}

export function getTaskCategory(
  message: string,
  files: FileAttachment[],
  options?: { webSearch?: boolean; researchMode?: boolean; presentationMode?: boolean }
): TaskCategory {
  return classify(message, files, options)
}
