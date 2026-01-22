import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Send,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  FileText,
  Copy,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import { useHistory } from "@/context/HistoryContext.jsx";
import { useNavigate } from "react-router-dom";

export default function AIAssistantDashboard() {
  const navigate = useNavigate();

  /* -------- SAFE CONTEXT ACCESS -------- */
  const auth = useAuth?.();
  const historyCtx = useHistory?.();

  const historySafe = useMemo(
    () => (Array.isArray(historyCtx?.history) ? historyCtx.history : []),
    [historyCtx?.history]
  );

  const addToHistory =
    typeof historyCtx?.addToHistory === "function"
      ? historyCtx.addToHistory
      : () => {};

  /* -------- STATE -------- */
  const [messages, setMessages] = useState(() =>
    historySafe.length
      ? historySafe
      : [{ role: "assistant", text: "👋 Hi! I’m RevelaAI. Ask me anything." }]
  );

  const [input, setInput] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  /* -------- ENV SAFE -------- */
  const baseUrl =
    import.meta.env.VITE_REVELAAI_URL || "http://localhost:5000";

  /* -------- AUTO SCROLL -------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* -------- SEND MESSAGE -------- */
  const sendMessage = async () => {
    if (sending) return;
    if (!input.trim() && !uploadFile) return;

    const userMessage = {
      role: "user",
      text: input || `📎 Uploaded: ${uploadFile?.name}`,
      fileName: uploadFile?.name || null,
    };

    setSending(true);
    setInput("");
    setMessages((p) => [...p, userMessage]);
    addToHistory(userMessage);

    try {
      const res = await fetch(`${baseUrl}/ai`, {
        method: "POST",
        headers: uploadFile ? undefined : { "Content-Type": "application/json" },
        body: uploadFile
          ? (() => {
              const fd = new FormData();
              fd.append("message", userMessage.text);
              fd.append("file", uploadFile);
              return fd;
            })()
          : JSON.stringify({ message: userMessage.text }),
      });

      const json = await res.json();

      const assistantMessage = {
        role: "assistant",
        text:
          json?.data?.content ||
          json?.error?.message ||
          "No response from AI.",
      };

      setMessages((p) => [...p, assistantMessage]);
      addToHistory(assistantMessage);
    } catch {
      const err = { role: "assistant", text: "🚨 Server unreachable." };
      setMessages((p) => [...p, err]);
      addToHistory(err);
    } finally {
      setUploadFile(null);
      setSending(false);
    }
  };

  /* -------- COPY -------- */
  const copyText = (text) => navigator.clipboard.writeText(text);

  /* -------- RENDER -------- */
  return (
    <div className="flex flex-col h-full w-full bg-gray-100 dark:bg-gray-950">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b bg-white dark:bg-gray-900">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`relative max-w-[85%] p-3 rounded-xl whitespace-pre-wrap ${
              msg.role === "assistant"
                ? "bg-gray-200 dark:bg-gray-800 text-black dark:text-white"
                : "bg-blue-600 text-white ml-auto"
            }`}
          >
            {msg.text}

            {msg.role === "assistant" && (
              <button
                onClick={() => copyText(msg.text)}
                className="absolute top-2 right-2 opacity-40 hover:opacity-80"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-white dark:bg-gray-900 p-3 space-y-2">
        <div className="flex gap-3">
          <label className="cursor-pointer">
            <Upload className="w-5 h-5" />
            <input
              hidden
              type="file"
              onChange={(e) => setUploadFile(e.target.files[0])}
            />
          </label>
          <button onClick={() => setInput("Create a professional document.")}>
            <FileText className="w-5 h-5" />
          </button>
          <button onClick={() => setInput("Generate an image or logo.")}>
            <ImageIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            rows={2}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            className="flex-1 resize-none rounded-lg border px-3 py-2 bg-gray-50 dark:bg-gray-800 text-sm"
            placeholder="Ask RevelaAI anything…"
          />
          <button
            disabled={sending}
            onClick={sendMessage}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-3 rounded-lg"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
