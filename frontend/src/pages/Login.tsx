// src/pages/Login.tsx

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import GoogleLogo from "@/assets/icons8-google-logo-96.svg";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login();
      navigate("/");
    } catch {
      alert("Failed to log in with Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-evenly items-center bg-gray-50 px-6 relative">
      {/* Desktop advisory: open on mobile */}
      <div className="hidden sm:block absolute top-4 left-10 w-full flex justify-center">
        For the best ICONIC experience, please open this app on your notebook
        device
      </div>

      {/* Animated gradient title */}
      <h1
        className="
          text-5xl sm:text-6xl font-extrabold uppercase text-transparent bg-clip-text
          bg-gradient-to-r from-primary via-hover to-pink-500
          animate-gradient-pan text-center
        "
      >
        ICONIC
      </h1>

      {/* Slogan */}
      <p className="text-gray-700 text-center max-w-md leading-relaxed">
        Turn your wishes and style into <strong>memorable moments</strong>.
        <br />
        <span className="font-semibold">Experience what is ICONIC.</span>
      </p>

      {/* Google Login Button */}
      <button
        onClick={handleLogin}
        disabled={loading}
        className={`
          w-full max-w-xs flex items-center justify-center gap-3
          ${
            loading
              ? "bg-gray-200 cursor-not-allowed"
              : "bg-white hover:bg-gray-100"
          }
          border border-gray-300 text-gray-800 font-medium
          py-3 rounded-full shadow-sm
          focus:outline-none focus:ring-2 focus:ring-primary
          transition-colors duration-200
        `}
      >
        {!loading && (
          <img src={GoogleLogo} alt="Google logo" className="w-5 h-5" />
        )}
        {loading ? "Signing in..." : "Sign in with Google"}
      </button>

      <style>{`
        @keyframes gradient-pan {
          0%,100% {background-position:0% 50%;}
          50%{background-position:100% 50%;}
        }
        .animate-gradient-pan {
          background-size: 200% 200%;
          animation: gradient-pan 4s linear infinite;
        }
      `}</style>
    </div>
  );
}
