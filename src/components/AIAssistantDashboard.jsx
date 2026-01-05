import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Send, Bot } from "lucide-react";

export default function AIAssistantDashboard() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "👋 Hi! I’m RevelaAI. Ask me anything biblical or prophetic.",
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_REVELAAI_URL}/ai`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMessage.text }),
        }
      );

      const data = await res.json();

      let replyText = "⚠️ Unexpected response.";

      if (data?.success) {
        if (data.data?.content) {
          replyText = data.data.content;
        } else {
          replyText = JSON.stringify(data.data, null, 2);
        }
      } else {
        replyText = data?.error?.message || "Error occurred.";
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: replyText },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "🚨 Server unreachable." },
      ]);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex items-center gap-2 border-b">
        <Bot className="w-5 h-5 text-green-500" />
        <h3 className="font-semibold">RevelaAI Assistant</h3>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto space-y-3 text-sm">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-xl max-w-[85%] whitespace-pre-wrap
              ${
                msg.role === "assistant"
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  : "bg-green-600 text-white ml-auto"
              }`}
          >
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input */}
      <div className="p-3 border-t flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask a biblical or prophetic question…"
          className="flex-1 rounded-lg border px-3 py-2 text-sm
                     bg-white dark:bg-gray-900 dark:text-white"
        />
        <button
          onClick={sendMessage}
          className="bg-green-600 hover:bg-green-700 text-white
                     p-2 rounded-lg"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
}
