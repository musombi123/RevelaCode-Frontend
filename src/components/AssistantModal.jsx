import React, { useState } from "react";
import RevelaAIChat from "@/ai/RevelaAIChat";
import RevelaAIVoiceChat from "@/ai/RevelaAIVoiceChat";
import { Mic, MessageSquare } from "lucide-react";

export default function AIAssistantDashboard() {
  const [mode, setMode] = useState("chat");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "👋 Hi! I’m RevelaAI. You can type or talk to me.",
    },
  ]);

  const sendTextMessage = async (text) => {
    const userMsg = { role: "user", text };
    setMessages((m) => [...m, userMsg, { role: "assistant", text: "⏳ Thinking…" }]);

    const res = await fetch(
      `${import.meta.env.VITE_REVELAAI_URL}/ai`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      }
    );

    const data = await res.json();

    setMessages((m) => {
      const copy = [...m];
      copy[copy.length - 1] = {
        role: "assistant",
        text: data?.data?.content || "Error",
      };
      return copy;
    });
  };

  const handleVoiceResult = (heard, response) => {
    setMessages((m) => [
      ...m,
      { role: "user", text: heard },
      { role: "assistant", text: response },
    ]);
    setMode("chat"); // ChatGPT behavior
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Mode Switch */}
      <div className="flex gap-2 p-3 border-b">
        <button
          onClick={() => setMode("chat")}
          className={`px-4 py-2 rounded ${
            mode === "chat" ? "bg-green-600 text-white" : "bg-gray-200"
          }`}
        >
          <MessageSquare size={16} /> Chat
        </button>

        <button
          onClick={() => setMode("voice")}
          className={`px-4 py-2 rounded ${
            mode === "voice" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          <Mic size={16} /> Voice
        </button>
      </div>

      {/* Content */}
      <div className="flex-1">
        {mode === "chat" && (
          <RevelaAIChat
            messages={messages}
            setMessages={setMessages}
            onSendMessage={sendTextMessage}
          />
        )}

        {mode === "voice" && (
          <RevelaAIVoiceChat onVoiceResult={handleVoiceResult} />
        )}
      </div>
    </div>
  );
}
