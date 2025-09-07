import { useState, useEffect } from "react";
import background from "../assets/homebg.png";
import backgroundDark from "../assets/homebg-dark.png";
import Header from "../components/header";
import DarkButton from "../components/darkbutton";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";

function About() {
  const [isDark, setIsDark] = useState(false);
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
        <div className="max-w-4xl mx-auto bg-black/60 dark:bg-gray-900/80 backdrop-blur-md rounded-xl p-8 text-white">
          <h1 className="text-4xl font-bold mb-8 text-center">About Kobutor</h1>

          <div className="space-y-6">
            <div className="bg-white/10 dark:bg-gray-800/50 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold mb-4 text-yellow-400">
                Our Story
              </h2>
              <p className="text-lg">
                Kobutor (which means "Pigeon" in Bengali) was born from the
                nostalgic idea of sending messages through carrier pigeons. In a
                world of instant digital communication, we wanted to bring back
                the mystery and excitement of discovering unexpected messages
                from strangers.
              </p>
            </div>

            <div className="bg-white/10 dark:bg-gray-800/50 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold mb-4 text-yellow-400">
                How It Works
              </h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-yellow-400 text-black w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    1
                  </div>
                  <p>
                    <strong>Release a Pigeon:</strong> Write a message and
                    choose a pigeon color to send it into the sky.
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="bg-yellow-400 text-black w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    2
                  </div>
                  <p>
                    <strong>Hunt for Messages:</strong> Search for pigeons
                    carrying messages from others around the world.
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="bg-yellow-400 text-black w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    3
                  </div>
                  <p>
                    <strong>Connect Anonymously:</strong> All messages are
                    anonymous, creating genuine connections without judgment.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 dark:bg-gray-800/50 p-6 rounded-lg">
              <h2 className="text-2xl font-semibold mb-4 text-yellow-400">
                Our Values
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-black/30 p-4 rounded">
                  <h3 className="font-semibold mb-2">Privacy First</h3>
                  <p>
                    We never store personal information. Messages are anonymous
                    and ephemeral.
                  </p>
                </div>
                <div className="bg-black/30 p-4 rounded">
                  <h3 className="font-semibold mb-2">Global Community</h3>
                  <p>
                    Connect with people from Bangladesh and around the world
                    through shared messages.
                  </p>
                </div>
                <div className="bg-black/30 p-4 rounded">
                  <h3 className="font-semibold mb-2">Positive Communication</h3>
                  <p>
                    We promote kindness and positive interactions in all
                    messages.
                  </p>
                </div>
                <div className="bg-black/30 p-4 rounded">
                  <h3 className="font-semibold mb-2">Digital Serendipity</h3>
                  <p>
                    Rediscover the joy of unexpected connections and random
                    encounters.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <button
                onClick={() => navigate("/release")}
                className="bg-yellow-400 dark:bg-yellow-500 text-black dark:text-gray-900 px-6 py-3 rounded-full font-semibold hover:bg-yellow-300 dark:hover:bg-yellow-400 transition mx-2"
              >
                Release Your First Pigeon
              </button>
              <button
                onClick={() => navigate("/hunt")}
                className="bg-transparent border border-yellow-400 text-yellow-400 px-6 py-3 rounded-full font-semibold hover:bg-yellow-400/20 transition mx-2"
              >
                Hunt for Messages
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default About;
