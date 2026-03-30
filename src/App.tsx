/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, Phone, MoreVertical, Paperclip, Smile, Send, Plus, Minus, Ticket, Smartphone, Info, CheckCircle2, ShieldCheck, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

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

const Logo = ({ className = "", scale = 1 }: { className?: string, scale?: number }) => (
  <div className={`flex items-center justify-center ${className}`} style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
    <div className="relative flex items-center justify-center w-11 h-11 rounded-full flex-shrink-0" style={{
      background: 'conic-gradient(from 0deg, #00A0E3, #FFCC00, #F37021, #E6007E, #662483, #1C3578, #4EB748, #C4D82D, #00A0E3)'
    }}>
      <div className="absolute inset-0 m-[12%] bg-black rounded-full flex items-center justify-center">
        <span className="text-white font-black text-lg" style={{ fontFamily: 'Arial, sans-serif' }}>W</span>
      </div>
    </div>
    <div className="flex items-center text-black dark:text-white ml-2 font-sans">
      <span className="text-lg font-bold mr-1">®</span>
      <span className="text-[40px] font-black tracking-tighter leading-none">3Z0</span>
    </div>
  </div>
);

const RobotLogo = ({ className = "" }: { className?: string }) => (
  <div className={`relative w-full h-full bg-black flex items-center justify-center ${className}`}>
    <svg viewBox="0 0 100 100" className="w-[85%] h-[85%]">
      {/* Head Outline */}
      <path d="M25,20 L75,20 L82,65 L18,65 Z" fill="none" stroke="white" strokeWidth="2.5" />
      
      {/* Eyes Area */}
      {/* Left Eye - Triangle */}
      <path d="M30,35 L45,42 L30,50 Z" fill="white" />
      
      {/* Right Eye - Circle with C */}
      <circle cx="65" cy="42" r="10" fill="none" stroke="white" strokeWidth="2.5" />
      <text x="65" y="45" fontSize="10" textAnchor="middle" fill="white" fontWeight="900" style={{ fontFamily: 'Arial, sans-serif' }}>C</text>
      
      {/* Mouth / Grill */}
      <path d="M32,55 L68,55 L72,72 L28,72 Z" fill="none" stroke="white" strokeWidth="2.5" />
      <path d="M32,55 L68,55 L72,72 L28,72 Z" fill="none" stroke="white" strokeWidth="2.5" />
      <line x1="37" y1="55" x2="37" y2="72" stroke="white" strokeWidth="1.5" />
      <line x1="42" y1="55" x2="42" y2="72" stroke="white" strokeWidth="1.5" />
      <line x1="47" y1="55" x2="47" y2="72" stroke="white" strokeWidth="1.5" />
      <line x1="53" y1="55" x2="53" y2="72" stroke="white" strokeWidth="1.5" />
      <line x1="58" y1="55" x2="58" y2="72" stroke="white" strokeWidth="1.5" />
      <line x1="63" y1="55" x2="63" y2="72" stroke="white" strokeWidth="1.5" />
      
      {/* Neck / Bottom Detail */}
      <path d="M42,72 L58,72 L60,95 L40,95 Z" fill="none" stroke="white" strokeWidth="2" />
      <line x1="42" y1="78" x2="58" y2="78" stroke="white" strokeWidth="1.5" />
      <line x1="42" y1="84" x2="58" y2="84" stroke="white" strokeWidth="1.5" />
      <line x1="42" y1="90" x2="58" y2="90" stroke="white" strokeWidth="1.5" />
      
      {/* Top Detail */}
      <circle cx="50" cy="15" r="5" fill="none" stroke="white" strokeWidth="2" />
      <circle cx="50" cy="15" r="2" fill="white" />
    </svg>
  </div>
);

export default function App() {
  const [view, setView] = useState<View>('setup');
  const [selectedType] = useState<TicketType>('1H');
  const [ticketCount, setTicketCount] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [history, setHistory] = useState<HistoryBatch[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<string | null>(null);

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
    }, 2000);
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

  const verifyWithAI = async (ticket: TicketData) => {
    setIsVerifying(true);
    setVerificationResult(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Analyze this transit ticket for Réseau M réso and confirm its validity. 
        Ticket Data: ${getTicketText(ticket)}
        Current Time: ${new Date().toISOString()}
        Provide a brief, professional security assessment.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
        }
      });
      setVerificationResult(response.text || "Verification complete.");
    } catch (error) {
      console.error("AI Verification failed:", error);
      setVerificationResult("Erreur lors de la vérification IA.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#111827] flex items-center justify-center font-sans antialiased p-4 transition-colors duration-300 relative overflow-hidden">
      {/* Floating Robot Logo */}
      <div className="fixed bottom-8 right-8 w-20 h-20 rounded-full border-[6px] border-[#C05621] overflow-hidden bg-black shadow-2xl z-50 pointer-events-none flex items-center justify-center">
        <RobotLogo />
      </div>

      <AnimatePresence mode="wait">
        {view === 'setup' && (
          <motion.div 
            key="setup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md flex flex-col items-center relative"
          >
            {/* Background Decoration */}
            <div className="absolute -top-32 -left-32 w-80 h-80 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
              <Logo scale={3} className="grayscale invert" />
            </div>

            {/* Header */}
            <div className="flex flex-col items-center mb-12">
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
            className="flex flex-col items-center space-y-8"
          >
            <div className="relative">
              <div className="w-32 h-32 border-4 border-blue-100 dark:border-blue-900/30 rounded-full animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <Smartphone className="w-12 h-12 text-[#004A99] dark:text-blue-400" />
                </motion.div>
              </div>
            </div>
            <div className="text-center space-y-5 flex flex-col items-center">
              <Logo scale={0.9} />
              <div className="flex items-center gap-2 justify-center text-gray-500 dark:text-gray-400 font-medium">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" />
                <span>Traitement de votre demande...</span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">Envoi vers {phoneNumber}</p>
            </div>
          </motion.div>
        )}

        {view === 'ticket' && (
          <motion.div 
            key="ticket"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-[#F2F2F7] dark:bg-[#0F172A] rounded-[40px] shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col h-[700px]"
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
            <div className="flex-1 overflow-y-auto p-4 space-y-6 flex flex-col">
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
                    <pre className="text-[13px] leading-relaxed font-sans whitespace-pre-wrap break-words">
                      {getTicketText(t)}
                    </pre>
                  </div>
                  <div className="flex items-center gap-2 ml-1">
                    <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase">{t.receivedTime}</span>
                    <button 
                      onClick={() => verifyWithAI(t)}
                      className="text-[9px] font-bold text-[#007AFF] dark:text-blue-400 uppercase hover:underline"
                    >
                      Vérifier avec IA
                    </button>
                  </div>
                </div>
              ))}

              {/* AI Verification Result */}
              {isVerifying && (
                <div className="self-start bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-center gap-3 animate-pulse">
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Analyse sécurisée en cours...</span>
                </div>
              )}

              {verificationResult && (
                <div className="self-start bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-900/30 space-y-2 max-w-[90%]">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Rapport de sécurité IA</span>
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-300 leading-relaxed italic">
                    "{verificationResult}"
                  </p>
                </div>
              )}
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
            className="w-full max-w-md bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col h-[600px]"
          >
            <div className="bg-white dark:bg-[#1E293B] p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between rounded-t-3xl">
              <div className="flex items-center gap-3">
                <button onClick={() => setView('setup')} className="text-gray-400 hover:text-[#FF6600] transition-colors">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <Logo scale={0.6} className="origin-left" />
              </div>
              <button 
                onClick={() => {
                  if (confirm("Effacer tout l'historique ?")) {
                    setHistory([]);
                    setView('setup');
                  }
                }}
                className="text-[10px] font-bold uppercase tracking-widest bg-red-50 dark:bg-red-900/20 text-red-500 px-3 py-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              >
                Effacer
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-[#0F172A]">
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
  );
}
