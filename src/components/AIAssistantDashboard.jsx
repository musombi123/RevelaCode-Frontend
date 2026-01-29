import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  Copy,
  Share2,
  Download,
  Edit3,
  Send,
  Mic,
} from "lucide-react";
import RevelaAIVoiceChat from "@/ai/RevelaAIVoiceChat";

export default function AIAssistantDashboard() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "👋 Hi! I’m RevelaAI. Ask me anything or upload a file to get insights.",
    },
  ]);

  const [inputText, setInputText] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [voiceActive, setVoiceActive] = useState(false);
  const textareaRef = useRef(null);
  const chatEndRef = useRef(null);

  /* ---------------- AUTO SCROLL ---------------- */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ---------------- AUTO RESIZE TEXTAREA ---------------- */
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height =
      Math.min(textareaRef.current.scrollHeight, 160) + "px";
  }, [inputText]);

  /* ---------------- TEXT TO SPEECH ---------------- */
  const speak = (text) => {
    if (!text || !voiceActive) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
  };

  /* ---------------- SEND MESSAGE ---------------- */
  const sendTextMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = { role: "user", text };
    setMessages((m) => [
      ...m,
      userMessage,
      { role: "assistant", text: "⏳ Thinking..." },
    ]);
    setInputText("");

    try {
      const res = await fetch(`${import.meta.env.VITE_REVELAAI_URL}/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "assistant",
          text: data?.data?.content || "⚠️ Something went wrong.",
        };
        return copy;
      });

      speak(data?.data?.content);
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "assistant",
          text: "⚠️ Network error.",
        };
        return copy;
      });
    }
  };

  /* ---------------- EDIT MESSAGE ---------------- */
  const saveEdit = (index, text) => {
    setMessages((m) => {
      const copy = [...m];
      copy[index].text = text;
      return copy;
    });
    setEditingIndex(null);
  };

  /* ---------------- UTILITIES ---------------- */
  const copyText = (text) => navigator.clipboard.writeText(text);

  const downloadPDF = (text) => {
    const blob = new Blob([text], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "RevelaAI.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareText = (text) => {
    if (navigator.share) navigator.share({ text });
    else alert("Sharing not supported.");
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () =>
      sendTextMessage(`Please analyze this document:\n${reader.result}`);
    reader.readAsText(file);
  };

  /* ---------------- HANDLE ENTER KEY ---------------- */
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendTextMessage(inputText);
    }
  };

  /* ---------------- HANDLE VOICE INPUT ---------------- */
  const handleVoiceResult = (heardText) => {
    if (heardText) {
      // Auto-send voice transcription
      sendTextMessage(heardText);
    }
    setVoiceActive(false); // Stop waveform when done
  };

  const startVoiceChat = () => {
    setVoiceActive(true);
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`group max-w-3xl ${
              msg.role === "user" ? "ml-auto" : "mr-auto"
            }`}
          >
            <div
              className={`relative rounded-xl p-4 ${
                msg.role === "user"
                  ? "bg-green-100 dark:bg-green-900"
                  : "bg-white dark:bg-gray-800 shadow"
              }`}
            >
              {editingIndex === idx ? (
                <textarea
                  defaultValue={msg.text}
                  className="w-full resize-none bg-transparent outline-none"
                  onBlur={(e) => saveEdit(idx, e.target.value)}
                />
              ) : (
                <p className="whitespace-pre-wrap">{msg.text}</p>
              )}

              {/* ACTIONS */}
              <div className="absolute -top-3 right-2 opacity-0 group-hover:opacity-100 flex gap-2 bg-white dark:bg-gray-900 rounded-lg p-1 shadow">
                {msg.role === "user" && (
                  <button onClick={() => setEditingIndex(idx)}>
                    <Edit3 size={14} />
                  </button>
                )}
                {msg.role === "assistant" && (
                  <>
                    <button onClick={() => copyText(msg.text)}>
                      <Copy size={14} />
                    </button>
                    <button onClick={() => downloadPDF(msg.text)}>
                      <Download size={14} />
                    </button>
                    <button onClick={() => shareText(msg.text)}>
                      <Share2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="px-4 pb-4">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          {/* UPLOAD */}
          <label className="p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 rounded">
            <Upload size={20} />
            <input type="file" hidden onChange={handleUpload} />
          </label>

          {/* TEXTAREA */}
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            className="flex-1 resize-none rounded-xl border px-4 py-3 max-h-40 overflow-y-auto dark:bg-gray-800 dark:border-gray-700"
          />

          {/* MICROPHONE */}
          <button
            onClick={startVoiceChat}
            className={`p-3 rounded-full ${
              voiceActive ? "bg-green-600" : "bg-gray-300 dark:bg-gray-700"
            }`}
          >
            <Mic size={20} />
          </button>

          {/* VOICE CHAT OVERLAY */}
          {voiceActive && (
            <RevelaAIVoiceChat
              onVoiceResult={handleVoiceResult}
              showWaveform={true}
            />
          )}

          {/* SEND BUTTON */}
          <button
            onClick={() => sendTextMessage(inputText)}
            className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full"
            title="Send message"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
