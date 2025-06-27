import React from "react";
import { Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const { logout } = useAuth();

  return (
    <header className="fixed top-0 w-full px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 z-10">
      <Link to="/" aria-label="Home">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-hover to-pink-500 animate-gradient-pan">
          ICONIC
        </h1>
      </Link>
      <button onClick={logout} aria-label="Logout">
        <LogOut className="w-6 h-6 text-gray-500 hover:text-gray-900 transition" />
      </button>
    </header>
  );
}
