export function CuteFlower({ className = "w-6 h-6 text-forest-600" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="20" cy="12" r="5" fill="#22c55e" fillOpacity="0.25" />
      <circle cx="28" cy="18" r="5" fill="#22c55e" fillOpacity="0.25" />
      <circle cx="25" cy="27" r="5" fill="#22c55e" fillOpacity="0.25" />
      <circle cx="15" cy="27" r="5" fill="#22c55e" fillOpacity="0.25" />
      <circle cx="12" cy="18" r="5" fill="#22c55e" fillOpacity="0.25" />
      <circle cx="20" cy="20" r="3.5" fill="#dc2626" />
    </svg>
  );
}

export function CuteSparkle({ className = "w-5 h-5 text-crimson-600" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C12 7.5 7.5 12 2 12C7.5 12 12 16.5 12 22C12 16.5 16.5 12 22 12C16.5 12 12 7.5 12 2Z" />
    </svg>
  );
}

export function CuteRedApple({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {/* 2 cute little party candles on top (from Reference Image 1!) */}
      <line x1="20" y1="6" x2="20" y2="14" stroke="#3b82f6" strokeWidth="2" />
      <circle cx="20" cy="4" r="1.5" fill="#f59e0b" />
      <line x1="27" y1="4" x2="27" y2="14" stroke="#ec4899" strokeWidth="2" />
      <circle cx="27" cy="2" r="1.5" fill="#f59e0b" />
      {/* Apple body */}
      <path
        d="M24 16C21 13 13 13 10 19C7 26 10 37 17 40C21 42 23 39 24 39C25 39 27 42 31 40C38 37 41 26 38 19C35 13 27 13 24 16Z"
        fill="#dc2626"
        stroke="#991b1b"
      />
      {/* Cute shiny highlight */}
      <path d="M16 20C13 23 13 28 14 31" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function CuteSmileyCloud({ className = "w-8 h-8 text-sky-500" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M18 36H46C52 36 56 31 56 25C56 19 51 15 45 15C44 10 39 6 32 6C25 6 20 10 19 15C13 15 8 20 8 26C8 32 12 36 18 36Z"
        fill="#e0f2fe"
        stroke="#0284c7"
      />
      <circle cx="26" cy="22" r="2" fill="#0369a1" />
      <circle cx="38" cy="22" r="2" fill="#0369a1" />
      <path d="M28 27C30 31 34 31 36 27" stroke="#0369a1" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function CuteLightBulb({ className = "w-8 h-8 text-amber-500" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M24 8C17.4 8 12 13.4 12 20C12 24.5 14.5 28.5 18 31V34C18 35.1 18.9 36 20 36H28C29.1 36 30 35.1 30 34V31C33.5 28.5 36 24.5 36 20C36 13.4 30.6 8 24 8Z"
        fill="#fef3c7"
        stroke="#d97706"
      />
      <path d="M20 40H28" stroke="#d97706" strokeWidth="2.5" />
      <line x1="24" y1="2" x2="24" y2="5" stroke="#d97706" />
      <line x1="10" y1="8" x2="12" y2="10" stroke="#d97706" />
      <line x1="38" y1="8" x2="36" y2="10" stroke="#d97706" />
    </svg>
  );
}

export function CuteGoldfish({ className = "w-8 h-8 text-orange-500" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M32 24C32 24 26 16 16 18C8 20 6 24 6 24C6 24 8 28 16 30C26 32 32 24 32 24Z"
        fill="#ffedd5"
        stroke="#ea580c"
      />
      <path d="M30 24L42 16C40 22 40 26 42 32L30 24Z" fill="#fdba74" stroke="#ea580c" />
      <circle cx="12" cy="22" r="1.5" fill="#9a3412" />
      <circle cx="10" cy="14" r="2" stroke="#0ea5e9" strokeWidth="1.5" />
      <circle cx="14" cy="8" r="1.5" stroke="#0ea5e9" strokeWidth="1.5" />
    </svg>
  );
}

export function CurlyDoodleBanner({ className = "w-full text-forest-700" }: { className?: string }) {
  return (
    <svg className={className} height="24" viewBox="0 0 400 24" fill="none" preserveAspectRatio="none">
      <path
        d="M0 12 Q 25 2, 50 12 T 100 12 T 150 12 T 200 12 T 250 12 T 300 12 T 350 12 T 400 12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Cute little spiral loops */}
      <circle cx="200" cy="12" r="3" fill="#dc2626" />
      <circle cx="100" cy="12" r="2.5" fill="#16a34a" />
      <circle cx="300" cy="12" r="2.5" fill="#16a34a" />
    </svg>
  );
}
