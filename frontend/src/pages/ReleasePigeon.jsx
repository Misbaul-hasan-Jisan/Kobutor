import { useState, useEffect } from 'react';
import background from '../assets/homebg.png';
import backgroundDark from '../assets/homebg-dark.png';
import Header from '../components/header';
import DarkButton from '../components/darkbutton';
import { useNavigate } from 'react-router-dom';

// Import pigeon images
import pigeonWhite from '../assets/pigeon-white.png';
import pigeonBlack from '../assets/pigeon-black.png';
import pigeonBrown from '../assets/pigeon-brown.png';

// Pigeon flying animation component
const FlyingPigeon = ({ color, onAnimationEnd }) => {
  const getPigeonImage = () => {
    switch(color) {
      case 'black': return pigeonBlack;
      case 'brown': return pigeonBrown;
      default: return pigeonWhite;
    }
  };
  
  const pigeonImage = getPigeonImage();
  
  return (
    <div
      className="absolute top-1/2 left-1/2 animate-pigeon-release"
      onAnimationEnd={onAnimationEnd}
      style={{
        transform: 'translate(-50%, -50%)',
      }}
    >
      <img
        src={pigeonImage}
        alt={`${color} pigeon`}
        className="w-24 h-20 object-contain pointer-events-none select-none" // Increased from w-16 h-14 to w-24 h-20
      />
    </div>
  );
};

function ReleasePigeon() {
  const [message, setMessage] = useState('');
  const [color, setColor] = useState('white');
  const [location, setLocation] = useState('Bangladesh');
  const [isDark, setIsDark] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isReleasing, setIsReleasing] = useState(false);
  const navigate = useNavigate();

  // Apply theme class to document root
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

  // Redirect if not logged in
  useEffect(() => {
    const token = localStorage.getItem('kobutor_token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleRelease = async () => {
    setError('');
    setSuccess('');
    const token = localStorage.getItem('kobutor_token');
    if (!token) {
      setError('You must be logged in to release a pigeon.');
      return;
    }

    if (!message.trim()) {
      setError('Please enter a message for your pigeon.');
      return;
    }

    // Start the animation
    setIsReleasing(true);
    
    // Wait for animation to complete before making API call
    setTimeout(async () => {
      try {
        const res = await fetch('https://kobutor.onrender.com/api/pigeons', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: message,
            color,
            location,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.message || 'Failed to release pigeon.');
          setIsReleasing(false);
          return;
        }

        setSuccess('Your pigeon has been released!');
        setMessage('');
      } catch (err) {
        console.error('Release failed:', err);
        setError('Failed to connect to server.');
      } finally {
        setIsReleasing(false);
      }
    }, 3000); // Match the animation duration (3 seconds)
  };

  const handleAnimationEnd = () => {
    // Animation ended
  };

  return (
    <div
      className="fixed inset-0 w-screen h-screen bg-cover flex items-center justify-center transition-all duration-500 overflow-hidden"
      style={{ backgroundImage: `url(${isDark ? backgroundDark : background})` }}
    >
      <div className="absolute top-0 left-0 w-full z-10">
        <Header />
      </div>

      <DarkButton isDark={isDark} setIsDark={setIsDark} />

      {/* Flying pigeon animation */}
      {isReleasing && (
        <FlyingPigeon color={color} onAnimationEnd={handleAnimationEnd} />
      )}

      <div className="absolute top-24 left-0 w-full flex justify-center z-20">
        <div className={`w-full max-w-2xl bg-black/60 dark:bg-gray-900/80 text-white flex flex-col mx-auto py-12 px-4 rounded-lg shadow-lg transition-opacity duration-300 ${isReleasing ? 'opacity-0' : 'opacity-100'}`}>
          <h1 className="text-4xl font-bold mb-4 text-center">Release a Pigeon</h1>
          <p className="mb-6 text-lg text-center max-w-xl">
            Enter your message below, then release your pigeon!
          </p>

          {error && (
            <div className="mb-4 p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-sm text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-sm text-center">
              {success}
            </div>
          )}

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="w-full max-w-xl h-40 p-4 rounded-lg text-white resize-none mb-6 bg-black/30 dark:bg-gray-800/60 border border-white/30 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-500"
            disabled={isReleasing}
          />

          <div className="mb-6 w-full flex flex-col items-center">
            <p className="mb-2 font-semibold text-center">Choose the color of your pigeon:</p>
            <div className="flex gap-4 justify-center">
              {['black', 'white', 'brown'].map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  disabled={isReleasing}
                  className={`px-4 py-2 rounded-full border ${isReleasing ? 'opacity-50 cursor-not-allowed' : ''} ${
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

          <div className="mb-6 w-full flex flex-col items-center">
            <p className="mb-2 font-semibold text-center">Hunt in:</p>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isReleasing}
              className="px-4 py-2 rounded text-black dark:bg-gray-800 dark:text-white text-center border border-white/30 dark:border-gray-600 disabled:opacity-50"
            >
              <option>Bangladesh</option>
              <option>Global</option>
              <option>Random</option>
            </select>
          </div>

          <button
            onClick={handleRelease}
            disabled={isReleasing}
            className="bg-yellow-400 dark:bg-yellow-500 text-black dark:text-gray-900 px-6 py-2 rounded-full font-semibold hover:bg-yellow-300 dark:hover:bg-yellow-400 transition mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isReleasing ? 'Releasing...' : 'Release'}
          </button>

          <p className="mt-6 text-sm italic text-white/80 dark:text-gray-300 text-center">
            Hunted pigeons are shared anonymously.
          </p>
        </div>
      </div>
      <style>{`
        @keyframes pigeon-release {
          0% {
            transform: translate(-50%, -50%) scale(1.5); /* Increased from scale(1) */
            opacity: 1;
          }
          30% {
            transform: translate(-50%, -60%) scale(1.7); /* Increased from scale(1.1) */
            opacity: 1;
          }
          100% {
            transform: translate(100vw, -100vh) scale(0.5); /* Increased from scale(0.3) */
            opacity: 0;
          }
        }
        
        .animate-pigeon-release {
          animation: pigeon-release 3s ease-in forwards;
          z-index: 15;
        }
      `}</style>
    </div>
  );
}

export default ReleasePigeon;