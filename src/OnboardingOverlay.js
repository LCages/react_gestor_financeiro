import { useEffect, useRef, useState } from "react";
 
/**
 * OnboardingOverlay — 4 steps
 *
 * Step 1 → Spotlight no botão "Adicionar" do header (cartão)
 *           Botão "Mais tarde" disponível
 * Step 2 → Frame iluminando o modal AddCartao aberto
 *           (sem overlay fosco — usuário preenche livremente)
 * Step 3 → Spotlight no botão "Adicionar" da barra de lançamentos
 *           Botão "Mais tarde" disponível
 * Step 4 → Frame iluminando o formulário de lançamento aberto
 *           (sem overlay fosco — usuário preenche livremente)
 *
 * Props:
 *   step        : 1 | 2 | 3 | 4
 *   targetRef   : ref do elemento destacado (botão ou container do form/modal)
 *   onDismiss   : clicou no spotlight / botão de ação
 *   onSkip      : clicou em "Mais tarde" (steps 1 e 3)
 */
export default function OnboardingOverlay({ step, targetRef, onDismiss, onSkip }) {
  const [rect, setRect] = useState(null);
  const rafRef          = useRef(null);
 
  // Rastreia posição do elemento-alvo em tempo real
  useEffect(() => {
    function tick() {
      if (targetRef?.current) {
        const r = targetRef.current.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [targetRef]);
 
  if (!rect) return null;
 
  // ── Steps 2 e 4: frame ao redor do modal/form (sem fundo fosco bloqueante) ──
  if (step === 2 || step === 4) {
    const PAD    = 14;
    const fTop   = rect.top  - PAD;
    const fLeft  = rect.left - PAD;
    const fW     = rect.width  + PAD * 2;
    const fH     = rect.height + PAD * 2;
 
    const label = step === 2
      ? "Preencha os dados do seu cartão 👆"
      : "Preencha os dados do lançamento 👆";
 
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 3000, pointerEvents: "none" }}>
 
        {/* 4 tiras fosca ao redor do frame — top, bottom, left, right */}
        {/* top */}
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: Math.max(0, fTop), background: "rgba(5,7,15,0.75)", backdropFilter: "blur(3px)" }} />
        {/* bottom */}
        <div style={{ position: "fixed", top: fTop + fH, left: 0, right: 0, bottom: 0, background: "rgba(5,7,15,0.75)", backdropFilter: "blur(3px)" }} />
        {/* left */}
        <div style={{ position: "fixed", top: fTop, left: 0, width: Math.max(0, fLeft), height: fH, background: "rgba(5,7,15,0.75)", backdropFilter: "blur(3px)" }} />
        {/* right */}
        <div style={{ position: "fixed", top: fTop, left: fLeft + fW, right: 0, height: fH, background: "rgba(5,7,15,0.75)", backdropFilter: "blur(3px)" }} />
 
        {/* borda luminosa ao redor do frame */}
        <div style={{
          position:     "fixed",
          top:          fTop,
          left:         fLeft,
          width:        fW,
          height:       fH,
          borderRadius: 20,
          border:       "2px solid rgba(255,255,255,0.28)",
          boxShadow:    "0 0 0 4px rgba(33,150,243,0.18), 0 0 40px rgba(33,150,243,0.15)",
          pointerEvents: "none",
          animation:    "obFramePulse 2.5s ease-in-out infinite",
        }} />
 
        {/* label flutuante abaixo do frame */}
        <div style={{
          position:       "fixed",
          top:            fTop + fH + 14,
          left:           fLeft + fW / 2,
          transform:      "translateX(-50%)",
          background:     "rgba(20,24,36,0.95)",
          border:         "1px solid rgba(255,255,255,0.12)",
          borderRadius:   12,
          padding:        "10px 18px",
          color:          "#e8eaf0",
          fontFamily:     '"Inter","Segoe UI",sans-serif',
          fontSize:       13,
          fontWeight:     600,
          whiteSpace:     "nowrap",
          pointerEvents:  "none",
          backdropFilter: "blur(16px)",
          boxShadow:      "0 8px 24px rgba(0,0,0,0.4)",
          animation:      "obFadeIn 0.35s ease",
          zIndex:         3001,
        }}>
          {label}
        </div>
 
        {/* indicador de passo — canto inferior central */}
        <StepDots step={step} />
 
        <style>{`
          @keyframes obFramePulse {
            0%, 100% { box-shadow: 0 0 0 4px rgba(33,150,243,0.18), 0 0 40px rgba(33,150,243,0.15); }
            50%       { box-shadow: 0 0 0 6px rgba(33,150,243,0.30), 0 0 60px rgba(33,150,243,0.25); }
          }
          @keyframes obFadeIn {
            from { opacity: 0; transform: translateX(-50%) translateY(6px); }
            to   { opacity: 1; transform: translateX(-50%) translateY(0); }
          }
          @keyframes obPulseRing {
            0%, 100% { opacity: 0.35; transform: scale(1); }
            50%       { opacity: 0.70; transform: scale(1.06); }
          }
          @keyframes obSpotFadeIn {
            from { opacity: 0; transform: translateX(-50%) translateY(8px); }
            to   { opacity: 1; transform: translateX(-50%) translateY(0); }
          }
        `}</style>
      </div>
    );
  }
 
  // ── Steps 1 e 3: spotlight circular ──────────────────────────────────────
 
  const PAD    = 12;
  const cx     = rect.left + rect.width  / 2;
  const cy     = rect.top  + rect.height / 2;
  const radius = Math.max(rect.width, rect.height) / 2 + PAD;
 
  const textos = {
    1: {
      titulo: "Bem-vindo! 👋",
      sub:    "Comece adicionando o seu primeiro cartão para organizar suas finanças.",
      acao:   "Adicionar cartão",
    },
    3: {
      titulo: "Cartão criado! 🎉",
      sub:    "Agora adicione o seu primeiro lançamento para começar a controlar suas finanças.",
      acao:   "Adicionar lançamento",
    },
  };
  const t = textos[step];
 
  // balão acima ou abaixo do spotlight
  const BALAO_H    = 180;
  const balaoAbaixo = cy + radius + 16 + BALAO_H < window.innerHeight;
  const balaoTop    = balaoAbaixo
    ? cy + radius + 16
    : cy - radius - 16 - BALAO_H;
 
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 3000, pointerEvents: "none" }}>
 
      {/* overlay fosco com buraco SVG */}
      <svg
        width="100%" height="100%"
        style={{ position: "absolute", inset: 0, pointerEvents: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <defs>
          <mask id="ob-mask">
            <rect width="100%" height="100%" fill="white" />
            <circle cx={cx} cy={cy} r={radius} fill="black" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(5,7,15,0.82)" mask="url(#ob-mask)" />
        {/* anel pulsante */}
        <circle
          cx={cx} cy={cy} r={radius + 3}
          fill="none" stroke="rgba(255,255,255,0.30)" strokeWidth="2"
          style={{ animation: "obPulseRing 2s ease-in-out infinite", transformOrigin: `${cx}px ${cy}px` }}
        />
      </svg>
 
      {/* área clicável sobre o spotlight */}
      <div
        style={{
          position: "fixed",
          top: cy - radius, left: cx - radius,
          width: radius * 2, height: radius * 2,
          borderRadius: "50%",
          cursor: "pointer",
          zIndex: 3002,
          pointerEvents: "auto",
        }}
        onClick={(e) => { e.stopPropagation(); onDismiss?.(); }}
      />
 
      {/* balão de texto */}
      <div style={{
        position:       "fixed",
        top:            balaoTop,
        left:           "50%",
        transform:      "translateX(-50%)",
        width:          "clamp(270px, 88vw, 380px)",
        background:     "rgba(18,22,34,0.97)",
        border:         "1px solid rgba(255,255,255,0.13)",
        borderRadius:   20,
        padding:        "24px 26px 20px",
        boxShadow:      "0 20px 56px rgba(0,0,0,0.60)",
        backdropFilter: "blur(20px)",
        textAlign:      "center",
        pointerEvents:  "auto",
        animation:      "obSpotFadeIn 0.4s ease",
        zIndex:         3001,
      }}>
        {/* seta */}
        <div style={{
          position: "absolute", left: "50%", transform: "translateX(-50%)",
          width: 0, height: 0,
          ...(balaoAbaixo
            ? { top: -10, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderBottom: "10px solid rgba(255,255,255,0.13)" }
            : { bottom: -10, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderTop: "10px solid rgba(255,255,255,0.13)" }
          ),
        }} />
 
        <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#e8eaf0", fontFamily: '"Inter","Segoe UI",sans-serif', lineHeight: 1.35 }}>
          {t.titulo}
        </p>
        <p style={{ margin: "10px 0 18px", fontSize: 13, color: "#8b93a5", fontFamily: '"Inter","Segoe UI",sans-serif', lineHeight: 1.6 }}>
          {t.sub}
        </p>
 
        {/* botão de ação principal */}
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss?.(); }}
          style={{
            width:        "100%",
            padding:      "11px 0",
            borderRadius: 12,
            border:       "none",
            background:   "linear-gradient(135deg, #1565c0, #1976d2)",
            color:        "#fff",
            fontFamily:   '"Inter","Segoe UI",sans-serif',
            fontSize:     14,
            fontWeight:   700,
            cursor:       "pointer",
            transition:   "opacity 0.2s, transform 0.15s",
            marginBottom: 10,
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
        >
          {t.acao}
        </button>
 
        {/* botão "Mais tarde" */}
        <button
          onClick={(e) => { e.stopPropagation(); onSkip?.(); }}
          style={{
            width:      "100%",
            padding:    "9px 0",
            borderRadius: 12,
            border:     "1px solid rgba(255,255,255,0.08)",
            background: "transparent",
            color:      "#8b93a5",
            fontFamily: '"Inter","Segoe UI",sans-serif',
            fontSize:   13,
            fontWeight: 600,
            cursor:     "pointer",
            transition: "background 0.2s, color 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "#e8eaf0"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#8b93a5"; }}
        >
          Mais tarde
        </button>
 
        <StepDots step={step} inline />
      </div>
 
      <style>{`
        @keyframes obPulseRing {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50%       { opacity: 0.70; transform: scale(1.06); }
        }
        @keyframes obSpotFadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes obFramePulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(33,150,243,0.18), 0 0 40px rgba(33,150,243,0.15); }
          50%       { box-shadow: 0 0 0 6px rgba(33,150,243,0.30), 0 0 60px rgba(33,150,243,0.25); }
        }
        @keyframes obFadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
 
// ── Indicador de 4 passos ────────────────────────────────────────────────────
 
function StepDots({ step, inline }) {
  const wrapper = {
    display:        "flex",
    justifyContent: "center",
    gap:            6,
    marginTop:      inline ? 16 : 0,
    ...(inline ? {} : {
      position: "fixed",
      bottom:   28,
      left:     "50%",
      transform: "translateX(-50%)",
      zIndex:   3003,
    }),
  };
 
  return (
    <div style={wrapper}>
      {[1, 2, 3, 4].map((s) => (
        <div key={s} style={{
          width:        s === step ? 20 : 6,
          height:       6,
          borderRadius: 3,
          background:   s === step ? "#2196F3" : "rgba(255,255,255,0.20)",
          transition:   "width 0.3s ease, background 0.3s ease",
        }} />
      ))}
    </div>
  );
}