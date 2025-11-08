// frontend/src/components/ProfileSettings.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import background from '../assets/homebg.png';
import backgroundDark from '../assets/homebg-dark.png';
import Header from './header';
import Footer from './Footer';
import DarkButton from './darkbutton';

const API = import.meta.env.VITE_API_BASE_URL;

function ProfileSettings() {
  const [user, setUser] = useState(null);
  const [newUsername, setNewUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setIsDark(savedTheme === "dark");
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('kobutor_token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else if (response.status === 401) {
        localStorage.removeItem('kobutor_token');
        navigate('/login');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setMessage({ text: 'Failed to load profile', type: 'error' });
    }
  };

  const checkUsernameAvailability = async (username) => {
    if (username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setIsChecking(true);
    try {
      const token = localStorage.getItem('kobutor_token');
      const response = await fetch(
        `${API}/api/user/username/check?username=${encodeURIComponent(username)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setUsernameAvailable(data.available);
        setMessage({ 
          text: data.message, 
          type: data.available ? 'success' : 'error' 
        });
      }
    } catch (err) {
      console.error('Error checking username:', err);
      setMessage({ text: 'Failed to check username', type: 'error' });
    } finally {
      setIsChecking(false);
    }
  };

  const handleUsernameChange = async (e) => {
    e.preventDefault();
    if (!newUsername.trim() || newUsername.length < 3) {
      setMessage({ text: 'Username must be at least 3 characters long', type: 'error' });
      return;
    }

    if (!usernameAvailable) {
      setMessage({ text: 'Please choose an available username', type: 'error' });
      return;
    }

    setIsChanging(true);
    setMessage({ text: '', type: '' });
    
    try {
      const token = localStorage.getItem('kobutor_token');
      const response = await fetch(`${API}/api/user/username/change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newUsername: newUsername.trim() }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage({ text: 'Username changed successfully!', type: 'success' });
        setNewUsername('');
        setUsernameAvailable(null);
        fetchUserProfile();
        
        // Update localStorage if username changed in token
        if (data.user) {
          localStorage.setItem('kobutor_user', JSON.stringify(data.user));
        }
      } else {
        setMessage({ text: data.message || 'Failed to change username', type: 'error' });
      }
    } catch (err) {
      console.error('Error changing username:', err);
      setMessage({ text: 'Failed to connect to server', type: 'error' });
    } finally {
      setIsChanging(false);
    }
  };

  const handleUsernameInput = (value) => {
    setNewUsername(value);
    setMessage({ text: '', type: '' });
    
    if (value.length >= 3) {
      checkUsernameAvailability(value);
    } else {
      setUsernameAvailable(null);
    }
  };

  if (!user) {
    return (
      <div
        className="w-screen min-h-screen bg-cover bg-center text-white flex flex-col transition-all duration-500 relative overflow-hidden"
        style={{ backgroundImage: `url(${isDark ? backgroundDark : background})` }}
      >
        <Header />
        <DarkButton isDark={isDark} setIsDark={setIsDark} />

        <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-400 mx-auto mb-6"></div>
            <p className="text-white/90 text-lg">Loading your profile...</p>
          </motion.div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div
      className="w-screen min-h-screen bg-cover bg-center text-white flex flex-col transition-all duration-500 relative overflow-hidden"
      style={{ backgroundImage: `url(${isDark ? backgroundDark : background})` }}
    >
      <Header />
      <DarkButton isDark={isDark} setIsDark={setIsDark} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-4xl"
        >
          {/* Header Section */}
          <div className="text-center mb-12">
            <motion.h1 
              className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-amber-200 to-orange-200 bg-clip-text text-transparent"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              Profile Settings
            </motion.h1>

            <motion.p 
              className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              Manage your account and personalize your experience
            </motion.p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Current Profile Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-yellow-400/30 transition-all"
            >
              <h3 className="text-2xl font-semibold mb-6 text-white flex items-center">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                Current Profile
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-300">Username</p>
                  <p className="text-lg font-medium text-white">{user.username}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-300">Email</p>
                  <p className="text-lg font-medium text-white">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-300">Member since</p>
                  <p className="text-lg font-medium text-white">
                    {new Date(user.joinDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-300">Username changes</p>
                  <p className="text-lg font-medium text-white">
                    {user.usernameChangeCount} time{user.usernameChangeCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Cooldown Notice */}
              {!user.canChangeUsername && user.nextChangeDate && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-6 p-4 bg-amber-500/20 border border-amber-500/30 rounded-lg"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-amber-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-amber-300">
                      You can change your username again on <strong>{new Date(user.nextChangeDate).toLocaleDateString()}</strong>
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Change Username Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:border-yellow-400/30 transition-all"
            >
              <h3 className="text-2xl font-semibold mb-6 text-white flex items-center">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                Change Username
              </h3>

              <form onSubmit={handleUsernameChange} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    New Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => handleUsernameInput(e.target.value)}
                      disabled={isChanging || !user.canChangeUsername}
                      placeholder="Enter your new username..."
                      className="w-full px-4 py-3 text-lg bg-white/10 border-2 border-gray-400/30 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder-gray-400 disabled:opacity-50 transition-all duration-200"
                      minLength={3}
                      maxLength={20}
                    />
                    
                    {/* Loading Spinner */}
                    {isChecking && (
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-400"></div>
                      </div>
                    )}
                    
                    {/* Availability Indicator */}
                    {usernameAvailable !== null && !isChecking && (
                      <div className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${
                        usernameAvailable ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {usernameAvailable ? (
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Status Message */}
                  {message.text && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className={`mt-3 p-3 rounded-lg border ${
                        message.type === 'success' 
                          ? 'bg-green-500/20 border-green-400/30'
                          : 'bg-red-500/20 border-red-400/30'
                      }`}
                    >
                      <p className={`text-sm font-medium ${
                        message.type === 'success' 
                          ? 'text-green-300'
                          : 'text-red-300'
                      }`}>
                        {message.text}
                      </p>
                    </motion.div>
                  )}

                  {/* Requirements */}
                  <p className="text-xs text-gray-400 mt-3">
                    Username must be 3-20 characters long and contain only letters, numbers, and underscores
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={
                    isChanging || 
                    !usernameAvailable || 
                    newUsername.length < 3 ||
                    !user.canChangeUsername
                  }
                  className="w-full bg-gradient-to-r from-amber-200 to-orange-100 text-black px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all disabled:from-gray-400 disabled:to-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isChanging ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Changing Username...
                    </>
                  ) : (
                    'Change Username'
                  )}
                </motion.button>
              </form>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-8 pt-6 border-t border-white/20"
              >
                <div className="flex flex-col gap-4">
                  {/* <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/stats')}
                    className="border-2 border-amber-700 text-amber-900 dark:text-amber-100 px-6 py-3 rounded-full font-semibold hover:bg-amber-200/10 transition-all text-center"
                  >
                    View Statistics
                  </motion.button> */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/chat')}
                    className="border-2 border-amber-700 text-amber-900 dark:text-amber-100 px-6 py-3 rounded-full font-semibold hover:bg-amber-200/10 transition-all text-center"
                  >
                    Back to Chats
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

export default ProfileSettings;