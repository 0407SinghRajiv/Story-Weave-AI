"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, Clock, Trash, Search, Filter, 
  ChevronRight, Book, Sparkles, Hash, Calendar, ArrowLeft
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";

/* ─── Types ─── */
interface ComicPanel {
  description: string;
  narration: string;
}

interface SavedStory {
  id: string;
  title: string;
  story: string;
  theme: string;
  keywords: string;
  tone: string;
  wordCount: number;
  createdAt: string;
  comicPanels?: ComicPanel[];
}

const LS_KEY = "storyweave_history";

export default function LibraryPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [stories, setStories] = useState<SavedStory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("All");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadStories = () => {
      try {
        const saved = localStorage.getItem(LS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setStories(parsed);
        }
      } catch (e) {
        console.error("Failed to load stories from history", e);
      }
      setIsLoaded(true);
    };

    loadStories();
  }, []);

  const deleteStory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm("Are you sure you want to delete this story?")) {
      const updated = stories.filter(s => s.id !== id);
      setStories(updated);
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
    }
  };

  const themes = ["All", ...Array.from(new Set(stories.map(s => s.theme)))];

  const filteredStories = stories.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.keywords.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTheme = selectedTheme === "All" || s.theme === selectedTheme;
    return matchesSearch && matchesTheme;
  });

  const getThemeIcon = (theme: string) => {
    const lower = theme.toLowerCase();
    if (lower.includes("fantasy")) return "🌳";
    if (lower.includes("sci-fi") || lower.includes("space")) return "🚀";
    if (lower.includes("mystery")) return "🔍";
    if (lower.includes("adventure")) return "🏕️";
    if (lower.includes("romance")) return "💞";
    return "🌟";
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="page-container" style={{ padding: "48px 24px", minHeight: "calc(100vh - 88px)" }}>
        {/* Header Section */}
        <header style={{ marginBottom: "48px", textAlign: "center" }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="hero-title" style={{ fontSize: "clamp(32px, 5vw, 48px)", marginBottom: "12px" }}>
              Your Magical Library
            </h1>
            <p className="hero-tagline" style={{ margin: "0 auto", opacity: 0.7 }}>
              Revisit the tales you've woven throughout your journey.
            </p>
          </motion.div>
        </header>

        {/* Controls Section */}
        <section style={{ 
          display: "flex", 
          flexWrap: "wrap", 
          gap: "16px", 
          marginBottom: "32px",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          {/* Search Bar */}
          <div style={{ 
            position: "relative", 
            flex: "1", 
            minWidth: "280px",
            maxWidth: "500px" 
          }}>
            <Search 
              size={18} 
              style={{ 
                position: "absolute", 
                left: "16px", 
                top: "50%", 
                transform: "translateY(-50%)", 
                color: "var(--text-muted)" 
              }} 
            />
            <input 
              type="text" 
              placeholder="Search stories by title or keywords..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                width: "100%", 
                padding: "14px 16px 14px 48px", 
                background: "rgba(255,255,255,0.05)", 
                border: "1px solid var(--glass-border)", 
                borderRadius: "14px", 
                color: "#fff", 
                fontFamily: "inherit",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.3s ease"
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--accent-purple)"}
              onBlur={(e) => e.target.style.borderColor = "var(--glass-border)"}
            />
          </div>

          {/* Theme Filters */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {themes.map(theme => (
              <button
                key={theme}
                onClick={() => setSelectedTheme(theme)}
                style={{
                  padding: "10px 18px",
                  borderRadius: "12px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  background: selectedTheme === theme ? "var(--accent-purple)" : "rgba(255,255,255,0.05)",
                  border: "1px solid",
                  borderColor: selectedTheme === theme ? "var(--accent-purple)" : "var(--glass-border)",
                  color: selectedTheme === theme ? "#fff" : "var(--text-muted)"
                }}
              >
                {theme}
              </button>
            ))}
          </div>
        </section>

        {/* Stories Grid */}
        {!isLoaded ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "100px 0" }}>
            <Sparkles size={48} className="animate-spin" style={{ color: "var(--accent-gold)" }} />
          </div>
        ) : filteredStories.length > 0 ? (
          <motion.div 
            layout
            style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", 
              gap: "24px" 
            }}
          >
            <AnimatePresence>
              {filteredStories.map((story, index) => (
                <motion.div
                  key={story.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ y: -8 }}
                  style={{ position: "relative" }}
                >
                  <div className="theme-card" 
                    onClick={() => router.push(`/story?id=${story.id}`)}
                    style={{ 
                      cursor: "pointer",
                      height: "100%", 
                      display: "flex", 
                      flexDirection: "column",
                      padding: "24px",
                      background: "linear-gradient(160deg, rgba(26, 17, 47, 0.8) 0%, rgba(18, 12, 33, 0.9) 100%)",
                      minHeight: "220px"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                        <div className="theme-icon-wrapper" style={{ margin: 0 }}>
                          <span className="theme-icon" style={{ fontSize: "32px" }}>
                            {getThemeIcon(story.theme)}
                          </span>
                        </div>
                        {/* Placeholder for visual balance, actual delete button is absolutely positioned below */}
                        <div style={{ width: "32px" }} />
                      </div>

                      <h3 style={{ 
                        fontSize: "20px", 
                        fontWeight: 700, 
                        color: "#fff", 
                        marginBottom: "12px",
                        lineHeight: 1.3
                      }}>
                        {story.title}
                      </h3>

                      <div style={{ marginTop: "auto" }}>
                        <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                          <span style={{ 
                            fontSize: "11px", 
                            color: "var(--accent-gold)", 
                            background: "rgba(255, 201, 102, 0.1)", 
                            padding: "3px 10px", 
                            borderRadius: "20px",
                            fontWeight: 600
                          }}>
                            {story.theme}
                          </span>
                          <span style={{ 
                            fontSize: "11px", 
                            color: "var(--text-muted)", 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "4px" 
                          }}>
                            <Hash size={10} /> {story.wordCount} words
                          </span>
                        </div>

                        <div style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center",
                          borderTop: "1px solid rgba(255,255,255,0.06)",
                          paddingTop: "12px"
                        }}>
                          <span style={{ 
                            fontSize: "11px", 
                            color: "rgba(255,255,255,0.4)", 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "6px" 
                          }}>
                            <Calendar size={12} /> {new Date(story.createdAt).toLocaleDateString()}
                          </span>
                          <span style={{ 
                            color: "var(--accent-purple)", 
                            fontSize: "12px", 
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                          }}>
                            Read Now <ChevronRight size={14} />
                          </span>
                        </div>
                      </div>
                  </div>

                  {/* Absolute Delete Button — outside the clickable card div */}
                  <button 
                    onClick={(e) => deleteStory(e, story.id)}
                    style={{
                      position: "absolute",
                      top: "24px",
                      right: "24px",
                      zIndex: 10,
                      background: "rgba(255, 68, 68, 0.1)",
                      border: "1px solid rgba(255, 68, 68, 0.2)",
                      padding: "8px",
                      borderRadius: "10px",
                      color: "#ff4444",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255, 68, 68, 0.3)";
                      e.currentTarget.style.transform = "scale(1.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255, 68, 68, 0.1)";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                    title="Delete Story"
                  >
                    <Trash size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ 
              textAlign: "center", 
              padding: "80px 0",
              background: "rgba(255,255,255,0.02)",
              borderRadius: "24px",
              border: "1px dashed var(--glass-border)"
            }}
          >
            <BookOpen size={48} style={{ color: "var(--text-muted)", marginBottom: "16px", opacity: 0.3 }} />
            <h3 style={{ color: "#fff", marginBottom: "8px" }}>No stories found</h3>
            <p className="hero-tagline" style={{ maxWidth: "300px", fontSize: "14px", marginBottom: "24px" }}>
              {searchQuery || selectedTheme !== "All" 
                ? "Try adjusting your filters to find what you're looking for." 
                : "You haven't woven any tales yet. Start your journey now!"}
            </p>
            <Link href="/">
              <button className="btn-gold">
                Create Your First Story
              </button>
            </Link>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer page-container">
        <p>Created by Rajiv x Nishant x Suyash &nbsp;|&nbsp; <a href="#">Terms of Service</a> &nbsp; <a href="#">Privacy Policy</a></p>
      </footer>

      <style jsx>{`
        .animate-spin {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
