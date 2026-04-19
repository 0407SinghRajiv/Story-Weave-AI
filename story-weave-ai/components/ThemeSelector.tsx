"use client";

const THEMES = [
  { id: "fantasy", icon: "🌳", name: "Fantasy", desc: "A land of magic, mystical creatures, and epic adventures.", accent: "#ffc966" },
  { id: "sci-fi", icon: "🚀", name: "Sci-Fi", desc: "Futuristic worlds, advanced technology, and space exploration.", accent: "#60a5fa" },
  { id: "mystery", icon: "🔍", name: "Mystery", desc: "Unraveling secrets, solving crimes, and suspenseful twists.", accent: "#a78bfa" },
  { id: "adventure", icon: "🏕️", name: "Adventure", desc: "Thrilling journeys, daring exploits, and global quests.", accent: "#34d399" },
  { id: "romance", icon: "💞", name: "Romance", desc: "Tales of love, relationships, and emotional journeys.", accent: "#f472b6" },
  { id: "horror", icon: "👻", name: "Horror", desc: "Dark tales of fear, dread, and the terrifying unknown.", accent: "#ef4444" },
  { id: "historical", icon: "🏰", name: "Historical", desc: "Epic sagas set in the grandeur of ancient civilisations.", accent: "#b4823c" },
];

interface Props {
  selectedTheme: string;
  setSelectedTheme: (t: string) => void;
}

import { useLanguage } from "@/contexts/LanguageContext";

export default function ThemeSelector({ selectedTheme, setSelectedTheme }: Props) {
  const { t } = useLanguage();
  return (
    <div className="theme-grid">
      {THEMES.map(theme => {
        const selected = selectedTheme === theme.id;
        return (
          <div
            key={theme.id}
            className="theme-card"
            data-selected={selected}
            data-theme={theme.id}
            onClick={() => setSelectedTheme(theme.id)}
          >
            <div className="theme-check">
              {selected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
            </div>
            <div className="theme-icon-wrapper">
              <span className="theme-icon">{theme.icon}</span>
              <span className="theme-title" style={{ color: selected ? theme.accent : '#fff' }}>
                {t(theme.name)}
              </span>
            </div>
            <p className="theme-desc">{t(theme.desc)}</p>
          </div>
        );
      })}
    </div>
  );
}
