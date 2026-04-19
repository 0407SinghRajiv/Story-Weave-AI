"use client";

export default function ParticleBackground() {
  const stars = Array.from({ length: 55 }, (_, i) => ({
    id: i,
    left: `${(i * 37 + 11) % 100}%`,
    top: `${(i * 53 + 7) % 100}%`,
    size: (i % 3) + 1,
    delay: `${(i * 0.3) % 5}s`,
    duration: `${2 + (i % 3)}s`,
    opacity: 0.15 + (i % 5) * 0.1,
  }));

  const orbs = [
    { left: "5%",   top: "15%", size: 260, color: "#6d28d9", opacity: 0.18 },
    { left: "82%",  top: "55%", size: 300, color: "#4c1d95", opacity: 0.14 },
    { left: "45%",  top: "85%", size: 200, color: "#f59e0b", opacity: 0.07 },
    { left: "-5%",  top: "65%", size: 220, color: "#5b21b6", opacity: 0.16 },
    { left: "72%",  top: "5%",  size: 180, color: "#7c3aed", opacity: 0.12 },
  ];

  const sparkles = [
    { emoji: "✨", left: "90%", top: "88%", delay: "0s" },
    { emoji: "⭐", left: "6%",  top: "22%", delay: "1.2s" },
    { emoji: "💫", left: "62%", top: "8%",  delay: "0.6s" },
    { emoji: "🌟", left: "22%", top: "92%", delay: "1.8s" },
  ];

  return (
    <div className="bg-layer">
      {/* Orbs */}
      {orbs.map((orb, i) => (
        <div
          key={i}
          className="orb"
          style={{
            left: orb.left, top: orb.top,
            width: orb.size, height: orb.size,
            background: orb.color,
            opacity: orb.opacity,
            transform: "translate(-50%, -50%)",
            animation: `float ${4.5 + i * 0.6}s ease-in-out infinite`,
            animationDelay: `${i * 0.7}s`,
          }}
        />
      ))}

      {/* Stars */}
      {stars.map((s) => (
        <div
          key={s.id}
          style={{
            position: "absolute",
            left: s.left, top: s.top,
            width: s.size, height: s.size,
            borderRadius: "50%",
            background: "white",
            opacity: s.opacity,
            animation: `sparkle ${s.duration} ease-in-out infinite`,
            animationDelay: s.delay,
          }}
        />
      ))}

      {/* Decorative sparkles */}
      {sparkles.map((sp) => (
        <div
          key={sp.emoji}
          style={{
            position: "absolute", left: sp.left, top: sp.top,
            fontSize: 20, opacity: 0.4,
            animation: "float 5s ease-in-out infinite",
            animationDelay: sp.delay,
            filter: "drop-shadow(0 0 8px rgba(245,158,11,0.7))",
          }}
        >
          {sp.emoji}
        </div>
      ))}

      {/* Subtle grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(109,63,204,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(109,63,204,0.04) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />
    </div>
  );
}
