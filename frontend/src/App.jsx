
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from "./pages/Home";
import ReleasePigeon from './pages/ReleasePigeon';
import Login from './pages/LogInPage';
import Signup from './pages/SignUpPage';



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/release" element={<ReleasePigeon />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;