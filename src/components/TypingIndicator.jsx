// src/components/TypingIndicator.jsx

export default function TypingIndicator({ className = "" }) {
  return (
    <div
      className={`flex items-center gap-1 px-3 py-2 ${className}`}
      role="status"
      aria-label="RevelaAI is responding"
    >
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-2 w-2 animate-bounce rounded-full bg-emerald-400/70 motion-reduce:animate-none"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}