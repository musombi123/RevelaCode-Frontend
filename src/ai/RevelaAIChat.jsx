import React, { useRef, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Send, Copy, Edit, Mic, Upload } from "lucide-react";

export default function RevelaAIChat({ messages, setMessages, onSendMessage }) {
  const inputRef = useRef(null);
  const endRef = useRef(null);
  const [inputText, setInputText] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);

  // Auto-scroll to bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;
    onSendMessage(text);
    setInputText("");
  };

  // Save edited message
  const saveEdit = (index, text) => {
    setMessages((m) => {
      const copy = [...m];
      copy[index].text = text;
      return copy;
    });
    setEditingIndex(null);
  };

  // Handle file upload
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const content =
        file.type === "application/pdf"
          ? `[PDF uploaded: ${file.name}]`
          : reader.result;
      onSendMessage(`Please analyze this document:\n${content}`);
    };

    if (file.type === "application/pdf") reader.readAsArrayBuffer(file);
    else reader.readAsText(file);
  };

  return (
    <Card className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-gray-900 shadow-none">
      {/* CHAT MESSAGES */}
      <CardContent className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`relative group max-w-[75%] p-3 rounded-xl whitespace-pre-wrap break-words
              ${msg.role === "assistant"
                ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 mr-auto"
                : "bg-green-600 text-white ml-auto"
              }`}
          >
            {editingIndex === i ? (
              <textarea
                className="w-full resize-none bg-transparent outline-none"
                defaultValue={msg.text}
                onBlur={(e) => saveEdit(i, e.target.value)}
              />
            ) : (
              <p className="whitespace-pre-wrap">{msg.text}</p>
            )}

            {/* Hover actions */}
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-1">
              {msg.role === "user" && <button onClick={() => setEditingIndex(i)}><Edit size={14} /></button>}
              <button onClick={() => navigator.clipboard.writeText(msg.text)}><Copy size={14} /></button>
            </div>
          </div>
        ))}

        {/* Scroll anchor */}
        <div ref={endRef} />
      </CardContent>

      {/* INPUT AREA */}
      <div className="p-3 border-t flex items-end gap-2 bg-gray-100 dark:bg-gray-800">
        {/* Upload button */}
        <label className="p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 rounded flex items-center gap-1">
          <Upload size={20} />
          <input type="file" hidden onChange={handleUpload} />
        </label>

        {/* Textarea */}
        <textarea
          ref={inputRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Send a message..."
          className="flex-1 resize-none rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-2 max-h-36 overflow-y-auto bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        {/* Mic */}
        <button
          className="p-3 rounded-full bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100"
          title="Voice input"
        >
          <Mic size={20} />
        </button>

        {/* Send */}
        <button
          onClick={handleSend}
          className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full"
          title="Send message"
        >
          <Send size={20} />
        </button>
      </div>
    </Card>
  );
}
