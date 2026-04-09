import type { LucideIcon } from 'lucide-react'

interface Props {
  icon: LucideIcon
  title: string
  description: string
}

export function FeatureCard({ icon: Icon, title, description }: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 hover:border-[var(--color-primary)]/40 hover:shadow-lg transition-all group">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 group-hover:bg-[var(--color-primary)]/20 transition-colors">
        <Icon className="h-5 w-5 text-[var(--color-primary)]" />
      </div>
      <div>
        <h3 className="font-semibold text-[var(--color-foreground)] mb-1">{title}</h3>
        <p className="text-sm text-[var(--color-muted-foreground)] leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
