import { useState, useEffect, useRef } from 'react';
import background from '../assets/homebg.png';
import backgroundDark from '../assets/homebg-dark.png';
import Header from '../components/header';
import DarkButton from '../components/darkbutton';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

function Chat() {
  const [isDark, setIsDark] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeChats, setActiveChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Apply theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('kobutor_token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  // Sample data for demonstration
  useEffect(() => {
    // Mock active chats
    setActiveChats([
      { id: 1, name: 'Anonymous Pigeon', lastMessage: 'Hello there!', unread: 2, avatar: '🐦' },
      { id: 2, name: 'Sky Wanderer', lastMessage: 'How are you today?', unread: 0, avatar: '👤' },
      { id: 3, name: 'Message Hunter', lastMessage: 'Nice to meet you!', unread: 5, avatar: '🎯' },
    ]);

    // Mock messages for selected chat
    if (selectedChat) {
      setMessages([
        { id: 1, text: 'Hello there!', sender: 'other', timestamp: '10:30 AM' },
        { id: 2, text: 'Hi! How are you?', sender: 'me', timestamp: '10:31 AM' },
        { id: 3, text: 'I found your pigeon message. It was beautiful!', sender: 'other', timestamp: '10:32 AM' },
        { id: 4, text: 'Thank you! I\'m glad you liked it.', sender: 'me', timestamp: '10:33 AM' },
        { id: 5, text: 'Do you often release pigeons?', sender: 'other', timestamp: '10:35 AM' },
      ]);
    }
  }, [selectedChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    const message = {
      id: messages.length + 1,
      text: newMessage,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, message]);
    setNewMessage('');

    // Simulate response after a delay
    setTimeout(() => {
      const responses = [
        "That's interesting!",
        "Tell me more about that.",
        "I've never thought about it that way.",
        "Thanks for sharing!",
        "What made you think of that?"
      ];
      const response = {
        id: messages.length + 2,
        text: responses[Math.floor(Math.random() * responses.length)],
        sender: 'other',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, response]);
    }, 1000 + Math.random() * 2000);
  };

  const selectChat = (chat) => {
    setSelectedChat(chat);
    // Reset unread count for this chat
    setActiveChats(prev => prev.map(c => 
      c.id === chat.id ? { ...c, unread: 0 } : c
    ));
  };

  return (
    <>
      <div
        className="w-screen min-h-screen bg-cover bg-center text-white flex flex-col transition-all duration-500"
        style={{ backgroundImage: `url(${isDark ? backgroundDark : background})` }}
      >
        <Header />
        <DarkButton isDark={isDark} setIsDark={setIsDark} />

        <div className="container mx-auto px-4 py-1 pt-10 h-[calc(100vh-80px)]">
          <div className="max-w-6xl mx-auto h-full bg-black/60 dark:bg-gray-900/80 backdrop-blur-md rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/20">
              <h1 className="text-2xl font-bold text-white text-center">Pigeon Chat</h1>
              <p className="text-sm text-center text-white/70">Chat with people who found your messages</p>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Chat list sidebar */}
              <div className="w-1/3 border-r border-white/20 overflow-y-auto">
                <div className="p-3">
                  <input
                    type="text"
                    placeholder="Search chats..."
                    className="w-full px-3 py-2 rounded bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-yellow-400"
                  />
                </div>

                <div className="space-y-1 p-2">
                  {activeChats.map(chat => (
                    <div
                      key={chat.id}
                      onClick={() => selectChat(chat)}
                      className={`p-3 rounded cursor-pointer flex items-center ${
                        selectedChat?.id === chat.id
                          ? 'bg-yellow-400/20 border border-yellow-400/50'
                          : 'hover:bg-white/10'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xl mr-3">
                        {chat.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <h3 className="font-semibold text-white truncate">{chat.name}</h3>
                          {chat.unread > 0 && (
                            <span className="bg-yellow-400 text-black text-xs px-2 py-1 rounded-full">
                              {chat.unread}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white/70 truncate">{chat.lastMessage}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {activeChats.length === 0 && (
                  <div className="p-4 text-center text-white/60">
                    <p>No active chats yet</p>
                    <p className="text-sm mt-2">Start by releasing pigeons and connecting with those who find them</p>
                    <button
                      onClick={() => navigate('/release')}
                      className="mt-4 bg-yellow-400 text-black px-4 py-2 rounded text-sm font-semibold hover:bg-yellow-300"
                    >
                      Release a Pigeon
                    </button>
                  </div>
                )}
              </div>

              {/* Chat messages area */}
              <div className="flex-1 flex flex-col">
                {selectedChat ? (
                  <>
                    <div className="p-4 border-b border-white/20 flex items-center">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-lg mr-3">
                        {selectedChat.avatar}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{selectedChat.name}</h3>
                        <p className="text-xs text-white/60">Connected via pigeon message</p>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map(message => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                              message.sender === 'me'
                                ? 'bg-yellow-400 text-black rounded-br-none'
                                : 'bg-white/10 text-white rounded-bl-none'
                            }`}
                          >
                            <p>{message.text}</p>
                            <p className={`text-xs mt-1 ${message.sender === 'me' ? 'text-black/60' : 'text-white/60'}`}>
                              {message.timestamp}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="p-4 border-t border-white/20">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          className="flex-1 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-yellow-400"
                        />
                        <button
                          type="submit"
                          className="bg-yellow-400 text-black w-10 h-10 rounded-full flex items-center justify-center hover:bg-yellow-300"
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
                      <h3 className="text-xl mb-2">Select a chat to start messaging</h3>
                      <p>Connect with people who found your pigeon messages</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Chat;