import { useState, useEffect } from "react";
import { FiSend, FiMail, FiArrowRight } from "react-icons/fi";
import background from "../assets/homebg.png";
import backgroundDark from "../assets/homebg-dark.png";
import Header from "../components/header";
import DarkButton from "../components/darkbutton";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";

function Contact() {
  const [isDark, setIsDark] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  // Apply theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setIsDark(savedTheme === "dark");
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("kobutor_token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Create email content
    const emailSubject = encodeURIComponent(
      formData.subject || "Message from Kobutor Contact Form"
    );
    const emailBody = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    );

    // Open default email client
    window.location.href = `mailto:jisanaa22@gmail.com?subject=${emailSubject}&body=${emailBody}`;

    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 5000);
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

return (
    <div
        className="w-screen min-h-screen bg-cover bg-center text-white flex flex-col transition-all duration-500"
        style={{
            backgroundImage: `url(${isDark ? backgroundDark : background})`,
        }}
    >
        <Header />
        <DarkButton isDark={isDark} setIsDark={setIsDark} />

        <div className="container mx-auto px-4 py-16 pt-24">
            <div className="max-w-4xl mx-auto bg-black/60 dark:bg-gray-900/80 backdrop-blur-md rounded-xl p-8 text-white">
                <h1 className="text-4xl font-bold mb-8 text-center">Contact Us</h1>

                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-2xl font-semibold mb-6 text-amber-200">
                            Get in Touch
                        </h2>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-start">
                                <div className="bg-amber-600  text-black w-10 h-10 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                                    <FiMail className="text-lg" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Email</h3>
                                    <p>jisanaa22@gmail.com</p>
                                    <a
                                        href="mailto:jisanaa22@gmail.com"
                                        className="text-amber-200 hover:text-yellow-300 text-sm flex items-center mt-1"
                                    >
                                        Write to us <FiArrowRight className="ml-1" />
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="bg-amber-600  text-black w-10 h-10 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                                    📱
                                </div>
                                <div>
                                    <h3 className="font-semibold">Social Media</h3>
                                    <p>Follow us for updates</p>
                                    <div className="flex space-x-3 mt-2">
                                        <button className="bg-white/10 p-2 rounded hover:bg-white/20 transition">
                                            📘
                                        </button>
                                        <button className="bg-white/10 p-2 rounded hover:bg-white/20 transition">
                                            📸
                                        </button>
                                        <button className="bg-white/10 p-2 rounded hover:bg-white/20 transition">
                                            🐦
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="bg-amber-600  text-black w-10 h-10 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                                    📍
                                </div>
                                <div>
                                    <h3 className="font-semibold">Location</h3>
                                    <p>Based in Bangladesh, serving globally</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/10 dark:bg-gray-800/50 p-4 rounded-lg">
                            <h3 className="font-semibold mb-2">FAQ</h3>
                            <p className="text-sm">
                                Check our{" "}
                                <button
                                    className="text-amber-200 hover:underline"
                                    onClick={() => navigate("/faq")}
                                >
                                    frequently asked questions   
                                </button>{" "}
                                for quick answers to common queries.
                            </p>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-semibold mb-6 text-amber-200">
                            Write us your message
                        </h2>

                        {isSubmitted && (
                            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded text-green-300 text-center">
                                Thank you! Your email client will open to send us a message.
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="contact__form-div">
                                <label className="block mb-1 text-sm contact__form-tag">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-400 contact__form-input"
                                    placeholder="Your name"
                                />
                            </div>

                            <div className="contact__form-div">
                                <label className="block mb-1 text-sm contact__form-tag">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-400 contact__form-input"
                                    placeholder="your@email.com"
                                />
                            </div>

                            <div className="contact__form-div">
                                <label className="block mb-1 text-sm contact__form-tag">
                                    Subject
                                </label>
                                <input
                                    type="text"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-400 contact__form-input"
                                    placeholder="What is this about?"
                                />
                            </div>

                            <div className="contact__form-div contact__form-area">
                                <label className="block mb-1 text-sm contact__form-tag">
                                    Message
                                </label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    rows="4"
                                    className="w-full px-4 py-2 rounded bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none contact__form-input"
                                    placeholder="Type your message here..."
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-amber-600  dark:bg-yellow-500 text-black dark:text-gray-900 py-2 rounded font-semibold hover:bg-yellow-300 dark:hover:bg-amber-600  transition flex items-center justify-center button"
                            >
                                Send Message <FiSend className="ml-2 button__icon" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <Footer />
    </div>
);
}

export default Contact;
