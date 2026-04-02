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
  const [view, setView] = useState<View>('setup');
  const [selectedType] = useState<TicketType>('1H');
  const [ticketCount, setTicketCount] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [history, setHistory] = useState<HistoryBatch[]>([]);

  // Apply dark mode class permanently
  useEffect(() => {
    document.documentElement.classList.add('dark');
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
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
      <div className="phone-frame shadow-[0_0_100px_rgba(0,0,0,0.5)]">
        <AnimatePresence mode="wait">
          {view === 'setup' && (
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
          )}

          {view === 'sending' && (
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
          )}

          {view === 'ticket' && (
            <motion.div 
              key="ticket"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col h-full bg-[#F2F2F7] dark:bg-[#0F172A]"
            >
              {/* iOS Style Header */}
              <div className="bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-md p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between sticky top-0 z-10">
                <button 
                  onClick={() => setView('setup')}
                  className="flex items-center text-[#007AFF] dark:text-blue-400 font-medium"
                >
                  <ChevronLeft className="w-6 h-6" />
                  <span className="text-lg -ml-1">Retour</span>
                </button>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-0.5">
                    <Smartphone className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-900 dark:text-white">93 123</span>
                </div>
                <button className="text-[#007AFF] dark:text-blue-400">
                  <Info className="w-6 h-6" />
                </button>
              </div>

              {/* SMS Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6 flex flex-col no-scrollbar">
                <div className="text-center">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Aujourd'hui {tickets[0]?.receivedTime}</span>
                </div>

                {/* User Message */}
                <div className="self-end max-w-[80%] bg-[#007AFF] text-white p-3 rounded-2xl rounded-tr-sm shadow-sm">
                  <p className="text-sm font-medium">{selectedType}</p>
                </div>

                {/* System Response (Ticket) */}
                {tickets.map((t, idx) => (
                  <div key={idx} className="self-start max-w-[85%] space-y-1">
                    <div className="bg-white dark:bg-[#262629] text-gray-900 dark:text-gray-100 p-4 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 dark:border-gray-800">
                      <pre className="text-[13px] leading-relaxed font-mono whitespace-pre-wrap break-words">
                        {getTicketText(t)}
                      </pre>
                      
                      {/* New Footer Item */}
                      <div className="mt-6 bg-[#001A2C] rounded-2xl p-4 space-y-3">
                        <p className="text-white text-[17px] font-bold leading-tight">
                          Conditions générales de vente et d'utilisation
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-[#00A0E3] rounded-full flex items-center justify-center overflow-hidden">
                            <svg viewBox="0 0 100 100" className="w-full h-full p-1">
                              <path d="M20,80 L50,20 L80,80 Z" fill="white" />
                              <path d="M40,80 L50,60 L60,80 Z" fill="#00A0E3" />
                            </svg>
                          </div>
                          <span className="text-white text-[13px] font-medium">www.reso-m.fr</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-1">
                      <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase">{t.receivedTime}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Fake SMS Input */}
              <div className="p-4 bg-white dark:bg-[#1E293B] border-t border-gray-200 dark:border-gray-800 flex items-center gap-3">
                <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-gray-400">
                  <Paperclip className="w-5 h-5" />
                </div>
                <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 flex items-center justify-between border border-gray-200 dark:border-gray-700">
                  <span className="text-gray-400 dark:text-gray-500 text-sm">iMessage</span>
                  <Smile className="w-5 h-5 text-gray-400" />
                </div>
                <div className="w-8 h-8 bg-[#007AFF] rounded-full flex items-center justify-center text-white">
                  <Send className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          )}

          {view === 'history' && (
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
