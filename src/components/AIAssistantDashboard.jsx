// @ai/AIAssistantDashboard.jsx
import React, { useState } from "react";
import { Mic } from "lucide-react";
import RevelaAIVoiceChat from "@/ai/RevelaAIVoiceChat";
import RevelaAIChat from "@/ai/RevelaAIChat";

export default function AIAssistantDashboard() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "👋 Hi! I’m RevelaAI. Ask me anything or upload a file to get insights." },
  ]);
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);

  const sendTextMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = { role: "user", text };
    setMessages((m) => [...m, userMessage, { role: "assistant", text: "⏳ Thinking..." }]);

    try {
      const res = await fetch(`${import.meta.env.VITE_REVELAAI_URL}/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const assistantText = data?.data?.content || "⚠️ Something went wrong.";

      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", text: assistantText };
        return copy;
      });
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", text: "⚠️ Network error." };
        return copy;
      });
    }
  };

  const handleVoiceResult = (heardText) => {
    if (heardText) sendTextMessage(heardText);
    setVoiceActive(false);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* TOGGLE MODE */}
      <div className="p-4 flex justify-center gap-2">
        <button
          className={`px-4 py-2 rounded ${!voiceMode ? "bg-green-600 text-white" : "bg-gray-300 dark:bg-gray-700"}`}
          onClick={() => setVoiceMode(false)}
        >
          Chat
        </button>
        <button
          className={`px-4 py-2 rounded ${voiceMode ? "bg-green-600 text-white" : "bg-gray-300 dark:bg-gray-700"}`}
          onClick={() => setVoiceMode(true)}
        >
          Voice
        </button>
      </div>

      {/* CHAT OR VOICE */}
      <div className="flex-1 flex flex-col px-4">
        {!voiceMode ? (
          <RevelaAIChat
            messages={messages}
            setMessages={setMessages}
            onSendMessage={sendTextMessage}
            showUpload // Pass a prop to enable upload inside chat
          />
        ) : (
          <>
            {!voiceActive && (
              <div className="flex justify-center mt-8">
                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full flex items-center gap-2"
                  onClick={() => setVoiceActive(true)}
                >
                  <Mic size={20} /> Start Voice Chat
                </button>
              </div>
            )}
            {voiceActive && <RevelaAIVoiceChat onVoiceResult={handleVoiceResult} />}
          </>
        )}
      </div>
    </div>
  );
}
