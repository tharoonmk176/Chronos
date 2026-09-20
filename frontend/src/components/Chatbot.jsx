import { useRegion } from "../RegionContext";
import React, { useContext, useState, useRef, useEffect } from 'react';
import { useSelector } from "react-redux";
import { Bot, User, Send, X, MessageSquare, Sparkles } from 'lucide-react';

export default function Chatbot() {
  const backtestResults = useSelector(s => s.backtest?.results);
  const { region } = useRegion();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "assistant", content: "Hi! I am CHRONOS, your AI Quantitative Research Assistant. What would you like to analyze today?" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [...messages, userMsg], 
          context: backtestResults ? JSON.stringify({
            performance: backtestResults.performance,
            risk_metrics: backtestResults.risk_metrics,
            trade_statistics: backtestResults.trade_statistics,
            parameters_used: backtestResults.parameters
          }) : "No active backtest results on dashboard right now." 
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "Error fetching response." }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Network error reaching the AI backend." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-14 w-14 bg-gradient-to-tr from-indigo-600 to-purple-500 hover:from-indigo-700 hover:to-purple-600 text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 z-50 group"
      >
        {isOpen ? (
          <X className="h-6 w-6 transition-transform group-hover:rotate-90" />
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[350px] sm:w-[400px] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden ring-1 ring-black/5" style={{ height: '600px', maxHeight: '80vh' }}>
          
          {/* Header */}
          <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-zinc-950 dark:to-zinc-900 p-4 text-white flex items-center justify-between border-b border-zinc-700/50">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[1px]">
                <div className="h-full w-full rounded-full bg-zinc-900 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                </div>
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide text-zinc-100 flex items-center gap-2">
                  CHRONOS AI
                  <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold">BETA</span>
                </h3>
                <p className="text-[11px] text-zinc-400 font-medium">Quantitative Research Engine</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-5 bg-slate-50/50 dark:bg-zinc-950/50">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                
                {/* Avatar */}
                <div className="flex-shrink-0 mt-auto">
                  {m.role === 'user' ? (
                    <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center">
                      <User className="h-4 w-4 text-slate-500 dark:text-zinc-400" />
                    </div>
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  )}
                </div>

                {/* Bubble */}
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed shadow-sm whitespace-pre-wrap ${
                  m.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-br-sm' 
                    : 'bg-white dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-200 border border-slate-200/60 dark:border-zinc-700/50 rounded-bl-sm'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-3 flex-row">
                <div className="flex-shrink-0 mt-auto">
                  <div className="h-7 w-7 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                <div className="bg-white dark:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-700/50 p-3 rounded-2xl rounded-bl-sm flex gap-1 items-center shadow-sm h-10">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800">
            <div className="relative flex items-center">
              <input
                type="text"
                className="w-full bg-slate-100 dark:bg-zinc-800 border-none rounded-full pl-4 pr-12 py-3 text-[13px] text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 outline-none placeholder-slate-400 dark:placeholder-zinc-500"
                placeholder="Message CHRONOS..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="absolute right-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-full p-2 flex items-center justify-center transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="text-center mt-2">
              <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                CHRONOS AI can make mistakes. Verify quantitative data.
              </p>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
