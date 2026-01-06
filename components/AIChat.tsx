
import React, { useState, useRef, useEffect } from 'react';
import { Client, Appointment } from '../types';
import { aiAssistant } from '../geminiService';

interface AIChatProps {
  clients: Client[];
  appointments: Appointment[];
}

const AIChat: React.FC<AIChatProps> = ({ clients, appointments }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', text: string}[]>([
    { role: 'assistant', text: 'Olá! Sou seu Sales Copilot. Posso analisar seus clientes, ajudar na agenda ou dar dicas para suas próximas visitas. Como posso ajudar hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response = await aiAssistant.chat(userMsg, { clients, appointments });
      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Desculpe, tive um problema ao processar isso. Verifique sua conexão.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-fadeIn">
      <header className="bg-blue-600 p-4 text-white flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
          <i className="fas fa-robot"></i>
        </div>
        <div>
          <h2 className="font-bold">Sales Copilot</h2>
          <p className="text-xs text-blue-100">Inteligência Artificial Integrada</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-gray-100 text-gray-800 rounded-tl-none'
            }`}>
              <p className="text-sm md:text-base whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50">
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Pergunte sobre seus clientes ou agenda..." 
            className="flex-1 p-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="bg-blue-600 text-white w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-blue-700 transition-colors disabled:bg-gray-300 shadow-lg shadow-blue-100"
          >
            <i className="fas fa-paper-plane text-xl"></i>
          </button>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-3 uppercase tracking-widest font-bold">
          Dica: Pergunte "Quais clientes da categoria A não visito há tempos?"
        </p>
      </div>
    </div>
  );
};

export default AIChat;
