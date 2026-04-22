"use client";
import React from "react";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { 
  Sparkles, BookOpen, Music, Languages, 
  Users, Heart, Star, Compass, Zap
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AboutPage() {
  const { t } = useLanguage();

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#080511]">
      <Navbar />
      
      <main className="page-container" style={{ padding: "80px 24px" }}>
        {/* Hero Section */}
        <header style={{ textAlign: "center", marginBottom: "80px" }}>
          <motion.div {...fadeIn}>
            <div style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: "8px", 
              background: "rgba(113, 72, 252, 0.1)", 
              padding: "8px 16px", 
              borderRadius: "30px",
              border: "1px solid rgba(113, 72, 252, 0.2)",
              color: "var(--accent-gold)",
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "24px"
            }}>
              <Sparkles size={16} />
              <span>Where Imagination Meets Magic</span>
            </div>
            <h1 className="hero-title" style={{ fontSize: "clamp(40px, 8vw, 72px)", marginBottom: "24px", lineHeight: 1.1 }}>
              Weaving Tales from <br />
              <span style={{ color: "var(--accent-purple)" }}>Your Dreams</span>
            </h1>
            <p className="hero-tagline" style={{ maxWidth: "700px", margin: "0 auto", fontSize: "18px", opacity: 0.8 }}>
              StoryWeaveAI is a magical space where your ideas, themes, and keywords are transformed into complete, immersive stories. We believe everyone has a story to tell, and we're here to help you weave it.
            </p>
          </motion.div>
        </header>

        {/* The Experience Section */}
        <motion.section 
          variants={stagger}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          style={{ marginBottom: "120px" }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px" }}>
            <motion.div variants={fadeIn} className="theme-card" style={{ padding: "40px", background: "rgba(255,255,255,0.02)" }}>
              <div className="theme-icon-wrapper" style={{ background: "rgba(113, 72, 252, 0.1)", color: "var(--accent-purple)", marginBottom: "24px" }}>
                <Zap size={24} />
              </div>
              <h3 style={{ fontSize: "24px", color: "#fff", marginBottom: "16px" }}>Dream It Instantly</h3>
              <p style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
                Simply pick a theme like Fantasy, Mystery, or Adventure, and add a few keywords. Our magical engine weaves them into a unique narrative just for you.
              </p>
            </motion.div>

            <motion.div variants={fadeIn} className="theme-card" style={{ padding: "40px", background: "rgba(255,255,255,0.02)" }}>
              <div className="theme-icon-wrapper" style={{ background: "rgba(255, 201, 102, 0.1)", color: "var(--accent-gold)", marginBottom: "24px" }}>
                <BookOpen size={24} />
              </div>
              <h3 style={{ fontSize: "24px", color: "#fff", marginBottom: "16px" }}>See the Story</h3>
              <p style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
                Every story is accompanied by beautiful, AI-crafted illustrations that bring your characters and worlds to life in vibrant detail.
              </p>
            </motion.div>

            <motion.div variants={fadeIn} className="theme-card" style={{ padding: "40px", background: "rgba(255,255,255,0.02)" }}>
              <div className="theme-icon-wrapper" style={{ background: "rgba(34, 197, 94, 0.1)", color: "#22c55e", marginBottom: "24px" }}>
                <Music size={24} />
              </div>
              <h3 style={{ fontSize: "24px", color: "#fff", marginBottom: "16px" }}>Hear the Magic</h3>
              <p style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
                Listen to your tales as they are narrated by warm, natural voices. It's like having a magical storyteller by your side at any time.
              </p>
            </motion.div>
          </div>
        </motion.section>

        {/* Mission / Language Section */}
        <section style={{ 
          background: "linear-gradient(135deg, rgba(113, 72, 252, 0.05) 0%, rgba(82, 37, 230, 0.05) 100%)",
          borderRadius: "32px",
          padding: "60px 40px",
          border: "1px solid rgba(255,255,255,0.05)",
          marginBottom: "120px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "48px"
        }}>
          <div style={{ flex: "1", minWidth: "300px" }}>
            <h2 className="section-heading" style={{ fontSize: "36px", marginBottom: "24px" }}>Stories for Everyone</h2>
            <p style={{ fontSize: "18px", color: "var(--text-muted)", lineHeight: 1.8, marginBottom: "32px" }}>
              We believe that language should never be a barrier to imagination. StoryWeaveAI supports many regional languages, allowing you to create and enjoy stories in the tongue you hold closest to your heart.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              {["English", "Hindi", "Bengali", "Telugu", "Marathi", "Tamil", "Gujarati", "Kannada", "Malayalam"].map(lang => (
                <span key={lang} style={{ 
                  padding: "6px 14px", 
                  background: "rgba(255,255,255,0.03)", 
                  borderRadius: "20px", 
                  fontSize: "14px", 
                  color: "rgba(255,255,255,0.6)",
                  border: "1px solid rgba(255,255,255,0.05)"
                }}>
                  {lang}
                </span>
              ))}
            </div>
          </div>
          <div style={{ flex: "1", minWidth: "300px", display: "flex", justifyContent: "center" }}>
            <div style={{ position: "relative" }}>
              <div style={{ 
                width: "300px", 
                height: "300px", 
                borderRadius: "50%", 
                background: "radial-gradient(circle, var(--accent-purple) 0%, transparent 70%)", 
                opacity: 0.2,
                position: "absolute",
                top: "-50px",
                left: "-50px"
              }} />
              <Languages size={200} style={{ color: "var(--accent-gold)", opacity: 0.8 }} />
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section style={{ textAlign: "center", marginBottom: "80px" }}>
          <h2 className="section-heading" style={{ marginBottom: "48px" }}>The Dream Weavers</h2>
          <div style={{ display: "flex", justifyContent: "center", gap: "40px", flexWrap: "wrap" }}>
            {[
              { name: "Rajiv", role: "Creative Architect" },
              { name: "Nishant", role: "Logic Weaver" },
              { name: "Suyash", role: "Visual Dreamer" }
            ].map((member, i) => (
              <motion.div 
                key={member.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                style={{ 
                  width: "220px", 
                  padding: "32px", 
                  background: "rgba(255,255,255,0.02)", 
                  borderRadius: "24px",
                  border: "1px solid rgba(255,255,255,0.05)"
                }}
              >
                <div style={{ 
                  width: "80px", 
                  height: "80px", 
                  borderRadius: "50%", 
                  background: "linear-gradient(135deg, var(--accent-purple), var(--accent-gold))", 
                  margin: "0 auto 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "32px",
                  fontWeight: 800
                }}>
                  {member.name[0]}
                </div>
                <h4 style={{ fontSize: "20px", color: "#fff", marginBottom: "4px" }}>{member.name}</h4>
                <p style={{ fontSize: "14px", color: "var(--accent-gold)", fontWeight: 600 }}>{member.role}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section style={{ textAlign: "center", padding: "100px 0 40px" }}>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="hero-title" style={{ fontSize: " clamp(32px, 5vw, 48px)", marginBottom: "24px" }}>Ready to Weave Your Own Tale?</h2>
            <Link href="/">
              <button className="btn-gold" style={{ padding: "16px 48px", fontSize: "18px" }}>
                Start Your Journey Now
              </button>
            </Link>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer page-container" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "40px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
          <div className="nav-logo" style={{ margin: 0 }}>
            <span>🪄</span> StoryWeave.ai
          </div>
          <p style={{ fontSize: "14px", opacity: 0.5 }}>
            Created with ❤️ by Rajiv x Nishant x Suyash &nbsp;|&nbsp; © 2026
          </p>
          <div style={{ display: "flex", gap: "24px" }}>
            <Link href="#" style={{ color: "inherit", fontSize: "14px", opacity: 0.7 }}>Terms</Link>
            <Link href="#" style={{ color: "inherit", fontSize: "14px", opacity: 0.7 }}>Privacy</Link>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .theme-card {
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 24px;
          transition: all 0.3s ease;
        }
        .theme-card:hover {
          background: rgba(255,255,255,0.04) !important;
          transform: translateY(-8px);
          border-color: rgba(113, 72, 252, 0.3);
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }
        .theme-icon-wrapper {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          alignItems: center;
          justifyContent: center;
        }
      `}</style>
    </div>
  );
}
