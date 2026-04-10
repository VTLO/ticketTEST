/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, Phone, Paperclip, Smile, Send, Plus, Minus, Ticket, Smartphone, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type View = 'setup' | 'sending' | 'ticket' | 'history';
type TicketType = '1H';

interface TicketData {
  type: TicketType;
  price: string;
  date: string;
  startTime: string;
  endTime: string;
  hash: string;
  receivedTime: string;
}

interface HistoryBatch {
  id: string;
  timestamp: number;
  type: TicketType;
  count: number;
  tickets: TicketData[];
}

const TICKET_CONFIG = {
  '1H': { label: '1 Heure', price: '2.60 E', code: '1H', duration: 60 },
};

const MatrixRain = () => {
  const characters = "0123456789ABCDEFHIJKLMNOPQRSTUVWXYZ@#$%&*";
  return (
    <div className="absolute inset-0 overflow-hidden bg-black flex flex-wrap content-start opacity-40">
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -100, opacity: 0 }}
          animate={{ 
            y: [null, 600],
            opacity: [0, 1, 1, 0]
          }}
          transition={{ 
            duration: Math.random() * 0.5 + 0.5,
            repeat: Infinity,
            delay: Math.random() * 0.5,
            ease: "linear"
          }}
          className="text-[#00FF41] text-[10px] font-mono leading-none w-4 text-center"
        >
          {characters[Math.floor(Math.random() * characters.length)]}
        </motion.div>
      ))}
    </div>
  );
};

const Logo = ({ className = "", scale = 1 }: { className?: string, scale?: number }) => (
  <div className={`flex items-center justify-center ${className}`} style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
    <div className="relative flex items-center justify-center w-11 h-11 rounded-full flex-shrink-0" style={{
      background: 'conic-gradient(from 0deg, #00A0E3, #FFCC00, #F37021, #E6007E, #662483, #1C3578, #4EB748, #C4D82D, #00A0E3)'
    }}>
      <div className="absolute inset-0 m-[12%] bg-black rounded-full flex items-center justify-center">
        <span className="text-white font-black text-lg">W</span>
      </div>
    </div>
    <div className="flex items-center text-black dark:text-white ml-2 font-mono">
      <span className="text-lg font-bold mr-1">®</span>
      <span className="text-[40px] font-black tracking-tighter leading-none">3Z0</span>
    </div>
  </div>
);

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [view, setView] = useState<View>('setup');
  const [selectedType] = useState<TicketType>('1H');
  const [ticketCount, setTicketCount] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [history, setHistory] = useState<HistoryBatch[]>([]);

  // Apply dark mode class permanently
  useEffect(() => {
    document.documentElement.classList.add('dark');
    
    // Splash screen timer
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('mreso_ticket_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('mreso_ticket_history', JSON.stringify(history));
  }, [history]);

  const generateHash = () => {
    const parts = [];
    for (let i = 0; i < 6; i++) {
      parts.push(Math.floor(Math.random() * 90 + 10).toString());
    }
    return parts.join("'");
  };

  const handleGenerate = () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      alert("Veuillez saisir un numéro de téléphone valide.");
      return;
    }

    setView('sending');
    
    const now = new Date();
    const config = TICKET_CONFIG[selectedType];
    const expiry = new Date(now.getTime() + config.duration * 60 * 1000);

    const formatDate = (date: Date) => {
      const d = date.getDate().toString().padStart(2, '0');
      const m = (date.getMonth() + 1).toString().padStart(2, '0');
      const y = date.getFullYear().toString().slice(-2);
      return `${d}.${m}.${y}`;
    };

    const formatTime = (date: Date) => {
      const h = date.getHours().toString().padStart(2, '0');
      const min = date.getMinutes().toString().padStart(2, '0');
      return `${h}:${min}`;
    };

    const newTickets: TicketData[] = [];
    for (let i = 0; i < ticketCount; i++) {
      newTickets.push({
        type: selectedType,
        price: config.price,
        date: formatDate(now),
        startTime: formatTime(now),
        endTime: formatTime(expiry),
        hash: generateHash(),
        receivedTime: formatTime(now),
      });
    }

    setTickets(newTickets);

    // Add to history
    const newBatch: HistoryBatch = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: selectedType,
      count: ticketCount,
      tickets: newTickets,
    };
    setHistory(prev => [newBatch, ...prev]);

    setTimeout(() => {
      setView('ticket');
    }, 1000);
  };

  const getTicketText = (t: TicketData) => {
    const label = '1 heure';
    const terLine = 'y compris dans les trains TER';
    
    return `Réseau M réso
Titre valable ${label}
${terLine}

le ${t.date} de ${t.startTime} à ${t.endTime}

${t.price}

${t.hash}

reso-m.fr/cgv`;
  };

  const openSmsApp = () => {
    const body = tickets.map(t => getTicketText(t)).join('\n\n------------\n\n');
    const smsUrl = `sms:93123?body=${encodeURIComponent(body)}`;
    window.location.href = smsUrl;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#050505] font-mono">
      <div className="phone-frame">
        <AnimatePresence mode="wait">
          {showSplash ? (
            <motion.div
              key="splash"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="absolute inset-0 z-[100] bg-black flex items-center justify-center"
            >
              <img 
                src="https://images.unsplash.com/photo-1561059488-916d69792237?q=80&w=2000&auto=format&fit=crop" 
                alt="Splash"
                className="w-full h-full object-cover opacity-80"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center">
                   <div className="w-40 h-40 border-4 border-white/40 rounded-full flex items-center justify-center relative">
                      <div className="absolute inset-0 border-2 border-white/10 rounded-full animate-ping" />
                      <span className="text-white text-6xl font-black tracking-tighter">X X</span>
                   </div>
                   <div className="mt-8 w-24 h-1 bg-white/20 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ duration: 0.2, ease: "linear" }}
                        className="w-full h-full bg-white"
                      />
                   </div>
                </div>
              </div>
            </motion.div>
          ) : view === 'setup' ? (
            <motion.div 
              key="setup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center p-6 overflow-y-auto no-scrollbar relative"
            >
              {/* Background Decoration */}
              <div className="absolute -top-32 -left-32 w-80 h-80 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                <Logo scale={3} className="grayscale invert" />
              </div>

              {/* Header */}
              <div className="flex flex-col items-center mb-12 mt-8">
                <Logo scale={1.2} />
                <p className="text-gray-500 dark:text-gray-400 text-[11px] font-bold uppercase tracking-[0.2em] mt-6">
                  Tickets Gratuits Toute l'Année !
                </p>
              </div>

              {/* Form */}
              <div className="w-full space-y-10">
                {/* Phone Input */}
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">
                    Votre numéro de mobile
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="tel" 
                      placeholder="06 00 00 00 00"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-white dark:bg-[#1e293b]/40 border border-gray-200 dark:border-[#2d3a4f] rounded-[24px] py-6 pl-16 pr-6 text-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:border-[#FF6600] transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
                    />
                  </div>
                </div>

                {/* Quantity Selector */}
                <div className="bg-white dark:bg-[#1e293b]/40 border border-gray-200 dark:border-[#2d3a4f] rounded-[24px] p-6 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Quantité</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">Nombre de titres</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                      className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#1a2333] flex items-center justify-center text-gray-500 hover:text-[#FF6600] transition-all active:scale-90"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="text-2xl font-black text-gray-900 dark:text-white w-6 text-center">{ticketCount}</span>
                    <button 
                      onClick={() => setTicketCount(Math.min(10, ticketCount + 1))}
                      className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#1a2333] flex items-center justify-center text-gray-500 hover:text-[#FF6600] transition-all active:scale-90"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-4 space-y-4">
                  <button 
                    onClick={handleGenerate}
                    className="w-full bg-[#FF5500] text-white py-6 rounded-[28px] font-bold text-xl shadow-xl shadow-orange-500/20 hover:bg-[#FF4400] transition-all active:scale-[0.98] flex items-center justify-center gap-4"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    Recevoir mon ticket
                  </button>

                  {history.length > 0 && (
                    <button 
                      onClick={() => setView('history')}
                      className="w-full text-[#007AFF] dark:text-blue-400 py-2 font-bold text-sm hover:underline transition-all"
                    >
                      Voir mon historique ({history.length})
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ) : view === 'sending' ? (
            <motion.div 
              key="sending"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden bg-black"
            >
              <MatrixRain />
              <div className="relative z-10 flex flex-col items-center space-y-8">
                <div className="relative">
                  <div className="w-32 h-32 border-4 border-[#00FF41]/20 rounded-full animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                    >
                      <Smartphone className="w-12 h-12 text-[#00FF41]" />
                    </motion.div>
                  </div>
                </div>
                <div className="text-center space-y-5 flex flex-col items-center">
                  <div className="flex items-center gap-2 justify-center text-[#00FF41] font-mono text-sm">
                    <span className="animate-pulse">{'>'}</span>
                    <span>INITIALIZING_SECURE_TRANSFER...</span>
                  </div>
                  <p className="text-[10px] text-[#00FF41]/60 font-mono uppercase tracking-widest">
                    ENCRYPTING_DATA_FOR_{phoneNumber}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : view === 'ticket' ? (
            <motion.div 
              key="ticket"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col h-full bg-[#f2f2f7] dark:bg-[#000000]"
            >
              {/* Modern Messaging Header */}
              <div className="bg-[#f9f9f9]/90 dark:bg-[#121212]/90 backdrop-blur-xl p-4 pt-12 border-b border-gray-200 dark:border-[#222] flex items-center justify-between sticky top-0 z-20">
                <button 
                  onClick={() => setView('setup')}
                  className="flex items-center text-[#007AFF] dark:text-[#0a84ff] transition-opacity active:opacity-50"
                >
                  <ChevronLeft className="w-7 h-7" />
                  <span className="text-lg -ml-1">Retour</span>
                </button>
                
                <div className="flex flex-col items-center absolute left-1/2 -translate-x-1/2">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center mb-1 shadow-inner">
                    <Smartphone className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[11px] font-bold text-gray-900 dark:text-white tracking-tight">93 123</span>
                </div>

                <button className="text-[#007AFF] dark:text-[#0a84ff] p-1">
                  <Info className="w-6 h-6" />
                </button>
              </div>

              {/* SMS Content */}
              <div className="flex-1 overflow-y-auto px-3 py-6 space-y-4 flex flex-col no-scrollbar bg-white dark:bg-black">
                <div className="text-center mb-4">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em]">
                    Aujourd'hui {tickets[0]?.receivedTime}
                  </span>
                </div>

                {/* User Message (Blue Bubble) */}
                <div className="self-end max-w-[75%] relative group">
                  <div className="bg-[#007AFF] dark:bg-[#0a84ff] text-white px-4 py-2.5 rounded-[20px] rounded-tr-[4px] shadow-sm">
                    <p className="text-[15px] font-medium leading-snug">{selectedType}</p>
                  </div>
                  <span className="absolute -bottom-5 right-1 text-[9px] text-gray-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Distribué</span>
                </div>

                {/* System Response (Ticket Bubbles) */}
                {tickets.map((t, idx) => (
                  <div key={idx} className="self-start max-w-[85%] space-y-2 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="relative">
                      <div className="bg-[#e9e9eb] dark:bg-[#262629] text-black dark:text-white p-4 rounded-[20px] rounded-tl-[4px] shadow-sm border border-transparent dark:border-[#333]">
                        <pre className="text-[14px] leading-relaxed font-mono whitespace-pre-wrap break-words">
                          {getTicketText(t)}
                        </pre>
                        
                        {/* New Footer Item */}
                        <div className="mt-5 bg-[#001A2C] rounded-xl p-4 space-y-3 border border-white/5">
                          <p className="text-white text-[15px] font-bold leading-tight">
                            Conditions générales de vente et d'utilisation
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-[#00A0E3] rounded-full flex items-center justify-center overflow-hidden">
                              <svg viewBox="0 0 100 100" className="w-full h-full p-1">
                                <path d="M20,80 L50,20 L80,80 Z" fill="white" />
                                <path d="M40,80 L50,60 L60,80 Z" fill="#00A0E3" />
                              </svg>
                            </div>
                            <span className="text-white text-[12px] font-medium opacity-80">www.reso-m.fr</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-[9px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">{t.receivedTime}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modern Message Input Bar */}
              <div className="p-3 pb-8 bg-[#f9f9f9]/90 dark:bg-[#121212]/90 backdrop-blur-xl border-t border-gray-200 dark:border-[#222] flex items-center gap-2">
                <button className="w-9 h-9 flex-shrink-0 flex items-center justify-center text-[#007AFF] dark:text-[#0a84ff] active:opacity-50">
                  <Plus className="w-6 h-6" />
                </button>
                <div className="flex-1 bg-white dark:bg-[#262629] rounded-full px-4 py-2 flex items-center justify-between border border-gray-200 dark:border-[#333] shadow-inner">
                  <span className="text-gray-400 dark:text-gray-500 text-[15px]">iMessage</span>
                  <Smile className="w-6 h-6 text-gray-400" />
                </div>
                <button className="w-8 h-8 bg-[#007AFF] dark:bg-[#0a84ff] rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col h-full bg-white dark:bg-[#1E293B]"
            >
              <div className="bg-white dark:bg-[#1E293B] p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => setView('setup')} className="text-gray-400 hover:text-[#FF6600] transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <Logo scale={0.6} className="origin-left" />
                </div>
                <button 
                  onClick={() => {
                    setHistory([]);
                    setView('setup');
                  }}
                  className="text-[10px] font-bold uppercase tracking-widest bg-red-50 dark:bg-red-900/20 text-red-500 px-3 py-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                  Effacer
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-[#0F172A] no-scrollbar">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600 space-y-2">
                    <Ticket className="w-12 h-12 opacity-20" />
                    <p className="font-bold uppercase text-xs tracking-widest">Aucun ticket généré</p>
                  </div>
                ) : (
                  history.map((batch) => (
                    <button
                      key={batch.id}
                      onClick={() => {
                        setTickets(batch.tickets);
                        setView('ticket');
                      }}
                      className="w-full bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:border-[#FF6600] transition-all text-left group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                          {new Date(batch.timestamp).toLocaleDateString('fr-FR', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <div className="bg-orange-100 dark:bg-orange-900/30 text-[#FF6600] text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                          {batch.type}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {batch.count} ticket{batch.count > 1 ? 's' : ''} {TICKET_CONFIG[batch.type].label}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            {batch.tickets[0].hash.slice(0, 8)}...
                          </span>
                        </div>
                        <ChevronLeft className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-[#FF6600] rotate-180 transition-colors" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
