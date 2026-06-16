// components/Sidebar.jsx

import {
  Plus,
  MessageSquare,
  PanelLeftClose,
} from "lucide-react";

import { Button } from "@/components/ui/Button";

export default function Sidebar({
  open,
  setOpen,
  chats = [],
  onNewChat,
  onSelectChat,
}) {
  return (
    <>
      {/* Mobile Overlay */}
      {open && (
        <div
          className="
            md:hidden
            fixed
            inset-0
            bg-black/50
            backdrop-blur-sm
            z-40
          "
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed
          top-0
          left-0
          z-50
          h-screen
          w-64
          flex
          flex-col
          bg-revela-card
          border-r
          border-white/10
          text-white
          shadow-2xl
          transition-transform
          duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Header */}
        <div
          className="
            h-16
            px-4
            flex
            items-center
            justify-between
            border-b
            border-white/10
          "
        >
          <div className="flex items-center gap-3">
            <img
              src="/favicon.ico"
              alt="RevelaAI"
              className="w-6 h-6"
            />

            <span className="font-semibold text-lg">
              RevelaAI
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            className="
              text-gray-400
              hover:text-white
              hover:bg-white/10
            "
          >
            <PanelLeftClose size={18} />
          </Button>
        </div>

        {/* New Chat */}
        <div className="p-3">
          <Button
            onClick={() => {
              onNewChat();
              setOpen(false);
            }}
            className="
              w-full
              justify-start
              gap-2
              bg-revela-secondary
              hover:bg-revela-secondary/80
              text-white
              border-none
              rounded-xl
            "
          >
            <Plus size={18} />
            New Chat
          </Button>
        </div>

        {/* History */}
        <div
          className="
            flex-1
            overflow-y-auto
            px-2
            pb-4
            space-y-1
          "
        >
          {chats.length === 0 ? (
            <div
              className="
                text-gray-500
                text-sm
                px-3
                py-4
              "
            >
              No chats yet
            </div>
          ) : (
            chats.map((chat) => (
              <Button
                key={chat.id}
                variant="ghost"
                onClick={() => {
                  onSelectChat(chat);
                  setOpen(false);
                }}
                className="
                  w-full
                  justify-start
                  gap-3
                  rounded-xl
                  text-gray-300
                  hover:text-white
                  hover:bg-white/5
                  transition-colors
                "
              >
                <MessageSquare
                  size={16}
                  className="shrink-0"
                />

                <span className="truncate">
                  {chat.title}
                </span>
              </Button>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          className="
            p-4
            border-t
            border-white/10
            text-xs
            text-gray-500
          "
        >
          RevelaAI • Powered by MVI Engine
        </div>
      </aside>
    </>
  );
}