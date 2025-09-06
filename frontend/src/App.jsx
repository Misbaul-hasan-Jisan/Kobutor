
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from "./pages/Home";
import ReleasePigeon from './pages/ReleasePigeon';
import Login from './pages/LogInPage';



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/release" element={<ReleasePigeon />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;