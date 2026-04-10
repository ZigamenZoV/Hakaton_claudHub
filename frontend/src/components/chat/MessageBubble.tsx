import { useState } from 'react'
import {
  BrainCircuit, User, Copy, Check, Globe, FlaskConical, Code2,
  FileText, Image as ImageIcon, Mic, ExternalLink, Loader2,
  Presentation, RefreshCw, FileDown, Zap,
} from 'lucide-react'
import type { Message, ContentBlock, SearchResult } from '@/types/chat'
import type { TaskCategory } from '@/lib/modelRouter'
import { MessageContent } from './MessageContent'
import { StreamingIndicator } from './StreamingIndicator'
import { TTSPlayButton } from '@/components/voice/TTSPlayButton'
import { formatTimestamp, formatFileSize } from '@/lib/utils'
import { isAudioFile, isImageFile } from '@/types/file'
import { useMemoryStore } from '@/stores/memoryStore'
import { cn } from '@/lib/utils'

interface Props {
  message: Message
  isStreamingPlaceholder?: boolean
  streamingContent?: string
  onRegenerate?: () => void
}

// ---------------------------------------------------------------------------
// Route indicator config
// ---------------------------------------------------------------------------

const ROUTE_INDICATOR: Record<string, { icon: React.ReactNode; label: string; detail: string; color: string }> = {
  web_search: { icon: <Globe className="h-3.5 w-3.5" />, label: 'Веб-поиск', detail: 'обнаружен запрос поиска', color: 'text-[var(--color-purple)] bg-[var(--color-purple)]/10 border-[var(--color-purple)]/20' },
  research: { icon: <FlaskConical className="h-3.5 w-3.5" />, label: 'Deep Research', detail: 'запрос на исследование', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  code: { icon: <Code2 className="h-3.5 w-3.5" />, label: 'Код', detail: 'обнаружен запрос кода', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  image_gen: { icon: <ImageIcon className="h-3.5 w-3.5" />, label: 'Генерация изображений', detail: 'запрос генерации', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
  image_analysis: { icon: <ImageIcon className="h-3.5 w-3.5" />, label: 'VLM', detail: 'обнаружено изображение', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  document: { icon: <FileText className="h-3.5 w-3.5" />, label: 'RAG', detail: 'обнаружен документ', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  presentation: { icon: <Presentation className="h-3.5 w-3.5" />, label: 'Презентация', detail: 'генерация PPTX', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RouteIndicator({ category, model }: { category: TaskCategory; model?: string }) {
  const cfg = ROUTE_INDICATOR[category]
  if (!cfg) return null
  return (
    <div className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 mb-3', cfg.color)}>
      <Zap className="h-3 w-3 text-[var(--color-primary)]" />
      <span className="text-xs font-medium">{cfg.label}</span>
      <span className="text-xs opacity-70">· {cfg.detail}</span>
      {model && <span className="text-xs opacity-50">→ {model}</span>}
    </div>
  )
}

function SearchResultsBlock({ query, results }: { query: string; results: SearchResult[] }) {
  return (
    <div className="my-3 rounded-xl border border-[var(--color-border)] overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-purple)]/10 border-b border-[var(--color-border)]">
        <Globe className="h-4 w-4 text-[var(--color-purple)]" />
        <span className="text-xs font-medium text-[var(--color-purple)]">Результаты поиска: {query}</span>
      </div>
      <div className="divide-y divide-[var(--color-border)]">
        {results.map((r, i) => (
          <a
            key={i}
            href={r.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-start gap-3 px-3 py-2.5 hover:bg-[var(--color-purple)]/5 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[var(--color-foreground)] truncate">{r.title}</div>
              <div className="text-xs text-[var(--color-muted-foreground)] mt-0.5 line-clamp-2">{r.snippet}</div>
              <div className="text-xs text-[var(--color-purple)]/70 mt-1 truncate">{r.url}</div>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-[var(--color-muted-foreground)] shrink-0 mt-1" />
          </a>
        ))}
      </div>
    </div>
  )
}

function ResearchStepBlock({ title, detail, status }: { title: string; detail: string; status: 'running' | 'done' }) {
  return (
    <div className="flex items-start gap-2.5 my-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
      {status === 'running' ? (
        <Loader2 className="h-4 w-4 text-emerald-400 animate-spin shrink-0 mt-0.5" />
      ) : (
        <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-emerald-400">{title}</div>
        <div className="text-xs text-[var(--color-muted-foreground)] mt-0.5">{detail}</div>
      </div>
    </div>
  )
}

function UrlPreviewBlock({ url, title, description, image }: { url: string; title?: string; description?: string; image?: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="my-3 flex gap-3 rounded-xl border border-[var(--color-border)] overflow-hidden hover:border-[var(--color-purple)]/40 transition-colors"
    >
      {image && (
        <img src={image} alt="" className="w-24 h-20 object-cover shrink-0" loading="lazy" />
      )}
      <div className="flex-1 min-w-0 py-2.5 px-3">
        <div className="text-sm font-medium text-[var(--color-foreground)] truncate">{title ?? url}</div>
        {description && (
          <div className="text-xs text-[var(--color-muted-foreground)] mt-1 line-clamp-2">{description}</div>
        )}
        <div className="text-xs text-[var(--color-purple)]/70 mt-1 truncate flex items-center gap-1">
          <ExternalLink className="h-3 w-3" />
          {(() => { try { return new URL(url).hostname } catch { return url } })()}
        </div>
      </div>
    </a>
  )
}

function ContentBlocks({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'text':
            return <MessageContent key={i} content={block.text} />
          case 'image':
            return (
              <img
                key={i}
                src={block.url}
                alt={block.alt ?? 'Сгенерированное изображение'}
                className="max-w-md rounded-xl my-3 shadow-lg"
                loading="lazy"
              />
            )
          case 'search_results':
            return <SearchResultsBlock key={i} query={block.query} results={block.results} />
          case 'research_step':
            return <ResearchStepBlock key={i} title={block.title} detail={block.detail} status={block.status} />
          case 'url_preview':
            return <UrlPreviewBlock key={i} url={block.url} title={block.title} description={block.description} image={block.image} />
          default:
            return null
        }
      })}
    </>
  )
}

function downloadAsPdf(content: string) {
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  // Convert basic markdown to readable HTML
  const html = escaped
    .replace(/^#{3} (.+)$/gm, '<h3>$1</h3>')
    .replace(/^#{2} (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br/>')
  const fullHtml = `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><title>GPTHub — экспорт</title><style>
    body{font-family:Georgia,serif;max-width:760px;margin:2.5rem auto;padding:0 1.5rem;line-height:1.75;color:#1a1a2e}
    h1,h2,h3{color:#2a0f5c;margin-top:1.5rem}
    code{background:#f0f0f8;padding:.15em .4em;border-radius:3px;font-size:.9em}
    @media print{body{margin:0;padding:1.5cm}}
  </style></head><body>${html}</body></html>`
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(fullHtml)
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 400)
}

function downloadAsPresentation(content: string) {
  // Generate a simple markdown presentation (---  slide separators)
  const slides = content
    .split(/\n#{1,2} /)
    .filter(Boolean)
    .map((s, i) => (i === 0 ? s : `## ${s}`))
    .join('\n\n---\n\n')
  const md = `# Презентация GPTHub\n\n---\n\n${slides}`
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `presentation-${Date.now()}.md`
  a.click()
  URL.revokeObjectURL(url)
}

/** Action buttons shown under assistant messages */
function MessageActions({
  message,
  onCopy,
  copied,
  onRegenerate,
}: {
  message: Message
  onCopy: () => void
  copied: boolean
  onRegenerate?: () => void
}) {
  const showExports = message.taskCategory === 'research' || message.taskCategory === 'presentation' || message.content.length > 200
  const btnCls = 'inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-muted-foreground)] hover:bg-[var(--color-purple)]/10 hover:text-[var(--color-purple)] hover:border-[var(--color-purple)]/30 transition-colors'

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-3">
      {showExports && (
        <button className={btnCls} onClick={() => downloadAsPresentation(message.content)}>
          <Presentation className="h-3.5 w-3.5" />
          В презентацию
        </button>
      )}
      {showExports && (
        <button className={btnCls} onClick={() => downloadAsPdf(message.content)}>
          <FileDown className="h-3.5 w-3.5" />
          В PDF
        </button>
      )}
      <button onClick={onCopy} className={btnCls}>
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Скопировано' : 'Копировать'}
      </button>
      {onRegenerate && (
        <button className={btnCls} onClick={onRegenerate}>
          <RefreshCw className="h-3.5 w-3.5" />
          Перегенерировать
        </button>
      )}
      <TTSPlayButton messageId={message.id} text={message.content} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function MessageBubble({ message, isStreamingPlaceholder, streamingContent, onRegenerate }: Props) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  function handleCopy() {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isUser) {
    return (
      <div className="group px-4 py-3">
        <div className="max-w-3xl mx-auto flex justify-end gap-2.5">
          <div className="flex flex-col items-end gap-1.5 max-w-[80%]">
            {/* Files */}
            {message.files && message.files.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-end">
                {message.files.map((f) =>
                  isImageFile(f.type) && f.preview ? (
                    <img
                      key={f.id}
                      src={f.preview}
                      alt={f.name}
                      className="h-20 w-20 rounded-lg object-cover ring-1 ring-white/20"
                    />
                  ) : isAudioFile(f.type) ? (
                    <div key={f.id} className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 border border-white/10">
                      <Mic className="h-4 w-4 text-[var(--color-primary)]" />
                      <span className="text-xs text-[var(--color-foreground)]">запись</span>
                    </div>
                  ) : (
                    <div key={f.id} className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 border border-white/10">
                      <FileText className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                      <div className="min-w-0">
                        <span className="text-xs text-[var(--color-foreground)] truncate block max-w-[160px]">{f.name}</span>
                        <span className="text-[10px] text-[var(--color-muted-foreground)]">{formatFileSize(f.size)}</span>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
            <div className="rounded-2xl rounded-tr-sm bg-[var(--color-user-bubble)] text-[var(--color-user-bubble-foreground)] px-5 py-3.5 text-base leading-relaxed shadow-md shadow-[var(--color-user-bubble)]/20">
              {message.content}
            </div>
            {/* URL indicator */}
            {/https?:\/\/\S+/.test(message.content) && (
              <div className="flex items-center gap-1.5 text-xs text-[var(--color-purple)]/70">
                <Globe className="h-3 w-3" />
                <span>Ссылка будет обработана</span>
              </div>
            )}
            <span className="text-xs text-[var(--color-muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity">
              {formatTimestamp(message.timestamp)}
            </span>
          </div>
          <div className="shrink-0 h-8 w-8 rounded-full bg-[var(--color-user-bubble)] flex items-center justify-center mt-0.5 ring-2 ring-[var(--color-user-bubble)]/20 text-sm font-bold text-white">
            К
          </div>
        </div>
      </div>
    )
  }

  // Assistant message
  const hasBlocks = message.blocks && message.blocks.length > 0
  const category = message.taskCategory

  return (
    <div className="group px-4 py-4">
      <div className="max-w-3xl mx-auto flex gap-3">
        <div className="shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-[var(--color-purple)]/30 to-[var(--color-primary)]/20 flex items-center justify-center mt-0.5 ring-1 ring-[var(--color-purple)]/30 text-sm font-bold text-[var(--color-purple)]">
          G
        </div>
        <div className="flex-1 min-w-0">
          {/* Routing indicator */}
          {category && !isStreamingPlaceholder && (
            <RouteIndicator category={category} model={message.model} />
          )}

          <div className="text-base leading-[1.8] text-[var(--color-foreground)]">
            {isStreamingPlaceholder ? (
              streamingContent
                ? <MessageContent content={streamingContent} />
                : <StreamingIndicator />
            ) : hasBlocks ? (
              <ContentBlocks blocks={message.blocks!} />
            ) : (
              <MessageContent content={message.content} />
            )}
          </div>

          {/* Action buttons */}
          {!isStreamingPlaceholder && (
            <MessageActions message={message} onCopy={handleCopy} copied={copied} onRegenerate={onRegenerate} />
          )}

          {/* Meta info on hover */}
          {!isStreamingPlaceholder && (
            <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {message.model && (
                <span className="text-xs text-[var(--color-purple)]/70">{message.model}</span>
              )}
              <span className="text-xs text-[var(--color-muted-foreground)]">
                {formatTimestamp(message.timestamp)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
