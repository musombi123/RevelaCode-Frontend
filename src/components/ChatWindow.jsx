import Message from "./Message";
import TypingIndicator from "./TypingIndicator";

export default function ChatWindow({ messages }) {
  const isTyping =
    messages.length &&
    messages[messages.length - 1]?.status === "loading";

  return (
    <div className="
      flex-1
      overflow-y-auto
      px-4
      py-6
      space-y-2
      scroll-smooth
    ">
      {messages.map((msg) => (
        <Message key={msg.id} message={msg} />
      ))}

      {/* LIVE AI INDICATOR */}
      {isTyping && (
        <div className="flex justify-start">
          <div className="
            bg-revela-card
            border
            border-white/10
            rounded-2xl
            px-3
            py-2
          ">
            <TypingIndicator />
          </div>
        </div>
      )}
    </div>
  );
}