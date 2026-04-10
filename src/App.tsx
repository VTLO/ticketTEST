/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  Phone, 
  Paperclip, 
  Smile, 
  Send, 
  Plus, 
  Minus, 
  Ticket, 
  Smartphone, 
  Info,
  ArrowLeft,
  MoreVertical,
  Image as ImageIcon,
  Square,
  Circle,
  Triangle,
  AudioLines,
  CheckCheck,
  CornerUpRight
} from 'lucide-react';
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

const MatrixRain = () => null;

const Logo = ({ className = "", scale = 1 }: { className?: string, scale?: number }) => (
  <div className={`flex items-center justify-center ${className}`} style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
    <div className="relative flex items-center justify-center w-11 h-11 rounded-full flex-shrink-0" style={{
      background: 'conic-gradient(from 0deg, #00A0E3, #FFCC00, #F37021, #E6007E, #662483, #1C3578, #4EB748, #C4D82D, #00A0E3)'
    }}>
      <div className="absolute inset-0 m-[12%] bg-black rounded-full flex items-center justify-center">
        <span className="text-white font-black text-lg">W</span>
      </div>
    </div>
    <div className="flex items-center text-black dark:text-white ml-2 font-sans">
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
  const [selectedBatchTimestamp, setSelectedBatchTimestamp] = useState<number | null>(null);
  const [longPressedIndex, setLongPressedIndex] = useState<number | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (view === 'ticket' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [view, history]);

  const handlePressStart = (idx: number) => {
    const timer = setTimeout(() => {
      setLongPressedIndex(idx);
    }, 600);
    setLongPressTimer(timer);
  };

  const handlePressEnd = () => {
    if (longPressTimer) clearTimeout(longPressTimer);
    setLongPressedIndex(null);
  };

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
    const timestamp = now.getTime();
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
    setSelectedBatchTimestamp(timestamp);

    // Add to history
    const newBatch: HistoryBatch = {
      id: crypto.randomUUID(),
      timestamp: timestamp,
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
    <div className="flex items-center justify-center min-h-screen bg-[#050505] font-sans">
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
                      <span className="text-white text-6xl font-black tracking-tighter font-sans">X X</span>
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
              className="flex-1 flex flex-col items-center p-6 overflow-y-auto no-scrollbar relative bg-[#f8f9fa] dark:bg-[#1a1c1e]"
            >
              {/* Header */}
              <div className="flex flex-col items-center mb-12 mt-12">
                <div className="w-20 h-20 bg-[#d3e4ff] dark:bg-[#004a77] rounded-[28px] flex items-center justify-center mb-6 shadow-sm">
                  <Logo scale={0.8} />
                </div>
                <h1 className="text-2xl font-medium text-gray-900 dark:text-white">M-Réso Ticket</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                  Tickets Gratuits Toute l'Année !
                </p>
              </div>

              {/* Form */}
              <div className="w-full space-y-6">
                {/* Phone Input Card */}
                <div className="bg-white dark:bg-[#2d2f31] rounded-[28px] p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 block">
                    Votre numéro de mobile
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="tel" 
                      placeholder="06 00 00 00 00"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-[#f0f4f9] dark:bg-[#1a1c1e] border-none rounded-2xl py-4 pl-12 pr-4 text-lg font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-[#004a77] transition-all"
                    />
                  </div>
                </div>

                {/* Quantity Selector Card */}
                <div className="bg-white dark:bg-[#2d2f31] rounded-[28px] p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantité</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Nombre de titres</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                      className="w-10 h-10 rounded-full bg-[#f0f4f9] dark:bg-[#1a1c1e] flex items-center justify-center text-gray-600 dark:text-gray-300 active:scale-90 transition-transform"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="text-xl font-bold text-gray-900 dark:text-white w-6 text-center">{ticketCount}</span>
                    <button 
                      onClick={() => setTicketCount(Math.min(10, ticketCount + 1))}
                      className="w-10 h-10 rounded-full bg-[#f0f4f9] dark:bg-[#1a1c1e] flex items-center justify-center text-gray-600 dark:text-gray-300 active:scale-90 transition-transform"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-4 space-y-4">
                  <button 
                    onClick={handleGenerate}
                    className="w-full bg-[#004a77] dark:bg-[#d3e4ff] text-white dark:text-[#003350] py-5 rounded-[28px] font-medium text-lg shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                  >
                    <Smartphone className="w-5 h-5" />
                    Recevoir mon ticket
                  </button>

                  {history.length > 0 && (
                    <button 
                      onClick={() => setView('history')}
                      className="w-full text-[#004a77] dark:text-[#d3e4ff] py-3 font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all"
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
              className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden bg-[#f8f9fa] dark:bg-[#1a1c1e]"
            >
              <div className="relative z-10 flex flex-col items-center space-y-12">
                <div className="relative">
                  <div className="w-40 h-40 bg-[#d3e4ff] dark:bg-[#004a77] rounded-full flex items-center justify-center relative">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute inset-0 bg-[#d3e4ff] dark:bg-[#004a77] rounded-full"
                    />
                    <Smartphone className="w-16 h-16 text-[#003350] dark:text-[#d3e4ff] relative z-10" />
                  </div>
                </div>
                <div className="text-center space-y-4">
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white">Envoi en cours...</h3>
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-2 h-2 bg-[#004a77] dark:bg-[#d3e4ff] rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-[#004a77] dark:bg-[#d3e4ff] rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-[#004a77] dark:bg-[#d3e4ff] rounded-full animate-bounce" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide mt-4">
                    Sécurisation du transfert pour {phoneNumber}
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
              {/* Google Messages Header */}
              <div className="bg-[#ffffff] dark:bg-[#1a1c1e] p-4 pt-10 flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setView('setup')}
                    className="p-1 text-gray-700 dark:text-gray-200 active:bg-gray-100 dark:active:bg-gray-800 rounded-full transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#004a77] rounded-full flex items-center justify-center text-white font-bold text-xs">
                      TAG
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[18px] font-medium text-gray-900 dark:text-white leading-tight">TAG</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-gray-700 dark:text-gray-200">
                  <button className="p-2 active:bg-gray-100 dark:active:bg-gray-800 rounded-full transition-colors">
                    <Phone className="w-6 h-6" />
                  </button>
                  <button className="p-2 active:bg-gray-100 dark:active:bg-gray-800 rounded-full transition-colors">
                    <MoreVertical className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* SMS Content */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 py-2 space-y-4 flex flex-col no-scrollbar bg-[#ffffff] dark:bg-[#1a1c1e] scroll-smooth"
              >
                {/* Render all history batches as a continuous flow if in ticket view */}
                {history.slice().reverse().map((batch, bIdx) => (
                  <React.Fragment key={batch.id}>
                    <div className="text-center my-6">
                      <span className="text-[12px] font-medium text-gray-500 dark:text-gray-400">
                        {new Date(batch.timestamp).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} • {batch.tickets[0]?.receivedTime}
                      </span>
                    </div>

                    {/* Sent Message */}
                    <motion.div 
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: bIdx * 0.1 }}
                      className="self-end max-w-[75%] mb-2"
                    >
                      <div className="bg-[#d3e4ff] dark:bg-[#004a77] text-[#041e2b] dark:text-[#d3e4ff] px-4 py-3 rounded-[24px] rounded-tr-[4px] shadow-sm">
                        <p className="text-[16px] font-medium leading-snug">{batch.type}</p>
                      </div>
                      <div className="flex justify-end items-center gap-1 mt-1 px-2">
                        <span className="text-[10px] text-gray-400">{batch.tickets[0]?.receivedTime}</span>
                        <CheckCheck className="w-3 h-3 text-blue-500" />
                      </div>
                    </motion.div>

                    {/* Received Messages */}
                    {batch.tickets.map((t, idx) => {
                      const globalIdx = bIdx * 100 + idx;
                      const ticketText = getTicketText(t);
                      // Extract the date/time line to underline it
                      const lines = ticketText.split('\n');
                      const dateTimeLineIndex = lines.findIndex(l => l.startsWith('le '));
                      
                      return (
                        <motion.div 
                          key={`${batch.id}-${idx}`}
                          initial={{ opacity: 0, x: -50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: bIdx * 0.1 + (idx + 1) * 0.1 }}
                          className="self-start max-w-[90%] space-y-1 relative mb-4"
                          onMouseDown={() => handlePressStart(globalIdx)}
                          onMouseUp={handlePressEnd}
                          onMouseLeave={handlePressEnd}
                          onTouchStart={() => handlePressStart(globalIdx)}
                          onTouchEnd={handlePressEnd}
                        >
                          <AnimatePresence>
                            {longPressedIndex === globalIdx && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: -40 }}
                                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                                className="absolute left-0 z-50 bg-gray-800 text-white text-[10px] px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap pointer-events-none"
                              >
                                Accusé de réception : Reçu à {t.receivedTime}
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="flex items-center gap-2">
                            <button className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-500 shrink-0 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                              <CornerUpRight className="w-4 h-4" />
                            </button>
                            
                            <div className={`overflow-hidden rounded-[24px] rounded-tl-[4px] shadow-sm transition-transform ${longPressedIndex === globalIdx ? 'scale-[0.98]' : ''}`}>
                              {/* Dark Header Part */}
                              <div className="bg-[#455a64] dark:bg-[#263238] text-white p-4">
                                <pre className="text-[15px] leading-relaxed font-sans whitespace-pre-wrap break-words">
                                  {lines.map((line, lIdx) => (
                                    <span key={lIdx}>
                                      {lIdx === dateTimeLineIndex ? (
                                        <span className="underline decoration-1 underline-offset-2">{line}</span>
                                      ) : line}
                                      {lIdx < lines.length - 1 && '\n'}
                                    </span>
                                  ))}
                                </pre>
                              </div>
                              
                              {/* Light Blue Footer Part */}
                              <div className="bg-[#e1f5fe] dark:bg-[#003350] p-4 space-y-3 border-t border-white/10">
                                <p className="text-[#01579b] dark:text-[#b3e5fc] text-[15px] font-bold leading-tight">
                                  Conditions générales de vente et d'utilisation
                                </p>
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-[#00A0E3] rounded-full flex items-center justify-center overflow-hidden">
                                    <svg viewBox="0 0 100 100" className="w-full h-full p-1">
                                      <path d="M20,80 L50,20 L80,80 Z" fill="white" />
                                      <path d="M40,80 L50,60 L60,80 Z" fill="#00A0E3" />
                                    </svg>
                                  </div>
                                  <span className="text-[#01579b] dark:text-[#b3e5fc] text-[12px] font-medium">www.reso-m.fr</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end items-center gap-1 mt-1 px-2">
                            <span className="text-[10px] text-gray-400">{t.receivedTime}</span>
                            <CheckCheck className="w-3 h-3 text-blue-500" />
                          </div>
                        </motion.div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>

              {/* Google Messages Input Bar */}
              <div className="p-4 bg-[#ffffff] dark:bg-[#1a1c1e] flex items-center gap-3">
                <div className="flex-1 bg-[#f0f4f9] dark:bg-[#2d2f31] rounded-[28px] px-4 py-3 flex items-center gap-3">
                  <button className="text-gray-600 dark:text-gray-400">
                    <Plus className="w-6 h-6" />
                  </button>
                  <span className="flex-1 text-gray-500 dark:text-gray-400 text-[16px]">Message</span>
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <Smile className="w-6 h-6" />
                    <ImageIcon className="w-6 h-6" />
                  </div>
                </div>
                <button className="w-12 h-12 bg-[#f0f4f9] dark:bg-[#2d2f31] rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 shadow-sm active:scale-95 transition-transform">
                  <AudioLines className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col h-full bg-[#f8f9fa] dark:bg-[#1a1c1e]"
            >
              <div className="bg-white dark:bg-[#2d2f31] p-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                  <button onClick={() => setView('setup')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                  </button>
                  <h2 className="text-xl font-medium text-gray-900 dark:text-white">Historique</h2>
                </div>
                <button 
                  onClick={() => {
                    setHistory([]);
                    setView('setup');
                  }}
                  className="text-sm font-medium text-red-600 dark:text-red-400 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                >
                  Effacer
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600 space-y-4">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-[#2d2f31] rounded-full flex items-center justify-center">
                      <Ticket className="w-10 h-10 opacity-40" />
                    </div>
                    <p className="font-medium text-sm">Aucun ticket généré</p>
                  </div>
                ) : (
                  history.map((batch) => (
                    <button
                      key={batch.id}
                      onClick={() => {
                        setTickets(batch.tickets);
                        setSelectedBatchTimestamp(batch.timestamp);
                        setView('ticket');
                      }}
                      className="w-full bg-white dark:bg-[#2d2f31] p-5 rounded-[28px] shadow-sm hover:shadow-md transition-all text-left group border border-gray-100 dark:border-gray-800"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {new Date(batch.timestamp).toLocaleDateString('fr-FR', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <div className="bg-[#d3e4ff] dark:bg-[#004a77] text-[#003350] dark:text-[#d3e4ff] text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                          {batch.type}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-base font-medium text-gray-900 dark:text-white">
                            {batch.count} ticket{batch.count > 1 ? 's' : ''} {TICKET_CONFIG[batch.type].label}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            ID: {batch.tickets[0].hash.slice(0, 12)}...
                          </span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-[#1a1c1e] flex items-center justify-center group-hover:bg-[#d3e4ff] dark:group-hover:bg-[#004a77] transition-colors">
                          <ArrowLeft className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-[#003350] dark:group-hover:text-[#d3e4ff] rotate-180" />
                        </div>
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
