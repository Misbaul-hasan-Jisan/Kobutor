import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import Header from "../components/header";
import Footer from "../components/Footer";
import DarkButton from "../components/darkbutton";
import background from "../assets/homebg.png";
import backgroundDark from "../assets/homebg-dark.png";

// Initialize socket once outside component
let socketInstance = null;
const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io("http://localhost:3000", {
      transports: ["websocket", "polling"],
    });
  }
  return socketInstance;
};

function Chat() {
  const [isDark, setIsDark] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeChats, setActiveChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const { chatId: initialChatId } = useParams();
  const currentUserId = JSON.parse(localStorage.getItem("kobutor_user"))?.id;

  // Get socket instance
  const socket = getSocket();

  // Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setIsDark(savedTheme === "dark");
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem("kobutor_token");
    if (!token) navigate("/login");
  }, [navigate]);

  // Socket authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem("kobutor_token");
    if (token) {
      socket.emit("authenticate", token);
    }
  }, [socket]);

  // Socket event listeners with proper cleanup
  useEffect(() => {
    const handleReceiveMessage = (message) => {
      if (selectedChat && message.chatId === selectedChat._id) {
        setMessages((prev) => [...prev, message]);
      }
    };

    const handleTyping = (chatId) => {
      if (selectedChat && selectedChat._id === chatId) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = (chatId) => {
      if (selectedChat && selectedChat._id === chatId) {
        setIsTyping(false);
      }
    };

    const handleChatDeleted = (data) => {
      if (data.chatId === selectedChat?._id) {
        setActiveChats((prev) =>
          prev.filter((chat) => chat._id !== data.chatId)
        );
        setSelectedChat(null);
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    socket.on("chatDeleted", handleChatDeleted);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      socket.off("chatDeleted", handleChatDeleted);
    };
  }, [selectedChat, socket]);

  // Fetch chats
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("kobutor_token");
        const res = await fetch("http://localhost:3000/api/chats", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch chats");

        const data = await res.json();
        setActiveChats(data);

        if (initialChatId) {
          const found = data.find((c) => c._id === initialChatId);
          if (found) selectChat(found);
        }
      } catch (error) {
        console.error("Error fetching chats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [initialChatId]);

  // Fetch messages for selected chat
  const selectChat = async (chat) => {
    try {
      setSelectedChat(chat);
      const token = localStorage.getItem("kobutor_token");
      const res = await fetch(
        `http://localhost:3000/api/chats/${chat._id}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch messages");

      const data = await res.json();
      setMessages(data);

      // Join socket room
      socket.emit("joinChat", chat._id);

      // Mark messages as read
      markMessagesAsRead(data);
    } catch (error) {
      console.error("Error selecting chat:", error);
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async (messagesToMark) => {
    try {
      const unreadMessages = messagesToMark.filter(
        (msg) =>
          msg.sender !== currentUserId && !msg.readBy?.includes(currentUserId)
      );

      if (unreadMessages.length > 0) {
        const messageIds = unreadMessages.map((msg) => msg._id);
        const token = localStorage.getItem("kobutor_token");

        await fetch(
          `http://localhost:3000/api/chats/${selectedChat._id}/read`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ messageIds }),
          }
        );

        socket.emit("markAsRead", {
          chatId: selectedChat._id,
          messageIds,
        });
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Typing indicator
  let typingTimeout;
  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!typing && selectedChat) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      if (selectedChat) {
        socket.emit("stopTyping", selectedChat._id);
      }
      setTyping(false);
    }, 2000);
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const token = localStorage.getItem("kobutor_token");
      const res = await fetch(
        `http://localhost:3000/api/chats/${selectedChat._id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: newMessage }),
        }
      );

      if (!res.ok) throw new Error("Failed to send message");

      // ❌ don’t append manually
      // ❌ don’t socket.emit("sendMessage")

      setNewMessage("");
      socket.emit("stopTyping", selectedChat._id);
      setTyping(false);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  // Delete chat
  const handleDeleteChat = async () => {
    try {
      const token = localStorage.getItem("kobutor_token");
      const res = await fetch(
        `http://localhost:3000/api/chats/${selectedChat._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        setActiveChats((prev) =>
          prev.filter((chat) => chat._id !== selectedChat._id)
        );
        setSelectedChat(null);
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  // Helper: format date separators
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString();
  };

  return (
    <div
      className="w-screen min-h-screen bg-cover bg-center text-white flex flex-col transition-all duration-500"
      style={{
        backgroundImage: `url(${isDark ? backgroundDark : background})`,
      }}
    >
      <Header />
      <DarkButton isDark={isDark} setIsDark={setIsDark} />

      <div className="container mx-auto px-4 py-1 pt-10 h-[calc(100vh-80px)]">
        <div className="max-w-6xl mx-auto h-full bg-black/60 dark:bg-gray-900/80 backdrop-blur-md rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-white/20 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Pigeon Chat</h1>
            {isTyping && (
              <span className="text-sm text-yellow-400">✍️ Typing...</span>
            )}
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Chat list */}
            <div className="w-1/3 border-r border-white/20 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-white/60">
                  Loading chats...
                </div>
              ) : activeChats.length > 0 ? (
                activeChats.map((chat, index) => (
                  <div
                    key={`${chat._id}-${index}`}
                    onClick={() => selectChat(chat)}
                    className={`p-3 rounded cursor-pointer flex items-center ${
                      selectedChat?._id === chat._id
                        ? "bg-yellow-400/20 border border-yellow-400/50"
                        : "hover:bg-white/10"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl mr-3">
                      🐦
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">
                        {chat.participants.find((p) => p._id !== currentUserId)
                          ?.username || "Anonymous"}
                      </h3>
                      <p className="text-sm text-white/70 truncate">
                        {chat.lastMessage}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-white/60">
                  <p>No active chats yet</p>
                  <p className="text-sm mt-2">
                    Start by releasing pigeons and connecting with those who
                    find them
                  </p>
                  <button
                    onClick={() => navigate("/release")}
                    className="mt-4 bg-yellow-400 text-black px-4 py-2 rounded text-sm font-semibold hover:bg-yellow-300"
                  >
                    Release a Pigeon
                  </button>
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 flex flex-col">
              {selectedChat ? (
                <>
                  <div className="p-4 border-b border-white/20 flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-lg mr-3">
                        🐦
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {selectedChat.participants.find(
                            (p) => p._id !== currentUserId
                          )?.username || "Anonymous"}
                        </h3>
                        <p className="text-xs text-white/60">
                          Connected via pigeon message
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-red-400 hover:text-red-300 p-2"
                      title="Delete chat"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, idx) => {
                      const showDate =
                        idx === 0 ||
                        formatDate(messages[idx - 1].createdAt) !==
                          formatDate(msg.createdAt);

                      return (
                        <div key={`${msg._id}-${idx}`}>
                          {showDate && (
                            <div className="text-center text-xs text-white/60 my-4">
                              {formatDate(msg.createdAt)}
                            </div>
                          )}
                          <div
                            className={`flex ${
                              (msg.sender._id || msg.sender) === currentUserId
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow ${
                                (msg.sender._id || msg.sender) === currentUserId
                                  ? "bg-yellow-400 text-black rounded-br-none"
                                  : "bg-white/10 text-white rounded-bl-none"
                              }`}
                            >
                              <p>{msg.text}</p>
                              <div className="flex justify-end items-center gap-1 mt-1">
                                <span
                                  className={`text-xs ${
                                    (msg.sender._id || msg.sender) ===
                                    currentUserId
                                      ? "text-black/60"
                                      : "text-white/60"
                                  }`}
                                >
                                  {new Date(msg.createdAt).toLocaleTimeString(
                                    [],
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white/10 text-white rounded-2xl rounded-bl-none px-4 py-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                              style={{ animationDelay: "0.4s" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  <form
                    onSubmit={handleSendMessage}
                    className="p-4 border-t border-white/20"
                  >
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={handleTyping}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-yellow-400"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-yellow-400 text-black w-10 h-10 rounded-full flex items-center justify-center hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ➤
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-white/60">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🐦</div>
                    <h3 className="text-xl mb-2">
                      Select a chat to start messaging
                    </h3>
                    <p>Connect with people who found your pigeon messages</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4">
            <h3 className="text-xl font-bold mb-4 text-black dark:text-white">
              Delete Chat?
            </h3>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              This will remove the chat from your inbox. The other person will
              still be able to see the messages.
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteChat}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default Chat;
