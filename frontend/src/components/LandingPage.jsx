import React, { useEffect, useState } from 'react';

export default function LandingPage({ onComplete }) {
  const [phase, setPhase] = useState('sucking'); // sucking -> explosion -> text

  useEffect(() => {
    // Stage 1: Fast, snappy convergence (1.2s)
    const t1 = setTimeout(() => setPhase('explosion'), 2000);
    // Stage 2: CHRONOS text pops up immediately after (1.4s)
    const t2 = setTimeout(() => setPhase('text'), 2100);
    // Stage 3: Auto-complete and enter site (4s total)
    const t3 = setTimeout(() => onComplete(), 4800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  // High-performance SVG trend chart (Transparent, glowing)
  const TrendChartGreen = () => (
    <svg width="180" height="90" viewBox="0 0 200 100" fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_20px_rgba(16,185,129,0.8)] opacity-90">
      <path d="M10,90 L50,50 L80,65 L130,20 L160,35 L190,5" />
    </svg>
  );

  const TrendChartBlue = () => (
    <svg width="180" height="90" viewBox="0 0 200 100" fill="none" stroke="#3b82f6" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_20px_rgba(59,130,246,0.8)] opacity-90">
      <path d="M10,80 L40,40 L90,60 L140,10 L190,30" />
    </svg>
  );

  // 16 rich assets converging from all angles
  const assets = [
    { id: 1, icon: <img src="https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg" className="w-10 h-10 drop-shadow-[0_0_15px_rgba(247,147,26,0.5)]" alt="BTC" />, x: '-45vw', y: '-40vh', delay: '0s', rot: 45 },
    { id: 2, icon: <img src="https://cryptologos.cc/logos/paxos-gold-paxg-logo.png" className="w-10 h-10 drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]" alt="Gold" />, x: '45vw', y: '-35vh', delay: '0.1s', rot: -30 },
    { id: 3, icon: <TrendChartGreen />, x: '-35vw', y: '45vh', delay: '0.2s', rot: 15 },
    { id: 4, icon: <TrendChartBlue />, x: '35vw', y: '40vh', delay: '0.05s', rot: -15 },
    { id: 5, icon: <img src="https://logo.clearbit.com/nvidia.com" className="w-16 h-16 rounded-xl shadow-[0_0_20px_rgba(118,185,0,0.4)]" alt="NVDA" />, x: '-50vw', y: '0', delay: '0.15s', rot: 60 },
    { id: 6, icon: <img src="https://logo.clearbit.com/ril.com" className="w-16 h-16 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)]" alt="Reliance" />, x: '50vw', y: '0', delay: '0.25s', rot: -45 },
    { id: 7, icon: <img src="https://logo.clearbit.com/tesla.com" className="w-16 h-16 rounded-xl shadow-[0_0_20px_rgba(227,25,55,0.4)] bg-white p-1" alt="Tesla" />, x: '0', y: '-50vh', delay: '0.3s', rot: 90 },
    { id: 8, icon: <img src="https://logo.clearbit.com/meta.com" className="w-16 h-16 rounded-xl shadow-[0_0_20px_rgba(6,104,225,0.4)] bg-white p-1" alt="Meta" />, x: '0', y: '50vh', delay: '0.1s', rot: -90 },
    { id: 9, icon: <img src="https://logo.clearbit.com/google.com" className="w-16 h-16 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] bg-white p-2" alt="Google" />, x: '-40vw', y: '25vh', delay: '0.35s', rot: 120 },
    { id: 10, icon: <img src="https://upload.wikimedia.org/wikipedia/commons/0/05/Ethereum_logo_2014.svg" className="w-8 h-12 drop-shadow-[0_0_15px_rgba(98,126,234,0.5)]" alt="ETH" />, x: '40vw', y: '-15vh', delay: '0.15s', rot: -120 },
    { id: 11, icon: <img src="https://logo.clearbit.com/apple.com" className="w-16 h-16 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] bg-white p-1" alt="Apple" />, x: '25vw', y: '-45vh', delay: '0.05s', rot: 30 },
    { id: 12, icon: <img src="https://logo.clearbit.com/microsoft.com" className="w-16 h-16 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)]" alt="Microsoft" />, x: '-25vw', y: '50vh', delay: '0.2s', rot: -60 },
    { id: 13, icon: <img src="https://logo.clearbit.com/amazon.com" className="w-16 h-16 rounded-xl shadow-[0_0_20px_rgba(255,153,0,0.4)] bg-white p-2" alt="Amazon" />, x: '-20vw', y: '-30vh', delay: '0.25s', rot: 75 },
    { id: 14, icon: <img src="https://logo.clearbit.com/netflix.com" className="w-16 h-16 rounded-xl shadow-[0_0_20px_rgba(229,9,20,0.4)]" alt="Netflix" />, x: '20vw', y: '30vh', delay: '0.1s', rot: -75 },
    { id: 15, icon: <img src="https://logo.clearbit.com/amd.com" className="w-16 h-16 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] bg-black p-1" alt="AMD" />, x: '-45vw', y: '-15vh', delay: '0.3s', rot: 105 },
    { id: 16, icon: <img src="https://logo.clearbit.com/tsmc.com" className="w-16 h-16 rounded-xl shadow-[0_0_20px_rgba(255,0,0,0.4)] bg-white p-1" alt="TSMC" />, x: '45vw', y: '15vh', delay: '0.05s', rot: -105 }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 overflow-hidden flex items-center justify-center cursor-pointer" onClick={onComplete}>
      
      {/* Floating Assets converging to center with extreme smoothness */}
      {phase === 'sucking' && assets.map((asset) => (
        <div 
          key={asset.id} 
          className="absolute"
          style={{
            '--start-x': asset.x,
            '--start-y': asset.y,
            '--rot': asset.rot,
            transform: `translate(${asset.x}, ${asset.y})`,
            willChange: 'transform, opacity, filter',
            animation: `suckInSmooth 1.8s cubic-bezier(0.7, 0, 0.3, 1) forwards`,
            animationDelay: asset.delay
          }}
        >
          {asset.icon}
        </div>
      ))}

      {/* No explosion overlay per user request */}

      {/* Text Popup */}
      <div className={`relative z-10 transition-all duration-700 ease-out transform ${phase === 'text' ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
        <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 drop-shadow-[0_0_30px_rgba(99,102,241,0.5)]">
          CHRONOS
        </h1>
        <p className={`text-center text-slate-300 font-bold tracking-[0.4em] uppercase mt-4 transition-all duration-700 delay-300 ${phase === 'text' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          Quantitative Intelligence
        </p>
      </div>

    </div>
  );
}
