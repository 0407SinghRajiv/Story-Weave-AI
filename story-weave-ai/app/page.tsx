"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import KeywordInput from "@/components/KeywordInput";
import ThemeSelector from "@/components/ThemeSelector";
import StoryOptions from "@/components/StoryOptions";
import GenerateButton from "@/components/GenerateButton";
import StoryOutput from "@/components/StoryOutput";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useLanguage } from "@/contexts/LanguageContext";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [keywords, setKeywords] = useState<string[]>([]);
  const [selectedTheme, setSelectedTheme] = useState("fantasy");
  const [options, setOptions] = useState({
    language: "English",
    length: "Short (~500 words)",
    tone: "Whimsical"
  });

  const [story, setStory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  const handleGenerate = async () => {
    setIsLoading(true);
    const queryParams = new URLSearchParams({
      theme: selectedTheme,
      keywords: keywords.join(", "),
      language: options.language,
      length: options.length,
      tone: options.tone
    });
    router.push(`/story?${queryParams.toString()}&generate=true`);
  };

  return (
    <>
      <Navbar />

      {/* Hero — stays centered */}
      <div className="page-container">
        <div className="hero-section">
          <h1 className="hero-title">Weave Your Story</h1>
          <p className="hero-tagline">
            Choose your theme, set your keywords, and let AI craft a tale that&apos;s uniquely yours.
          </p>
          <div className="hero-divider" />
        </div>
      </div>

      {/* Full-width main content — no outer padding */}
      <div className="main-content">
        {/* Left Column — Keywords */}
        <div className="content-panel">
          <h2 className="section-heading">{t("Input Keywords")}</h2>
          <p className="section-subheading">{t("Enter keywords to weave your story.")}</p>
          <KeywordInput keywords={keywords} setKeywords={setKeywords} />
        </div>

        {/* Right Column — Theme + Options + Generate */}
        <div className="content-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 className="section-heading">{t("Select Theme")}</h2>
          <ThemeSelector selectedTheme={selectedTheme} setSelectedTheme={setSelectedTheme} />

          <h2 className="section-heading" style={{ marginTop: '24px' }}>{t("Options")}</h2>
          <StoryOptions options={options} setOptions={setOptions} />

          <div style={{ marginTop: 'auto' }}>
            {isSignedIn ? (
              <GenerateButton onClick={handleGenerate} isLoading={isLoading} />
            ) : (
              <div className="signin-prompt">
                <p>{t("Please sign in to weave your story.")}</p>
                <SignInButton mode="modal">
                  <button className="btn-gold" style={{ cursor: "pointer", border: "none" }}>
                    {t("Sign In to Continue")}
                  </button>
                </SignInButton>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer — centered */}
      <div className="page-container">
        <div className="footer">
          Created by Rajiv x Nishant x Suyash &nbsp;|&nbsp; <a href="#">Terms of Service</a> &nbsp; <a href="#">Privacy Policy</a>
        </div>
      </div>
    </>
  );
}
