import { useState, useEffect } from "react";
import {
  FiChevronDown,
  FiChevronUp,
  FiHome,
  FiMessageSquare,
  FiSearch,
} from "react-icons/fi";
import background from "../assets/homebg.png";
import backgroundDark from "../assets/homebg-dark.png";
import Header from "../components/header";
import DarkButton from "../components/darkbutton";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";

function FAQ() {
  const [isDark, setIsDark] = useState(false);
  const [activeCategory, setActiveCategory] = useState("general");
  const [openItems, setOpenItems] = useState({});
  const navigate = useNavigate();

  // Apply theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setIsDark(savedTheme === "dark");
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("kobutor_token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const toggleItem = (id) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const faqData = {
    general: [
      {
        id: "general-1",
        question: "What is Kobutor?",
        answer:
          'Kobutor (which means "Pigeon" in Bengali) is a messaging platform that lets you send anonymous messages through virtual pigeons. Release a pigeon with your message, and someone random in your selected location might find and read it.',
      },
      {
        id: "general-2",
        question: "Is Kobutor free to use?",
        answer:
          "Yes, Kobutor is completely free to use. You can release and hunt for pigeons without any cost.",
      },
      {
        id: "general-3",
        question: "How does the pigeon messaging work?",
        answer:
          'When you release a pigeon, your message is stored in our system with the location you selected. Other users can then "hunt" for pigeons in that location, and if they find yours, they can read your message and optionally respond through our chat system.',
      },
      {
        id: "general-4",
        question: "Is my identity revealed when someone reads my message?",
        answer:
          "No, all messages are completely anonymous. The recipient will only see your message, not your username or any identifying information.",
      },
    ],
    messaging: [
      {
        id: "messaging-1",
        question: "How do I release a pigeon?",
        answer:
          'Click on the "Release a Pigeon" button from the home page or navigation. Write your message, choose a pigeon color, select a location, and hit the release button. Your pigeon will fly into the virtual sky for others to find.',
      },
      {
        id: "messaging-2",
        question: "What happens after I release a pigeon?",
        answer:
          "Your message becomes available for other users to discover when they hunt for pigeons in the location you selected. If someone finds your pigeon, they can read your message and choose to respond through the chat system.",
      },
      {
        id: "messaging-3",
        question: "Can I choose who receives my message?",
        answer:
          "No, the recipient is completely random within the location you select. This is part of the fun and mystery of Kobutor!",
      },
      {
        id: "messaging-4",
        question: "Are there any restrictions on message content?",
        answer:
          "Yes, we prohibit hate speech, harassment, threats, and inappropriate content. Messages are moderated, and violations can result in account suspension.",
      },
    ],
    hunting: [
      {
        id: "hunting-1",
        question: "How do I hunt for pigeons?",
        answer:
          'Go to the Hunt page where you\'ll see virtual pigeons flying across the screen. Click on any pigeon to "catch" it and read the message it carries.',
      },
      {
        id: "hunting-2",
        question: "Can I choose where to hunt for pigeons?",
        answer:
          "Yes, you can select from different locations: Bangladesh (local), Global (worldwide), or Random (any location). Different locations may have different types of messages.",
      },
      {
        id: "hunting-3",
        question: "How often are new pigeons available?",
        answer:
          'New pigeons are released continuously by users. You can use the "Refresh Pigeons" button to search for new messages if you don\'t see any initially.',
      },
      {
        id: "hunting-4",
        question: "What should I do if I find an inappropriate message?",
        answer:
          "Please use the report feature to flag inappropriate content. Our moderators will review reported messages and take appropriate action.",
      },
    ],
    account: [
      {
        id: "account-1",
        question: "Do I need an account to use Kobutor?",
        answer:
          "Yes, you need to create an account to release pigeons and access all features. This helps us maintain a safe community and prevent abuse.",
      },
      {
        id: "account-2",
        question: "What information do you collect from users?",
        answer:
          "We only collect essential information needed for account creation and functionality. We value your privacy and never share your personal information with third parties.",
      },
      {
        id: "account-3",
        question: "Can I delete my account?",
        answer:
          "Yes, you can delete your account from the settings page. This will remove all your personal information and message history from our system.",
      },
      {
        id: "account-4",
        question: "I forgot my password. How can I reset it?",
        answer:
          'Click on the "Forgot Password" link on the login page. We\'ll send password reset instructions to your registered email address.',
      },
    ],
  };

  const categories = [
    { id: "general", name: "General", icon: <FiHome /> },
    { id: "messaging", name: "Messaging", icon: <FiMessageSquare /> },
    { id: "hunting", name: "Hunting", icon: <FiSearch /> },
    { id: "account", name: "Account", icon: <FiHome /> },
  ];

  return (
    <div
      className="w-screen min-h-screen bg-cover bg-center text-white flex flex-col transition-all duration-500"
      style={{
        backgroundImage: `url(${isDark ? backgroundDark : background})`,
      }}
    >
      <Header />
      <DarkButton isDark={isDark} setIsDark={setIsDark} />

      <div className="container mx-auto px-4 py-16 pt-24">
        <div className="max-w-4xl mx-auto bg-black/60 dark:bg-gray-900/80 backdrop-blur-md rounded-xl p-6 md:p-8 text-white">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-white/80">
              Find answers to common questions about Kobutor
            </p>
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center px-4 py-2 rounded-full transition ${
                  activeCategory === category.id
                    ? "bg-yellow-400 text-black"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>

          {/* FAQ items */}
          <div className="space-y-4">
            {faqData[activeCategory].map((item) => (
              <div
                key={item.id}
                className="bg-white/10 dark:bg-gray-800/50 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition"
                >
                  <span className="font-semibold pr-4">{item.question}</span>
                  {openItems[item.id] ? <FiChevronUp /> : <FiChevronDown />}
                </button>

                {openItems[item.id] && (
                  <div className="px-4 pb-4 pt-2 border-t border-white/10">
                    <p className="text-white/80">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Additional help section */}
          <div className="mt-12 p-6 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 text-yellow-400 text-center">
              Still need help?
            </h2>
            <p className="text-center mb-4">
              Can't find the answer you're looking for? Please contact our
              support team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate("/contact")}
                className="bg-yellow-400 text-black px-6 py-2 rounded-full font-semibold hover:bg-yellow-300 transition"
              >
                Contact Support
              </button>
              <button
                onClick={() => navigate("/release")}
                className="bg-transparent border border-yellow-400 text-yellow-400 px-6 py-2 rounded-full font-semibold hover:bg-yellow-400/20 transition"
              >
                Release a Pigeon
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default FAQ;
