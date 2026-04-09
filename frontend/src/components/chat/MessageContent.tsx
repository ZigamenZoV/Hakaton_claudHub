import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { memo, useState } from 'react'
import { Copy, Check } from 'lucide-react'
import 'highlight.js/styles/github-dark.css'
import type React from 'react'

interface Props {
  content: string
}

function getTextContent(node: React.ReactNode): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(getTextContent).join('')
  if (node && typeof node === 'object' && 'props' in (node as object)) {
    return getTextContent((node as React.ReactElement<{ children?: React.ReactNode }>).props.children)
  }
  return ''
}

function CodeBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false)

  const lang = className?.replace('language-', '') ?? ''

  function handleCopy() {
    navigator.clipboard.writeText(getTextContent(children).trimEnd())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mb-3 rounded-lg overflow-hidden border border-white/10">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/80">
        {lang && (
          <span className="text-xs text-zinc-400 font-mono">{lang}</span>
        )}
        <button
          onClick={handleCopy}
          className="ml-auto flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          aria-label="Копировать код"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Скопировано</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Копировать</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto bg-[#0d1117] p-4 text-sm !m-0 !rounded-none">
        {children}
      </pre>
    </div>
  )
}

export const MessageContent = memo(function MessageContent({ content }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
        ul: ({ children }) => <ul className="mb-3 ml-4 list-disc space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="mb-3 ml-4 list-decimal space-y-1">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        h1: ({ children }) => <h1 className="text-xl font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 mt-3 first:mt-0">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-semibold mb-1 mt-2 first:mt-0">{children}</h3>,
        code: ({ className, children, ...props }) => {
          const isBlock = className?.includes('language-')
          if (isBlock) {
            return (
              <code className={`${className} block text-sm`} {...props}>
                {children}
              </code>
            )
          }
          return (
            <code className="rounded bg-black/10 dark:bg-white/10 px-1.5 py-0.5 text-[0.8em] font-mono" {...props}>
              {children}
            </code>
          )
        },
        pre: ({ children, ...props }) => {
          const child = Array.isArray(children) ? children[0] : children
          const codeClassName =
            child && typeof child === 'object' && 'props' in (child as object)
              ? (child as React.ReactElement<{ className?: string }>).props?.className
              : undefined
          return <CodeBlock className={codeClassName} {...props}>{children}</CodeBlock>
        },
        blockquote: ({ children }) => (
          <blockquote className="mb-3 border-l-4 border-[var(--color-primary)] pl-4 italic text-[var(--color-muted-foreground)]">
            {children}
          </blockquote>
        ),
        img: ({ src, alt }) => (
          <img
            src={src}
            alt={alt}
            className="max-w-full rounded-lg my-2"
            loading="lazy"
          />
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-[var(--color-primary)] underline underline-offset-2 hover:opacity-80"
          >
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="mb-3 overflow-x-auto rounded-lg border border-[var(--color-border)]">
            <table className="min-w-full border-collapse text-sm">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border-b border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2 text-left font-semibold">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border-b border-[var(--color-border)] last:border-0 px-3 py-2">{children}</td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
})
