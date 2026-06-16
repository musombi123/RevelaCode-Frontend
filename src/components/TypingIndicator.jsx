// components/TypingIndicator.jsx

export default function TypingIndicator() {
  return (
    <div className="flex gap-1 items-center py-2 px-3">
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300" />
    </div>
  );
}