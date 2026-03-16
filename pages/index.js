import Head from "next/head";
import { useState, useRef, useCallback, useEffect } from "react";

/* ══════════════════════════════════════════════════════════════
   PLAYER CARD COMPONENTS
   ══════════════════════════════════════════════════════════════ */

const TIERS = {
  bronze:   { border:"linear-gradient(135deg, #CD7F32, #8B5A2B, #E8A862, #CD7F32)", glow:"rgba(205,127,50,0.4)", label:"BRONZE", accent:"#CD7F32", accent2:"#E8A862", accent3:"#A0522D", inner:"linear-gradient(160deg, #18120a 0%, #0e0a06 100%)", barBg:"linear-gradient(90deg, #A0522D, #CD7F32, #E8A862)", auraColors:["#CD7F32","#E8A862","#A0522D"], scanColor:"CD7F32", refAngle:45 },
  silver:   { border:"linear-gradient(135deg, #D0D0D0, #808080, #E8E8E8, #A0A0A0)", glow:"rgba(200,200,220,0.4)", label:"SILVER", accent:"#C0C0C0", accent2:"#E8E8E8", accent3:"#808090", inner:"linear-gradient(160deg, #14141a 0%, #0a0a10 100%)", barBg:"linear-gradient(90deg, #808080, #C0C0C0, #E8E8E8)", auraColors:["#9CA8B8","#C0C0C0","#E8E8E8"], scanColor:"C0C0C0", refAngle:50 },
  gold:     { border:"linear-gradient(135deg, #FFD700, #B8860B, #FFF4A0, #DAA520)", glow:"rgba(255,215,0,0.45)", label:"GOLD", accent:"#FFD700", accent2:"#FFF1A8", accent3:"#DAA520", inner:"linear-gradient(160deg, #181408 0%, #100e06 100%)", barBg:"linear-gradient(90deg, #DAA520, #FFD700, #FFF1A8)", auraColors:["#FFD700","#FFF1A8","#DAA520"], scanColor:"FFD700", refAngle:42 },
  purple:   { border:"linear-gradient(135deg, #9B30FF, #5C1A8C, #CF9FFF, #7B1FA2)", glow:"rgba(155,48,255,0.45)", label:"EPIC", accent:"#9B30FF", accent2:"#CF9FFF", accent3:"#6A0DAD", inner:"linear-gradient(160deg, #140c1e 0%, #0a0612 100%)", barBg:"linear-gradient(90deg, #6A0DAD, #9B30FF, #CF9FFF)", auraColors:["#9B30FF","#CF9FFF","#6A0DAD"], scanColor:"9B30FF", refAngle:55 },
  platinum: { border:"linear-gradient(135deg, #A8D8EA, #E8B4F0, #A8EAC8, #F0D0A8, #A8B4F0)", glow:"rgba(200,180,240,0.5)", label:"PLATINUM", accent:"#D4C0F0", accent2:"#A8D8EA", accent3:"#E8B4F0", inner:"linear-gradient(160deg, #121620 0%, #0a0e18 100%)", barBg:"linear-gradient(90deg, #A8D8EA, #D8B4F0, #A8EAC8, #E0B8D0)", prismatic:true, auraColors:["#A8D8EA","#E8B4F0","#A8EAC8","#F0D0A8"], scanColor:"D4C0F0", refAngle:48 },
  diamond:  { border:"linear-gradient(135deg, #B9F2FF, #4DD9FF, #FFFFFF, #4DD9FF, #B9F2FF)", glow:"rgba(77,217,255,0.55)", label:"DIAMOND", accent:"#4DD9FF", accent2:"#B9F2FF", accent3:"#2BC4F0", inner:"linear-gradient(160deg, #0a1418 0%, #060e14 100%)", barBg:"linear-gradient(90deg, #2BC4F0, #4DD9FF, #B9F2FF)", auraColors:["#4DD9FF","#B9F2FF","#2BC4F0"], scanColor:"4DD9FF", refAngle:40, glitch:true },
};
const TIER_ORDER = ["bronze","silver","gold","purple","platinum","diamond"];

const SPORT_ICON_DATA = {
  soccer: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAbH0lEQVR42pVbecxcZfV+5s6dffuWtlBAQECMgKR8YluWCGjYQgsqSMAFTTQqiIqAJv7hAi6ARAxLCRFjUdFEwX+E2sjWVgo1IFsrxaKyJMV+883cmXvn7uvz+wPOmzvzfQV/k3zJ07d37rzvve855znPOS9I0vM89no9kqTv+1xYWCBJBkHAhYUFZlnGMAy5sLDAJEkYRZHCSZJwYWGBURQxTVMuLCwwDMMxnGUZFxYW6Ps+SbLX69HzPIVd1yVJ9vt92rat8Gg0IkkahkHLskiSg8GApmmSJIfDIYfDIUnSsiwOBgOS5Gg0omEYCvf7fZKk4zhqnZ7ncWFhgYW3JgIAKBQKEKxpGkiCpBonCU3TAECNA0CWZSgUCigUCgrLR3Kapup7Mp6/LssydU9N09T/5ec0+ZHr89fI9ybXlB8fW4/rugCAer0Oz/NAUuE0TVGv1xEEAdI0RaPRQBiGiKII9XodURQhiiI0Gg3EcYwwDNFoNJAkCYIgQL1eRxiGcBwHzWZT/bVaLTSbTei6jkajof7a7TZarRbiOEa5XAYAuK6LarUKXdfhui4qlQpKpZLC5XIZjuOgXC6jUqnAdV3ouo5qtQrXdVEsFlGr1eC6LgqFglpboVBAo9FAIcsyBkEA3/cxNTWFKIrgui6mpqaQJAkcx8HU1BTSNIVt22i32yCpMACMRiO0221omgbTNNFsNgEAnudhenoaAPDaa6/h5Zdfxs6dO7Fr1y4sLCzA8zzEcYypqSmsXLkSRx11FE444QTMzc1hdnYWxWIRWZZhOByiUqmg2WzCsiwUCgW0Wi3Ytg0AaLfbsG0bWZah0+nAtm2kaYpOpwPXddVveJ6HMAwxPT0N3/fh+z4KQRAwyzJkWQZd15GmKdI0RblcRpZlSNMUuq4DAJIkUTiOY5RKpUXjYRiiVCqhXq/DNE1s27YN9957L/76179iYWFBbd92u41qtQpN0+D7PizLUv93wAEHYM2aNbjsssswbtw4FApFZFkGh8MBh8OBkpISZFkGh8OBkpISZFmG0+mEw+GAw+FAMBiEz+eDz+eDz+eDw+GAMzMzSKVSKBQKSNMUqVQKkiQhiiLEcQxJkpAkCaIoQhRFSNMUSZKQJAmSJEGSJEiSJEiSBEmSIEkSJEmCJEmQJAmSJEGSJEiSBEmSIEkSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmS",
  football: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAZ3UlEQVR42u17eZRV1Znvd865Q1VRUOOteYCiCkQmAYkjGBRnAc1TJgfE9MuLL+nkPVc6HTVSaAQ6QIzT66zXiZ2kO6Z9bYcUWBJRKsUQAUWUKgaFAqEo6lbd+d5zxzPt3/vj3r059wJJulf36u7VOWu5rH339O3f9/t+3974HKQzZ85AkiRqamoiADQyMkKMMWpqaiIiouHhYWKMUXNzsyhLkkSNjY0EgLxer2gvSRINDQ0REYny+fPniYiosbGRJEnKGw8ADQ0NEZ/f3r65uZkYY3T+/HlRT0R54/OyLMvC/uHhYTEfEYnx7OshImpoaCBZlskhSRLJskyMMbIsi3iZ/y1JEimKQqZpkizLeeUASJIkcjgcxBgjxhjJskxEJPorikKMMQIgfnM4HGQYBhERORwOIiIxPm9vGAbJsizm5ONzmyzLuqg/EYl6xlhePW+vKAoBIM00ydHRkQPRaBQOh4N2ux0Oh4NOpxMAkEgkAAClUgkAgEajgVKphFKphFgshlgshlgshlgshlgshlgshlgshlgshlgshlgshlgshlgshlgshlgshlgshlgshlgshlgshlgshlgshlgs",
  basketball: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAWTklEQVR42u1be5AU1dX/zXTPa4ddWQjLghAokPAmwi6CVHgX1lrqEglikEgQi0CWkFQwiSQqKYKWKcNqwiNBtMAghUGQADEiWfLgUSwG5K1AUAiy7O7s7MzOe3pmuvv3/fHl3pqemWVBTVXqy9dVt3Zr+vR9nHvP7/zOuffagsEg8a+HJFRVRUlJCcj//dlmsyGdTiMWi8Fms0k5h8OB4uLiTyWXSqUQj8ctck6nE506depQzuVywev1WuQ0TUMikehQLplMIplMSjkAsKPAIz7q6LlZuf/kx47/8ue/XgFqtj0IWzFNM2+p22w2HkCnWCovkLZdPYvuH3JNBafABEtAAWGEwk",
  baseball: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAW3UlEQVR42uVba5AU5bl+uqd77bedXXZheSFsaIyshZWsWhVRKuUSmFQqJqQqJlEiQkBMLAK5kCIRCC5zS4KJBEchRiMSaoxgLMqikqIiuauAiLIsuwv7MzO7s3PfO/fq8/sD5s3NdXunfufLqTq10z09/X3Pfbrnuc95D0iSmZkZSJKkmpqaCACNjIwQY4yamhqIiGh4eJgYY9Tc3CzKkiRRY2MjASDv9Yq2kiTR0NAQEYny+fPniYiosbGRJEnKGw8ADQ0NEZ/f3r65uZkYY3T+/HlRT0R54/OyLMvC/uHhYTEfEYnx7OshImpoaCBZlskhSRLJskyMMbIsi3iZ/y1JEimKQqZpkizLeeUASJIkcjgcxBgjxhjJskxEJPorikKMMQIgfnM4HGQYBhERORwOIiIxPm9vGAbJsizm5ONzmyzLuqg/EYl6xlhePW+vKAoBIM00ydHRkQPRaBQOh4N2ux0Oh4NOpxMAkEgkAAClUgkAgEajgVKphFIshlgshlgshlgshlgshlgshlgshlgshlgshlgshlgshlgshlgshlgshlgshlgshlgshlgshlgshlgshlgshlgs"
};

function SportIcon({ sport, color, size = 16 }) {
  const src = SPORT_ICON_DATA[sport] || SPORT_ICON_DATA.basketball;
  if (!src) return null;
  return (
    <img src={src} alt={sport} width={size} height={size}
      style={{ display:"block", filter:"brightness(0) invert(1)", pointerEvents:"none" }}
    />
  );
}

function Starfield({ color, count = 40 }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    const W = 274, H = 414; c.width = W; c.height = H;
    const stars = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3, speed: Math.random() * 0.3 + 0.05,
      opacity: Math.random() * 0.5 + 0.1, phase: Math.random() * Math.PI * 2
    }));
    let frame;
    const draw = (t) => {
      ctx.clearRect(0, 0, W, H);
      stars.forEach(s => {
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = s.opacity * (0.5 + 0.5 * Math.sin(t * 0.001 * s.speed * 10 + s.phase));
        ctx.fill(); s.y -= s.speed;
        if (s.y < -2) { s.y = H + 2; s.x = Math.random() * W; }
      });
      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [color, count]);
  return <canvas ref={ref} style={{ position:"absolute", inset:0, zIndex:1, pointerEvents:"none", borderRadius:13 }} />;
}

function EnergyAura({ colors: c, tier, hovered }) {
  return (
    <svg width="180" height="180" viewBox="0 0 180 180" style={{ filter:`drop-shadow(0 0 24px ${c[0]}50)` }}>
      <defs>
        <radialGradient id={`ac-${tier}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={c[0]} stopOpacity="0.6"/>
          <stop offset="50%" stopColor={c[1] || c[0]} stopOpacity="0.15"/>
          <stop offset="100%" stopColor="transparent"/>
        </radialGradient>
      </defs>
      <circle cx="90" cy="90" r="82" fill="none" stroke={c[0]} strokeWidth="0.4" strokeOpacity="0.12" strokeDasharray="6 10">
        <animateTransform attributeName="transform" type="rotate" from="0 90 90" to="360 90 90" dur="25s" repeatCount="indefinite"/>
      </circle>
      <circle cx="90" cy="90" r="65" fill="none" stroke={c[1] || c[0]} strokeWidth="0.6" strokeOpacity="0.1" strokeDasharray="3 7">
        <animateTransform attributeName="transform" type="rotate" from="360 90 90" to="0 90 90" dur="18s" repeatCount="indefinite"/>
      </circle>
      <circle cx="90" cy="90" r="48" fill="none" stroke={c[2] || c[0]} strokeWidth="0.5" strokeOpacity="0.08" strokeDasharray="2 6">
        <animateTransform attributeName="transform" type="rotate" from="0 90 90" to="360 90 90" dur="12s" repeatCount="indefinite"/>
      </circle>
      <circle cx="90" cy="90" r="55" fill={`url(#ac-${tier})`}>
        <animate attributeName="r" values={hovered ? "55;63;55" : "52;55;52"} dur="3s" repeatCount="indefinite"/>
      </circle>
      {[0,1,2,3,4,5,6,7].map(i => {
        const orb = 30 + i * 6, dur = 2.5 + i * 0.4, sz = 1.5 + (i % 3) * 0.8;
        return (
          <g key={i}>
            {hovered && (
              <circle cx="90" cy="90" r={orb} fill="none" stroke={c[i % c.length]} strokeWidth={sz * 0.8} strokeOpacity="0.12"
                strokeDasharray={`${orb * 0.4} ${orb * Math.PI * 2 - orb * 0.4}`} strokeLinecap="round">
                <animateTransform attributeName="transform" type="rotate" from={`${i*45} 90 90`} to={`${i*45+360} 90 90`} dur={`${dur}s`} repeatCount="indefinite"/>
              </circle>
            )}
            <circle cx="90" cy="90" r={sz} fill={c[i % c.length]} opacity="0.6">
              <animateMotion dur={`${dur}s`} repeatCount="indefinite" path={`M0,0 A${orb},${orb} 0 1,1 0.1,0`}/>
              <animate attributeName="opacity" values="0.2;0.9;0.2" dur={`${dur * 0.8}s`} repeatCount="indefinite"/>
            </circle>
          </g>
        );
      })}
      <path d="M70 60Q90 38 110 60Q100 90 90 68Q80 90 70 60Z" fill={c[0]} fillOpacity="0.07">
        <animateTransform attributeName="transform" type="rotate" from="0 90 90" to="360 90 90" dur="8s" repeatCount="indefinite"/>
      </path>
    </svg>
  );
}

function PlayerCard({ name="LeBron James", team="LAL", teamFull="Los Angeles Lakers", season="2025–2026", sport="basketball", imageUrl=null, teamLogoUrl=null, betsPlaced=47, wins=34, wagered=2350, tier="gold", progress=0.65, rank=47 }) {
  const [hovered, setHovered] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x:0, y:0 });
  const [shinePos, setShinePos] = useState({ x:50, y:50 });

  const t = TIERS[tier] || TIERS.bronze;
  const tierIdx = TIER_ORDER.indexOf(tier);
  const nextTier = tierIdx < TIER_ORDER.length - 1 ? TIER_ORDER[tierIdx + 1] : null;
  const prismaticText = t.prismatic ? { background:"linear-gradient(90deg,#A8D8EA,#E8B4F0,#A8EAC8,#D4B8F0)", backgroundSize:"200% 100%", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", animation:"prismaticText 3s ease infinite" } : {};

  const px = tilt.y / 8, py = tilt.x / 8;

  const onMove = useCallback((e) => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    setTilt({ x: ((e.clientY - r.top) / r.height - 0.5) * -8, y: ((e.clientX - r.left) / r.width - 0.5) * 8 });
    setShinePos({ x: (e.clientX - r.left) / r.width * 100, y: (e.clientY - r.top) / r.height * 100 });
  }, []);

  const slide = "transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94)";

  return (
    <div style={{ perspective:1200, width:280, height:420 }}>
      <div ref={cardRef} onMouseMove={onMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setTilt({ x:0, y:0 }); setShinePos({ x:50, y:50 }); }}
        onClick={() => setFlipped(f => !f)}
        style={{
          position:"relative", width:280, height:420, transformStyle:"preserve-3d",
          transition: hovered ? "transform 0.1s ease-out" : "transform 0.6s ease-out",
          transform: `rotateX(${flipped ? 0 : tilt.x}deg) rotateY(${flipped ? 180 : tilt.y}deg)`,
          cursor:"pointer", userSelect:"none", fontFamily:"'Plus Jakarta Sans', sans-serif",
        }}
      >
        {/* FRONT */}
        <div style={{
          position:"absolute", width:280, height:420, borderRadius:16, padding:3,
          background: t.border, backgroundSize: t.prismatic ? "400% 400%" : undefined,
          animation: t.prismatic ? "prismaticShift 4s ease infinite" : hovered && !flipped ? `borderPulse-${tier} 2s ease infinite` : undefined,
          backfaceVisibility:"hidden",
          boxShadow: hovered ? `0 20px 50px rgba(0,0,0,0.5), 0 0 40px ${t.glow}` : `0 4px 20px rgba(0,0,0,0.5)`,
        }}>
          <div style={{ position:"relative", width:274, height:414, borderRadius:13, background:t.inner, overflow:"hidden" }}>

            <Starfield color={t.accent} count={45}/>

            {/* Team logo watermark — centered on card */}
            {teamLogoUrl && (
              <img src={teamLogoUrl} alt="" aria-hidden="true" style={{
                position:"absolute", top:"17%", left:"3.6%", width:"92.9%", aspectRatio:"1",
                objectFit:"contain", opacity:0.08, pointerEvents:"none", userSelect:"none", zIndex:1,
              }}/>
            )}

            {/* Carbon fiber */}
            <div style={{ position:"absolute", inset:0, zIndex:1, pointerEvents:"none", opacity:0.05, backgroundImage:`url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h3v3H0zM3 3h3v3H3z' fill='%23fff' fill-opacity='0.4'/%3E%3C/svg%3E")`, backgroundSize:"4px 4px" }}/>

            {/* Scanlines */}
            <div style={{ position:"absolute", inset:0, zIndex:1, pointerEvents:"none", opacity: hovered ? 0.06 : 0.025, transition:"opacity 0.4s", backgroundImage:`repeating-linear-gradient(0deg, transparent, transparent 2px, #${t.scanColor}08 2px, #${t.scanColor}08 3px)` }}/>

            {/* Refractor lines */}
            <div style={{ position:"absolute", inset:0, zIndex:1, pointerEvents:"none", overflow:"hidden" }}>
              {Array.from({ length:35 }, (_,i) => (
                <div key={i} style={{ position:"absolute", top:-20+i*15, left:-50, width:"180%", height:1, background:`linear-gradient(90deg, transparent, ${t.accent}${i%4===0?'0a':'05'}, transparent)`, transform:`rotate(${t.refAngle}deg)`, opacity: hovered ? 1 : 0.3, transition:"opacity 0.4s" }}/>
              ))}
            </div>

            {/* Gradient mesh */}
            <div style={{ position:"absolute", inset:0, zIndex:1, pointerEvents:"none", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:"-30%", left:"-20%", width:"80%", height:"80%", borderRadius:"50%", background:`radial-gradient(circle, ${t.accent}08 0%, transparent 70%)`, filter:"blur(40px)" }}/>
              <div style={{ position:"absolute", bottom:"-20%", right:"-15%", width:"70%", height:"70%", borderRadius:"50%", background:`radial-gradient(circle, ${t.accent3}06 0%, transparent 70%)`, filter:"blur(35px)" }}/>
            </div>

            {/* Animated energy wave lines */}
            <div style={{ position:"absolute", inset:0, zIndex:1, pointerEvents:"none", overflow:"hidden" }}>
              {[0,1,2].map(i => (
                <div key={`wave-${i}`} style={{
                  position:"absolute", top:`${25 + i * 25}%`, left:"-100%", width:"300%", height:1,
                  background:`linear-gradient(90deg, transparent 0%, ${t.accent}${i===0?'12':'08'} 30%, transparent 50%, ${t.accent2}${i===1?'10':'06'} 70%, transparent 100%)`,
                  animation:`waveSlide ${8 + i * 3}s linear infinite`, animationDelay:`${i * 2}s`,
                  opacity: hovered ? 0.8 : 0.3, transition:"opacity 0.4s ease",
                }}/>
              ))}
            </div>

            {/* Sport ball watermark — top left */}
            <div style={{ position:"absolute", top:-15, left:-15, zIndex:1, pointerEvents:"none", opacity: hovered ? 0.12 : 0.06, transition:"opacity 0.4s", transform:"rotate(15deg)" }}>
              <SportIcon sport={sport} color={t.accent} size={200}/>
            </div>

            {/* Geometric shapes */}
            <div style={{ position:"absolute", inset:0, zIndex:1, pointerEvents:"none", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:-80, right:-80, width:240, height:240, borderRadius:"50%", border:`1px solid ${t.accent}0a` }}/>
              <div style={{ position:"absolute", bottom:-100, left:-50, width:280, height:280, borderRadius:"50%", border:`1px solid ${t.accent3}08` }}/>
              <div style={{ position:"absolute", top:"35%", left:"10%", width:60, height:60, borderRadius:"50%", border:`0.5px solid ${t.accent}06` }}/>
              <div style={{ position:"absolute", top:0, right:0, width:160, height:160, background:`radial-gradient(circle at 100% 0%, ${t.accent}14 0%, transparent 60%)`, opacity: hovered ? 1 : 0.4, transition:"opacity 0.4s" }}/>
              <div style={{ position:"absolute", bottom:0, left:0, width:180, height:130, background:`radial-gradient(circle at 0% 100%, ${t.accent3}0c 0%, transparent 60%)` }}/>
              <div style={{ position:"absolute", top:"20%", left:"-10%", width:"130%", height:40, background:`linear-gradient(${t.refAngle}deg, transparent, ${t.accent}03, transparent)`, transform:`rotate(${t.refAngle}deg)` }}/>
            </div>

            {/* Holo foil */}
            <div style={{ position:"absolute", inset:0, zIndex:3, pointerEvents:"none", mixBlendMode:"screen", background:`conic-gradient(from ${shinePos.x*3.6}deg at ${shinePos.x}% ${shinePos.y}%, rgba(255,50,50,0.05), rgba(255,200,50,0.05), rgba(50,255,100,0.05), rgba(50,150,255,0.05), rgba(200,50,255,0.05), rgba(255,50,50,0.05))`, opacity: hovered ? 1 : 0, transition:"opacity 0.3s" }}/>
            <div style={{ position:"absolute", inset:0, zIndex:3, pointerEvents:"none", mixBlendMode:"screen", background:`linear-gradient(${shinePos.x*3.6}deg, transparent 15%, ${t.accent}0a 40%, ${t.accent2}16 50%, ${t.accent}0a 60%, transparent 85%)`, opacity: hovered ? 1 : 0, transition:"opacity 0.3s" }}/>

            {/* Diamond glitch */}
            {t.glitch && hovered && (
              <div style={{ position:"absolute", inset:0, zIndex:4, pointerEvents:"none", overflow:"hidden", animation:"glitchFlicker 0.15s infinite" }}>
                <div style={{ position:"absolute", top:"20%", left:0, right:0, height:2, background:`${t.accent}30`, transform:"translateX(3px)" }}/>
                <div style={{ position:"absolute", top:"60%", left:0, right:0, height:1, background:`${t.accent2}20`, transform:"translateX(-2px)" }}/>
                <div style={{ position:"absolute", top:"80%", left:0, right:0, height:3, background:`${t.accent}15`, transform:"translateX(5px)" }}/>
              </div>
            )}

            {/* Inner frames */}
            <div style={{ position:"absolute", top:6, left:6, right:6, bottom:6, border:`1px solid ${t.accent}12`, borderRadius:8, zIndex:2, pointerEvents:"none" }}/>
            <div style={{ position:"absolute", top:10, left:10, right:10, bottom:10, border:`0.5px solid ${t.accent}08`, borderRadius:6, zIndex:2, pointerEvents:"none" }}/>

            {/* TOP BAR: sport + team (left), rank (right) */}
            <div style={{ position:"absolute", top:12, left:16, zIndex:10, display:"flex", alignItems:"flex-start", gap:7, maxWidth:180, transform:`translate(${px*1}px, ${py*1}px)`, transition: hovered ? "none" : "transform 0.5s ease" }}>
              <div style={{ marginTop:2, flexShrink:0 }}><SportIcon sport={sport} color={t.accent} size={16}/></div>
              <span style={{ fontSize:13, fontWeight:700, letterSpacing:0.3, color:t.accent, opacity:0.65, lineHeight:1.25 }}>{teamFull}</span>
            </div>

            {/* RANK */}
            <div style={{ position:"absolute", top:12, right:14, zIndex:10, textAlign:"right", transform:`translate(${px*1}px, ${py*1}px)`, transition: hovered ? "none" : "transform 0.5s ease" }}>
              <div style={{ fontSize:7, fontWeight:700, letterSpacing:2, color:t.accent, opacity:0.4 }}>RANK</div>
              <div style={{ fontSize:22, fontWeight:900, color:t.accent, lineHeight:1, textShadow:`0 0 15px ${t.glow}`, ...prismaticText }}>#{rank}</div>
            </div>

            {/* CENTER COLUMN */}
            <div style={{
              position:"absolute", inset:0, zIndex:5,
              display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", paddingTop:18,
              transform:`translate(${px*3}px, ${py*3}px)`, transition: hovered ? "none" : "transform 0.5s ease",
            }}>
              <div style={{ textAlign:"center", marginBottom:2, transition:slide, transform: hovered ? "translateX(16px)" : "translateX(0)" }}>
                <div style={{ fontSize: name.length > 20 ? 17 : name.length > 15 ? 19 : 22, fontWeight:800, color:"rgba(255,255,255,0.95)", letterSpacing:-0.3, lineHeight:1.1, textShadow:`0 0 20px ${t.glow}`, padding:"0 16px" }}>{name}</div>
                <div style={{ fontSize:11, fontWeight:600, letterSpacing:2, color:t.accent, opacity:0.5, marginTop:4 }}>{team}</div>
              </div>

              <div style={{ marginTop:-6, marginBottom:-6, transition:slide, transform: hovered ? `translateX(32px) scale(1.04) translate(${px*2}px, ${py*2}px)` : "translateX(0) scale(1)" }}>
                {imageUrl ? (
                  <div style={{ position:"relative", width:180, height:180, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <div style={{ position:"absolute", inset:0 }}><EnergyAura colors={t.auraColors} tier={tier} hovered={hovered}/></div>
                    <img src={imageUrl} alt={name} style={{ width:120, height:120, borderRadius:"50%", objectFit:"cover", border:`2px solid ${t.accent}40`, position:"relative", zIndex:2 }}/>
                  </div>
                ) : <EnergyAura colors={t.auraColors} tier={tier} hovered={hovered}/>}
              </div>

              <div style={{ transition:slide, transform: hovered ? "translateX(16px)" : "translateX(0)" }}>
                <span style={{ fontSize:12, fontWeight:600, letterSpacing:1.5, color:"rgba(255,255,255,0.3)" }}>{season}</span>
              </div>

              {/* Progress bar */}
              <div style={{ width:"100%", padding:"0 20px", marginTop:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                  <span style={{ fontSize:9, fontWeight:700, letterSpacing:1.5, color:"rgba(255,255,255,0.35)", textTransform:"uppercase" }}>{nextTier ? `→ ${TIERS[nextTier].label}` : "MAX RANK"}</span>
                  <span style={{ fontSize:10, fontWeight:700, color:t.accent, ...prismaticText }}>{Math.round(progress * 100)}%</span>
                </div>
                <div style={{ width:"100%", height:5, borderRadius:3, background:"rgba(255,255,255,0.06)", overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${progress * 100}%`, borderRadius:3, background:t.barBg, backgroundSize: t.prismatic ? "300% 100%" : undefined, animation: t.prismatic ? "prismaticShift 3s ease infinite" : undefined, boxShadow:`0 0 8px ${t.glow}`, transition:"width 0.6s ease" }}/>
                </div>
              </div>
            </div>

            {/* STATS PANEL (on hover) */}
            <div style={{
              position:"absolute", left:0, top:44, bottom:65, width:115, padding:"12px 16px",
              display:"flex", flexDirection:"column", justifyContent:"center", gap:14,
              zIndex:10, pointerEvents: hovered ? "auto" : "none",
              opacity: hovered ? 1 : 0, transform: hovered ? "translateX(0)" : "translateX(-20px)",
              transition:"opacity 0.35s ease 0.08s, transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94) 0.08s",
            }}>
              {[["BETS", betsPlaced], ["WINS", wins], ["WAGERED", `$${wagered.toLocaleString()}`]].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize:8, fontWeight:600, letterSpacing:1.5, color:t.accent, opacity:0.5, marginBottom:2 }}>{l}</div>
                  <div style={{ fontSize:18, fontWeight:700, color:"rgba(255,255,255,0.92)" }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Tier label */}
            <div style={{ position:"absolute", bottom:12, left:16, zIndex:10 }}>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:2, color:t.accent, opacity:0.3 }}>{t.label}</span>
            </div>

            {/* Watermark */}
            <div style={{ position:"absolute", bottom:12, left:0, right:0, zIndex:4, display:"flex", justifyContent:"center" }}>
              <span style={{ fontSize:7, fontWeight:700, letterSpacing:3, color:t.accent, opacity:0.1 }}>VANTAGE COLLECTIBLES</span>
            </div>
          </div>
        </div>

        {/* BACK FACE */}
        <div style={{
          position:"absolute", width:280, height:420, borderRadius:16, padding:3,
          background: t.border, backgroundSize: t.prismatic ? "400% 400%" : undefined,
          animation: t.prismatic ? "prismaticShift 4s ease infinite" : undefined,
          backfaceVisibility:"hidden", transform:"rotateY(180deg)",
          boxShadow:`0 4px 20px rgba(0,0,0,0.5)`,
        }}>
          <div style={{ position:"relative", width:274, height:414, borderRadius:13, background:t.inner, overflow:"hidden", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:18 }}>
            <div style={{ position:"absolute", inset:0, opacity:0.05, backgroundImage:`url("data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h3v3H0zM3 3h3v3H3z' fill='%23fff' fill-opacity='0.4'/%3E%3C/svg%3E")`, backgroundSize:"4px 4px" }}/>
            <div style={{ position:"absolute", top:6, left:6, right:6, bottom:6, border:`1px solid ${t.accent}12`, borderRadius:8 }}/>
            <svg width="70" height="70" viewBox="0 0 28 28" fill="none" style={{ filter:`drop-shadow(0 0 20px ${t.glow})` }}>
              <path d="M4 6L14 24L24 6" stroke={t.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
              <path d="M8 6L14 18L20 6" stroke={t.accent} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.25"/>
            </svg>
            <div style={{ fontSize:12, fontWeight:800, letterSpacing:6, color:t.accent, opacity:0.6 }}>VANTAGE</div>
            <div style={{ fontSize:8, fontWeight:600, letterSpacing:4, color:t.accent, opacity:0.3 }}>COLLECTIBLES</div>
            <div style={{ width:50, height:1, background:`linear-gradient(90deg, transparent, ${t.accent}30, transparent)` }}/>
            <div style={{ textAlign:"center", lineHeight:1.6 }}>
              <div style={{ fontSize:18, fontWeight:800, color:"rgba(255,255,255,0.85)" }}>{name}</div>
              <div style={{ fontSize:12, fontWeight:600, color:t.accent, opacity:0.5 }}>{teamFull}</div>
              <div style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.3)", marginTop:4 }}>{season}</div>
            </div>
            <div style={{ width:50, height:1, background:`linear-gradient(90deg, transparent, ${t.accent}20, transparent)` }}/>
            <div style={{ display:"flex", gap:28 }}>
              {[["BETS", betsPlaced], ["WINS", wins], ["WIN%", `${Math.round(wins / betsPlaced * 100)}%`]].map(([l, v]) => (
                <div key={l} style={{ textAlign:"center" }}>
                  <div style={{ fontSize:8, fontWeight:600, letterSpacing:1.5, color:t.accent, opacity:0.4 }}>{l}</div>
                  <div style={{ fontSize:20, fontWeight:800, color:"rgba(255,255,255,0.85)" }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:16, marginTop:4 }}>
              <span style={{ fontSize:16, fontWeight:900, color:t.accent, opacity:0.5, fontFamily:"monospace" }}>RANK #{rank}</span>
              <div style={{ padding:"4px 14px", borderRadius:6, border:`1px solid ${t.accent}30`, background:`${t.accent}08` }}>
                <span style={{ fontSize:10, fontWeight:700, letterSpacing:2, color:t.accent }}>{t.label}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  useEffect(() => {
    // Load main.js animations after component mounts
    // We use a dynamic import approach since main.js uses browser globals
    if (typeof window === "undefined") return;

    // Patch the form submission to use our API instead of EmailJS directly
    window.__VANTAGE_JOIN_API__ = true;

    const script = document.createElement("script");
    script.src = "/main.js";
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup on unmount (navigation away)
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  return (
    <>
      <Head>
        <title>Vantage</title>
      </Head>

      {/* INTRO OVERLAY */}
      <div id="intro">
        <canvas id="intro-canvas"></canvas>
        <div id="intro-logo">
          <img
            src="/Logo.png"
            alt="Vantage"
            id="intro-logo-img"
            onError={(e) => (e.target.style.display = "none")}
          />
          <span id="intro-logo-text">VANTAGE</span>
        </div>
        <div id="intro-tagline">The next greatest sports betting app.</div>
        <div id="intro-odds">
          <span className="odds-label">PARLAY ODDS</span>
          <div className="odds-display">
            <span className="odds-prefix">+</span>
            <span id="odds-number">100</span>
          </div>
          <div className="odds-picks">
            <span className="pick-dot" id="dot-1"></span>
            <span className="pick-dot" id="dot-2"></span>
            <span className="pick-dot" id="dot-3"></span>
            <span className="pick-dot" id="dot-4"></span>
            <span className="pick-dot" id="dot-5"></span>
          </div>
        </div>
      </div>

      {/* MAIN SITE */}
      <div id="site" style={{ opacity: 0, visibility: "hidden" }}>
        <div id="cursor-spotlight" aria-hidden="true"></div>
        <div id="cursor-grid" aria-hidden="true"></div>

        <div id="scroll-bg" aria-hidden="true">
          <div className="bg-aurora"></div>
          <div className="bg-grid"></div>
          <div className="bg-rings"></div>
          <div className="bg-noise"></div>
          <div className="bg-particles" id="bg-particles"></div>
          <div className="bg-heat" id="bg-heat"></div>
        </div>

        <div id="scroll-progress" aria-hidden="true"></div>

        {/* NAV */}
        <nav id="nav">
          <a href="#" className="nav-logo">
            <img
              src="/Logo.png"
              alt="Vantage"
              onError={(e) => (e.target.style.display = "none")}
            />
            <span className="logo-text">VANTAGE</span>
          </a>
          <a href="mailto:vantagesportsbook@gmail.com" className="nav-contact blob-btn">
            Contact Us
            <span className="blob-btn__inner">
              <span className="blob-btn__blobs">
                <span className="blob-btn__blob"></span>
                <span className="blob-btn__blob"></span>
                <span className="blob-btn__blob"></span>
                <span className="blob-btn__blob"></span>
              </span>
            </span>
          </a>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            version="1.1"
            style={{ display: "none" }}
          >
            <defs>
              <filter id="goo">
                <feGaussianBlur
                  in="SourceGraphic"
                  stdDeviation="10"
                  result="blur"
                />
                <feColorMatrix
                  in="blur"
                  mode="matrix"
                  values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
                  result="goo"
                />
                <feBlend in="SourceGraphic" in2="goo" />
              </filter>
            </defs>
          </svg>
        </nav>

        {/* HERO */}
        <section id="hero">
          <div id="ticker-wrap" aria-hidden="true">
            <div id="ticker">
              <span className="tick tick-green">
                🏈 J. Allen OVER 284.5 yds ✓
              </span>
              <span className="tick tick-gold">💰 +$47.50</span>
              <span className="tick">NBA · LeBron PTS OVER 22.5</span>
              <span className="tick tick-green">
                ⚾ Ohtani K&apos;s OVER 7.5 ✓
              </span>
              <span className="tick tick-red">❌ CMC Rush UNDER 74.5</span>
              <span className="tick tick-gold">
                🔥 5-pick parlay · 8.2x payout
              </span>
              <span className="tick">NHL · McDavid Points OVER 1.5</span>
              <span className="tick tick-green">🏀 Curry 3PM OVER 3.5 ✓</span>
              <span className="tick tick-gold">💰 +$122.00</span>
              <span className="tick">NFL · Kelce Rec Yds OVER 68.5</span>
              <span className="tick tick-green">
                🏈 J. Allen OVER 284.5 yds ✓
              </span>
              <span className="tick tick-gold">💰 +$47.50</span>
              <span className="tick">NBA · LeBron PTS OVER 22.5</span>
              <span className="tick tick-green">
                ⚾ Ohtani K&apos;s OVER 7.5 ✓
              </span>
              <span className="tick tick-red">❌ CMC Rush UNDER 74.5</span>
              <span className="tick tick-gold">
                🔥 5-pick parlay · 8.2x payout
              </span>
              <span className="tick">NHL · McDavid Points OVER 1.5</span>
              <span className="tick tick-green">🏀 Curry 3PM OVER 3.5 ✓</span>
              <span className="tick tick-gold">💰 +$122.00</span>
              <span className="tick">NFL · Kelce Rec Yds OVER 68.5</span>
            </div>
          </div>

          {/* HERO PHONE */}
          <div id="cards-field" aria-hidden="true">
            <div className="hero-scene">
              <div className="hero-props">
                <div className="hero-prop-wrap hero-prop-wrap--curry">
                  <div className="prop-shine"></div>
                  <div className="prop-bg">
                    <div className="prop-tiles">
                      <div className="prop-tile prop-tile-1"></div>
                      <div className="prop-tile prop-tile-2"></div>
                      <div className="prop-tile prop-tile-3"></div>
                      <div className="prop-tile prop-tile-4"></div>
                      <div className="prop-tile prop-tile-5"></div>
                      <div className="prop-tile prop-tile-6"></div>
                      <div className="prop-tile prop-tile-7"></div>
                      <div className="prop-tile prop-tile-8"></div>
                    </div>
                    <div className="prop-line prop-line-1"></div>
                    <div className="prop-line prop-line-2"></div>
                  </div>
                  <img
                    className="hero-prop-img"
                    src="/assets/curry prop.png"
                    alt="Curry prop"
                  />
                </div>
                <div className="hero-prop-wrap hero-prop-wrap--lebron">
                  <div className="prop-shine"></div>
                  <div className="prop-bg">
                    <div className="prop-tiles">
                      <div className="prop-tile prop-tile-1"></div>
                      <div className="prop-tile prop-tile-2"></div>
                      <div className="prop-tile prop-tile-3"></div>
                      <div className="prop-tile prop-tile-4"></div>
                      <div className="prop-tile prop-tile-5"></div>
                      <div className="prop-tile prop-tile-6"></div>
                      <div className="prop-tile prop-tile-7"></div>
                      <div className="prop-tile prop-tile-8"></div>
                    </div>
                    <div className="prop-line prop-line-1"></div>
                    <div className="prop-line prop-line-2"></div>
                  </div>
                  <img
                    className="hero-prop-img"
                    src="/assets/Lebron prop.png"
                    alt="LeBron prop"
                  />
                </div>
              </div>
              <div className="hero-phone-wrap">
                <div className="hero-phone-glow" aria-hidden="true"></div>
                <div className="hero-phone">
                  <div className="hero-phone-notch"></div>
                  <div className="hero-phone-screen">
                    <img
                      className="hero-phone-ui"
                      src="/assets/phonepicture.png"
                      alt="Vantage phone UI"
                      loading="eager"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* HERO COPY */}
          <div className="hero-center">
            <div className="hero-eyebrow" id="eyebrow">
              <span className="eyebrow-dot"></span>
              <span>Now in private beta</span>
            </div>
            <h1 className="hero-headline" id="hero-headline">
              Never Sweat
              <br />A Parlay Alone.
            </h1>
            <p className="hero-sub" id="hero-sub">
              Making Betting Even Better.
            </p>
            <div className="hero-actions" id="hero-actions">
              <a href="#waitlist" className="blob-btn blob-btn--cta">
                Join the Waitlist
                <span className="blob-btn__inner">
                  <span className="blob-btn__blobs">
                    <span className="blob-btn__blob"></span>
                    <span className="blob-btn__blob"></span>
                    <span className="blob-btn__blob"></span>
                    <span className="blob-btn__blob"></span>
                  </span>
                </span>
              </a>
              <span className="hero-count">
                <strong>100+</strong> on the list
              </span>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features">
          <div className="features-sticky">
            {/* Slide 1: Sweat Screen */}
            <div className="feature-slide" id="slide-squad">
              <div className="slide-inner">
                <div className="slide-text">
                  <div className="slide-meta">
                    <span className="slide-count">01 / 02</span>
                    <span className="slide-tag">The Sweat Screen</span>
                  </div>
                  <h2 className="slide-heading">
                    Every play.
                    <br />
                    Word for word.
                    <br />
                    In real time.
                  </h2>
                  <p className="slide-body">
                    Watch your parlay players go off or bust, live.
                    Every bucket, every rush, every strikeout
                    lands the second it happens.
                  </p>
                  <ul className="wl-perks">
                    <li className="perk-item">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Play by play updates, word for word
                    </li>
                    <li className="perk-item">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Live prop lines tick by tick
                    </li>
                    <li className="perk-item">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Squad reacts with you in real time
                    </li>
                  </ul>
                </div>
                <div className="slide-visual">
                  <div className="slide-phone-frame">
                    <div className="slide-phone-notch"></div>
                    <img
                      src="/sweatscreen.png"
                      alt="Sweat screen live play-by-play"
                      className="slide-phone-img"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Slide 2: Player Cards */}
            <div className="feature-slide" id="slide-cards">
              <div className="slide-inner">
                <div className="slide-text">
                  <div className="slide-meta">
                    <span className="slide-count">02 / 02</span>
                    <span className="slide-tag">Player Cards</span>
                  </div>
                  <h2 className="slide-heading">
                    Collect every
                    <br />
                    legend.
                  </h2>
                  <p className="slide-body">
                    Place slips to unlock player cards and earn capped XP. Cards are cosmetics only.
                  </p>
                  <ul className="wl-perks">
                    <li className="perk-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Bet on players to unlock their card and earn XP
                    </li>
                    <li className="perk-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Leveling milestones unlock promos: boosts and protected pick rewards
                    </li>
                    <li className="perk-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Progress tracked per season. Card borders reset every season.
                    </li>
                  </ul>
                </div>
                <div className="slide-visual slide-visual--cards">
                  <div className="slide-cards-stack">
                    <div className="pc-card-wrap">
                      <PlayerCard
                        name="Anthony Edwards"
                        team="MIN"
                        teamFull="Minnesota Timberwolves"
                        season="2025–2026"
                        sport="basketball"
                        imageUrl="https://cdn.nba.com/headshots/nba/latest/1040x760/1630162.png"
                        teamLogoUrl="https://a.espncdn.com/i/teamlogos/nba/500/min.png"
                        betsPlaced={89} wins={67} wagered={4200}
                        tier="platinum" progress={1.0} rank={1}
                      />
                    </div>
                    <div className="pc-card-wrap">
                      <PlayerCard
                        name="Stephen Curry"
                        team="GSW"
                        teamFull="Golden State Warriors"
                        season="2025–2026"
                        sport="basketball"
                        imageUrl="https://cdn.nba.com/headshots/nba/latest/1040x760/201939.png"
                        teamLogoUrl="https://a.espncdn.com/i/teamlogos/nba/500/gsw.png"
                        betsPlaced={76} wins={51} wagered={3800}
                        tier="diamond" progress={0.58} rank={2}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WAITLIST */}
        <section id="waitlist">
          <div className="orb orb-1" aria-hidden="true"></div>
          <div className="orb orb-2" aria-hidden="true"></div>
          <div className="ed-divider" aria-hidden="true">
            <span className="ed-divider-line" id="ed-line-3"></span>
            <span className="ed-divider-label">Early Access</span>
          </div>
          <div className="waitlist-inner">
            <div className="waitlist-text">
              <h2 className="wl-heading" id="wl-heading">
                Get in before
                <br />
                everyone else.
              </h2>
              <p className="wl-sub">
                Join the waitlist for early beta access and lock in exclusive
                perks before we go live.
              </p>
              <ul className="wl-perks">
                <li className="perk-item">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Free credits to bet with on launch
                </li>
                <li className="perk-item">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Squad rooms &amp; exclusive player cards
                </li>
                <li className="perk-item">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Massive promos &amp; drops every day
                </li>
              </ul>
            </div>
            <div className="waitlist-form-wrap" id="wl-form-wrap">
              <form id="waitlist-form" className="waitlist-form">
                <label className="form-label" htmlFor="email-input">
                  Your email
                </label>
                <div className="form-row">
                  <input
                    type="email"
                    name="email"
                    id="email-input"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                </div>
                <button type="submit" className="blob-btn blob-btn--full">
                  Join the Waitlist →
                  <span className="blob-btn__inner">
                    <span className="blob-btn__blobs">
                      <span className="blob-btn__blob"></span>
                      <span className="blob-btn__blob"></span>
                      <span className="blob-btn__blob"></span>
                      <span className="blob-btn__blob"></span>
                    </span>
                  </span>
                </button>
                <p className="form-note">No spam. Unsubscribe anytime.</p>
              </form>
              <div id="form-success" className="form-success" hidden>
                <div className="success-check">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3>You&apos;re in.</h3>
                <p>You&apos;re on the list. View your squad room below.</p>
                <a
                  id="view-squad-btn"
                  href="#"
                  className="btn btn-primary"
                  style={{ marginTop: "1rem", display: "inline-block" }}
                >
                  View My Squad →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer id="footer">
          <div className="footer-inner">
            <p className="footer-copy">
              &copy; 2026 Vantage. All rights reserved.
            </p>
          </div>
        </footer>
      </div>

      {/* Basketball hoop animation */}
      <div id="bball-stage" aria-hidden="true">
        <div id="bball-hoop">
          <svg
            id="bball-hoop-svg"
            viewBox="0 0 160 90"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="60"
              y="0"
              width="40"
              height="26"
              rx="3"
              fill="#1a1a1a"
              stroke="#333"
              strokeWidth="1.5"
            />
            <rect
              x="68"
              y="6"
              width="24"
              height="14"
              rx="2"
              fill="none"
              stroke="#c9ab6e"
              strokeWidth="1.2"
              opacity="0.7"
            />
            <line
              x1="80"
              y1="26"
              x2="80"
              y2="34"
              stroke="#555"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <ellipse
              cx="80"
              cy="36"
              rx="28"
              ry="5"
              fill="none"
              stroke="#e05252"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M52,36 Q50,55 58,68 Q64,76 80,78 Q96,76 102,68 Q110,55 108,36"
              fill="none"
              stroke="rgba(240,235,225,0.25)"
              strokeWidth="1"
            />
            <path
              d="M80,36 L75,78"
              fill="none"
              stroke="rgba(240,235,225,0.18)"
              strokeWidth="0.8"
            />
            <path
              d="M80,36 L85,78"
              fill="none"
              stroke="rgba(240,235,225,0.18)"
              strokeWidth="0.8"
            />
            <path
              d="M68,37 L65,78"
              fill="none"
              stroke="rgba(240,235,225,0.18)"
              strokeWidth="0.8"
            />
            <path
              d="M92,37 L95,78"
              fill="none"
              stroke="rgba(240,235,225,0.18)"
              strokeWidth="0.8"
            />
            <path
              d="M59,38 L62,70"
              fill="none"
              stroke="rgba(240,235,225,0.18)"
              strokeWidth="0.8"
            />
            <path
              d="M101,38 L98,70"
              fill="none"
              stroke="rgba(240,235,225,0.18)"
              strokeWidth="0.8"
            />
            <path
              d="M55,47 Q80,52 105,47"
              fill="none"
              stroke="rgba(240,235,225,0.15)"
              strokeWidth="0.8"
            />
            <path
              d="M57,58 Q80,64 103,58"
              fill="none"
              stroke="rgba(240,235,225,0.15)"
              strokeWidth="0.8"
            />
            <path
              d="M60,68 Q80,73 100,68"
              fill="none"
              stroke="rgba(240,235,225,0.12)"
              strokeWidth="0.8"
            />
          </svg>
        </div>
        <div id="bball-ball">🏀</div>
        <div id="bball-cash-burst"></div>
        <div id="bball-score-text"></div>
      </div>
    </>
  );
}
