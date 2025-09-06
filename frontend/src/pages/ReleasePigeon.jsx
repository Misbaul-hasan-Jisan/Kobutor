import { useState, useEffect } from 'react';
import background from '../assets/homebg.png';
import backgroundDark from '../assets/homebg-dark.png'; // You'll need a dark version
import Header from '../components/header';
import DarkButton from '../components/darkbutton';

function ReleasePigeon() {
  const [message, setMessage] = useState('');
  const [color, setColor] = useState('white');
  const [location, setLocation] = useState('Bangladesh');
  const [isDark, setIsDark] = useState(false);

  // Apply theme class to document root for consistent styling
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleRelease = () => {
    console.log('Message:', message);
    console.log('Color:', color);
    console.log('Location:', location);
    // Add release logic here (e.g. send to backend or animate pigeon)
  };

  return (
    <div
      className="fixed inset-0 w-screen h-screen bg-cover flex items-center justify-center transition-all duration-500"
      style={{ backgroundImage: `url(${isDark ? backgroundDark : background})` }}
    > 
      {/* Header */}
      <div className="absolute top-0 left-0 w-full">
        <Header />
      </div>

      {/* Dark Mode Toggle Button */}
      <DarkButton isDark={isDark} setIsDark={setIsDark} />

      <div className="w-full max-w-2xl bg-black/60 dark:bg-gray-900/80 text-white flex flex-col mx-auto py-12 px-4 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold mb-4 text-center">Release a Pigeon</h1>
        <p className="mb-6 text-lg text-center max-w-xl">
          Enter your message below, then release your pigeon!
        </p>
        
        {/* Message Input */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="w-full max-w-xl h-40 p-4 rounded-lg text-white resize-none mb-6 text-align-start bg-black/30 dark:bg-gray-800/60 border border-white/30 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-500"
        />

        {/* Pigeon Color Selector */}
        <div className="mb-6 w-full flex flex-col items-center">
          <p className="mb-2 font-semibold text-center">Choose the color of your pigeon:</p>
          <div className="flex gap-4 justify-center">
            {['black', 'white', 'brown'].map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`px-4 py-2 rounded-full border ${
                  color === c 
                    ? 'bg-white text-black font-bold dark:bg-yellow-500 dark:text-gray-900' 
                    : 'bg-white/20 dark:bg-gray-700/70 hover:bg-white/30 dark:hover:bg-gray-600/70'
                } border-white/30 dark:border-gray-600`}
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Location Selector */}
        <div className="mb-6 w-full flex flex-col items-center">
          <p className="mb-2 font-semibold text-center">Hunt in:</p>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="px-4 py-2 rounded text-black dark:bg-gray-800 dark:text-white text-center border border-white/30 dark:border-gray-600"
          >
            <option>Bangladesh</option>
            <option>Global</option>
            <option>Random</option>
          </select>
        </div>

        {/* Release Button */}
        <button
          onClick={handleRelease}
          className="bg-yellow-400 dark:bg-yellow-500 text-black dark:text-gray-900 px-6 py-2 rounded-full font-semibold hover:bg-yellow-300 dark:hover:bg-yellow-400 transition mx-auto"
        >
          Release
        </button>

        {/* Footer Tip */}
        <p className="mt-6 text-sm italic text-white/80 dark:text-gray-300 text-center">
          Hunted pigeons are shared anonymously.
        </p>
      </div>
    </div>
  );
}

export default ReleasePigeon;