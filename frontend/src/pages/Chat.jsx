import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/header";
import Footer from "../components/Footer";
import DarkButton from "../components/darkbutton";
import background from "../assets/homebg.png";
import backgroundDark from "../assets/homebg-dark.png";

// Initialize socket
let socketInstance = null;

const getSocket = () => {
  if (!socketInstance) {
    console.log("🆕 Creating new socket instance");
    socketInstance = io("https://kobutor.onrender.com", {
      transports: ["websocket", "polling"],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    // Global event listeners (only set once)
    socketInstance.on("connect", () => {
      console.log("✅ Global: Socket connected:", socketInstance.id);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("🔌 Global: Socket disconnected:", reason);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("❌ Global: Socket connection error:", error);
    });
  }
  return socketInstance;
};

// Enhanced reaction emojis with groups
const REACTION_GROUPS = [
  ["❤️", "😂", "😮", "😢", "😡"],
  ["👍", "👎", "🎉", "🔥", "👏"],
  ["🙏", "🤔", "🤯", "🥳", "💩"],
];

// Expanded Theme options with chat box colors
const CHAT_THEMES = [
  {
    id: "default",
    name: "Classic",
    background: "bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900",
    chatBox: "from-yellow-400 to-orange-500",
    otherChatBox: "from-blue-400 to-purple-500",
    header: "from-yellow-400/10 to-transparent",
    border: "border-yellow-400/30",
  },
  // ... (keep all your existing themes)
];

// Avatar generator function
const generateAvatar = (userId, username) => {
  const colors = [
    "from-red-400 to-pink-500",
    "from-blue-400 to-cyan-500",
    "from-green-400 to-teal-500",
    "from-purple-400 to-indigo-500",
    "from-orange-400 to-red-500",
    "from-yellow-400 to-orange-500",
  ];

  const emojis = ["🐦", "🕊️", "🌟", "✨", "🔥", "💫", "🎯", "📮"];

  const colorIndex =
    userId?.split("").reduce((a, b) => a + b.charCodeAt(0), 0) % colors.length;
  const emojiIndex =
    username?.split("").reduce((a, b) => a + b.charCodeAt(0), 0) %
    emojis.length;

  return {
    gradient: colors[colorIndex],
    emoji: emojis[emojiIndex],
  };
};

// Status indicator component
const StatusIndicator = ({ isOnline, isTyping }) => {
  if (isTyping) {
    return (
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
        <span className="text-xs text-yellow-400">Typing...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1">
      <div
        className={`w-2 h-2 rounded-full ${
          isOnline ? "bg-green-400" : "bg-gray-400"
        }`}
      ></div>
      <span className="text-xs text-gray-400">
        {isOnline ? "Online" : "Offline"}
      </span>
    </div>
  );
};

// Enhanced message status component
const MessageStatus = ({ status, readBy = [] }) => {
  const getStatusIcon = () => {
    switch (status) {
      case "sent":
        return <span className="text-gray-400 text-xs">✓</span>;
      case "delivered":
        return <span className="text-gray-400 text-xs">✓✓</span>;
      case "read":
        return <span className="text-blue-400 text-xs">✓✓</span>;
      default:
        return <span className="text-gray-300 text-xs">🕒</span>;
    }
  };

  return (
    <div
      className="flex items-center space-x-1"
      title={readBy.length > 0 ? `Seen by ${readBy.length}` : ""}
    >
      {getStatusIcon()}
      {readBy.length > 0 && (
        <span className="text-xs text-gray-400">{readBy.length}</span>
      )}
    </div>
  );
};

function Chat() {
  const [isDark, setIsDark] = useState(false);
  const [messages, setMessages] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeChats, setActiveChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("default");
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [socketConnected, setSocketConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const { chatId: initialChatId } = useParams();
  const currentUser = JSON.parse(localStorage.getItem("kobutor_user"));
  const currentUserId = currentUser?.id || currentUser?._id;

  const socket = getSocket();

  // Socket connection management
  useEffect(() => {
    // Component-specific connection handlers
    const handleConnect = () => {
      console.log("✅ Socket connected in component");
      setSocketConnected(true);
      setConnectionError(null);
    };

    const handleConnectError = (error) => {
      console.error("❌ Socket connection error in component:", error);
      setSocketConnected(false);
      setConnectionError("Failed to connect to server");
    };

    const handleDisconnect = (reason) => {
      console.log("🔌 Socket disconnected in component:", reason);
      setSocketConnected(false);
    };

    // Add component listeners
    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);

    // Connect socket if not already connected
    if (!socket.connected) {
      console.log("🔄 Connecting socket from component...");
      socket.connect();
    } else {
      setSocketConnected(true);
    }

    // Cleanup
    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket, navigate]);

  // When component mounts and socket is ready, enter chat page
  useEffect(() => {
    if (socketConnected && currentUserId) {
      console.log("🚀 Entering chat page");
      socket.emit("enterChatPage");

      // Request initial online users
      socket.emit("getOnlineUsers");
    }
  }, [socketConnected, currentUserId, socket]);

  // When component unmounts, leave chat page
  useEffect(() => {
    return () => {
      if (socket && currentUserId) {
        console.log("🚪 Leaving chat page");
        socket.emit("leaveChatPage");
      }
    };
  }, [socket, currentUserId]);

  // Page visibility handler to detect when user navigates away
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched tabs or minimized window
        if (socket && currentUserId) {
          console.log("👋 Page hidden, leaving chat page");
          socket.emit("leaveChatPage");
        }
      } else {
        // User returned to the page
        if (socket && currentUserId) {
          console.log("🔙 Page visible, entering chat page");
          socket.emit("enterChatPage");
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [socket, currentUserId]);

  // Get current theme settings
  const getCurrentTheme = () => {
    return CHAT_THEMES.find((t) => t.id === currentTheme) || CHAT_THEMES[0];
  };

  const theme = getCurrentTheme();

  // Theme effects
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const savedChatTheme = localStorage.getItem("chatTheme");
    if (savedTheme) {
      setIsDark(savedTheme === "dark");
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
    if (savedChatTheme) {
      setCurrentTheme(savedChatTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
    localStorage.setItem("chatTheme", currentTheme);
  }, [isDark, currentTheme]);

  // Track all chat participants for status monitoring
  const [chatParticipants, setChatParticipants] = useState(new Set());

  // Update chat participants when activeChats changes
  useEffect(() => {
    const token = localStorage.getItem("kobutor_token");
    if (token) {
      console.log("🔐 Authenticating socket...");
      socket.emit("authenticate", token);

      // Wait for authentication before entering chat page
      socket.once("authenticated", () => {
        console.log("✅ Authenticated, entering chat page...");
        socket.emit("enterChatPage");
        socket.emit("getOnlineUsers");
      });
    }
    const allParticipants = new Set();
    activeChats.forEach((chat) => {
      chat.participants.forEach((participant) => {
        if (participant._id !== currentUserId) {
          allParticipants.add(participant._id);
        }
      });
    });
    setChatParticipants(allParticipants);

    // Request status for all participants
    if (allParticipants.size > 0) {
      requestUserStatuses(Array.from(allParticipants));
    }
  }, [activeChats, currentUserId]);

  // Pin/Unpin functionality
  const handlePinMessage = async (messageId) => {
    try {
      const token = localStorage.getItem("kobutor_token");
      if (token) {
        console.log("🔐 Authenticating socket...");
        socket.emit("authenticate", token);

        // Wait for authentication before entering chat page
        socket.once("authenticated", () => {
          console.log("✅ Authenticated, entering chat page...");
          socket.emit("enterChatPage");
          socket.emit("getOnlineUsers");
        });
      }
      const res = await fetch(
        `https://kobutor.onrender.com/api/chats/${selectedChat._id}/messages/${messageId}/pin`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const updatedMessage = await res.json();
        setPinnedMessages((prev) => [
          ...prev.filter((msg) => msg._id !== messageId),
          updatedMessage,
        ]);
      }
    } catch (error) {
      console.error("Error pinning message:", error);
    }
  };

  const handleUnpinMessage = async (messageId) => {
    try {
      const token = localStorage.getItem("kobutor_token");
      if (token) {
        console.log("🔐 Authenticating socket...");
        socket.emit("authenticate", token);

        // Wait for authentication before entering chat page
        socket.once("authenticated", () => {
          console.log("✅ Authenticated, entering chat page...");
          socket.emit("enterChatPage");
          socket.emit("getOnlineUsers");
        });
      }
      const res = await fetch(
        `https://kobutor.onrender.com/api/chats/${selectedChat._id}/messages/${messageId}/unpin`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        setPinnedMessages((prev) =>
          prev.filter((msg) => msg._id !== messageId)
        );
      }
    } catch (error) {
      console.error("Error unpinning message:", error);
    }
  };

  // Pin Button Component
  const PinButton = ({ message }) => {
    const isPinned =
      message.isPinned ||
      (Array.isArray(pinnedMessages) &&
        pinnedMessages.some((m) => m._id === message._id));

    return (
      <button
        onClick={() =>
          isPinned
            ? handleUnpinMessage(message._id)
            : handlePinMessage(message._id)
        }
        className="text-xs p-1 hover:bg-black/20 rounded transition-all"
        title={isPinned ? "Unpin message" : "Pin message"}
      >
        {isPinned ? "📌" : "📍"}
      </button>
    );
  };

  // Enhanced Message Bubble Component with theme colors
  const MessageBubble = ({ message, isOwnMessage, showDate }) => {
    const avatar = generateAvatar(message.sender._id, message.sender.username);
    const isOnline = onlineUsers.has(message.sender._id);
    const currentTheme = getCurrentTheme();

    const bubbleVariants = {
      hidden: {
        opacity: 0,
        y: isOwnMessage ? 20 : -20,
        scale: 0.8,
      },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 500,
          damping: 30,
        },
      },
      animate: {
        scale: [1, 1.05, 1],
        transition: { duration: 0.3 },
      },
    };

    return (
      <motion.div
        variants={bubbleVariants}
        initial="hidden"
        animate={message.animate ? "animate" : "visible"}
        className="relative group"
      >
        {showDate && (
          <div className="text-center text-xs text-white/60 my-4 px-3 py-1 bg-black/30 rounded-full inline-block">
            {formatDate(message.createdAt)}
          </div>
        )}

        <div
          className={`flex ${
            isOwnMessage ? "justify-end" : "justify-start"
          } items-end space-x-2`}
        >
          {!isOwnMessage && (
            <div className="relative">
              <div
                className={`w-8 h-8 rounded-full bg-gradient-to-r ${avatar.gradient} flex items-center justify-center text-sm shadow-md`}
              >
                {avatar.emoji}
              </div>
            </div>
          )}

          <motion.div
            whileHover={{ scale: 1.02 }}
            className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-lg relative ${
              isOwnMessage
                ? `bg-gradient-to-r ${currentTheme.chatBox} text-black rounded-br-none`
                : `bg-gradient-to-r ${currentTheme.otherChatBox} text-white rounded-bl-none`
            }`}
          >
            <p className="mb-1 leading-relaxed">{message.text}</p>

            {/* Enhanced Reactions */}
            {message.reactions && Object.keys(message.reactions).length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {Object.entries(message.reactions).map(
                  ([emoji, reactionData]) => {
                    const usersArray = Array.isArray(reactionData)
                      ? reactionData
                      : reactionData.users || [];
                    const userReacted = usersArray.includes(currentUserId);
                    const reactionCount = Array.isArray(reactionData)
                      ? reactionData.length
                      : reactionData.count || usersArray.length;

                    return (
                      <motion.button
                        key={emoji}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleToggleReaction(message._id, emoji)}
                        className={`px-2 py-1 rounded-full text-xs transition-all flex items-center space-x-1 ${
                          userReacted
                            ? "bg-yellow-400 text-black shadow-md"
                            : "bg-black/20 hover:bg-black/30"
                        }`}
                      >
                        <span>{emoji}</span>
                        <span>{reactionCount}</span>
                      </motion.button>
                    );
                  }
                )}
              </div>
            )}

            <div className="flex justify-between items-center mt-1">
              <span
                className={`text-xs ${
                  isOwnMessage ? "text-black/60" : "text-white/60"
                }`}
              >
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>

              <div className="flex items-center space-x-2">
                {isOwnMessage && (
                  <MessageStatus
                    status={message.readBy?.length > 0 ? "read" : "delivered"}
                    readBy={message.readBy || []}
                  />
                )}

                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <PinButton message={message} />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowReactionPicker(
                        showReactionPicker === message._id ? null : message._id
                      );
                    }}
                    className="text-xs p-1 hover:bg-black/20 rounded transition-all"
                    title="Add reaction"
                  >
                    😊
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {isOwnMessage && (
            <div className="relative">
              <div
                className={`w-8 h-8 rounded-full bg-gradient-to-r ${avatar.gradient} flex items-center justify-center text-sm shadow-md`}
              >
                {avatar.emoji}
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Reaction Picker */}
        <AnimatePresence>
          {showReactionPicker === message._id && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="absolute bg-black/90 backdrop-blur-md rounded-2xl p-3 shadow-2xl border border-white/20 z-20 mt-2"
              style={{
                left: isOwnMessage ? "auto" : "0",
                right: isOwnMessage ? "0" : "auto",
              }}
            >
              <div className="grid grid-cols-5 gap-2">
                {REACTION_GROUPS.flat().map((emoji) => (
                  <motion.button
                    key={emoji}
                    whileHover={{ scale: 1.4, rotate: 5 }}
                    whileTap={{ scale: 0.8 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleReaction(message._id, emoji);
                      setShowReactionPicker(null);
                    }}
                    className="text-xl p-2 hover:bg-white/10 rounded-lg transition-all"
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const requestUserStatuses = (userIds) => {
    if (socketConnected && userIds.length > 0) {
      console.log("📡 Requesting status for users:", userIds);
      socket.emit("requestUserStatus", userIds);
    }
  };

  const handleManualReconnect = () => {
    setConnectionError(null);
    if (!socket.connected) {
      socket.connect();
    }
  };

  // Theme selector component with improved layout
  const ThemeSelector = () => (
    <AnimatePresence>
      {showThemePicker && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-16 right-4 bg-black/90 backdrop-blur-md rounded-xl p-4 shadow-2xl border border-white/20 z-30 max-w-xs"
        >
          <h4 className="text-white font-semibold mb-3">Chat Themes</h4>
          <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
            {CHAT_THEMES.map((theme) => (
              <motion.button
                key={theme.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setCurrentTheme(theme.id);
                  setShowThemePicker(false);
                }}
                className={`relative w-12 h-12 rounded-lg ${
                  theme.background
                } border-2 ${
                  currentTheme === theme.id
                    ? "border-yellow-400 ring-2 ring-yellow-200"
                    : "border-white/20"
                }`}
                title={theme.name}
              >
                <span className="absolute -top-2 -right-2 text-xs bg-black/50 rounded-full w-4 h-4 flex items-center justify-center">
                  {currentTheme === theme.id ? "✓" : ""}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Socket event handlers
  const handleMessagePinned = (data) => {
    if (selectedChat && data.chatId === selectedChat._id) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId
            ? {
                ...msg,
                isPinned: true,
                pinnedBy: data.pinnedBy,
                pinnedAt: data.pinnedAt,
              }
            : msg
        )
      );

      setPinnedMessages((prev) => {
        const currentPinned = Array.isArray(prev) ? prev : [];
        const filtered = currentPinned.filter(
          (msg) => msg._id !== data.messageId
        );

        const pinnedMsg = {
          _id: data.messageId,
          text: `Pinned message`,
          isPinned: true,
          pinnedBy: data.pinnedBy,
          pinnedAt: data.pinnedAt,
        };
        return [...filtered, pinnedMsg];
      });
    }
  };

  const handleMessageUnpinned = (data) => {
    if (selectedChat && data.chatId === selectedChat._id) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId
            ? { ...msg, isPinned: false, pinnedBy: null, pinnedAt: null }
            : msg
        )
      );

      setPinnedMessages((prev) =>
        prev.filter((msg) => msg._id !== data.messageId)
      );
    }
  };

  const handleOnlineUsers = (userIds) => {
    console.log("📱 Received online users:", userIds);
    setOnlineUsers(new Set(userIds));
  };

  const handleUserOnline = (userId) => {
    console.log("🟢 User came online:", userId);
    setOnlineUsers((prev) => new Set([...prev, userId]));
  };

  const handleUserOffline = (userId) => {
    console.log("🔴 User went offline:", userId);
    setOnlineUsers((prev) => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
  };

  const handleUserStatuses = (statusMap) => {
    console.log("📊 Received user statuses:", statusMap);
    const onlineUserIds = Object.keys(statusMap).filter(
      (userId) => statusMap[userId].isOnline
    );
    setOnlineUsers((prev) => {
      const newSet = new Set(prev);
      // Add online users
      onlineUserIds.forEach((userId) => newSet.add(userId));
      // Remove users that are offline
      Object.keys(statusMap).forEach((userId) => {
        if (!statusMap[userId].isOnline) {
          newSet.delete(userId);
        }
      });
      return newSet;
    });
  };

  // Utility functions
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString();
  };

  const selectChat = async (chat) => {
    try {
      setSelectedChat(chat);
      const token = localStorage.getItem("kobutor_token");
      const res = await fetch(
        `https://kobutor.onrender.com/api/chats/${chat._id}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch messages");

      const data = await res.json();
      setMessages(data);
      socket.emit("joinChat", chat._id);
      markMessagesAsRead(data);

      // Fetch pinned messages for this chat
      try {
        const pinnedRes = await fetch(
          `https://kobutor.onrender.com/api/chats/${chat._id}/pinned-messages`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (pinnedRes.ok) {
          const pinnedData = await pinnedRes.json();
          setPinnedMessages(Array.isArray(pinnedData) ? pinnedData : []);
        } else {
          console.log(
            "Pinned messages endpoint returned error:",
            pinnedRes.status
          );
          setPinnedMessages([]);
        }
      } catch (pinnedError) {
        console.log("Error fetching pinned messages:", pinnedError);
        setPinnedMessages([]);
      }

      // Request status for ALL chat participants, not just the current one
      const allParticipantIds = Array.from(chatParticipants);
      if (allParticipantIds.length > 0) {
        requestUserStatuses(allParticipantIds);
      }
    } catch (error) {
      console.error("Error selecting chat:", error);
      setPinnedMessages([]);
    }
  };

  const markMessagesAsRead = async (messagesToMark) => {
    try {
      const unreadMessages = messagesToMark.filter(
        (msg) =>
          (msg.sender._id || msg.sender) !== currentUserId &&
          !msg.readBy?.includes(currentUserId)
      );

      if (unreadMessages.length > 0 && selectedChat) {
        const messageIds = unreadMessages.map((msg) => msg._id);
        const token = localStorage.getItem("kobutor_token");

        await fetch(
          `https://kobutor.onrender.com/api/chats/${selectedChat._id}/read`,
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

  let typingTimeout;
  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!typing && selectedChat) {
      setTyping(true);
      socket.emit("typing", { chatId: selectedChat._id });
    }

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      if (selectedChat) {
        socket.emit("stopTyping", { chatId: selectedChat._id });
      }
      setTyping(false);
    }, 2000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const token = localStorage.getItem("kobutor_token");
      const res = await fetch(
        `https://kobutor.onrender.com/api/chats/${selectedChat._id}/messages`,
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

      setNewMessage("");
      socket.emit("stopTyping", { chatId: selectedChat._id });
      setTyping(false);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleToggleReaction = async (messageId, emoji) => {
    const message = messages.find((m) => m._id === messageId);
    if (!message || !message.reactions) return;

    let hasReacted = false;
    const reaction = message.reactions[emoji];

    if (reaction) {
      if (Array.isArray(reaction)) {
        hasReacted = reaction.includes(currentUserId);
      } else if (reaction.users) {
        hasReacted = reaction.users.includes(currentUserId);
      }
    }

    try {
      const token = localStorage.getItem("kobutor_token");
      const res = await fetch(
        `https://kobutor.onrender.com/api/chats/${selectedChat._id}/messages/${messageId}/react`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ emoji }),
        }
      );

      if (res.ok) {
        const updatedData = await res.json();
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId
              ? { ...msg, reactions: updatedData.reactions }
              : msg
          )
        );

        socket.emit("messageReaction", {
          chatId: selectedChat._id,
          messageId,
          reactions: updatedData.reactions,
        });
      }
    } catch (error) {
      console.error("Error toggling reaction:", error);
    }
    setShowReactionPicker(null);
  };

  const handleDeleteChat = async () => {
    try {
      const token = localStorage.getItem("kobutor_token");
      const res = await fetch(
        `https://kobutor.onrender.com/api/chats/${selectedChat._id}`,
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

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Fetch chats
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("kobutor_token");
        const res = await fetch("https://kobutor.onrender.com/api/chats", {
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

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem("kobutor_token");
    if (!token) navigate("/login");
  }, [navigate]);

  // Socket auth
  useEffect(() => {
    const token = localStorage.getItem("kobutor_token");
    if (token) {
      socket.emit("authenticate", token);
    }
  }, [socket]);

  // Comprehensive socket event listeners
  useEffect(() => {
    const handleReceiveMessage = (message) => {
      if (selectedChat && message.chatId === selectedChat._id) {
        setMessages((prev) => [...prev, { ...message, animate: true }]);

        setTimeout(() => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg._id === message._id ? { ...msg, animate: false } : msg
            )
          );
        }, 1000);
      }
    };

    const handleTyping = (data) => {
      if (selectedChat && data.chatId === selectedChat._id) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = (data) => {
      if (selectedChat && data.chatId === selectedChat._id) {
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

    const handleMessageReaction = (data) => {
      if (selectedChat && data.chatId === selectedChat._id) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === data.messageId
              ? { ...msg, reactions: data.reactions }
              : msg
          )
        );
      }
    };

    const handleMessagesRead = (data) => {
      if (selectedChat && data.chatId === selectedChat._id) {
        setMessages((prev) =>
          prev.map((msg) =>
            data.messageIds.includes(msg._id)
              ? {
                  ...msg,
                  readBy: [...(msg.readBy || []), data.readBy],
                  isRead: true,
                }
              : msg
          )
        );
      }
    };

    // Add all socket event listeners
    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    socket.on("chatDeleted", handleChatDeleted);
    socket.on("messageReaction", handleMessageReaction);
    socket.on("messagesRead", handleMessagesRead);

    // Add the new pin/unpin and online/offline events
    socket.on("messagePinned", handleMessagePinned);
    socket.on("messageUnpinned", handleMessageUnpinned);
    socket.on("onlineUsers", handleOnlineUsers);
    socket.on("userOnline", handleUserOnline);
    socket.on("userOffline", handleUserOffline);
    socket.on("userStatuses", handleUserStatuses);

    return () => {
      // Clean up all event listeners
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      socket.off("chatDeleted", handleChatDeleted);
      socket.off("messageReaction", handleMessageReaction);
      socket.off("messagesRead", handleMessagesRead);
      socket.off("messagePinned", handleMessagePinned);
      socket.off("messageUnpinned", handleMessageUnpinned);
      socket.off("onlineUsers", handleOnlineUsers);
      socket.off("userOnline", handleUserOnline);
      socket.off("userOffline", handleUserOffline);
      socket.off("userStatuses", handleUserStatuses);
    };
  }, [selectedChat, socket, messages]);

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
        {/* Outer container with theme background */}
        <div
          className={`max-w-7xl mx-auto h-full rounded-xl overflow-hidden ${theme.background}`}
        >
          {/* Inner container with theme border */}
          <div
            className={`w-full h-full backdrop-blur-md bg-black/40 flex flex-col ${theme.border} shadow-lg`}
          >
            {/* Header with theme gradient */}
            <div
              className={`p-4 border-b border-white/20 flex justify-between items-center bg-gradient-to-r ${theme.header}`}
            >
              <h1 className="text-2xl font-bold flex items-center">
                <span className="mr-2">💬</span> Pigeon Chat
              </h1>

              <div className="flex items-center space-x-4">
                {isTyping && (
                  <span className="text-sm text-yellow-400 flex items-center">
                    <span className="animate-pulse mr-1">✍️</span> Typing...
                  </span>
                )}

                <button
                  onClick={() => setShowThemePicker(!showThemePicker)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all"
                  title="Change theme"
                >
                  🎨
                </button>

                <ThemeSelector />
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Chat list */}
              <div className="w-1/3 border-r border-white/20 overflow-y-auto bg-black/30">
                {loading ? (
                  <div className="p-4 text-center text-white/60 flex flex-col items-center">
                    <div className="animate-bounce text-2xl mb-2">🐦</div>
                    <p>Loading chats...</p>
                  </div>
                ) : activeChats.length > 0 ? (
                  activeChats.map((chat, index) => {
                    const otherParticipant = chat.participants.find(
                      (p) => p._id !== currentUserId
                    );
                    const avatar = generateAvatar(
                      otherParticipant?._id,
                      otherParticipant?.username
                    );
                    const isOnline = onlineUsers.has(otherParticipant?._id);

                    return (
                      <div
                        key={`${chat._id}-${index}`}
                        onClick={() => selectChat(chat)}
                        className={`p-3 cursor-pointer flex items-center transition-all duration-200 ${
                          selectedChat?._id === chat._id
                            ? "bg-yellow-400/20 border-r-2 border-yellow-400"
                            : "hover:bg-white/10"
                        }`}
                      >
                        <div className="relative">
                          <div
                            className={`w-10 h-10 rounded-full bg-gradient-to-r ${avatar.gradient} flex items-center justify-center text-lg mr-3 shadow-md`}
                          >
                            {avatar.emoji}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            {otherParticipant?.username || "Anonymous Pigeon"}
                          </h3>
                          <p className="text-sm text-white/70 truncate">
                            {chat.lastMessage || "Start a conversation..."}
                          </p>
                          <StatusIndicator
                            isOnline={isOnline}
                            isTyping={false}
                          />
                        </div>
                        {chat.unreadCount > 0 && (
                          <span className="bg-yellow-400 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center ml-2">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-white/60 flex flex-col items-center">
                    <div className="text-4xl mb-4">📭</div>
                    <p className="mb-2">No active chats yet</p>
                    <p className="text-sm mb-4">
                      Release pigeons to connect with others
                    </p>
                    <button
                      onClick={() => navigate("/release")}
                      className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-2 rounded-full text-sm font-semibold hover:from-yellow-300 hover:to-orange-400 transition-all shadow-md"
                    >
                      ✨ Release a Pigeon
                    </button>
                  </div>
                )}
              </div>

              {/* Messages area */}
              <div className="flex-1 flex flex-col bg-chat-pattern">
                {selectedChat ? (
                  <>
                    <div
                      className={`p-4 border-b border-white/20 flex justify-between items-center bg-gradient-to-r ${theme.header}`}
                    >
                      <div className="flex items-center">
                        {(() => {
                          const otherParticipant =
                            selectedChat.participants.find(
                              (p) => p._id !== currentUserId
                            );
                          const avatar = generateAvatar(
                            otherParticipant?._id,
                            otherParticipant?.username
                          );
                          const isOnline = onlineUsers.has(
                            otherParticipant?._id
                          );

                          return (
                            <div className="relative">
                              <div
                                className={`w-10 h-10 rounded-full bg-gradient-to-r ${avatar.gradient} flex items-center justify-center text-lg mr-3 shadow-md`}
                              >
                                {avatar.emoji}
                              </div>
                            </div>
                          );
                        })()}
                        <div>
                          <h3 className="font-semibold text-white">
                            {selectedChat.participants.find(
                              (p) => p._id !== currentUserId
                            )?.username || "Anonymous Pigeon"}
                          </h3>
                          <StatusIndicator
                            isOnline={onlineUsers.has(
                              selectedChat.participants.find(
                                (p) => p._id !== currentUserId
                              )?._id
                            )}
                            isTyping={isTyping}
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-red-400 hover:text-red-300 p-2 transition-transform hover:scale-110"
                        title="Delete chat"
                      >
                        🗑️
                      </button>
                    </div>

                    {/* Pinned Messages Section */}
                    {pinnedMessages.length > 0 && (
                      <div className="p-2 border-b border-white/20 bg-yellow-400/10">
                        <div className="flex items-center text-yellow-400 text-sm mb-2 px-2">
                          <span>📌</span>
                          <span className="ml-2">Pinned Messages</span>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {pinnedMessages.map((msg) => (
                            <div
                              key={msg._id}
                              className="text-xs bg-black/30 rounded p-2 truncate flex justify-between items-center"
                            >
                              <span>{msg.text}</span>
                              <button
                                onClick={() => handleUnpinMessage(msg._id)}
                                className="text-xs p-1 hover:bg-black/20 rounded"
                                title="Unpin message"
                              >
                                ❌
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 messages-container">
                      {messages.map((msg, idx) => {
                        const showDate =
                          idx === 0 ||
                          formatDate(messages[idx - 1].createdAt) !==
                            formatDate(msg.createdAt);
                        const isOwnMessage =
                          (msg.sender._id || msg.sender) === currentUserId;

                        return (
                          <MessageBubble
                            key={`${msg._id}-${idx}`}
                            message={msg}
                            isOwnMessage={isOwnMessage}
                            showDate={showDate}
                          />
                        );
                      })}

                      {isTyping && (
                        <div className="flex justify-start items-end space-x-2">
                          <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-cyan-500 flex items-center justify-center text-sm shadow-md">
                              💬
                            </div>
                          </div>
                          <div
                            className={`bg-gradient-to-r ${theme.otherChatBox} text-white rounded-2xl rounded-bl-none px-4 py-3 shadow-md`}
                          >
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-white/80 rounded-full animate-bounce"></div>
                              <div
                                className="w-2 h-2 bg-white/80 rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-white/80 rounded-full animate-bounce"
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
                      className="p-4 border-t border-white/20 bg-black/30"
                    >
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={handleTyping}
                          placeholder="Type your message..."
                          className="flex-1 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                        />
                        <button
                          type="submit"
                          disabled={!newMessage.trim()}
                          className={`bg-gradient-to-r ${theme.chatBox} text-black w-10 h-10 rounded-full flex items-center justify-center hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:scale-105`}
                        >
                          ➤
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-white/60">
                    <div className="text-center">
                      <div className="text-6xl mb-4 animate-float">📨</div>
                      <h3 className="text-xl mb-2 font-semibold">
                        Select a chat to start messaging
                      </h3>
                      <p className="opacity-75">
                        Connect with fellow pigeon enthusiasts
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4 border border-yellow-400/30">
            <h3 className="text-xl font-bold mb-4 text-black dark:text-white flex items-center">
              <span className="mr-2">🗑️</span> Delete Chat?
            </h3>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              This will remove the chat from your inbox. The other person will
              still be able to see the messages.
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteChat}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />

      <style>{`
        @keyframes float {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        
        .animate-float { animation: float 3s ease-in-out infinite; }
        
        .bg-chat-pattern { 
          background-image: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.03' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E");
        }
        
        .messages-container {
          scroll-behavior: smooth;
        }
        
        .messages-container::-webkit-scrollbar {
          width: 6px;
        }
        
        .messages-container::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
        }
        
        .messages-container::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.3);
          border-radius: 3px;
        }
        
        .messages-container::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.5);
        }
      `}</style>
    </div>
  );
}

export default Chat;
