import React, { useEffect, useState } from 'react';
import { Activity, Bitcoin, Coins, LineChart, TrendingUp, Cpu, Car, Globe, Target } from 'lucide-react';

export default function LandingPage({ onComplete }) {
  const [phase, setPhase] = useState('sucking'); // sucking -> explosion -> text

  useEffect(() => {
    // Stage 1: Assets move to center (2s)
    const t1 = setTimeout(() => setPhase('explosion'), 2500);
    // Stage 2: CHRONOS text pops up (3s)
    const t2 = setTimeout(() => setPhase('text'), 3000);
    // Stage 3: Auto-complete and enter site (6s)
    const t3 = setTimeout(() => onComplete(), 5500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  // Generate random starting positions outside the center
  const assets = [
    { id: 1, icon: <Bitcoin size={48} className="text-[#F7931A]" />, x: '-40vw', y: '-40vh', delay: '0s', type: 'crypto' },
    { id: 2, icon: <Coins size={48} className="text-[#FFD700]" />, x: '40vw', y: '-30vh', delay: '0.2s', type: 'gold' },
    { id: 3, icon: <TrendingUp size={48} className="text-emerald-500" />, x: '-30vw', y: '40vh', delay: '0.4s', type: 'chart' },
    { id: 4, icon: <LineChart size={48} className="text-blue-500" />, x: '35vw', y: '35vh', delay: '0.1s', type: 'trend' },
    { id: 5, icon: <div className="text-2xl font-black text-green-600">NVDA</div>, x: '-50vw', y: '0', delay: '0.3s', type: 'stock' },
    { id: 6, icon: <div className="text-2xl font-black text-blue-800">RELIANCE</div>, x: '50vw', y: '0', delay: '0.5s', type: 'stock' },
    { id: 7, icon: <Car size={48} className="text-red-600" />, x: '0', y: '-50vh', delay: '0.6s', type: 'tesla' },
    { id: 8, icon: <Globe size={48} className="text-blue-600" />, x: '0', y: '50vh', delay: '0.2s', type: 'meta' },
    { id: 9, icon: <Target size={48} className="text-orange-500" />, x: '-40vw', y: '20vh', delay: '0.7s', type: 'google' },
    { id: 10, icon: <Activity size={48} className="text-purple-500" />, x: '40vw', y: '-10vh', delay: '0.3s', type: 'pulse' },
    { id: 11, icon: <div className="text-xl font-bold text-slate-400">AAPL</div>, x: '20vw', y: '-40vh', delay: '0.1s', type: 'stock' },
    { id: 12, icon: <div className="text-xl font-bold text-slate-400">MSFT</div>, x: '-20vw', y: '50vh', delay: '0.4s', type: 'stock' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 overflow-hidden flex items-center justify-center cursor-pointer" onClick={onComplete}>
      
      {/* Dark modern background grid */}
      <div className="absolute inset-0 opacity-20" 
           style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* Floating Assets converging to center */}
      {phase === 'sucking' && assets.map((asset) => (
        <div 
          key={asset.id} 
          className="absolute transition-all duration-[2000ms] ease-in-cubic"
          style={{
            '--start-x': asset.x,
            '--start-y': asset.y,
            transform: `translate(${asset.x}, ${asset.y})`, // Initial state before animation starts
            animation: `suckIn 2s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards`,
            animationDelay: asset.delay
          }}
        >
          {asset.icon}
        </div>
      ))}

      {/* Explosion / Flash when they hit center */}
      {phase === 'explosion' && (
        <div className="absolute w-32 h-32 bg-indigo-500 rounded-full blur-[100px] animate-ping opacity-70"></div>
      )}

      {/* Text Popup */}
      <div className={`relative z-10 transition-all duration-1000 transform ${phase === 'text' ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
        <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 drop-shadow-2xl">
          CHRONOS
        </h1>
        <p className={`text-center text-slate-400 font-medium tracking-[0.3em] uppercase mt-4 transition-all duration-1000 delay-500 ${phase === 'text' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          Quantitative Intelligence
        </p>
      </div>

    </div>
  );
}
