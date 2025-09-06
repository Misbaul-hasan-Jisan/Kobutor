import { useState, useEffect } from 'react';
import background from '../assets/homebg.png'; // Your landscape image
import backgroundDark from '../assets/homebg-dark.png'; // You'll need a dark version
import Header from '../components/header';
import Footer from '../components/Footer';
import DarkButton from '../components/darkbutton';

function Home() {
  const [isDark, setIsDark] = useState(false);

  // Apply theme class to document root for consistent styling
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <>
      <div
        className="w-screen min-h-screen bg-cover bg-center text-white flex flex-col transition-all duration-500"
        style={{ backgroundImage: `url(${isDark ? backgroundDark : background})` }}
      >
        {/* Header */}
        <Header />

        {/* Dark Mode Toggle Button */}
        <DarkButton isDark={isDark} setIsDark={setIsDark} />

        {/* Hero Section */}
        <main className="flex flex-col items-center justify-center text-center mt-20">
          <h1 className="text-4xl font-bold mb-4">Send Messages with Pigeons</h1>
          <p className="max-w-xl text-lg mb-6">
            Release a message into the sky. Let someone unexpected catch it.
          </p>
          <button
            className="bg-transparent text-black dark:text-white px-6 py-2 rounded-full font-semibold hover:bg-white/10 transition mt-4 border border-white/30 dark:border-gray-600"
            onClick={() => window.location.href = '/release'}
          >
            Release a Pigeon
          </button>
          {/* Options */}
          <div className="flex gap-4 mt-10">
            <button className="bg-transparent  text-black dark:text-white px-4 py-2 rounded hover:bg-white/10 border border-white/30 dark:border-gray-600">Chat</button>
            <button className="bg-transparent  text-black dark:text-white px-4 py-2 rounded hover:bg-white/10 border border-white/30 dark:border-gray-600">Hunt</button>
            <select className="bg-white/20 px-4 py-2 rounded text-black dark:bg-gray-700 dark:text-white">
              <option>Bangladesh</option>
              <option>Global</option>
              <option>Random</option>
            </select>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}

export default Home;