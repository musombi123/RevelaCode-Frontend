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

  // 🔁 Poll Replicate until image is ready
  const pollImage = async (pollUrl, index) => {
    try {
      const res = await fetch(pollUrl);
      const data = await res.json();

      if (data.status === "succeeded" && data.output?.[0]) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            imageUrl: data.output[0],
            text: "🎨 Image generated successfully",
          };
          return updated;
        });
      } else if (data.status === "failed") {
        throw new Error("Image generation failed");
      } else {
        setTimeout(() => pollImage(pollUrl, index), 2000);
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[index].text = "❌ Failed to generate image.";
        return updated;
      });
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

      let assistantMessage = {
        role: "assistant",
        text: "⚠️ Unexpected response.",
      };

      if (responseJson?.success) {
        const data = responseJson.data;

        if (data?.type === "image" && data.poll_url) {
          assistantMessage.text = "🎨 Generating image…";
          const index = messages.length + 1;

          setMessages((prev) => [...prev, assistantMessage]);
          pollImage(data.poll_url, index);
          return;
        }

        assistantMessage.text =
          data?.content ||
          (typeof data === "string" ? data : JSON.stringify(data, null, 2));
      } else {
        assistantMessage.text = responseJson?.error?.message || "Error occurred.";
      }

      setMessages((prev) => [...prev, assistantMessage]);
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

                {/* ✅ AI TEXT — NO SCROLL LIMIT */}
                <div className="bg-white/40 dark:bg-black/20 rounded-lg p-3 whitespace-pre-wrap">
                  {msg.text}
                </div>

                {/* ✅ IMAGE RENDER */}
                {msg.imageUrl && (
                  <img
                    src={msg.imageUrl}
                    alt="Generated"
                    className="rounded-lg mt-2 max-w-full border"
                  />
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

        <button onClick={() => setInput("Create a professional document.")}>
          <FileText className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>

        <button onClick={() => setInput("Generate an image or logo.")}>
          <ImageIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Input */}
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
          rows={3}
          className="flex-1 resize-y rounded-lg border px-3 py-2 text-sm
                     bg-white text-black dark:bg-gray-900 dark:text-white"
          placeholder="Ask, create, design, analyze…"
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
