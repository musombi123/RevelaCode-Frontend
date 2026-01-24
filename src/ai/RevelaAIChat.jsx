import React, { useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Send, Edit, Copy, Download, Paperclip } from "lucide-react";

export default function RevelaAIChat({
  messages,
  setMessages,
  onSendMessage,
}) {
  const inputRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = inputRef.current.value.trim();
    if (!text) return;
    onSendMessage(text);
    inputRef.current.value = "";
  };

  return (
    <Card className="flex-1 flex flex-col bg-transparent shadow-none">
      <CardContent className="flex-1 overflow-y-auto space-y-3 p-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded-xl max-w-[85%] whitespace-pre-wrap
              ${msg.role === "assistant"
                ? "bg-gray-100 dark:bg-gray-800"
                : "bg-green-600 text-white ml-auto"
              }`}
          >
            {msg.text}

            {msg.role === "assistant" && (
              <button
                onClick={() => navigator.clipboard.writeText(msg.text)}
                className="float-right text-gray-400"
              >
                <Copy size={14} />
              </button>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </CardContent>

      <div className="p-3 border-t flex gap-2">
        <textarea
          ref={inputRef}
          placeholder="Message RevelaAI…"
          onKeyDown={(e) =>
            e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())
          }
          className="flex-1 resize-none rounded-lg border p-2"
        />
        <button
          onClick={handleSend}
          className="bg-green-600 text-white p-3 rounded-lg"
        >
          <Send size={16} />
        </button>
      </div>
    </Card>
  );
}
