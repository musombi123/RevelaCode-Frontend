// @ai/AIAssistantDashboard.jsx
import React, { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import ChatWindow from "@/components/ChatWindow";
import InputBar from "@/components/InputBar";
import WelcomeScreen from "@/components/WelcomeScreen";
import RevelaAIVoiceChat from "@/ai/RevelaAIVoiceChat";

/* =========================================================
   MESSAGE FACTORY
========================================================= */
const createMessage = (role, text, status = "done") => ({
  id: crypto.randomUUID(),
  role,
  text,
  status,
});
const STORAGE_KEY = "revela_chats";


const buildContext = (messages) => {
  return messages
    .slice(-12) // keep last 12 messages (performance control)
    .map((m) => {
      const role = m.role === "user" ? "User" : "Assistant";
      return `${role}: ${m.text}`;
    })
    .join("\n");
};
/* =========================================================
   PROMPT INTELLIGENCE
========================================================= */
const enrichPrompt = (text) => {
  const lower = text.toLowerCase();

  if (lower.includes("bible") || lower.includes("verse")) {
    return `[BIBLE MODE] ${text}`;
  }

  if (lower.includes("prophecy")) {
    return `[PROPHECY MODE] ${text}`;
  }

  if (lower.includes("code") || lower.includes("error")) {
    return `[DEVELOPER MODE] ${text}`;
  }

  return text;
};

/* =========================================================
   MAIN DASHBOARD
========================================================= */
export default function AIAssistantDashboard() {
  // ✅ FIX 1: messages was missing (this breaks your UI flow)
  const [messages, setMessages] = useState([]);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chats, setChats] = useState([]);
  const [voiceActive, setVoiceActive] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);

  const controllerRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      setChats(JSON.parse(saved));
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  }, [chats]);

  
  const startNewChat = () => {
      const newChat = {
        id: Date.now(),
        title: `Chat ${chats.length + 1}`,
        messages: [],
      };

      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      setMessages([]);
    };

    const updateChat = (
      chatId,
      newMessages
    ) => {
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: newMessages,
              }
            : chat
        )
      );
    };
  /* =========================================================
     AI CALL
  ========================================================= */
  const callRevelaAI = async (message,context, signal) => {
    const res = await fetch(
      `${import.meta.env.VITE_REVELAAI_URL}/ai`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message,
          context,
         }),
        signal,
      }
    );

    if (!res.ok) throw new Error("AI request failed");

    return res.json();
  };

  /* =========================================================
     SEND MESSAGE
  ========================================================= */
  const sendTextMessage = async (text) => {
    let currentChatId = activeChatId;

    if (!currentChatId) {
      const newChat = {
        id: Date.now(),
        title: text.slice(0, 30),
        messages: [],
      };

      setChats((prev) => [newChat, ...prev]);

      currentChatId = newChat.id;

      setActiveChatId(currentChatId);
   }
    if (!text.trim()) return;

    const userMessage = createMessage("user", text);

    const context = buildContext(messages);

    const loadingId = crypto.randomUUID();

    const loadingMessage = {
      id: loadingId,
      role: "assistant",
      text: "Thinking...",
      status: "loading",
    };

    setMessages((prev) => {
      const updated = [
        ...prev,
        userMessage,
        loadingMessage,
      ];

      updateChat(
        currentChatId,
        updated
      );

      return updated;
    });

    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const data = await callRevelaAI(
        enrichPrompt(text),
        context,
        controller.signal
      );

      const assistantText =
        data?.data?.content ||
        "⚠️ No response from RevelaAI.";

      setMessages((prev) => {
        const updated = prev.map((msg) =>
          msg.id === loadingId
            ? {
              ...msg,
              text: assistantText,
              status: "done",
              }
            : msg
        );

        updateChat(
          currentChatId,
          updated
        );

        return updated;
      });
      
    } catch (err) {
      if (err.name === "AbortError") return;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingId
            ? {
                ...msg,
                text: "⚠️ Request failed. Try again.",
                status: "error",
              }
            : msg
        )
      );
    }
  };

  /* =========================================================
     VOICE RESULT
  ========================================================= */
  const handleVoiceResult = (text) => {
    if (text) sendTextMessage(text);
    setVoiceActive(false);
  };

  const hasConversation = messages.some(m => m.role === "user");

  /* =========================================================
     UI
  ========================================================= */
  return (
    <div className="h-screen flex bg-revela-dark text-white overflow-hidden">

      {/* SIDEBAR (NOW WORKING) */}
      <Sidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        chats={chats}
        onNewChat={startNewChat}
        onSelectChat={(chat) => {
          setActiveChatId(chat.id);
          setMessages(JSON.parse(JSON.stringify(chat.messages || [])));
        }}
      />

      <button
        onClick={() =>
          setSidebarOpen((prev) => !prev)
        }
        className={`
          fixed
          top-4
          z-[60]
          p-2
          rounded-lg
          bg-revela-card
          border
          border-white/10
          transition-all
          duration-300
          ${sidebarOpen ? "left-72" : "left-4"}
        `}
      >
        ☰
      </button>

      {/* MAIN AREA */}
      <main
        className="
          flex-1
          flex
          flex-col
          relative
          overflow-hidden
          min-h-0
        "
      >

        <div className="flex-1 flex flex-col min-h-0">

          {/* Scrollable chat area */}
          <div className="flex-1 overflow-y-auto">

            {!hasConversation ? (
              <div
                className="
                  h-full
                  flex
                  items-center
                  justify-center
                  px-4
                "
              >
                <div
                  className="
                    w-full
                    max-w-3xl
                    flex
                    flex-col
                    items-center
                    justify-center
                    -translate-y-12
                  "
                >
                  <WelcomeScreen />
                </div>
              </div>
            ) : (
              <ChatWindow messages={messages} />
            )}

          </div>

          {/* Fixed input area */}
          <div
            className="
              sticky
              bottom-0
              z-20
              bg-revela-dark
              border-t
              border-white/10
              px-4
              py-4
            "
          >
            <div className="max-w-4xl mx-auto">
              <InputBar
                centered={!hasConversation}
                onSend={sendTextMessage}
                onMic={() => setVoiceActive(true)}
              />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
