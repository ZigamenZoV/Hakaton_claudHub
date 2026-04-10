interface Props {
  size?: number
  className?: string
}

/** GPTHub robot mascot — matches the favicon design */
export function MascotIcon({ size = 40, className }: Props) {
  const id = `mascot-${Math.random().toString(36).slice(2, 7)}`
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-label="GPTHub mascot"
    >
      <defs>
        <radialGradient id={`bg-${id}`} cx="50%" cy="40%" r="55%">
          <stop offset="0%"   stopColor="#7a3fd4"/>
          <stop offset="100%" stopColor="#4a1a96"/>
        </radialGradient>
        <radialGradient id={`eye-${id}`} cx="50%" cy="45%" r="50%">
          <stop offset="0%"   stopColor="#ff7080"/>
          <stop offset="40%"  stopColor="#ff2040"/>
          <stop offset="100%" stopColor="#cc0020" stopOpacity="0"/>
        </radialGradient>
        <filter id={`ge-${id}`} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id={`gd-${id}`} x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="1.8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width="100" height="100" rx="22" fill={`url(#bg-${id})`}/>

      {/* Antenna */}
      <rect x="48.5" y="16" width="3" height="14" rx="1.5" fill="#9060e0"/>
      <circle cx="50" cy="14" r="5"   fill="#ff1a3a" filter={`url(#gd-${id})`}/>
      <circle cx="50" cy="14" r="2.5" fill="#ff6070"/>

      {/* Head */}
      <rect x="14" y="30" width="72" height="46" rx="16" fill="none" stroke="#9060e0" strokeWidth="1.5" opacity="0.6"/>
      <rect x="15" y="31" width="70" height="44" rx="15" fill="#221050"/>
      <rect x="20" y="36" width="60" height="34" rx="11" fill="#180a40"/>
      <rect x="15" y="31" width="70" height="44" rx="15" fill="none" stroke="#8050d8" strokeWidth="2"/>

      {/* Side bolts */}
      <circle cx="15" cy="53" r="4" fill="#5a30b0"/>
      <circle cx="85" cy="53" r="4" fill="#5a30b0"/>
      <circle cx="15" cy="53" r="2" fill="#7040c8"/>
      <circle cx="85" cy="53" r="2" fill="#7040c8"/>

      {/* Left eye */}
      <circle cx="37" cy="53" r="13"  fill={`url(#eye-${id})`} opacity="0.5"/>
      <circle cx="37" cy="53" r="8"   fill="#180a40"/>
      <circle cx="37" cy="53" r="6.5" fill="#ff2040" filter={`url(#ge-${id})`}/>
      <circle cx="37" cy="53" r="3.5" fill="#ff7080"/>

      {/* Right eye */}
      <circle cx="63" cy="53" r="13"  fill={`url(#eye-${id})`} opacity="0.5"/>
      <circle cx="63" cy="53" r="8"   fill="#180a40"/>
      <circle cx="63" cy="53" r="6.5" fill="#ff2040" filter={`url(#ge-${id})`}/>
      <circle cx="63" cy="53" r="3.5" fill="#ff7080"/>
    </svg>
  )
}
