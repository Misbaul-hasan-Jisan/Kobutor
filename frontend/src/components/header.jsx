import React from "react";
import { Link } from "react-router-dom";

const Header = () => (
    <header className="flex justify-between items-center p-6 bg-black/30">
        <div className="text-2xl font-bold">🕊️ KOBUTOR</div>
        <nav className="space-x-4">
            <Link to="/" className="bg-transparent hover:underline px-4 py-2 rounded">Home</Link>
            <Link to="/about" className="bg-transparent hover:underline px-4 py-2 rounded">About</Link>
            <Link to="/contact" className="bg-transparent hover:underline px-4 py-2 rounded">Contact</Link>
            <Link to="/login" className="bg-transparent hover:underline px-4 py-2 rounded">Log In</Link>
        </nav>
    </header>
);

export default Header;