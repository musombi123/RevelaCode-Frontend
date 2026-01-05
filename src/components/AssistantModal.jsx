import React, { useState } from 'react';

export default function AssistantModal({ onClose }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, newMessage]);
    setInput('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      const data = await res.json();

      setMessages(prev => [...prev, { sender: 'assistant', text: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: "⚠️ Could not connect to AI."
      }]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
        >✖</button>

        <h2 className="text-lg font-semibold mb-3">🤖 Revela AI Assistant</h2>

        <div className="space-y-2 max-h-[300px] overflow-y-auto mb-3 text-sm">
          {messages.map((msg, idx) => (
            <div key={idx} className={`p-2 rounded ${msg.sender === 'user' ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-200 dark:bg-gray-700'}`}>
              <strong>{msg.sender === 'user' ? 'You' : 'AI'}:</strong> {msg.text}
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask something..."
            className="flex-1 p-2 rounded border"
          />
          <button onClick={sendMessage} className="bg-indigo-600 text-white px-4 rounded">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
