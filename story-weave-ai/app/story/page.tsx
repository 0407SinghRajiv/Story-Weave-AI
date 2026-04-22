"use client";
import React, {
  useState, useEffect, Suspense, useMemo, useRef, useCallback
} from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Volume2, VolumeX, Download, Play, Pause,
  Edit3, MoreHorizontal, ChevronDown, BookOpen, Layout,
  Sparkles, Image as ImageIcon, RotateCw, Hash, Check, X, Clock, Trash,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useLanguage, translateText, languageCodeMap, Language } from "@/contexts/LanguageContext";
import { GoogleGenerativeAI } from "@google/generative-ai";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

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

/* ─── Constants ─── */
const THEMES = [
  { id: "fantasy", icon: "🌳", name: "Fantasy" },
  { id: "sci-fi", icon: "🚀", name: "Sci-Fi" },
  { id: "mystery", icon: "🔍", name: "Mystery" },
  { id: "adventure", icon: "🏕️", name: "Adventure" },
  { id: "romance", icon: "💞", name: "Romance" },
];
const LS_KEY = "storyweave_history";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://story-weave-ai.onrender.com";

/* ─── Small atoms ─── */
const StoryImage = ({ prompt, seed, alt }: { prompt: string, seed: number, alt: string }) => {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    
    // Stagger initial fetch to avoid hitting backend/Pollinations all at once
    const initialDelay = (seed % 1000) * 1.5; 
    
    const fetchImage = async (attempts = 3) => {
      try {
        const url = `${API_BASE_URL}/proxy-image?prompt=${encodeURIComponent(prompt)}&seed=${seed}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load");
        const blob = await res.blob();
        if (active) setSrc(URL.createObjectURL(blob));
      } catch (e) {
        if (attempts > 1) {
          console.warn(`Retrying image load for: ${prompt.slice(0, 20)}...`);
          // Increase retry delay to 4 seconds to give Pollinations AI breathing room
          if (active) setTimeout(() => fetchImage(attempts - 1), 4000);
        } else {
          if (active) setError(true);
        }
      }
    };

    const timer = setTimeout(() => {
      fetchImage();
    }, initialDelay);

    return () => { 
      active = false;
      clearTimeout(timer);
    };
  }, [prompt, seed]);

  if (error) {
    return <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: '#ff4444', fontSize: '12px' }}>Failed...</div>;
  }
  if (!src) {
    return <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}><Sparkles size={20} className="animate-spin" style={{ color: 'var(--accent-gold)' }} /></div>;
  }
  return <img src={src} alt={alt} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} crossOrigin="anonymous" />;
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.25em", color: "var(--accent-gold)", marginBottom: "8px" }}>
    {children}
  </p>
);
const Sep = () => <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "18px 0" }} />;

/* ─── LocalStorage helpers ─── */
function loadHistory(): SavedStory[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
function saveToHistory(story: SavedStory) {
  const prev = loadHistory().filter(s => s.id !== story.id);
  localStorage.setItem(LS_KEY, JSON.stringify([story, ...prev].slice(0, 30)));
}

/* ═══════════════════════════════════════════════════════
   Main workspace
 ═══════════════════════════════════════════════════════ */
function PremiumStoryWorkspace() {
  const searchParams = useSearchParams();
  const { t: _t } = useLanguage();

  const initialTheme = searchParams.get("theme") || "Fantasy";
  const initialKwStr = searchParams.get("keywords") || "";
  const initialLanguage = (searchParams.get("language") || "English") as Language;
  const initialLength = searchParams.get("length") || "Short (~500 words)";
  const initialTone = searchParams.get("tone") || "Whimsical";

  /* ─── State ─── */
  const [storyLanguage, setStoryLanguage] = useState<Language>(initialLanguage);
  const [keywords, setKeywords] = useState<string[]>(
    initialKwStr.split(",").map(k => k.trim()).filter(Boolean)
  );
  const [kwInput, setKwInput] = useState("");

  const [theme, setTheme] = useState(initialTheme);
  const [genreOpen, setGenreOpen] = useState(false);
  const genreRef = useRef<HTMLDivElement>(null);

  const [toneVal, setToneVal] = useState(50);
  const [tone, setTone] = useState(initialTone);
  const options = useMemo(() => ({ length: initialLength }), [initialLength]);

  const [activeTab, setActiveTab] = useState<"audio" | "comic">("audio");

  /* TTS shared state (drives both right panel and center Narrate) */
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const [progress, setProgress] = useState(0);  // 0-1 fraction of text spoken
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Map display language names to Sarvam language codes */
  const languageToCode: Record<string, string> = {
    "English": "en-IN",
    "Hindi": "hi-IN",
    "Bengali": "bn-IN",
    "Telugu": "te-IN",
    "Tamil": "ta-IN",
    "Kannada": "kn-IN",
    "Malayalam": "ml-IN",
    "Marathi": "mr-IN",
    "Gujarati": "gu-IN",
    "Odia": "od-IN",
    "Punjabi": "pa-IN",
  };

  /* Edit mode */
  const [isEditing, setIsEditing] = useState(false);
  const [editableStory, setEditableStory] = useState("");

  /* Story */
  const [isGenerating, setIsGenerating] = useState(true);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [generatedStory, setGeneratedStory] = useState("");
  const [storyTitle, setStoryTitle] = useState("Generating…");

  /* Comic */
  const [isGeneratingComic, setIsGeneratingComic] = useState(false);
  const [comicPanels, setComicPanels] = useState<ComicPanel[]>([]);
  const comicRef = useRef<HTMLDivElement>(null);
  const storyTextRef = useRef<HTMLDivElement>(null);
  const textbookRef = useRef<HTMLDivElement>(null);
  const textbookTextOnlyRef = useRef<HTMLDivElement>(null);

  /* Library */
  const [history, setHistory] = useState<SavedStory[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  useEffect(() => { setHistory(loadHistory()); }, []);

  /* Derived */
  const wordCount = useMemo(() => generatedStory.split(/\s+/).filter(Boolean).length, [generatedStory]);

  /* Stable waveform shape (same seed every render) */
  const barHeights = useMemo(() =>
    Array.from({ length: 40 }, (_, i) => Math.round(15 + Math.abs(Math.sin(i * 0.55 + 0.3) * 70))),
    []
  );

  /* ─── Close genre dropdown on outside click ─── */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (genreRef.current && !genreRef.current.contains(e.target as Node)) setGenreOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* ─── Cleanup TTS on unmount ─── */
  useEffect(() => {
    return () => { stopSpeaking(); };
  }, []); // eslint-disable-line

  /* ─── Sarvam AI TTS helpers ─── */
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (progressRef.current) clearInterval(progressRef.current);
    setIsSpeaking(false);
    setIsTtsLoading(false);
    setProgress(0);
  }, []);

  const startSpeaking = useCallback(async (text: string) => {
    if (!text) return;
    stopSpeaking();
    setIsTtsLoading(true);

    const langCode = languageToCode[storyLanguage] || "en-IN";

    try {
      const res = await fetch(`${API_BASE_URL}/text-to-speech`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language_code: langCode, speaker: "anushka" }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("TTS error:", err);
        setIsTtsLoading(false);
        return;
      }

      const data = await res.json();
      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audio_base64), c => c.charCodeAt(0))],
        { type: "audio/wav" }
      );
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.oncanplay = () => {
        setIsTtsLoading(false);
        setIsSpeaking(true);
        setProgress(0);
        audio.play();
      };
      audio.ontimeupdate = () => {
        if (audio.duration > 0) {
          setProgress(audio.currentTime / audio.duration);
        }
      };
      audio.onended = () => {
        setProgress(1);
        setTimeout(() => { setIsSpeaking(false); setProgress(0); URL.revokeObjectURL(audioUrl); }, 500);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        setIsTtsLoading(false);
        setProgress(0);
        audioRef.current = null;
        URL.revokeObjectURL(audioUrl);
      };
      audio.load();
    } catch (e) {
      console.error("TTS fetch failed:", e);
      setIsTtsLoading(false);
    }
  }, [stopSpeaking, storyLanguage]); // eslint-disable-line

  const toggleSpeak = useCallback(() => {
    if (isSpeaking || isTtsLoading) { stopSpeaking(); }
    else { startSpeaking(isEditing ? editableStory : generatedStory); }
  }, [isSpeaking, isTtsLoading, isEditing, editableStory, generatedStory, stopSpeaking, startSpeaking]);

  /* ─── API call ─── */
  const generate = useCallback(async (kws?: string[], overrideTheme?: string, overrideTone?: string, overrideLang?: string) => {
    const startTime = performance.now();
    setIsGenerating(true);
    setGenerationTime(null);
    setGeneratedStory("");
    setStoryTitle("Weaving your tale…");
    setIsEditing(false);
    stopSpeaking();

    const usedTheme = overrideTheme || theme;
    const usedTone = overrideTone || tone;
    const usedKws = kws || keywords;
    const usedLang = overrideLang || storyLanguage;

    try {
      const res = await fetch(`${API_BASE_URL}/generate-story`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: usedTheme, keywords: usedKws.join(", "), language: usedLang, length: options.length, tone: usedTone }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const story = data.story || "";
      const title = data.title || usedTheme;
      setGeneratedStory(story);
      setStoryTitle(title);
      
      const endTime = performance.now();
      setGenerationTime(Math.round(((endTime - startTime) / 1000) * 10) / 10);

      /* ── Save to localStorage ── */
      const storyId = Date.now().toString();
      const entry: SavedStory = {
        id: storyId,
        title,
        story,
        theme: usedTheme,
        keywords: usedKws.join(", "),
        tone: usedTone,
        wordCount: story.split(/\s+/).filter(Boolean).length,
        createdAt: new Date().toISOString(),
      };
      saveToHistory(entry);
      setHistory(loadHistory());

      executeComicGeneration(story, title, usedTheme, storyId);
    } catch {
      const fallback = "The year was 2342. On Titan, Saturn's largest moon, Detective Alex Thorne gazed out at the methane lakes shimmering under a distant sun.\n\nAs he stepped outside the station, the frost crunched beneath his boots. A message blinked on his wrist display — unknown sender, no coordinates. Just three words:\n\n\"They are watching.\"\n\nThorne closed his coat against the bitter cold and began to walk.";
      setGeneratedStory(fallback);
      setStoryTitle(usedTheme);
    } finally {
      setIsGenerating(false);
    }
  }, [theme, keywords, options, tone, stopSpeaking, storyLanguage]); // eslint-disable-line

  /* ─── Story Pages & PDF ─── */
  const executeComicGeneration = async (storyText: string, title: string, themeStr: string, storyId?: string) => {
    setIsGeneratingComic(true);
    setComicPanels([]);
    try {
      const res = await fetch(`${API_BASE_URL}/generate-story-pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story: storyText, theme: themeStr }),
      });

      if (!res.ok) throw new Error("Failed to generate story pages from backend");

      const data = await res.json();
      if (!data.pages) throw new Error("Invalid response format from backend");

      const panels: ComicPanel[] = data.pages.map((p: any) => ({
        description: p.image_prompt,
        narration: p.narration
      }));

      setComicPanels(panels);

      setHistory(prev => {
        const h = [...prev];
        const idx = storyId ? h.findIndex(s => s.id === storyId) : h.findIndex(s => s.story === storyText);
        if (idx !== -1) {
          h[idx].comicPanels = panels;
          localStorage.setItem(LS_KEY, JSON.stringify(h));
        }
        return h;
      });
    } catch (err) {
      console.error("Story pages generation failed:", err);
      setComicPanels([
        { description: `A stylized illustration for ${title}`, narration: "The adventure begins..." },
        { description: `Characters exploring a ${themeStr} setting`, narration: "They venture further into the unknown." }
      ]);
    } finally {
      setIsGeneratingComic(false);
    }
  };

  const downloadPDF = async (mode: 'storybook' | 'text-only' = 'storybook') => {
    const ref = mode === 'storybook' ? textbookRef : textbookTextOnlyRef;
    if (!ref.current || isExportingPDF) return;
    if (!generatedStory) {
      alert("Please wait for the story to be generated first.");
      return;
    }
    
    setIsExportingPDF(true);
    try {
      const element = ref.current;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        onclone: (clonedDoc) => {
          const el = clonedDoc.querySelector('.textbook-export-container') as HTMLElement;
          if (el) {
            el.style.position = 'relative';
            el.style.left = '0';
            el.style.top = '0';
            el.style.display = 'block';
            el.style.visibility = 'visible';
          }
        }
      });

      const imgWidth = 595.28; // A4 width in pt
      const pageHeight = 841.89; // A4 height in pt
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const pdf = new jsPDF('p', 'pt', 'a4');
      let position = 0;

      const imgData = canvas.toDataURL('image/jpeg', 0.90);

      // Add the first page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add remaining pages
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const safeTitle = storyTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() || "story";
      const suffix = mode === 'storybook' ? '_storybook' : '';
      pdf.save(`${safeTitle}${suffix}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Sorry, there was an error generating your PDF. Please try again.");
    } finally {
      setIsExportingPDF(false);
    }
  };

  const downloadStoryPDF = async () => {
    downloadPDF('text-only'); 
  };

  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const id = searchParams.get("id");
    const shouldGenerate = searchParams.get("generate") === "true";

    if (shouldGenerate) {
      const url = new URL(window.location.href);
      url.searchParams.delete("generate");
      window.history.replaceState({}, "", url.toString());
      generate(undefined, undefined, undefined, initialLanguage);
    } else if (id) {
      const h = loadHistory();
      const story = h.find(s => s.id === id);
      if (story) {
        loadFromHistory(story);
      } else if (h.length > 0) {
        loadFromHistory(h[0]);
      } else {
        generate(undefined, undefined, undefined, initialLanguage);
      }
    } else {
      const h = loadHistory();
      if (h.length > 0) loadFromHistory(h[0]);
      else generate(undefined, undefined, undefined, initialLanguage);
    }
  }, []); // eslint-disable-line

  const addKw = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (kwInput.trim()) {
        setKeywords(p => [...p, kwInput.trim()]);
        setKwInput("");
      }
    }
  };

  const handleThemeSelect = (th: typeof THEMES[0]) => {
    setTheme(th.name);
    setGenreOpen(false);
    generate(undefined, th.name);
  };

  const loadFromHistory = (s: SavedStory) => {
    stopSpeaking();
    setGeneratedStory(s.story);
    setStoryTitle(s.title);
    setTheme(s.theme);
    setKeywords(s.keywords ? s.keywords.split(",").map(k => k.trim()) : []);
    setComicPanels(s.comicPanels || []);
    setIsEditing(false);
    setIsGenerating(false);
  };

  const requestDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const confirmDelete = () => {
    if (!confirmDeleteId) return;
    const h = loadHistory().filter(s => s.id !== confirmDeleteId);
    localStorage.setItem(LS_KEY, JSON.stringify(h));
    setHistory(h);
    setConfirmDeleteId(null);
  };

  const cancelDelete = () => setConfirmDeleteId(null);

  const activeStart = Math.floor(progress * 40);
  const activeEnd = Math.min(activeStart + 10, 40);

  /* ════════════════════════ RENDER ════════════════════════ */
  return (
    <>
      <Navbar />
      <div className="workspace-container" style={{ display: "flex", flexDirection: "column", padding: "20px 28px", maxWidth: "1700px", margin: "0 auto", width: "100%", boxSizing: "border-box", height: "calc(100vh - 88px)", overflow: "hidden" }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="workspace-grid"
        >

          {/* ══════════ LEFT PANEL ══════════ */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.5 }}
            style={{ background: "linear-gradient(160deg, rgba(22,14,44,0.95) 0%, rgba(11,6,22,0.98) 100%)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "18px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)", minHeight: "400px" }}
          >
            <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid rgba(113,72,252,0.2)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Layout size={14} style={{ color: "var(--text-muted)" }} />
                <span style={{ fontFamily: "Cinzel, serif", fontSize: "11px", fontWeight: 700, letterSpacing: "0.2em", color: "rgba(255,255,255,0.85)", textTransform: "uppercase" }}>Workspace</span>
              </div>
            </div>

            <div className="custom-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
              <Label>Keywords</Label>
              <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "10px 12px", display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center", minHeight: "46px" }}>
                <Search size={12} style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                {keywords.map((kw, i) => (
                  <span key={`kw-${i}`} style={{ background: "rgba(113,72,252,0.18)", border: "1px solid rgba(113,72,252,0.35)", color: "rgba(255,255,255,0.9)", fontSize: "11px", padding: "3px 8px 3px 10px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "5px", fontWeight: 500 }}>
                    {kw}
                    <button onClick={() => setKeywords(p => p.filter((_, j) => j !== i))} style={{ color: "rgba(113,72,252,0.7)", cursor: "pointer", border: "none", background: "none", padding: 0, fontSize: "13px", lineHeight: 1 }}>×</button>
                  </span>
                ))}
                <input value={kwInput} onChange={e => setKwInput(e.target.value)} onKeyDown={addKw} placeholder="Add keyword…" style={{ background: "none", border: "none", outline: "none", color: "#fff", fontSize: "12px", flex: 1, minWidth: "70px", fontFamily: "Outfit, sans-serif" }} />
              </div>

              <Sep />
              <Label>Genre</Label>
              <div ref={genreRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setGenreOpen(o => !o)}
                  style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: `1px solid ${genreOpen ? "rgba(113,72,252,0.5)" : "rgba(255,255,255,0.07)"}`, borderRadius: "12px", padding: "11px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", color: "rgba(255,255,255,0.9)", fontSize: "13px", fontFamily: "Outfit, sans-serif", fontWeight: 500, transition: "border-color 0.2s", boxSizing: "border-box" }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {THEMES.find(t => t.name === theme)?.icon || "🌟"} {theme}
                  </span>
                  <motion.span animate={{ rotate: genreOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={14} style={{ color: "var(--accent-purple)" }} />
                  </motion.span>
                </button>
                <AnimatePresence>
                  {genreOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.15 }}
                      style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "rgba(18,10,36,0.98)", border: "1px solid rgba(113,72,252,0.3)", borderRadius: "14px", overflow: "hidden", zIndex: 50, boxShadow: "0 16px 40px rgba(0,0,0,0.6)", backdropFilter: "blur(20px)" }}
                    >
                      {THEMES.map(th => {
                        const sel = th.name === theme;
                        return (
                          <button
                            key={th.id}
                            onClick={() => handleThemeSelect(th)}
                            style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "11px 16px", background: sel ? "rgba(113,72,252,0.15)" : "transparent", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.85)", fontSize: "13px", fontFamily: "Outfit, sans-serif", fontWeight: sel ? 600 : 400, textAlign: "left", transition: "background 0.15s" }}
                          >
                            <span style={{ fontSize: "16px" }}>{th.icon}</span>
                            <span style={{ flex: 1 }}>{th.name}</span>
                            {sel && <Check size={13} style={{ color: "var(--accent-gold)" }} />}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Sep />
              <Label>Narrative Tone</Label>
              <input type="range" min="0" max="100" value={toneVal} onChange={e => { const v = Number(e.target.value); setToneVal(v); setTone(v < 33 ? "Exciting" : v < 66 ? "Whimsical" : "Serious"); }} style={{ width: "100%", accentColor: "var(--accent-purple)", cursor: "pointer", marginBottom: "6px" }} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {["Exciting", "Whimsical", "Serious"].map(label => (
                  <span key={label} style={{ fontSize: "10px", fontWeight: 600, color: tone === label ? "var(--accent-gold)" : "var(--text-muted)", transition: "color 0.3s" }}>{label}</span>
                ))}
              </div>

              <Sep />
              <motion.button
                whileTap={{ scale: 0.97 }} onClick={() => generate()} disabled={isGenerating}
                style={{ width: "100%", padding: "12px 0", background: isGenerating ? "rgba(113,72,252,0.25)" : "linear-gradient(135deg, var(--accent-purple) 0%, #5225e6 100%)", border: "none", borderRadius: "12px", color: "#fff", fontFamily: "Outfit, sans-serif", fontSize: "12px", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", cursor: isGenerating ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", boxShadow: isGenerating ? "none" : "0 8px 24px rgba(113,72,252,0.35)", transition: "all 0.3s" }}
              >
                <Sparkles size={14} className={isGenerating ? "animate-spin" : ""} />
                {isGenerating ? "Weaving…" : "Regenerate"}
              </motion.button>

              <Sep />
              <Label>Library ({history.length})</Label>
              {history.length === 0 ? (
                <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", padding: "12px 0" }}>No stories yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {history.slice(0, 8).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => loadFromHistory(s)}
                      style={{ background: history[0]?.id === s.id && !isEditing ? "rgba(113,72,252,0.13)" : "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "10px", padding: "9px 12px", cursor: "pointer", textAlign: "left", width: "100%", display: "flex", gap: "9px", alignItems: "flex-start" }}
                    >
                      <BookOpen size={12} style={{ color: "var(--accent-purple)", flexShrink: 0, marginTop: "2px" }} />
                      <div style={{ overflow: "hidden", flex: 1 }}>
                        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "2px" }}>{s.title}</p>
                        <p style={{ fontSize: "10px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Clock size={8} /> {new Date(s.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div onClick={(e) => { e.stopPropagation(); requestDelete(e, s.id); }} style={{ color: "rgba(255,255,255,0.3)", padding: "4px" }}><Trash size={12} /></div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.aside>

          {/* ══════════ CENTER PANEL ══════════ */}
          <motion.main
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.5 }}
            style={{ background: "linear-gradient(150deg, rgba(24,15,47,0.96) 0%, rgba(11,6,22,0.98) 100%)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "18px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.55)", minHeight: "500px" }}
          >
            <div ref={storyTextRef} style={{ display: "flex", flexDirection: "column", height: "100%", background: "inherit" }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.2)", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: isGenerating ? "rgba(255,255,255,0.3)" : (isSpeaking ? "#22c55e" : "var(--accent-gold)"), boxShadow: isSpeaking ? "0 0 12px #22c55e" : "none", flexShrink: 0 }} />
                  <h1 style={{ fontFamily: "Cinzel, serif", fontSize: "16px", fontWeight: 700, color: "#fff", letterSpacing: "0.04em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{storyTitle}</h1>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                  {generationTime !== null && (
                    <span style={{ fontSize: "11px", color: "var(--accent-gold)", background: "rgba(255, 201, 102, 0.1)", borderRadius: "20px", padding: "3px 10px", fontWeight: 600 }}>
                      Generated in {generationTime}s
                    </span>
                  )}
                  {!isGenerating && <span style={{ fontSize: "11px", color: "var(--text-muted)", background: "rgba(255,255,255,0.04)", borderRadius: "20px", padding: "3px 10px" }}><Hash size={10} /> {wordCount} words</span>}
                </div>
              </div>

              <div className="custom-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "36px 28px" }}>
                <div style={{ maxWidth: "680px", margin: "0 auto" }}>
                  <AnimatePresence mode="wait">
                    {isGenerating ? (
                      <motion.div key="loading-story" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "60px", gap: "24px" }}>
                        <Sparkles size={32} style={{ color: "var(--accent-gold)" }} className="animate-pulse" />
                        <p style={{ fontFamily: "Cinzel, serif", fontSize: "12px", fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>Weaving Magic…</p>
                      </motion.div>
                    ) : isEditing ? (
                      <motion.textarea
                        key="editor-box" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        value={editableStory} onChange={e => setEditableStory(e.target.value)}
                        style={{ width: "100%", minHeight: "400px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(113,72,252,0.4)", borderRadius: "12px", padding: "20px", color: "rgba(220,215,240,0.9)", fontSize: "16px", lineHeight: "1.9", fontFamily: "Outfit, sans-serif", resize: "none", outline: "none" }}
                      />
                    ) : (
                      <motion.div key="story-content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                        {generatedStory.split(/\n\n+/).map((para, i) => (
                          <p key={`p-${i}`} style={{ fontSize: "17px", lineHeight: "1.9", color: "rgba(220,215,240,0.88)", marginBottom: "22px", textAlign: "justify" }}>{para}</p>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div style={{ padding: "12px 22px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "10px", background: "rgba(0,0,0,0.2)", flexShrink: 0 }}>
              <button onClick={toggleSpeak} disabled={isGenerating || isEditing} style={{ flex: 1, padding: "10px 0", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: (isSpeaking || isTtsLoading) ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.03)", color: (isSpeaking || isTtsLoading) ? "#22c55e" : "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                {isTtsLoading ? "Preparing…" : isSpeaking ? "Stop" : "Narrate"}
              </button>
              {isEditing ? (
                <>
                  <button onClick={() => { setGeneratedStory(editableStory); setIsEditing(false); }} style={{ flex: 1, padding: "10px 0", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #16a34a, #15803d)", color: "#fff", fontSize: "13px", fontWeight: 700 }}>Save</button>
                  <button onClick={() => setIsEditing(false)} style={{ flex: 1, padding: "10px 0", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "#fff", fontSize: "13px", fontWeight: 600 }}>Cancel</button>
                </>
              ) : (
                <button onClick={() => { setEditableStory(generatedStory); setIsEditing(true); stopSpeaking(); }} disabled={isGenerating} style={{ flex: 1, padding: "10px 0", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, var(--accent-purple) 0%, #5225e6 100%)", color: "#fff", fontSize: "13px", fontWeight: 700 }}>Edit</button>
              )}
            </div>
          </motion.main>

          {/* ══════════ RIGHT PANEL — Media Studio ══════════ */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25, duration: 0.5 }}
            style={{ background: "linear-gradient(160deg, rgba(22,14,44,0.95) 0%, rgba(11,6,22,0.98) 100%)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "18px", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 48px rgba(0,0,0,0.5)", minHeight: "450px" }}
          >
            <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "relative", flexShrink: 0 }}>
              {(["audio", "comic"] as const).map(tab => (
                <button key={`tab-btn-${tab}`} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: "15px 0", background: "none", border: "none", cursor: "pointer", fontFamily: "Outfit, sans-serif", fontSize: "11px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: activeTab === tab ? "var(--accent-gold)" : "rgba(255,255,255,0.3)", transition: "color 0.25s" }}>
                  {tab === "audio" ? "Audio" : "Storybook"}
                </button>
              ))}
              <div style={{ position: "absolute", bottom: 0, left: activeTab === "audio" ? "0%" : "50%", width: "50%", height: "2px", background: "var(--accent-gold)", transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }} />
            </div>

            <div className="custom-scrollbar" style={{ flex: 1, overflowY: "auto", padding: "22px 20px" }}>
              {/* Audio View */}
              <div key="audio-view" style={{ display: activeTab === "audio" ? "block" : "none" }}>

                {/* Voice Info Badge */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", padding: "10px 14px", background: "rgba(113,72,252,0.08)", borderRadius: "10px", border: "1px solid rgba(113,72,252,0.15)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Volume2 size={14} style={{ color: "var(--accent-gold)" }} />
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>AI Narrator</span>
                  </div>
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)", padding: "3px 8px", borderRadius: "20px" }}>Anushka · {storyLanguage}</span>
                </div>

                {/* Play / Pause Button */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                  <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={toggleSpeak}
                    disabled={isGenerating}
                    style={{ width: "72px", height: "72px", borderRadius: "50%", background: isSpeaking ? "var(--accent-purple)" : isTtsLoading ? "rgba(255,200,80,0.15)" : "rgba(255,255,255,0.05)", border: `2px solid ${isSpeaking ? "var(--accent-purple)" : isTtsLoading ? "var(--accent-gold)" : "rgba(113,72,252,0.4)"}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: isGenerating ? "not-allowed" : "pointer", transition: "all 0.3s ease", boxShadow: isSpeaking ? "0 0 24px rgba(113,72,252,0.4)" : "none" }}
                  >
                    {isTtsLoading
                      ? <RotateCw size={26} style={{ color: "var(--accent-gold)", animation: "spin 1s linear infinite" }} />
                      : isSpeaking
                        ? <Pause size={26} style={{ color: "#fff" }} />
                        : <Play size={26} style={{ color: "#fff" }} />
                    }
                  </motion.button>
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.05em" }}>
                    {isTtsLoading ? "Preparing audio…" : isSpeaking ? "Tap to pause" : "Tap to narrate"}
                  </span>
                </div>

                {/* Waveform Visualizer + Progress */}
                <div style={{ background: "rgba(0,0,0,0.35)", borderRadius: "14px", padding: "16px 16px 12px", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "44px", marginBottom: "10px" }}>
                    {barHeights.map((h, i) => (
                      <div
                        key={`wave-bar-${i}`}
                        style={{
                          flex: 1,
                          height: isSpeaking ? `${h}%` : "10%",
                          background: i / 40 < progress ? "var(--accent-gold)" : "rgba(255,255,255,0.1)",
                          borderRadius: "2px",
                          transition: "height 0.15s ease, background 0.3s ease"
                        }}
                      />
                    ))}
                  </div>
                  {/* Progress Bar */}
                  <div style={{ height: "2px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${progress * 100}%`, background: "var(--accent-gold)", borderRadius: "2px", transition: "width 0.3s linear" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                    <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>
                      <Clock size={9} style={{ display: "inline", marginRight: "3px" }} />
                      {isSpeaking ? `${Math.round(progress * 100)}%` : "0%"}
                    </span>
                    <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.3)" }}>
                      ~{Math.ceil(wordCount / 130)} min read
                    </span>
                  </div>
                </div>

                {/* Download Button */}
                <button onClick={downloadStoryPDF} disabled={isGenerating || isExportingPDF} style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: isExportingPDF ? "var(--accent-gold)" : "#fff", fontWeight: 600, cursor: (isGenerating || isExportingPDF) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  {isExportingPDF ? <RotateCw size={14} className="animate-spin" /> : <Download size={14} />}
                  {isExportingPDF ? "Capturing Pages..." : "Download Story PDF"}
                </button>
              </div>

              {/* Storybook View */}
              <div key="comic-view" style={{ display: activeTab === "comic" ? "block" : "none" }}>
                <div ref={comicRef} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {(comicPanels.length > 0 ? comicPanels : []).map((panel, i) => (
                    <div key={`panel-card-${i}`} className="story-page-pdf-export" style={{ background: "#0b0616", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", paddingBottom: "16px" }}>
                      <div style={{ width: "100%", aspectRatio: "16/9" }}>
                        <StoryImage prompt={panel.description + " digital storybook illustration"} seed={i * 100} alt={`Panel ${i + 1}`} />
                      </div>
                      <div style={{ padding: "16px" }}>
                        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.9)", textAlign: "center", lineHeight: 1.6 }}>{panel.narration}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {comicPanels.length > 0 && (
                  <button onClick={() => downloadPDF()} disabled={isExportingPDF} style={{ width: "100%", padding: "12px", background: "var(--accent-purple)", borderRadius: "12px", color: "#fff", fontWeight: 700, border: "none", marginTop: "20px", cursor: isExportingPDF ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    {isExportingPDF ? <RotateCw size={14} className="animate-spin" /> : <Download size={14} />}
                    {isExportingPDF ? "Capturing Pages..." : "Download Storybook PDF"}
                  </button>
                )}
              </div>
            </div>
          </motion.aside>

        </motion.div>
      </div>

      <AnimatePresence>
        {confirmDeleteId && (
          <motion.div key="delete-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} style={{ background: "#120a24", padding: "30px", borderRadius: "20px", textAlign: "center", maxWidth: "340px" }}>
              <h3 style={{ color: "#fff", marginBottom: "10px" }}>Delete Story?</h3>
              <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "20px" }}>Action cannot be undone.</p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={cancelDelete} style={{ flex: 1, padding: "10px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", color: "#fff", border: "none" }}>Cancel</button>
                <button onClick={confirmDelete} style={{ flex: 1, padding: "10px", borderRadius: "10px", background: "#ef4444", color: "#fff", border: "none" }}>Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Textbook Export Template (ILLUSTRATED) */}
      <div 
        ref={textbookRef} 
        className="textbook-export-container"
        style={{ position: 'absolute', left: '-9999px', top: 0, width: '595.28pt', background: 'white' }}
      >
        <div style={{ padding: '60pt 72pt' }}>
          <div style={{ height: '720pt', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderBottom: '1px solid #eee', marginBottom: '40pt' }}>
            <h1 className="textbook-title" style={{ fontSize: '36pt', border: 'none', marginBottom: '20pt', textAlign: 'center' }}>{storyTitle}</h1>
            <div style={{ width: '40pt', height: '2pt', background: '#000', marginBottom: '20pt' }} />
            <p style={{ fontSize: '14pt', fontStyle: 'italic', color: '#444' }}>A Story Generated by StoryWeave AI</p>
          </div>

          {comicPanels.length > 0 ? (
            comicPanels.map((panel, idx) => (
              <div key={`pdf-panel-${idx}`} style={{ marginBottom: '40pt', breakInside: 'avoid' }}>
                <img 
                  src={`http://127.0.0.1:8000/proxy-image?prompt=${encodeURIComponent(panel.description + " digital storybook illustration")}&seed=${idx * 100}`}
                  crossOrigin="anonymous"
                  style={{ width: '100%', borderRadius: '8px', marginBottom: '20pt' }} 
                  alt="Story scene"
                />
                <div className="textbook-content">
                  <p style={{ fontSize: '12pt', lineHeight: '1.6', textAlign: 'justify' }}>{panel.narration}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="textbook-content">
              {generatedStory.split(/\n\n+/).map((para, i) => (
                <p key={`pdf-para-${i}`} style={{ marginBottom: '15pt', fontSize: '12pt', lineHeight: '1.6', textAlign: 'justify' }}>{para}</p>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hidden Textbook Export Template (TEXT ONLY) */}
      <div 
        ref={textbookTextOnlyRef} 
        className="textbook-export-container"
        style={{ position: 'absolute', left: '-9999px', top: 0, width: '595.28pt', background: 'white' }}
      >
        <div style={{ padding: '60pt 72pt' }}>
          <div style={{ height: '720pt', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderBottom: '1px solid #eee', marginBottom: '40pt' }}>
            <h1 className="textbook-title" style={{ fontSize: '36pt', border: 'none', marginBottom: '20pt', textAlign: 'center' }}>{storyTitle}</h1>
            <div style={{ width: '40pt', height: '2pt', background: '#000', marginBottom: '20pt' }} />
            <p style={{ fontSize: '14pt', fontStyle: 'italic', color: '#444' }}>A Story Generated by StoryWeave AI</p>
          </div>

          <div className="textbook-content">
            {generatedStory.split(/\n\n+/).map((para, i) => (
              <p key={`pdf-textonly-para-${i}`} style={{ marginBottom: '15pt', fontSize: '12pt', lineHeight: '1.6', textAlign: 'justify' }}>{para}</p>
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

export default function StoryPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div style={{ minHeight: "100vh", background: "#0b0616" }} />;
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0b0616" }} />}>
      <PremiumStoryWorkspace />
    </Suspense>
  );
}
