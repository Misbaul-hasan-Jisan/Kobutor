
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from "./pages/Home";
import ReleasePigeon from './pages/ReleasePigeon';
import Login from './pages/LogInPage';
import Signup from './pages/SignUpPage';
import Hunt from './pages/Hunt';
import Chat from './pages/chat';
import About from './pages/About';
import Contact from './pages/Contact';
import FAQ from './pages/FAQ';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/release" element={<ReleasePigeon />} />
        <Route path="/login" element={<Login />} />
        <Route path="/hunt" element={<Hunt />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<FAQ />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;