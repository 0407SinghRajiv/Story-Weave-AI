"use client";
import Link from "next/link";
import { useState } from "react";
import { SignInButton, SignUpButton, useAuth, UserButton } from "@clerk/nextjs";
import { useLanguage } from "@/contexts/LanguageContext";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const { t } = useLanguage();
  const { isSignedIn } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="nav-logo">
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🪄</span> StoryWeave.ai
        </Link>
      </div>

      <button 
        className="mobile-menu-btn"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle menu"
      >
        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
        <Link href="/" className="nav-link active" onClick={() => setIsMenuOpen(false)}>{t("Home")}</Link>
        <Link href="/library" className="nav-link" onClick={() => setIsMenuOpen(false)}>{t("Library")}</Link>
        <Link href="/about" className="nav-link" onClick={() => setIsMenuOpen(false)}>{t("About")}</Link>
      </div>

      <div className={`nav-right ${isMenuOpen ? 'open' : ''}`}>
        <button className="btn-gold" onClick={() => setIsMenuOpen(false)}>{t("Create Story")}</button>
        
        {!isSignedIn ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <SignInButton mode="modal">
              <button className="glass-btn" style={{ fontSize: '13px' }}>{t("Sign In")}</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="btn-gold" style={{ fontSize: '13px', padding: '8px 14px' }}>{t("Sign Up")}</button>
            </SignUpButton>
          </div>
        ) : (
          <UserButton />
        )}
      </div>
    </nav>
  );
}
