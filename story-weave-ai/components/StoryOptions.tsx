"use client";

const FIELDS = [
  { key: "language", label: "Language", icon: "🌐", options: ["English", "Hindi", "Bengali", "Telugu", "Marathi", "Tamil", "Gujarati", "Kannada", "Malayalam", "Punjabi", "Spanish", "French"] },
  { key: "length", label: "Length", icon: "📏", options: ["Micro (~100 words)", "Short (~500 words)", "Medium (~1000 words)", "Epic (~2500 words)"] },
  { key: "tone", label: "Tone", icon: "🎭", options: ["Whimsical", "Dark", "Funny", "Dramatic", "Romantic", "Suspenseful"] },
];

import { useLanguage } from "@/contexts/LanguageContext";

export default function StoryOptions({ options, setOptions }: any) {
  const { t } = useLanguage();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '12px', marginBottom: '32px' }}>
      {FIELDS.map((f, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
          <label className="option-label-icon">
            <span>{f.icon}</span>
            {t(f.label)}
          </label>
          <select
            className="option-select"
            value={options[f.key]}
            onChange={(e) => setOptions({ ...options, [f.key]: e.target.value })}
          >
            {f.options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
