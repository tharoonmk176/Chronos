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
    { id: 1, icon: <img src="https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg" className="w-16 h-16 drop-shadow-2xl" alt="Bitcoin" />, x: '-40vw', y: '-40vh', delay: '0s' },
    { id: 2, icon: <img src="https://cryptologos.cc/logos/paxos-gold-paxg-logo.png" className="w-16 h-16 drop-shadow-2xl" alt="Gold" />, x: '40vw', y: '-30vh', delay: '0.2s' },
    { id: 3, icon: <img src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=200&h=200&fit=crop&q=80" className="w-24 h-24 rounded-lg shadow-2xl object-cover" alt="Chart" />, x: '-30vw', y: '40vh', delay: '0.4s' },
    { id: 4, icon: <img src="https://upload.wikimedia.org/wikipedia/commons/c/c5/Candlestick_chart_example.svg" className="w-32 h-auto drop-shadow-2xl opacity-90" alt="Candlesticks" />, x: '35vw', y: '35vh', delay: '0.1s' },
    { id: 5, icon: <img src="https://logo.clearbit.com/nvidia.com" className="w-16 h-16 rounded shadow-xl" alt="NVDA" />, x: '-50vw', y: '0', delay: '0.3s' },
    { id: 6, icon: <img src="https://logo.clearbit.com/ril.com" className="w-16 h-16 rounded shadow-xl" alt="Reliance" />, x: '50vw', y: '0', delay: '0.5s' },
    { id: 7, icon: <img src="https://logo.clearbit.com/tesla.com" className="w-16 h-16 rounded shadow-xl bg-white p-1" alt="Tesla" />, x: '0', y: '-50vh', delay: '0.6s' },
    { id: 8, icon: <img src="https://logo.clearbit.com/meta.com" className="w-16 h-16 rounded shadow-xl" alt="Meta" />, x: '0', y: '50vh', delay: '0.2s' },
    { id: 9, icon: <img src="https://logo.clearbit.com/google.com" className="w-16 h-16 rounded shadow-xl bg-white p-2" alt="Google" />, x: '-40vw', y: '20vh', delay: '0.7s' },
    { id: 10, icon: <img src="https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=200&h=200&fit=crop&q=80" className="w-24 h-24 rounded-lg shadow-2xl object-cover" alt="Pulse" />, x: '40vw', y: '-10vh', delay: '0.3s' },
    { id: 11, icon: <img src="https://logo.clearbit.com/apple.com" className="w-16 h-16 rounded shadow-xl bg-white p-1" alt="Apple" />, x: '20vw', y: '-40vh', delay: '0.1s' },
    { id: 12, icon: <img src="https://logo.clearbit.com/microsoft.com" className="w-16 h-16 rounded shadow-xl" alt="Microsoft" />, x: '-20vw', y: '50vh', delay: '0.4s' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 overflow-hidden flex items-center justify-center cursor-pointer" onClick={onComplete}>
      


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
