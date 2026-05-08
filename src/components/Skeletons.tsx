export function Bar({ className = "" }: { className?: string }) {
  return <div className={`bg-black/[0.06] rounded ${className}`} />;
}

export function Pill({ className = "" }: { className?: string }) {
  return <div className={`bg-black/[0.05] rounded-xl ${className}`} />;
}
