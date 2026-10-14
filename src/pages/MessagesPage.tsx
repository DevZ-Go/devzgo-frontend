import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  MessageSquare,
  Search,
  Send,
  Loader2,
  CheckCheck,
  Check,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import {
  fetchConversations,
  fetchConversationThread,
  sendMessage,
  markConversationRead,
} from "../api/messages";
import { fetchUserProfile } from "../api/profiles";
import type { Conversation, Message, ConnectionUserSummary } from "../types/network";
import { useAuth } from "../auth/AuthContext";

function formatMessageTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "numeric",
    }).format(d);
  } catch {
    return "";
  }
}

export function MessagesPage() {
  const [searchParams] = useSearchParams();
  const targetUserParam = searchParams.get("user");
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<ConnectionUserSummary | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputContent, setInputContent] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations list
  const loadConversationsList = useCallback(async (autoSelectId?: string) => {
    try {
      const list = await fetchConversations();
      setConversations(list);

      if (autoSelectId) {
        const found = list.find(
          (c) =>
            c.otherUser.id === autoSelectId ||
            c.otherUser.username.toLowerCase() === autoSelectId.toLowerCase()
        );
        if (found) {
          setSelectedUser(found.otherUser);
        } else {
          // Fetch profile and initiate new conversation stub
          const prof = await fetchUserProfile(autoSelectId);
          setSelectedUser({
            id: prof.userId || prof.id,
            username: prof.username,
            fullName: prof.fullName,
            headline: prof.headline,
            avatarUrl: prof.avatarUrl,
          });
        }
      } else {
        setSelectedUser((current) => (!current && list.length > 0 ? list[0]!.otherUser : current));
      }
    } catch {
      // Ignore
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    void loadConversationsList(targetUserParam || undefined);

    const handleUpdate = () => {
      void loadConversationsList();
    };
    window.addEventListener("devzgo:messages-updated", handleUpdate);
    return () => {
      window.removeEventListener("devzgo:messages-updated", handleUpdate);
    };
  }, [loadConversationsList, targetUserParam]);

  // Load active thread when selectedUser changes
  useEffect(() => {
    if (!selectedUser) return;
    let cancelled = false;

    async function loadThread() {
      setLoadingThread(true);
      try {
        const thread = await fetchConversationThread(selectedUser!.id);
        if (!cancelled) {
          setMessages(thread);
          // Mark read
          await markConversationRead(selectedUser!.id);
          setConversations((prev) =>
            prev.map((c) =>
              c.otherUser.id === selectedUser!.id ? { ...c, unreadCount: 0 } : c
            )
          );
        }
      } catch {
        // Ignore
      } finally {
        if (!cancelled) setLoadingThread(false);
      }
    }

    void loadThread();
    return () => {
      cancelled = true;
    };
  }, [selectedUser]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputContent.trim() || !selectedUser || sending) return;

    const content = inputContent.trim();
    setInputContent("");
    setSending(true);

    try {
      const newMsg = await sendMessage(selectedUser.id, content);
      setMessages((prev) => [...prev, newMsg]);

      // Update conversation in list
      setConversations((prev) => {
        const exists = prev.find((c) => c.otherUser.id === selectedUser.id);
        if (exists) {
          return prev.map((c) =>
            c.otherUser.id === selectedUser.id
              ? { ...c, lastMessage: newMsg, unreadCount: 0 }
              : c
          );
        }
        return [
          {
            otherUser: selectedUser,
            lastMessage: newMsg,
            unreadCount: 0,
          },
          ...prev,
        ];
      });
    } catch {
      // rollback
    } finally {
      setSending(false);
    }
  }

  const filteredConversations = conversations.filter(
    (c) =>
      c.otherUser.username.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (c.otherUser.fullName &&
        c.otherUser.fullName.toLowerCase().includes(searchFilter.toLowerCase())) ||
      c.lastMessage.content.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900">
      <Navbar />

      <main className="max-w-[1440px] mx-auto px-4 sm:px-8 pt-24 pb-12">
        <div className="rounded-3xl border border-gray-200/90 bg-white shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-[380px_1fr] h-[calc(100vh-140px)] min-h-[600px]">
          {/* Left Column: Conversations List */}
          <div
            className={`border-r border-gray-100 flex flex-col h-full bg-white ${
              selectedUser ? "hidden md:flex" : "flex"
            }`}
          >
            {/* Conversations Header */}
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">Messages</h2>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    {conversations.length}
                  </span>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {loadingConversations ? (
                <div className="py-20 flex flex-col items-center justify-center gap-2 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="text-xs">Loading conversations…</span>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="py-16 text-center text-gray-400 text-xs">
                  <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  No messages found
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = selectedUser?.id === conv.otherUser.id;
                  return (
                    <button
                      key={conv.otherUser.id}
                      type="button"
                      onClick={() => setSelectedUser(conv.otherUser)}
                      className={`w-full text-left p-4 flex items-center gap-3 transition ${
                        isSelected
                          ? "bg-blue-50/70 border-r-4 border-blue-600"
                          : "hover:bg-gray-50/80"
                      }`}
                    >
                      <div className="relative shrink-0">
                        {conv.otherUser.avatarUrl ? (
                          <img
                            src={conv.otherUser.avatarUrl}
                            alt={conv.otherUser.fullName || conv.otherUser.username}
                            className="w-11 h-11 rounded-2xl object-cover ring-1 ring-gray-200"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                            {conv.otherUser.username.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-xs text-gray-900 truncate">
                            {conv.otherUser.fullName || conv.otherUser.username}
                          </span>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {formatMessageTime(conv.lastMessage.createdAt)}
                          </span>
                        </div>
                        <p
                          className={`text-xs truncate ${
                            conv.unreadCount > 0
                              ? "font-semibold text-gray-900"
                              : "text-gray-500"
                          }`}
                        >
                          {conv.lastMessage.isOutgoing && (
                            <span className="text-gray-400 font-normal">You: </span>
                          )}
                          {conv.lastMessage.content}
                        </p>
                      </div>

                      {conv.unreadCount > 0 && (
                        <span className="flex h-5 min-w-[20px] px-1.5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-sm shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Selected Thread */}
          <div
            className={`flex flex-col h-full bg-slate-50/50 ${
              selectedUser ? "flex" : "hidden md:flex"
            }`}
          >
            {selectedUser ? (
              <>
                {/* Thread Header */}
                <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedUser(null)}
                      className="md:hidden p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 mr-1"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    {selectedUser.avatarUrl ? (
                      <img
                        src={selectedUser.avatarUrl}
                        alt={selectedUser.fullName || selectedUser.username}
                        className="w-10 h-10 rounded-xl object-cover ring-1 ring-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                        {selectedUser.username.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-gray-900">
                          {selectedUser.fullName || selectedUser.username}
                        </h3>
                        <span className="text-xs text-gray-400">
                          @{selectedUser.username}
                        </span>
                      </div>
                      {selectedUser.headline && (
                        <p className="text-[11px] text-gray-500 line-clamp-1">
                          {selectedUser.headline}
                        </p>
                      )}
                    </div>
                  </div>

                  <Link
                    to={`/profile/${selectedUser.id || selectedUser.username}`}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-xl border border-blue-100 hover:bg-blue-50 transition"
                  >
                    View Profile
                  </Link>
                </div>

                {/* Message Stream */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {loadingThread ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-2 text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      <span className="text-xs">Loading messages…</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="py-24 text-center text-gray-400">
                      <Sparkles className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-gray-700">
                        Start a conversation with {selectedUser.fullName || selectedUser.username}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Discuss open source projects, code architectures, or collaboration ideas.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.isOutgoing || msg.senderId === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex items-end gap-2 ${
                            isMe ? "justify-end" : "justify-start"
                          }`}
                        >
                          {!isMe && (
                            <div className="w-7 h-7 rounded-lg bg-gray-200 text-gray-700 font-bold flex items-center justify-center text-[10px] shrink-0 mb-1">
                              {selectedUser.username.slice(0, 2).toUpperCase()}
                            </div>
                          )}

                          <div
                            className={`max-w-[75%] sm:max-w-md px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                              isMe
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-none"
                                : "bg-white text-gray-900 border border-gray-100 rounded-bl-none"
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            <div
                              className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                                isMe ? "text-blue-100" : "text-gray-400"
                              }`}
                            >
                              <span>{formatMessageTime(msg.createdAt)}</span>
                              {isMe && (
                                msg.read ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-white" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-blue-200" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Dock */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 bg-white border-t border-gray-100 flex items-center gap-3"
                >
                  <input
                    type="text"
                    placeholder={`Write a message to ${
                      selectedUser.fullName || selectedUser.username
                    }…`}
                    value={inputContent}
                    onChange={(e) => setInputContent(e.target.value)}
                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-2.5 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                  <button
                    type="submit"
                    disabled={!inputContent.trim() || sending}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md shadow-blue-500/20 hover:shadow-lg transition disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
                <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
                <h3 className="font-bold text-gray-700 text-base mb-1">
                  Select a conversation
                </h3>
                <p className="text-xs text-gray-500 max-w-sm">
                  Choose a developer from your contacts on the left or visit their profile to start a new direct message thread.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
