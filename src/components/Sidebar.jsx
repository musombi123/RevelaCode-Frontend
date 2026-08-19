// src/components/Sidebar.jsx

import {
  Plus,
  MessageSquare,
  PanelLeftClose,
  Sparkles,
  Search,
  MessageCircle,
} from "lucide-react";

import { Button } from "@/components/ui/Button";

export default function Sidebar({
  open,
  setOpen,
  chats = [],
  onNewChat,
  onSelectChat,
  activeChatId = null,
}) {
  return (
    <>
      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {open && (
        <button
          type="button"
          aria-label="Close RevelaAI sidebar"
          onClick={() => setOpen(false)}
          className="
            fixed
            inset-0
            z-40
            bg-black/50
            backdrop-blur-[2px]
            md:hidden
          "
        />
      )}

      {/* =====================================================
          SIDEBAR
          -----------------------------------------------------
          Desktop:
          - remains inside the flex layout
          - always occupies width when open
          
          Mobile:
          - becomes a slide-in drawer
      ===================================================== */}

      <aside
        className={`
          flex
          h-full
          min-h-0
          w-[280px]
          shrink-0
          flex-col
          overflow-hidden
          border-r
          border-white/10
          bg-revela-card
          text-white
          shadow-2xl

          ${
            open
              ? "md:relative md:translate-x-0"
              : "md:w-0 md:border-r-0"
          }

          fixed
          inset-y-0
          left-0
          z-50
          transition-all
          duration-300
          ease-out

          ${
            open
              ? "translate-x-0"
              : "-translate-x-full"
          }

          md:static
          md:z-auto
        `}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="
            flex
            h-16
            shrink-0
            items-center
            justify-between
            border-b
            border-white/10
            px-4
          "
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-gradient-to-br
                from-green-500
                to-emerald-700
                shadow-lg
              "
            >
              <Sparkles size={17} />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-black">
                RevelaAI
              </p>

              <p className="truncate text-[10px] text-gray-400">
                Intelligent Assistant
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            className="
              shrink-0
              text-gray-400
              hover:bg-white/10
              hover:text-white
            "
            aria-label="Close sidebar"
            title="Close sidebar"
          >
            <PanelLeftClose size={18} />
          </Button>
        </div>

        {/* =================================================
            NEW CHAT
        ================================================= */}

        <div className="shrink-0 p-3">
          <Button
            type="button"
            onClick={() => {
              onNewChat?.();
            }}
            className="
              flex
              w-full
              items-center
              justify-start
              gap-2
              rounded-xl
              border
              border-white/10
              bg-revela-secondary
              px-3
              py-3
              text-sm
              font-bold
              text-white
              shadow-sm
              transition
              hover:bg-revela-secondary/80
              active:scale-[0.99]
            "
          >
            <Plus size={18} />
            New Chat
          </Button>
        </div>

        {/* =================================================
            SEARCH / HISTORY LABEL
        ================================================= */}

        <div className="shrink-0 px-3 pb-2">
          <div
            className="
              flex
              items-center
              gap-2
              px-2
              text-[10px]
              font-black
              uppercase
              tracking-[0.14em]
              text-gray-500
            "
          >
            <MessageCircle size={13} />
            Conversations
          </div>
        </div>

        {/* =================================================
            HISTORY
        ================================================= */}

        <div
          className="
            min-h-0
            flex-1
            overflow-y-auto
            overscroll-contain
            px-2
            pb-4
          "
        >
          {chats.length === 0 ? (
            <div
              className="
                flex
                flex-col
                items-center
                justify-center
                px-6
                py-12
                text-center
              "
            >
              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-2xl
                  bg-white/5
                  text-gray-500
                "
              >
                <MessageSquare size={20} />
              </div>

              <p
                className="
                  mt-4
                  text-sm
                  font-semibold
                  text-gray-400
                "
              >
                No conversations yet
              </p>

              <p
                className="
                  mt-1
                  max-w-[190px]
                  text-xs
                  leading-5
                  text-gray-500
                "
              >
                Start a new conversation and
                your recent chats will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {chats.map((chat) => {
                const active =
                  activeChatId === chat.id;

                return (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => {
                      onSelectChat?.(chat);
                      setOpen?.(false);
                    }}
                    className={`
                      group
                      flex
                      w-full
                      min-w-0
                      items-center
                      gap-3
                      rounded-xl
                      px-3
                      py-3
                      text-left
                      transition
                      ${
                        active
                          ? "bg-white/10 text-white"
                          : "text-gray-300 hover:bg-white/5 hover:text-white"
                      }
                    `}
                  >
                    <span
                      className={`
                        flex
                        h-9
                        w-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        ${
                          active
                            ? "bg-indigo-500/20 text-indigo-300"
                            : "bg-white/5 text-gray-500 group-hover:text-gray-300"
                        }
                      `}
                    >
                      <MessageSquare size={16} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span
                        className={`
                          block
                          truncate
                          text-sm
                          font-semibold
                          ${
                            active
                              ? "text-white"
                              : "text-gray-300"
                          }
                        `}
                      >
                        {chat.title ||
                          "Untitled Chat"}
                      </span>

                      {chat.messages?.length > 0 && (
                        <span
                          className="
                            mt-0.5
                            block
                            truncate
                            text-[10px]
                            text-gray-500
                          "
                        >
                          {chat.messages.length}{" "}
                          {chat.messages.length === 1
                            ? "message"
                            : "messages"}
                        </span>
                      )}
                    </span>

                    {active && (
                      <span
                        className="
                          h-2
                          w-2
                          shrink-0
                          rounded-full
                          bg-emerald-400
                        "
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div
          className="
            shrink-0
            border-t
            border-white/10
            p-3
          "
        >
          <div
            className="
              rounded-xl
              bg-white/[0.03]
              px-3
              py-3
            "
          >
            <div className="flex items-center gap-2">
              <div
                className="
                  flex
                  h-7
                  w-7
                  items-center
                  justify-center
                  rounded-lg
                  bg-emerald-500/10
                  text-emerald-400
                "
              >
                <Sparkles size={13} />
              </div>

              <div className="min-w-0">
                <p
                  className="
                    truncate
                    text-[11px]
                    font-bold
                    text-gray-300
                  "
                >
                  RevelaAI
                </p>

                <p
                  className="
                    truncate
                    text-[10px]
                    text-gray-500
                  "
                >
                  Powered by MVI Engine
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
