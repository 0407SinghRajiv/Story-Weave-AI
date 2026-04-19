"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export default function GenerateButton({ onClick, isLoading }: any) {
  const { t } = useLanguage();
  return (
    <button className="generate-btn" onClick={onClick} disabled={isLoading}>
      {isLoading ? t("Generating...") : t("Generate Story 🪄")}
      
      {!isLoading && (
        <div style={{ position: 'absolute', right: 16, display: 'flex', gap: 2, alignItems: 'flex-end', height: 16 }}>
          <div style={{ width: 2, height: 6, background: '#000', borderRadius: 2 }} />
          <div style={{ width: 2, height: 14, background: '#000', borderRadius: 2 }} />
          <div style={{ width: 2, height: 10, background: '#000', borderRadius: 2 }} />
          <div style={{ width: 2, height: 16, background: '#000', borderRadius: 2 }} />
        </div>
      )}
    </button>
  );
}
