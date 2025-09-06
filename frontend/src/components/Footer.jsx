function Footer() {
  return (
    <footer className="bg-transparent text-white py-2 mt-12">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Left: Logo & Tagline */}
        <div className="text-center md:text-left">
          <h2 className="text-xl font-bold">🕊️ Kobutor</h2>
          <p className="text-sm text-white/70">Messages with mystery, delivered with flight.</p>
        </div>

        {/* Center: Navigation */}
        <nav className="flex gap-6 text-sm">
          <a href="/" className="hover:underline">Home</a>
          <a href="/release" className="hover:underline">Release</a>
          <a href="/hunt" className="hover:underline">Hunt</a>
          <a href="/about" className="hover:underline">About</a>
        </nav>

        {/* Right: Copyright */}
        <div className="text-sm text-white/50 text-center md:text-right">
          &copy; {new Date().getFullYear()} Kobutor. Built with love in Dhaka.
        </div>
      </div>
    </footer>
  );
}

export default Footer;