
export function CuteFlower({ className = "w-6 h-6 text-peach-400" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* 5 whimsical hand-drawn petals */}
      <circle cx="20" cy="12" r="6" fill="currentColor" fillOpacity="0.2" />
      <circle cx="28" cy="18" r="6" fill="currentColor" fillOpacity="0.2" />
      <circle cx="25" cy="28" r="6" fill="currentColor" fillOpacity="0.2" />
      <circle cx="15" cy="28" r="6" fill="currentColor" fillOpacity="0.2" />
      <circle cx="12" cy="18" r="6" fill="currentColor" fillOpacity="0.2" />
      <circle cx="20" cy="20" r="4" fill="currentColor" />
    </svg>
  );
}

export function CuteSparkle({ className = "w-5 h-5 text-amber-400" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C12 7.5 7.5 12 2 12C7.5 12 12 16.5 12 22C12 16.5 16.5 12 22 12C16.5 12 12 7.5 12 2Z" />
    </svg>
  );
}

export function CuteSmileyCloud({ className = "w-8 h-8 text-sky-400" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M18 36H46C52 36 56 31 56 25C56 19 51 15 45 15C44 10 39 6 32 6C25 6 20 10 19 15C13 15 8 20 8 26C8 32 12 36 18 36Z"
        fill="currentColor"
        fillOpacity="0.15"
      />
      {/* Eyes and smile */}
      <circle cx="26" cy="22" r="2" fill="currentColor" />
      <circle cx="38" cy="22" r="2" fill="currentColor" />
      <path d="M28 27C30 30 34 30 36 27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function CuteLightBulb({ className = "w-8 h-8 text-amber-500" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M24 8C17.4 8 12 13.4 12 20C12 24.5 14.5 28.5 18 31V34C18 35.1 18.9 36 20 36H28C29.1 36 30 35.1 30 34V31C33.5 28.5 36 24.5 36 20C36 13.4 30.6 8 24 8Z"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <path d="M20 40H28" stroke="currentColor" strokeWidth="2.5" />
      {/* Rays */}
      <line x1="24" y1="2" x2="24" y2="5" />
      <line x1="10" y1="8" x2="12" y2="10" />
      <line x1="38" y1="8" x2="36" y2="10" />
    </svg>
  );
}

export function CuteGoldfish({ className = "w-8 h-8 text-orange-400" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M32 24C32 24 26 16 16 18C8 20 6 24 6 24C6 24 8 28 16 30C26 32 32 24 32 24Z"
        fill="currentColor"
        fillOpacity="0.2"
      />
      {/* Tail fin */}
      <path d="M30 24L42 16C40 22 40 26 42 32L30 24Z" fill="currentColor" fillOpacity="0.25" />
      {/* Eye and bubbles */}
      <circle cx="12" cy="22" r="1.5" fill="currentColor" />
      <circle cx="10" cy="14" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function WavyDoodleLine({ className = "w-full text-purple-300" }: { className?: string }) {
  return (
    <svg className={className} height="16" viewBox="0 0 300 16" fill="none" preserveAspectRatio="none">
      <path
        d="M0 8 Q 15 0, 30 8 T 60 8 T 90 8 T 120 8 T 150 8 T 180 8 T 210 8 T 240 8 T 270 8 T 300 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
