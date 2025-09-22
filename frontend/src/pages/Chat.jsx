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

// Reaction emojis
const REACTIONS = ["❤️", "😂", "😮", "😢", "😡", "👍", "👎", "🎉"];

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
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const { chatId: initialChatId } = useParams();
  const currentUser = JSON.parse(localStorage.getItem("kobutor_user"));
  const currentUserId = currentUser?.id || currentUser?._id;

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

    // In your socket useEffect, update the handleMessageReaction function:
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

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    socket.on("chatDeleted", handleChatDeleted);
    socket.on("messageReaction", handleMessageReaction);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      socket.off("chatDeleted", handleChatDeleted);
      socket.off("messageReaction", handleMessageReaction);
    };
  }, [selectedChat, socket]);

  useEffect(() => {
  if (!selectedChat || messages.length === 0) return;

  const unreadMessages = messages.filter(
    (msg) =>
      (msg.sender._id || msg.sender) !== currentUserId &&
      !msg.readBy?.includes(currentUserId)
  );

  if (unreadMessages.length === 0) return;

  const timer = setTimeout(() => {
    markMessagesAsRead(unreadMessages);
  }, 500); // wait 500ms before sending

  return () => clearTimeout(timer);
}, [messages, selectedChat, currentUserId]);


  // Add this socket listener for read receipts
  useEffect(() => {
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

    socket.on("messagesRead", handleMessagesRead);

    return () => {
      socket.off("messagesRead", handleMessagesRead);
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
          (msg.sender._id || msg.sender) !== currentUserId &&
          !msg.readBy?.includes(currentUserId)
      );

      if (unreadMessages.length > 0 && selectedChat) {
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

      setNewMessage("");
      socket.emit("stopTyping", { chatId: selectedChat._id });
      setTyping(false);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Update handleAddReaction:
  // const handleAddReaction = async (messageId, emoji) => {
  //   try {
  //     const token = localStorage.getItem("kobutor_token");
  //     const res = await fetch(
  //       `http://localhost:3000/api/chats/${selectedChat._id}/messages/${messageId}/react`,
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `Bearer ${token}`,
  //         },
  //         body: JSON.stringify({ emoji }),
  //       }
  //     );

  //     if (res.ok) {
  //       const updatedData = await res.json();
  //       setMessages((prev) =>
  //         prev.map((msg) =>
  //           msg._id === messageId
  //             ? { ...msg, reactions: updatedData.reactions }
  //             : msg
  //         )
  //       );

  //       socket.emit("messageReaction", {
  //         chatId: selectedChat._id,
  //         messageId,
  //         reactions: updatedData.reactions,
  //       });
  //     }
  //   } catch (error) {
  //     console.error("Error adding reaction:", error);
  //   }
  //   setShowReactionPicker(null);
  // };

  // // Update handleRemoveReaction:
  // const handleRemoveReaction = async (messageId, emoji) => {
  //   try {
  //     const token = localStorage.getItem("kobutor_token");
  //     const res = await fetch(
  //       `http://localhost:3000/api/chats/${selectedChat._id}/messages/${messageId}/react`,
  //       {
  //         method: "DELETE",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `Bearer ${token}`,
  //         },
  //         body: JSON.stringify({ emoji }),
  //       }
  //     );

  //     if (res.ok) {
  //       const updatedData = await res.json();
  //       setMessages((prev) =>
  //         prev.map((msg) =>
  //           msg._id === messageId
  //             ? { ...msg, reactions: updatedData.reactions }
  //             : msg
  //         )
  //       );

  //       socket.emit("messageReaction", {
  //         chatId: selectedChat._id,
  //         messageId,
  //         reactions: updatedData.reactions,
  //       });
  //     }
  //   } catch (error) {
  //     console.error("Error removing reaction:", error);
  //   }
  // };
  // Toggle reaction (add or remove)

  const handleToggleReaction = async (messageId, emoji) => {
    const message = messages.find((m) => m._id === messageId);
    if (!message || !message.reactions) return;

    // Check if user already reacted (handle both old and new formats)
    let hasReacted = false;
    const reaction = message.reactions[emoji];

    if (reaction) {
      if (Array.isArray(reaction)) {
        // Old format: reaction is an array of user IDs
        hasReacted = reaction.includes(currentUserId);
      } else if (reaction.users) {
        // New format: reaction is an object with users array
        hasReacted = reaction.users.includes(currentUserId);
      }
    }

    try {
      const token = localStorage.getItem("kobutor_token");
      const res = await fetch(
        `http://localhost:3000/api/chats/${selectedChat._id}/messages/${messageId}/react`,
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

        // Emit socket event to notify other users
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
        <div className="max-w-6xl mx-auto h-full bg-black/60 dark:bg-gray-900/80 backdrop-blur-md rounded-xl overflow-hidden flex flex-col border border-yellow-400/30 shadow-lg">
          <div className="p-4 border-b border-white/20 flex justify-between items-center bg-gradient-to-r from-yellow-400/10 to-transparent">
            <h1 className="text-2xl font-bold flex items-center">
              <span className="mr-2">💬</span> Pigeon Chat
            </h1>
            {isTyping && (
              <span className="text-sm text-yellow-400 flex items-center">
                <span className="animate-pulse mr-1">✍️</span> Typing...
              </span>
            )}
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
                activeChats.map((chat, index) => (
                  <div
                    key={`${chat._id}-${index}`}
                    onClick={() => selectChat(chat)}
                    className={`p-3 cursor-pointer flex items-center transition-all duration-200 ${
                      selectedChat?._id === chat._id
                        ? "bg-yellow-400/20 border-r-2 border-yellow-400"
                        : "hover:bg-white/10"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-xl mr-3 shadow-md">
                      🐦
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">
                        {chat.participants.find((p) => p._id !== currentUserId)
                          ?.username || "Anonymous Pigeon"}
                      </h3>
                      <p className="text-sm text-white/70 truncate">
                        {chat.lastMessage || "Start a conversation..."}
                      </p>
                    </div>
                    {chat.unreadCount > 0 && (
                      <span className="bg-yellow-400 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center ml-2">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                ))
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

            {/* Messages */}
            <div className="flex-1 flex flex-col bg-gradient-to-b from-black/40 to-black/20">
              {selectedChat ? (
                <>
                  <div className="p-4 border-b border-white/20 flex justify-between items-center bg-gradient-to-r from-yellow-400/10 to-transparent">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-lg mr-3 shadow-md">
                        🐦
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {selectedChat.participants.find(
                            (p) => p._id !== currentUserId
                          )?.username || "Anonymous Pigeon"}
                        </h3>
                        <p className="text-xs text-white/60">
                          Connected via pigeon message ✉️
                        </p>
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

                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-chat-pattern bg-repeat bg-contain bg-center bg-opacity-10">
                    {messages.map((msg, idx) => {
                      const showDate =
                        idx === 0 ||
                        formatDate(messages[idx - 1].createdAt) !==
                          formatDate(msg.createdAt);

                      const isOwnMessage =
                        (msg.sender._id || msg.sender) === currentUserId;
                      const isRead =
                        msg.readBy?.includes(currentUserId) || msg.isRead;

                      return (
                        <div key={`${msg._id}-${idx}`}>
                          {showDate && (
                            <div className="text-center text-xs text-white/60 my-4 px-3 py-1 bg-black/30 rounded-full inline-block">
                              {formatDate(msg.createdAt)}
                            </div>
                          )}
                          <div
                            className={`flex ${
                              isOwnMessage ? "justify-end" : "justify-start"
                            } group relative`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-lg transition-all duration-200 ${
                                isOwnMessage
                                  ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-br-none"
                                  : "bg-gradient-to-r from-blue-400 to-purple-500 text-white rounded-bl-none"
                              } group-hover:scale-105`}
                            >
                              <p className="mb-1">{msg.text}</p>

                              {/* Reactions */}
                              {msg.reactions &&
                                Object.keys(msg.reactions).length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-1">
                                    {Object.entries(msg.reactions).map(
                                      ([emoji, reactionData]) => {
                                        // Check if reactionData is an array (old format) or object (new format)
                                        const usersArray = Array.isArray(
                                          reactionData
                                        )
                                          ? reactionData
                                          : reactionData.users || [];

                                        const userReacted =
                                          usersArray.includes(currentUserId);
                                        const reactionCount = Array.isArray(
                                          reactionData
                                        )
                                          ? reactionData.length
                                          : reactionData.count ||
                                            usersArray.length;

                                        return (
                                          <button
                                            key={emoji}
                                            onClick={() =>
                                              handleToggleReaction(
                                                msg._id,
                                                emoji
                                              )
                                            }
                                            className={`px-1 rounded text-xs transition-all ${
                                              userReacted
                                                ? "bg-yellow-400 text-black"
                                                : "bg-black/20 hover:bg-black/30"
                                            }`}
                                            title={`${reactionCount} reaction${
                                              reactionCount !== 1 ? "s" : ""
                                            }`}
                                          >
                                            {emoji}{" "}
                                            {reactionCount > 1
                                              ? reactionCount
                                              : ""}
                                          </button>
                                        );
                                      }
                                    )}
                                  </div>
                                )}

                              <div className="flex justify-between items-center mt-1">
                                <span
                                  className={`text-xs ${
                                    isOwnMessage
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
                                <div className="flex items-center">
                                  {isOwnMessage && (
                                    <span className="text-xs mr-2">
                                      {isRead ? "✓✓" : "✓"}
                                    </span>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowReactionPicker(
                                        showReactionPicker === msg._id
                                          ? null
                                          : msg._id
                                      );
                                    }}
                                    className="opacity-0 group-hover:opacity-50 hover:opacity-100 transition-opacity text-xs"
                                  >
                                    😊
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Reaction Picker */}
                            {showReactionPicker === msg._id && (
                              <div className="absolute bg-black/90 rounded-full p-1 flex space-x-1 z-10 mt-8 shadow-lg border border-white/20">
                                {REACTIONS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleReaction(msg._id, emoji);
                                      setShowReactionPicker(null);
                                    }}
                                    className="hover:scale-125 transition-transform p-1"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-gradient-to-r from-blue-400 to-purple-500 text-white rounded-2xl rounded-bl-none px-4 py-2 shadow-md">
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
                        className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black w-10 h-10 rounded-full flex items-center justify-center hover:from-yellow-300 hover:to-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:scale-105"
                      >
                        ➤
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-white/60 bg-gradient-to-b from-black/40 to-black/20">
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
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .bg-chat-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E");
        }
      `}</style>
    </div>
  );
}

export default Chat;
