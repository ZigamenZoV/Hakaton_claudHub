export function StreamingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-1">
      {['-0.4s', '-0.2s', '0s'].map((delay, i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]/60 animate-bounce"
          style={{ animationDelay: delay, animationDuration: '1s' }}
        />
      ))}
    </div>
  )
}
