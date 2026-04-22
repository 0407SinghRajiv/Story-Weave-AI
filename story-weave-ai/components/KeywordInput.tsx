"use client";
import { useState } from "react";

interface KeywordInputProps {
  keywords: string[];
  setKeywords: (kw: string[]) => void;
}

import { useLanguage } from "@/contexts/LanguageContext";

export default function KeywordInput({ keywords, setKeywords }: KeywordInputProps) {
  const [inputValue, setInputValue] = useState("");
  const { t } = useLanguage();

  const handleAddKeyword = () => {
    if (inputValue.trim() && !keywords.includes(inputValue.trim())) {
      setKeywords([...keywords, inputValue.trim()]);
      setInputValue("");
    }
  };

  const handleRemove = (kwToRemove: string) => {
    setKeywords(keywords.filter(kw => kw !== kwToRemove));
  };

  return (
    <div className="keyword-box">
      <div className="keyword-chips">
        {keywords.map((kw, i) => (
          <div key={i} className="keyword-chip" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{kw}</span>
            <button
              onClick={() => handleRemove(kw)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffc966',
                cursor: 'pointer',
                fontSize: '16px',
                lineHeight: 1,
                padding: '0 2px',
                transition: 'color 0.2s ease',
              }}
              title="Remove keyword"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
        <input
          type="text"
          className="custom-input"
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: '10px',
            border: '1px solid rgba(113, 72, 252, 0.4)',
            background: 'rgba(18, 12, 33, 0.6)',
            color: '#fff',
            outline: 'none',
            fontSize: '14px',
            fontFamily: 'inherit',
            transition: 'border-color 0.3s ease',
          }}
          placeholder={t("Type a keyword...")}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddKeyword();
            }
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(113, 72, 252, 0.7)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(113, 72, 252, 0.4)'; }}
        />
        <button
          className="add-keyword-btn"
          style={{ marginTop: 0, padding: '12px 16px', width: '100%' }}
          onClick={handleAddKeyword}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
          {t("Add Keyword")}
        </button>
      </div>
    </div>
  );
}
