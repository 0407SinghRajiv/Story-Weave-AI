"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Language = "English" | "Hindi" | "Bengali" | "Telugu" | "Marathi" | "Tamil" | "Gujarati" | "Kannada" | "Malayalam" | "Punjabi" | "Spanish" | "French";

export const languageCodeMap: Record<Language, string> = {
  English: "en",
  Hindi: "hi",
  Bengali: "bn",
  Telugu: "te",
  Marathi: "mr",
  Tamil: "ta",
  Gujarati: "gu",
  Kannada: "kn",
  Malayalam: "ml",
  Punjabi: "pa",
  Spanish: "es",
  French: "fr",
};

export const translateText = async (text: string, targetLangCode: string): Promise<string> => {
  if (!text || targetLangCode === "en") return text;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLangCode}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    const data = await res.json();
    return data[0].map((item: any) => item[0]).join('');
  } catch (error) {
    console.error("Translation API error:", error);
    return text;
  }
};

const defaultUIStrings = [
  "Home", "Library", "About", "Create Story",
  "Input Keywords", "Enter keywords to weave your story.", "Select Theme", "Options",
  "Please sign in to weave your story.", "Sign In to Continue",
  "Generate Story 🪄", "Generating...",
  "Type a keyword...", "Add Keyword",
  "Weaving your tale...", "Your story will appear here after you click 'Generate Story'.",
  "Language", "Length", "Tone", "Style", "Character Name",
  "Fantasy", "Sci-Fi", "Mystery", "Adventure", "Romance",
  "A land of magic, mystical creatures, and epic adventures.",
  "Futuristic worlds, advanced technology, and space exploration.",
  "Unraveling secrets, solving crimes, and suspenseful twists.",
  "Thrilling journeys, daring exploits, and global quests.",
  "Tales of love, relationships, and emotional journeys."
];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("English");
  const [translations, setTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    if (language === "English") {
      setTranslations({});
      return;
    }

    const fetchTranslations = async () => {
      const targetLang = languageCodeMap[language];
      const delimiter = " ||| ";
      const textToTranslate = defaultUIStrings.join(delimiter);
      
      const translatedText = await translateText(textToTranslate, targetLang);
      
      // Split by delimiter to perfectly map the translated versions
      const parts = translatedText.split(/\|\|\||\| \| \|/i).map(s => s.trim());
      
      const newMap: Record<string, string> = {};
      defaultUIStrings.forEach((key, index) => {
        newMap[key] = parts[index] || key;
      });
      setTranslations(newMap);
    };

    fetchTranslations();
  }, [language]);

  const t = useCallback((key: string) => {
    return translations[key] || key;
  }, [translations]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

