export function LogoMark({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Go Run Finance"
      className={className}
    >
      <defs>
        <linearGradient id="grfHeaderBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c5cff" />
          <stop offset="55%" stopColor="#5b8cff" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#grfHeaderBg)" />
      <line
        x1="10"
        y1="50"
        x2="54"
        y2="50"
        stroke="#fff"
        strokeOpacity="0.18"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <g stroke="#fff" strokeLinecap="round" fill="none">
        <line x1="12" y1="46" x2="22" y2="36" strokeWidth="5" />
        <line x1="22" y1="46" x2="38" y2="30" strokeWidth="5.5" />
        <line x1="32" y1="46" x2="52" y2="26" strokeWidth="6" />
      </g>
      <circle cx="52" cy="22" r="4.5" fill="#fff" />
      <circle cx="52" cy="22" r="2" fill="#22c55e" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-baseline gap-1 leading-none ${className}`}>
      <span className="font-extrabold tracking-tight">Go</span>
      <span className="font-semibold tracking-tight text-white/90">Run</span>
      <span className="font-extrabold tracking-tight text-accent">Finance</span>
    </span>
  );
}

export function BrandLockup({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      <Wordmark className="text-[15px]" />
    </div>
  );
}
