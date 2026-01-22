import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Send, Edit, Download, Copy, Paperclip } from "lucide-react";

export default function RevelaAIChat() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "👋 Hi! I’m RevelaAI. Ask me anything biblical, prophetic, or general AI questions.",
      type: "text",
    },
  ]);

  const [input, setInput] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [file, setFile] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Expand textarea dynamically
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [input]);

  const sendMessage = async () => {
    // Prevent sending empty messages
    if (!input.trim() && !file) return;

    const userMessage = {
      role: "user",
      text: input,
      type: file ? "file" : "text",
      file,
    };

    // Update message list
    let updatedMessages = [...messages];
    let isEditing = false;

    if (editingIndex !== null) {
      updatedMessages[editingIndex] = userMessage;
      isEditing = true;
      setEditingIndex(null);
    } else {
      updatedMessages.push(userMessage);
    }

    setMessages(updatedMessages);
    setInput("");
    setFile(null);

    // Add placeholder for AI response
    const aiIndex = isEditing ? editingIndex + 1 : updatedMessages.length;
    setMessages((prev) => [
      ...prev,
      { role: "assistant", text: "⏳ Thinking...", type: "text" },
    ]);

    try {
      const formData = new FormData();
      formData.append("message", userMessage.text);
      if (userMessage.file) formData.append("file", userMessage.file);

      const res = await fetch(`${import.meta.env.VITE_REVELAAI_URL}/ai`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      let reply = "⚠️ Unexpected response.";
      let type = "text";

      if (data?.success) {
        if (data.data?.file_url) {
          reply = data.data.file_url;
          type = "file";
        } else if (data.data?.content) {
          reply = data.data.content;
          type = "text";
        } else {
          reply = JSON.stringify(data.data, null, 2);
        }
      } else {
        reply = data?.error?.message || "Error occurred.";
      }

      // Replace placeholder with actual AI response
      setMessages((prev) => {
        const newMsgs = [...prev];
        newMsgs[aiIndex] = { role: "assistant", text: reply, type };
        return newMsgs;
      });
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "🚨 Server unreachable.", type: "text" },
      ]);
    }
  };

  const handleEdit = (index) => {
    setInput(messages[index].text);
    setEditingIndex(index);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  return (
    <Card className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto space-y-3 text-sm">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-xl max-w-[85%] whitespace-pre-wrap relative
              ${msg.role === "assistant"
                ? "bg-gray-100 dark:bg-gray-800 text-black dark:text-white"
                : "bg-green-600 text-white ml-auto"
              }`}
          >
            {msg.text}

            {/* Actions */}
            {msg.role === "user" && !msg.file && (
              <button
                onClick={() => handleEdit(idx)}
                className="absolute top-1 right-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}

            {msg.role === "assistant" && msg.type === "text" && (
              <button
                onClick={() => handleCopy(msg.text)}
                className="absolute top-1 right-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}

            {msg.role === "assistant" && msg.type === "file" && (
              <a
                href={msg.text}
                download
                className="absolute top-1 right-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <Download className="w-4 h-4" />
              </a>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input area */}
      <div className="p-3 border-t flex gap-2 flex-col sm:flex-row items-end">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())
          }
          placeholder="Ask RevelaAI anything…"
          className="flex-1 rounded-lg border px-3 py-2 text-sm resize-none
                     bg-white dark:bg-gray-900 text-black dark:text-white overflow-hidden"
        />
        <div className="flex gap-2 mt-2 sm:mt-0 items-center">
          {/* File upload icon */}
          <label className="cursor-pointer text-gray-500 dark:text-gray-300">
            <Paperclip className="w-5 h-5" />
            <input type="file" onChange={handleFileChange} className="hidden" />
          </label>
          <button
            onClick={sendMessage}
            className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}
