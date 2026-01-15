import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Send, Bot, Upload, Image as ImageIcon, FileText } from "lucide-react";

export default function AIAssistantDashboard() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "👋 Hi! I’m RevelaAI. Ask me anything biblical, creative, or technical.",
    },
  ]);
  const [input, setInput] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const convertToNaturalLanguage = (obj) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return "⚠️ Unable to display response.";
    }
  };

  const sendMessage = async () => {
    if (!input.trim() && !uploadFile) return;

    const userMessage = {
      role: "user",
      text: input || "📎 Uploaded a file for analysis",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      let res;

      if (uploadFile) {
        const formData = new FormData();
        formData.append("message", userMessage.text);
        formData.append("file", uploadFile);

        res = await fetch(`${import.meta.env.VITE_REVELAAI_URL}/ai`, {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch(`${import.meta.env.VITE_REVELAAI_URL}/ai`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMessage.text }),
        });
      }

      const responseJson = await res.json();
      let assistantReply = "⚠️ Unexpected response.";
      let imageUrl = null;

      if (responseJson?.success) {
        const modelOutput = responseJson.data;

        if (modelOutput?.type === "image") {
          assistantReply = "🎨 Image generation in progress…";
          imageUrl = modelOutput.poll_url;
        } else if (typeof modelOutput === "string") {
          assistantReply = modelOutput;
        } else if (modelOutput?.content) {
          assistantReply = modelOutput.content;
        } else {
          assistantReply = convertToNaturalLanguage(modelOutput);
        }
      } else {
        assistantReply =
          responseJson?.error?.message || "Error occurred.";
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: assistantReply,
          imageUrl,
        },
      ]);

      setUploadFile(null);
    } catch {
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
        <h3 className="font-semibold text-black dark:text-white">
          RevelaAI Assistant
        </h3>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto space-y-4 text-sm">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-xl max-w-[85%]
              ${
                msg.role === "assistant"
                  ? "bg-gray-100 dark:bg-gray-800 text-black dark:text-white"
                  : "bg-green-600 text-white ml-auto"
              }`}
          >
            {msg.role === "assistant" ? (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  🤖 RevelaAI
                </div>

                <div className="max-h-64 overflow-y-auto bg-white/40 dark:bg-black/20 rounded-lg p-3 whitespace-pre-wrap">
                  {msg.text}
                </div>

                {msg.imageUrl && (
                  <div className="pt-2">
                    <a
                      href={msg.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-600 underline"
                    >
                      View generated image →
                    </a>
                  </div>
                )}
              </div>
            ) : (
              msg.text
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Action Bar */}
      <div className="px-3 py-2 flex items-center gap-2 border-t bg-gray-50 dark:bg-gray-900">
        <label className="cursor-pointer">
          <Upload className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          <input
            type="file"
            hidden
            onChange={(e) => setUploadFile(e.target.files[0])}
          />
        </label>

        <button
          onClick={() =>
            setInput("Create a professional copy-paste document for me.")
          }
        >
          <FileText className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>

        <button
          onClick={() =>
            setInput("Generate an image or visual design concept.")
          }
        >
          <ImageIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* ✅ FIXED INPUT (SCROLLABLE & EDITABLE) */}
      <div className="p-3 flex gap-2 border-t">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Ask, create, design, analyze…"
          rows={3}
          className="flex-1 resize-y max-h-40 overflow-y-auto rounded-lg border px-3 py-2 text-sm
                     bg-white text-black dark:bg-gray-900 dark:text-white"
        />
        <button
          onClick={sendMessage}
          className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
}
