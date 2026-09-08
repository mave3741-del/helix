export function HelixMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="currentColor" className="text-card-elevated" />
      <path
        d="M10 6v20M22 6v20"
        stroke="#d6dbe3"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M10 11c4 2 8 2 12 0M10 21c4-2 8-2 12 0"
        stroke="#8ec9c2"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
