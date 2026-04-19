"use client";

import { useState, useEffect } from "react";
import { useLanguage, translateText, languageCodeMap, Language } from "@/contexts/LanguageContext";

export default function StoryOutput({ story, isLoading, language: propLanguage }: any) {
  const { language: globalLanguage, t } = useLanguage();
  const language = propLanguage || globalLanguage;
  const [translatedStory, setTranslatedStory] = useState(story);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (!story) {
      setTranslatedStory("");
      return;
    }
    
    if (language === "English") {
      setTranslatedStory(story);
      return;
    }

    const translate = async () => {
      // Basic check: if text contains many non-Latin characters, it's likely already in a regional language
      const nonLatinRegex = /[^\x00-\x7F]/;
      if (nonLatinRegex.test(story)) {
        setTranslatedStory(story);
        return;
      }

      setIsTranslating(true);
      const targetLang = languageCodeMap[language as Language];
      const translated = await translateText(story, targetLang);
      setTranslatedStory(translated);
      setIsTranslating(false);
    };

    translate();
  }, [story, language]);
  
  if (isLoading) {
    return (
      <div className="output-area">
        <p style={{ color: '#a395c3' }}>{t("Weaving your tale...")}</p>
      </div>
    );
  }

  if (story) {
    return (
      <div className="output-area" style={{ justifyContent: 'flex-start', textAlign: 'left', overflowY: 'auto' }}>
        {isTranslating ? (
           <p style={{ color: '#a395c3', fontStyle: 'italic', margin: 0 }}>{t("Weaving your tale...")}</p>
        ) : (
           <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{translatedStory}</p>
        )}
      </div>
    );
  }

  return (
    <div className="output-area" style={{ textAlign: "center" }}>
      {t("Your story will appear here after you click 'Generate Story'.")}
    </div>
  );
}