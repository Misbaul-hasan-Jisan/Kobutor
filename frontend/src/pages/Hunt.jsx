import { useState, useEffect } from 'react';
import background from '../assets/homebg.png';
import backgroundDark from '../assets/homebg-dark.png';
import Header from '../components/header';
import DarkButton from '../components/darkbutton';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

// Pigeon SVG component with different colors
const Pigeon = ({ color, onClick, id, isCaught }) => {
  const getPigeonColor = () => {
    switch(color) {
      case 'black': return '#2D3748';
      case 'brown': return '#744210';
      default: return '#FFFFFF';
    }
  };
  
  const pigeonColor = getPigeonColor();
  const beakColor = color === 'white' ? '#F6AD55' : '#E53E3E';
  
  return (
    <div 
      className={`absolute cursor-pointer transition-all duration-1000 ${isCaught ? 'opacity-0' : 'opacity-100'}`}
      onClick={onClick}
      style={{ 
        transform: isCaught ? 'scale(0.5) translateY(100px)' : 'scale(1)',
        transition: 'transform 0.5s, opacity 0.5s'
      }}
    >
      <svg width="60" height="50" viewBox="0 0 60 50">
        {/* Body */}
        <ellipse cx="30" cy="25" rx="15" ry="10" fill={pigeonColor} />
        
        {/* Head */}
        <circle cx="40" cy="20" r="7" fill={pigeonColor} />
        
        {/* Beak */}
        <path d="M47 20 L52 18 L47 22 Z" fill={beakColor} />
        
        {/* Eye */}
        <circle cx="42" cy="19" r="1.5" fill="#000" />
        
        {/* Wings */}
        <path d="M25 15 Q35 5 45 15 Q35 10 25 15" fill={pigeonColor} opacity="0.8" />
        
        {/* Tail */}
        <path d="M15 25 Q20 15 25 25 Q20 20 15 25" fill={pigeonColor} />
      </svg>
    </div>
  );
};

// Message popup component
const MessagePopup = ({ message, onClose, color }) => {
  const bgColor = color === 'white' ? 'bg-gray-100' : 
                 color === 'black' ? 'bg-gray-800' : 'bg-amber-100';
                 
  const textColor = color === 'white' ? 'text-gray-800' : 
                   color === 'black' ? 'text-white' : 'text-gray-800';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className={`${bgColor} ${textColor} rounded-xl p-6 max-w-md mx-4 relative`}>
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        <h3 className="text-xl font-bold mb-4">You caught a pigeon!</h3>
        <div className="p-4 rounded-lg bg-white/20">
          <p className="italic">"{message}"</p>
        </div>
        <button 
          onClick={onClose}
          className="mt-6 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Release back to sky
        </button>
      </div>
    </div>
  );
};

function Hunt() {
  const [pigeons, setPigeons] = useState([]);
  const [isDark, setIsDark] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [huntLocation, setHuntLocation] = useState('Bangladesh');
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

  // Fetch pigeons from API
  useEffect(() => {
    const fetchPigeons = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('kobutor_token');
        const response = await fetch(`http://localhost:3000/api/pigeons?location=${huntLocation}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Add random positions and animation delays
          const pigeonsWithPositions = data.map(pigeon => ({
            ...pigeon,
            position: {
              x: Math.random() * 80 + 10, // 10-90% of screen width
              y: Math.random() * 70 + 15, // 15-85% of screen height
            },
            delay: Math.random() * 5, // 0-5s delay
            isCaught: false
          }));
          setPigeons(pigeonsWithPositions);
        } else {
          console.error('Failed to fetch pigeons');
        }
      } catch (error) {
        console.error('Error fetching pigeons:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPigeons();
  }, [huntLocation]);

  const handleCatchPigeon = (id) => {
    setPigeons(prev => prev.map(pigeon => 
      pigeon.id === id ? {...pigeon, isCaught: true} : pigeon
    ));
    
    const caughtPigeon = pigeons.find(p => p.id === id);
    setSelectedMessage(caughtPigeon);
  };

  const closeMessage = () => {
    setSelectedMessage(null);
    // Remove the caught pigeon after a delay
    setTimeout(() => {
      setPigeons(prev => prev.filter(p => p.id !== selectedMessage.id));
    }, 500);
  };

  const refreshPigeons = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('kobutor_token');
      const response = await fetch(`http://localhost:3000/api/pigeons?location=${huntLocation}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const pigeonsWithPositions = data.map(pigeon => ({
          ...pigeon,
          position: {
            x: Math.random() * 80 + 10,
            y: Math.random() * 70 + 15,
          },
          delay: Math.random() * 5,
          isCaught: false
        }));
        setPigeons(pigeonsWithPositions);
      }
    } catch (error) {
      console.error('Error refreshing pigeons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 w-screen h-screen bg-cover bg-center transition-all duration-500 overflow-hidden"
        style={{ backgroundImage: `url(${isDark ? backgroundDark : background})` }}
      >
        {/* Header should be above everything */}
      <div className="absolute top-0 left-0 w-full z-50">
        <Header />
        <DarkButton isDark={isDark} setIsDark={setIsDark} />
      </div>

      {/* All other content stays below */}
      {/* Controls, pigeons, instructions, etc. */}

        
        {/* Controls */}
        
        
        {/* Pigeon counter */}
        <div className="absolute top-20 left-4 z-10 bg-black/50 dark:bg-gray-800/70 p-3 rounded-lg text-white">
          <div className="text-sm">Pigeons in sky: {pigeons.filter(p => !p.isCaught).length}</div>
        </div>
        
        {/* Instructions */}
        <div className="absolute bottom-20 left-0 right-0 mx-auto text-center text-white bg-black/50 p-2 rounded-lg max-w-md">
          <p className="text-sm">Click on pigeons to catch them and read their messages!</p>
        </div>
        <div className="absolute top-50 right-8 z-10 bg-black/50 dark:bg-gray-800/70 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-white text-sm">Hunt in:</span>
            <select 
              value={huntLocation}
              onChange={(e) => setHuntLocation(e.target.value)}
              className="bg-white/20 px-2 py-1 rounded text-white dark:bg-gray-700"
            >
              <option>Bangladesh</option>
              <option>Global</option>
              <option>Random</option>
            </select>
          </div>
          <button 
            onClick={refreshPigeons}
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
          >
            {isLoading ? 'Searching...' : 'Refresh Pigeons'}
          </button>
        </div>
        {/* Pigeons flying in the sky */}
        <div className="absolute inset-0">
          {pigeons.map((pigeon) => (
            <div
              key={pigeon.id}
              className="absolute animate-float"
              style={{
                left: `${pigeon.position.x}%`,
                top: `${pigeon.position.y}%`,
                animationDelay: `${pigeon.delay}s`,
              }}
            >
              <Pigeon
                color={pigeon.color}
                onClick={() => handleCatchPigeon(pigeon.id)}
                id={pigeon.id}
                isCaught={pigeon.isCaught}
              />
            </div>
          ))}
        </div>
        
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="text-white text-xl">Searching for pigeons...</div>
          </div>
        )}
        
        {/* Empty state */}
        {!isLoading && pigeons.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-center bg-black/50 p-6 rounded-xl">
              <h3 className="text-xl mb-2">No pigeons in the sky</h3>
              <p className="mb-4">Try changing location or refresh to find messages</p>
              <button 
                onClick={refreshPigeons}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Message popup */}
      {selectedMessage && (
        <MessagePopup 
          message={selectedMessage.content} 
          onClose={closeMessage}
          color={selectedMessage.color}
        />
      )}
      
      <Footer />
      
      <style>{`
        @keyframes float {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}

export default Hunt;