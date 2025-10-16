import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSend, FiSearch, FiMessageSquare, FiUsers } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import AnimatedSky from '../components/AnimatedSky';
import background from '../assets/homebg.png';
import backgroundDark from '../assets/homebg-dark.png';
import Header from '../components/header';
import Footer from '../components/Footer';
import DarkButton from '../components/darkbutton';
import { Typewriter } from 'react-simple-typewriter';

// Add the missing TypewriterText component
const TypewriterText = ({ text, speed = 40 }) => {
  return (
    <Typewriter
      words={[text]}
      loop={1}
      cursor
      cursorStyle="|"
      typeSpeed={speed}
      deleteSpeed={999999} // Prevent deletion
      delaySpeed={1000}
    />
  );
};

function Home() {
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const features = [
    {
      icon: <FiSend className="text-2xl" />,
      title: "Release Messages",
      description: "Send anonymous messages into the virtual sky",
      color: "from-blue-400 to-cyan-400",
      onClick: () => navigate('/release')
    },
    {
      icon: <FiSearch className="text-2xl" />,
      title: "Hunt for Pigeons",
      description: "Discover messages from around the world",
      color: "from-purple-400 to-pink-400",
      onClick: () => navigate('/hunt')
    },
    {
      icon: <FiMessageSquare className="text-2xl" />,
      title: "Real-time Chat",
      description: "Connect with message senders instantly",
      color: "from-orange-400 to-red-400",
      onClick: () => navigate('/chat')
    },
    {
      icon: <FiUsers className="text-2xl" />,
      title: "Global Community",
      description: "Meet people from different locations",
      color: "from-green-400 to-teal-400",
      onClick: () => navigate('/about')
    }
  ];

  return (
    <div
      className="w-screen min-h-screen bg-cover bg-center text-white flex flex-col transition-all duration-500 relative overflow-hidden"
      style={{ backgroundImage: `url(${isDark ? backgroundDark : background})` }}
    >
      {/* Animated background elements */}
      {/* <AnimatedSky /> */}
      
      <Header />
   
      <DarkButton isDark={isDark} setIsDark={setIsDark} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl"
        >
          <motion.h1 
            className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-amber-200 to-orange-200 bg-clip-text text-transparent"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            Send Messages
            <span className="block text-white">with Wings</span>
          </motion.h1>

          <motion.p 
            className="text-xl md:text-2xl mb-12 text-white/90 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <TypewriterText text="Release your thoughts into the sky and let serendipity guide them to someone special" speed={30} />
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-amber-200 to-orange-100 text-black px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              onClick={() => navigate('/release')}
            >
              <FiSend />
              Release a Pigeon
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="border-2 border-amber-700 text-amber-900 dark:text-amber-100 px-8 py-4 rounded-full font-semibold text-lg hover:bg-amber-200/10 transition-all flex items-center gap-2"
              onClick={() => navigate('/hunt')}
            >
              <FiSearch />
              Hunt for Messages
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full mt-16 px-4"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + index * 0.1, duration: 0.5 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-yellow-400/30 transition-all group cursor-pointer"
              onClick={feature.onClick}
            >
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white group-hover:text-yellow-400 transition-colors">
                {feature.title}
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="flex flex-wrap justify-center gap-8 mt-16 text-center"
        >
          {[
            { number: "10K+", label: "Messages Sent" },
            { number: "5K+", label: "Active Users" },
            { number: "50+", label: "Countries" },
            { number: "24/7", label: "Active" }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-gray-700 dark:text-amber-100 mb-1">
                {stat.number}
              </div>
              <div className="text-gray-700 dark:text-amber-100 text-sm">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

export default Home;