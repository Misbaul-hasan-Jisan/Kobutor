import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import Header from "../components/header";
import Footer from "../components/Footer";
import DarkButton from "../components/darkbutton";
import background from "../assets/homebg.png";
import backgroundDark from "../assets/homebg-dark.png";

const API = import.meta.env.VITE_API_BASE_URL;

// Initialize socket
let socketInstance = null;

const getSocket = () => {
  if (!socketInstance) {
    console.log("🆕 Creating new socket instance");
    socketInstance = io(`${API}`, {
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

// Pigeon Gifting System
const PIGEON_GIFTS = {
  SEEDS: { emoji: '🌱', name: 'Pigeon Seeds', cost: 10, description: 'A tasty treat for your feathered friend' },
  GRAIN: { emoji: '🌾', name: 'Golden Grain', cost: 25, description: 'Premium nutrition for happy pigeons' },
  GOLD: { emoji: '🥇', name: 'Gold Medal', cost: 100, description: 'Award your champion pigeon' },
  HEART: { emoji: '💝', name: 'Pigeon Heart', cost: 50, description: 'Show your pigeon some love' },
  CROWN: { emoji: '👑', name: 'Pigeon Crown', cost: 150, description: 'Royal treatment for your pigeon' }
};

// Chat Achievements
const CHAT_ACHIEVEMENTS = {
  FIRST_MESSAGE: { emoji: '✉️', name: 'First Pigeon', description: 'Send your first message' },
  CHAT_MASTER: { emoji: '🏆', name: 'Chat Champion', description: 'Send 100 messages' },
  REACTION_KING: { emoji: '❤️', name: 'Reaction Pro', description: 'Get 50 reactions on your messages' },
  PIGEON_TAMER: { emoji: '🕊️', name: 'Pigeon Tamer', description: 'Chat with 10 different users' },
  EARLY_BIRD: { emoji: '🌅', name: 'Early Bird', description: 'Send messages at 5 AM' }
};

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
  {
    id: "nature",
    name: "Nature",
    background: "bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900",
    chatBox: "from-green-400 to-emerald-500",
    otherChatBox: "from-teal-400 to-cyan-500",
    header: "from-green-400/10 to-transparent",
    border: "border-green-400/30",
  },
  {
    id: "sunset",
    name: "Sunset",
    background: "bg-gradient-to-br from-orange-900 via-red-800 to-pink-900",
    chatBox: "from-orange-400 to-red-500",
    otherChatBox: "from-pink-400 to-rose-500",
    header: "from-orange-400/10 to-transparent",
    border: "border-orange-400/30",
  },
  {
    id: "ocean",
    name: "Ocean",
    background: "bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900",
    chatBox: "from-cyan-400 to-blue-500",
    otherChatBox: "from-indigo-400 to-purple-500",
    header: "from-cyan-400/10 to-transparent",
    border: "border-cyan-400/30",
  },
  {
    id: "midnight",
    name: "Midnight",
    background: "bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900",
    chatBox: "from-gray-400 to-blue-400",
    otherChatBox: "from-indigo-400 to-purple-400",
    header: "from-gray-400/10 to-transparent",
    border: "border-gray-400/30",
  },
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

// Mobile Chat Header with Swipe Indicator
const MobileChatHeader = ({ username, isOnline, onBack, showSwipeHint, onProfileClick }) => (
  <motion.div 
    className="lg:hidden p-4 border-b border-white/20 bg-black/60 backdrop-blur-md flex items-center justify-between"
    initial={{ y: -10 }}
    animate={{ y: 0 }}
  >
    <div className="flex items-center space-x-3">
      <button
        onClick={onBack}
        className="p-2 hover:bg-white/10 rounded-lg transition-all"
      >
        ←
      </button>
      <button 
        onClick={onProfileClick}
        className="flex items-center space-x-3"
      >
        <div>
          <h3 className="font-semibold text-white text-left">{username}</h3>
          <StatusIndicator isOnline={isOnline} isTyping={false} />
        </div>
      </button>
    </div>
    {showSwipeHint && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-xs text-yellow-400 flex items-center"
      >
        👆 Tap for info
      </motion.div>
    )}
  </motion.div>
);

// User Profile Drawer for Mobile
const UserProfileDrawer = ({ user, isOpen, onClose, isOnline, onSendGift }) => {
  const avatar = generateAvatar(user?._id, user?.username);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl rounded-t-3xl z-50 lg:hidden border-t border-white/20 p-6 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Pigeon Profile</h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-full transition-all"
              >
                ✕
              </button>
            </div>
            
            <div className="text-center mb-6">
              <div className={`w-20 h-20 rounded-full bg-gradient-to-r ${avatar.gradient} flex items-center justify-center text-2xl mx-auto mb-4 shadow-lg`}>
                {avatar.emoji}
              </div>
              <h4 className="text-white font-semibold text-lg">
                {user?.username || "Anonymous Pigeon"}
              </h4>
              <div className="flex items-center justify-center space-x-2 mt-2">
                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
                <span className="text-sm text-gray-300">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-black/30 rounded-xl p-4">
                <h5 className="text-white font-semibold mb-3">Chat Stats</h5>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-yellow-400 font-bold text-lg">24</div>
                    <div className="text-gray-400 text-xs">Messages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-400 font-bold text-lg">3</div>
                    <div className="text-gray-400 text-xs">Pigeons</div>
                  </div>
                  <div className="text-center">
                    <div className="text-blue-400 font-bold text-lg">12</div>
                    <div className="text-gray-400 text-xs">Reactions</div>
                  </div>
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-4">
                <h5 className="text-white font-semibold mb-3">Send a Gift</h5>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(PIGEON_GIFTS).slice(0, 4).map(([key, gift]) => (
                    <motion.button
                      key={key}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onSendGift(key)}
                      className="bg-yellow-400/20 text-yellow-400 py-2 rounded-lg font-semibold hover:bg-yellow-400/30 transition-all flex items-center justify-center space-x-2"
                    >
                      <span>{gift.emoji}</span>
                      <span className="text-xs">{gift.cost}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <button className="w-full bg-red-500/20 text-red-400 py-3 rounded-xl font-semibold hover:bg-red-500/30 transition-all flex items-center justify-center space-x-2">
                <span>🚫</span>
                <span>Block Pigeon</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Quick Reactions Bar for Mobile
const QuickReactionsBar = ({ onReaction, isVisible }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-20 left-4 right-4 bg-black/90 backdrop-blur-md rounded-2xl p-3 border border-white/20 z-30 lg:hidden"
      >
        <div className="flex justify-between items-center mb-2">
          <span className="text-white text-sm font-semibold">Quick React</span>
          <span className="text-xs text-gray-400">Tap to send</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {REACTION_GROUPS[0].map((emoji) => (
            <motion.button
              key={emoji}
              whileTap={{ scale: 0.8 }}
              onClick={() => onReaction(emoji)}
              className="text-2xl p-2 hover:bg-white/10 rounded-xl transition-all active:scale-95"
            >
              {emoji}
            </motion.button>
          ))}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

// Connection Status Banner
const ConnectionStatus = ({ isConnected, onReconnect }) => (
  <AnimatePresence>
    {!isConnected && (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-red-500/20 border border-red-400/30 text-red-400 px-4 py-2 text-sm text-center backdrop-blur-md"
      >
        <div className="flex items-center justify-center space-x-2">
          <span>🔌</span>
          <span>Connection lost</span>
          <button
            onClick={onReconnect}
            className="underline hover:text-red-300 transition-colors"
          >
            Reconnect
          </button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

// Gift Sending Modal
const GiftModal = ({ isOpen, onClose, onSendGift, recipient }) => {
  const [selectedGift, setSelectedGift] = useState(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-yellow-400/30"
      >
        <h3 className="text-xl font-bold mb-4 text-black dark:text-white flex items-center">
          <span className="mr-2">🎁</span> Send a Pigeon Gift
        </h3>
        
        <div className="grid grid-cols-2 gap-3 mb-6">
          {Object.entries(PIGEON_GIFTS).map(([key, gift]) => (
            <motion.button
              key={key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedGift(key)}
              className={`p-3 rounded-xl border-2 transition-all ${
                selectedGift === key
                  ? 'border-yellow-400 bg-yellow-400/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-yellow-400'
              }`}
            >
              <div className="text-2xl mb-1">{gift.emoji}</div>
              <div className="text-sm font-semibold text-black dark:text-white">{gift.name}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">{gift.cost} coins</div>
            </motion.button>
          ))}
        </div>

        {selectedGift && (
          <div className="bg-yellow-400/10 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              {PIGEON_GIFTS[selectedGift].description}
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSendGift(selectedGift);
              onClose();
            }}
            disabled={!selectedGift}
            className="px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            Send Gift
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Achievement Unlocked Modal
const AchievementModal = ({ achievement, isOpen, onClose }) => {
  if (!isOpen || !achievement) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-6 max-w-sm w-full text-center text-white shadow-2xl"
      >
        <div className="text-6xl mb-4 animate-bounce">{achievement.emoji}</div>
        <h3 className="text-2xl font-bold mb-2">Achievement Unlocked!</h3>
        <h4 className="text-xl font-semibold mb-2">{achievement.name}</h4>
        <p className="text-yellow-100 mb-4">{achievement.description}</p>
        <button
          onClick={onClose}
          className="bg-white text-yellow-600 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition-colors"
        >
          Awesome!
        </button>
      </motion.div>
    </div>
  );
};

// Theme Selector Component
const ThemeSelector = ({ showThemePicker, setShowThemePicker, currentTheme, setCurrentTheme }) => (
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
  
  // New mobile states
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showQuickReactions, setShowQuickReactions] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState(null);
  const [mobileView, setMobileView] = useState('chats');
  const [showSwipeHint, setShowSwipeHint] = useState(true);

  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const { chatId: initialChatId } = useParams();
  const currentUser = JSON.parse(localStorage.getItem("kobutor_user"));
  const currentUserId = currentUser?.id || currentUser?._id;

  const socket = getSocket();

  // Auto-hide swipe hint
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSwipeHint(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Mobile view handler
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        if (selectedChat) {
          setMobileView('messages');
        } else {
          setMobileView('chats');
        }
      } else {
        setMobileView('chats');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedChat]);

  // Socket connection management
  useEffect(() => {
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

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);

    if (!socket.connected) {
      console.log("🔄 Connecting socket from component...");
      socket.connect();
    } else {
      setSocketConnected(true);
    }

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
      socket.emit("getOnlineUsers");
    }
  }, [socketConnected, currentUserId, socket]);

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
      socket.emit("authenticate", token);

      socket.once("authenticated", () => {
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

    if (allParticipants.size > 0) {
      requestUserStatuses(Array.from(allParticipants));
    }
  }, [activeChats, currentUserId]);

  // Enhanced Message Bubble Component for mobile
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
            {message.isGift && (
              <div className="text-center mb-2">
                <span className="text-2xl">{message.giftEmoji}</span>
                <p className="text-xs text-yellow-600 font-semibold">Sent a gift!</p>
              </div>
            )}
            
            <p className="mb-1 leading-relaxed break-words">{message.text}</p>

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

  // Mobile Back Handler
  const handleMobileBack = () => {
    setSelectedChat(null);
    setMobileView('chats');
  };

  // Quick reaction handler
  const handleQuickReaction = (emoji) => {
    if (selectedChat && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender._id !== currentUserId) {
        handleToggleReaction(lastMessage._id, emoji);
      }
    }
    setShowQuickReactions(false);
  };

  // Gift sending handler
  const handleSendGift = async (giftType) => {
    if (!selectedChat) return;

    try {
      const token = localStorage.getItem("kobutor_token");
      const gift = PIGEON_GIFTS[giftType];
      
      const res = await fetch(
        `${API}/api/chats/${selectedChat._id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            text: `Sent a ${gift.name} gift! ${gift.emoji}`,
            isGift: true,
            giftType: giftType,
            giftEmoji: gift.emoji
          }),
        }
      );

      if (res.ok) {
        setNewMessage("");
        // Show achievement if it's the first gift
        if (!localStorage.getItem('sent_first_gift')) {
          setCurrentAchievement(CHAT_ACHIEVEMENTS.FIRST_MESSAGE);
          setShowAchievement(true);
          localStorage.setItem('sent_first_gift', 'true');
        }
      }
    } catch (error) {
      console.error("Error sending gift:", error);
    }
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
        `${API}/api/chats/${chat._id}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch messages");

      const data = await res.json();
      setMessages(data);
      socket.emit("joinChat", chat._id);
      markMessagesAsRead(data);

      // Fetch pinned messages
      try {
        const pinnedRes = await fetch(
          `${API}/api/chats/${chat._id}/pinned-messages`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (pinnedRes.ok) {
          const pinnedData = await pinnedRes.json();
          setPinnedMessages(Array.isArray(pinnedData) ? pinnedData : []);
        } else {
          setPinnedMessages([]);
        }
      } catch (pinnedError) {
        console.log("Error fetching pinned messages:", pinnedError);
        setPinnedMessages([]);
      }

      // Set mobile view
      if (window.innerWidth < 1024) {
        setMobileView('messages');
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
          `${API}/api/chats/${selectedChat._id}/read`,
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
        `${API}/api/chats/${selectedChat._id}/messages`,
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

      // Show achievement for first message
      if (!localStorage.getItem('sent_first_message')) {
        setCurrentAchievement(CHAT_ACHIEVEMENTS.FIRST_MESSAGE);
        setShowAchievement(true);
        localStorage.setItem('sent_first_message', 'true');
      }
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
        `${API}/api/chats/${selectedChat._id}/messages/${messageId}/react`,
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
        `${API}/api/chats/${selectedChat._id}`,
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
        setMobileView('chats');
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  const requestUserStatuses = (userIds) => {
    if (socketConnected && userIds.length > 0) {
      socket.emit("requestUserStatus", userIds);
    }
  };

  const handleManualReconnect = () => {
    setConnectionError(null);
    if (!socket.connected) {
      socket.connect();
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
        const res = await fetch(`${API}/api/chats`, {
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

  // Socket event listeners
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

    const handleOnlineUsers = (userIds) => {
      setOnlineUsers(new Set(userIds));
    };

    const handleUserOnline = (userId) => {
      setOnlineUsers((prev) => new Set([...prev, userId]));
    };

    const handleUserOffline = (userId) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    socket.on("messageReaction", handleMessageReaction);
    socket.on("onlineUsers", handleOnlineUsers);
    socket.on("userOnline", handleUserOnline);
    socket.on("userOffline", handleUserOffline);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      socket.off("messageReaction", handleMessageReaction);
      socket.off("onlineUsers", handleOnlineUsers);
      socket.off("userOnline", handleUserOnline);
      socket.off("userOffline", handleUserOffline);
    };
  }, [selectedChat, socket]);

  return (
    <div
      className="w-screen min-h-screen bg-cover bg-center text-white flex flex-col transition-all duration-500"
      style={{
        backgroundImage: `url(${isDark ? backgroundDark : background})`,
      }}
    >
      <Header />
      <DarkButton isDark={isDark} setIsDark={setIsDark} />

      <ConnectionStatus 
        isConnected={socketConnected} 
        onReconnect={handleManualReconnect}
      />

      <div className="container mx-auto px-0 lg:px-4 py-1 pt-10 h-[calc(100vh-80px)]">
        {/* Mobile Navigation */}
        <div className="lg:hidden flex border-b border-white/20 bg-black/40">
          <button
            onClick={() => setMobileView('chats')}
            className={`flex-1 py-3 text-center font-semibold transition-all ${
              mobileView === 'chats' 
                ? 'bg-yellow-400 text-black' 
                : 'text-white/70 hover:text-white'
            }`}
          >
            💬 Chats
          </button>
          <button
            onClick={() => selectedChat && setMobileView('messages')}
            disabled={!selectedChat}
            className={`flex-1 py-3 text-center font-semibold transition-all ${
              mobileView === 'messages' 
                ? 'bg-yellow-400 text-black' 
                : 'text-white/70 hover:text-white disabled:opacity-50'
            }`}
          >
            ✉️ Messages
          </button>
        </div>

        <div
          className={`max-w-7xl mx-auto h-full rounded-none lg:rounded-xl overflow-hidden ${theme.background}`}
        >
          <div
            className={`w-full h-full backdrop-blur-md bg-black/40 flex flex-col ${theme.border} shadow-lg`}
          >
            {/* Desktop Header */}
            <div
              className={`p-4 border-b border-white/20 flex justify-between items-center bg-gradient-to-r ${theme.header} hidden lg:flex`}
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
                <ThemeSelector 
                  showThemePicker={showThemePicker}
                  setShowThemePicker={setShowThemePicker}
                  currentTheme={currentTheme}
                  setCurrentTheme={setCurrentTheme}
                />
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Chat list - Hidden on mobile when in messages view */}
              <div className={`
                ${mobileView === 'chats' ? 'flex' : 'hidden'} 
                lg:flex w-full lg:w-1/3 border-r border-white/20 overflow-y-auto bg-black/30 flex-col
              `}>
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
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-black ${
                            isOnline ? 'bg-green-400' : 'bg-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            {otherParticipant?.username || "Anonymous Pigeon"}
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
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-white/60 flex flex-col items-center justify-center h-full">
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
              <div className={`
                ${mobileView === 'messages' ? 'flex' : 'hidden'} 
                lg:flex flex-1 flex-col bg-chat-pattern relative
              `}>
                {selectedChat ? (
                  <>
                    <MobileChatHeader
                      username={selectedChat.participants.find(
                        (p) => p._id !== currentUserId
                      )?.username || "Anonymous Pigeon"}
                      isOnline={onlineUsers.has(
                        selectedChat.participants.find(
                          (p) => p._id !== currentUserId
                        )?._id
                      )}
                      onBack={handleMobileBack}
                      showSwipeHint={showSwipeHint}
                      onProfileClick={() => setShowUserProfile(true)}
                    />

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
                        <button
                          type="button"
                          onClick={() => setShowQuickReactions(!showQuickReactions)}
                          className="p-2 hover:bg-white/10 rounded-full transition-all"
                        >
                          😊
                        </button>
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

      {/* Mobile Components */}
      <UserProfileDrawer
        user={selectedChat?.participants.find(p => p._id !== currentUserId)}
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
        isOnline={onlineUsers.has(
          selectedChat?.participants.find(p => p._id !== currentUserId)?._id
        )}
        onSendGift={() => {
          setShowUserProfile(false);
          setShowGiftModal(true);
        }}
      />

      <QuickReactionsBar
        onReaction={handleQuickReaction}
        isVisible={showQuickReactions}
      />

      <GiftModal
        isOpen={showGiftModal}
        onClose={() => setShowGiftModal(false)}
        onSendGift={handleSendGift}
        recipient={selectedChat?.participants.find(p => p._id !== currentUserId)}
      />

      <AchievementModal
        achievement={currentAchievement}
        isOpen={showAchievement}
        onClose={() => setShowAchievement(false)}
      />

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
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
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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

        /* Mobile optimizations */
        @media (max-width: 1024px) {
          .container {
            padding-left: 0;
            padding-right: 0;
          }
          
          .messages-container {
            padding: 1rem;
          }
        }

        /* Improved touch targets for mobile */
        @media (max-width: 768px) {
          button, [role="button"] {
            min-height: 44px;
            min-width: 44px;
          }
          
          input, textarea {
            font-size: 16px; /* Prevents zoom on iOS */
          }
        }
      `}</style>
    </div>
  );
}

export default Chat;