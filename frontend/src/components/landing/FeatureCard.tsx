import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  icon: LucideIcon
  title: string
  description: string
  accent?: 'red' | 'purple'
}

export function FeatureCard({ icon: Icon, title, description, accent = 'red' }: Props) {
  const isPurple = accent === 'purple'
  return (
    <div className={cn(
      'group flex flex-col gap-3 rounded-2xl p-5 transition-all cursor-default glass border',
      isPurple
        ? 'hover:border-[var(--color-purple)]/40 hover:shadow-xl hover:shadow-[var(--color-purple)]/10'
        : 'hover:border-[var(--color-primary)]/40 hover:shadow-xl hover:shadow-[var(--color-primary)]/10'
    )}>
      <div className={cn(
        'inline-flex h-11 w-11 items-center justify-center rounded-xl transition-colors',
        isPurple
          ? 'bg-[var(--color-purple)]/15 group-hover:bg-[var(--color-purple)]/25'
          : 'bg-[var(--color-primary)]/15 group-hover:bg-[var(--color-primary)]/25'
      )}>
        <Icon className={cn('h-5 w-5', isPurple ? 'text-[var(--color-purple)]' : 'text-[var(--color-primary)]')} />
      </div>
      <div>
        <h3 className="font-semibold text-[var(--color-foreground)] mb-1">{title}</h3>
        <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
