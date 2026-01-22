import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  Send,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  FileText,
  Copy,
  Download,
  Edit3,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext.jsx";
import { useHistory } from "@/context/HistoryContext.jsx";

export default function AIAssistantDashboard() {
  const navigate = useNavigate();

  /* -------- SAFE CONTEXT -------- */
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
  const [editingIndex, setEditingIndex] = useState(null);

  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  /* -------- ENV -------- */
  const baseUrl =
    import.meta.env.VITE_REVELAAI_URL || "http://localhost:5000";

  /* -------- AUTO SCROLL -------- */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* -------- AUTO EXPAND TEXTAREA -------- */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [input]);

  /* -------- SEND / RE-SEND -------- */
  const sendMessage = useCallback(async () => {
    if (sending) return;
    if (!input.trim() && !uploadFile) return;

    setSending(true);

    let newMessages = [...messages];

    /* If editing, remove edited message + following assistant reply */
    if (editingIndex !== null) {
      newMessages = newMessages.slice(0, editingIndex);
    }

    const userMessage = {
      role: "user",
      text: input || `📎 Uploaded: ${uploadFile?.name}`,
      fileName: uploadFile?.name || null,
    };

    newMessages.push(userMessage);
    setMessages(newMessages);
    addToHistory(userMessage);

    setInput("");
    setUploadFile(null);
    setEditingIndex(null);

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
        text: json?.data?.content || "",
        file: json?.data?.file || null, // { name, url }
      };

      setMessages((p) => [...p, assistantMessage]);
      addToHistory(assistantMessage);
    } catch {
      const err = { role: "assistant", text: "🚨 Server unreachable." };
      setMessages((p) => [...p, err]);
      addToHistory(err);
    } finally {
      setSending(false);
    }
  }, [sending, input, uploadFile, messages, editingIndex]);

  /* -------- HELPERS -------- */
  const copyText = (text) => navigator.clipboard.writeText(text);

  const startEdit = (index) => {
    setInput(messages[index].text);
    setEditingIndex(index);
  };

  /* -------- RENDER -------- */
  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b">
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
                ? "bg-muted text-foreground"
                : "bg-primary text-primary-foreground ml-auto"
            }`}
          >
            {msg.text}

            {/* Assistant actions */}
            {msg.role === "assistant" && (
              <div className="absolute top-2 right-2 flex gap-2">
                {msg.text && !msg.file && (
                  <button
                    onClick={() => copyText(msg.text)}
                    className="opacity-40 hover:opacity-80"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
                {msg.file && (
                  <a
                    href={msg.file.url}
                    download={msg.file.name}
                    className="opacity-40 hover:opacity-80"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}

            {/* User edit */}
            {msg.role === "user" && (
              <button
                onClick={() => startEdit(i)}
                className="absolute top-2 right-2 opacity-40 hover:opacity-80"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3 space-y-2">
        <div className="flex gap-3 items-center">
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

          {editingIndex !== null && (
            <span className="text-xs opacity-60">Editing message</span>
          )}
        </div>

        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            className="flex-1 resize-none rounded-lg border px-3 py-2 bg-muted text-sm overflow-hidden"
            placeholder="Ask RevelaAI anything…"
            rows={1}
          />

          <button
            disabled={sending}
            onClick={sendMessage}
            className="bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground p-3 rounded-lg"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
