
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- CONFIGURAÇÕES E TIPOS ---
const DB_NAME = 'SalesMasterDB_vFinal';
const DB_VERSION = 1;
const DAYS_OF_WEEK = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

// --- BANCO DE DADOS LOCAL (IndexedDB) ---
class LocalDatabase {
  db = null;
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        ['clients', 'appointments', 'sales', 'routes', 'users'].forEach(s => {
          if (!db.objectStoreNames.contains(s)) {
            const os = db.createObjectStore(s, { keyPath: 'id' });
            if (s !== 'users') os.createIndex('userId', 'userId', { unique: false });
          }
        });
      };
      request.onsuccess = (e) => { this.db = e.target.result; resolve(); };
      request.onerror = () => reject('Erro DB');
    });
  }
  async getAllForUser(store, userId) {
    if (!this.db) return [];
    return new Promise((resolve) => {
      const tx = this.db.transaction(store, 'readonly');
      const os = tx.objectStore(store);
      const req = os.index('userId').getAll(userId);
      req.onsuccess = () => resolve(req.result);
    });
  }
  async put(store, item) {
    const tx = this.db.transaction(store, 'readwrite');
    tx.objectStore(store).put(item);
    return new Promise((res) => tx.oncomplete = res);
  }
  async delete(store, id) {
    const tx = this.db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(id);
    return new Promise((res) => tx.oncomplete = res);
  }
}
const dbService = new LocalDatabase();

// --- SERVIÇO DE IA ---
const aiAssistant = {
  async chat(msg, ctx) {
    const apiKey = window.process?.env?.API_KEY;
    if (!apiKey) return "IA desativada (falta API Key).";
    try {
      const genAI = new GoogleGenAI({ apiKey });
      const model = genAI.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Contexto: ${ctx.clients.length} clientes. Pergunta: ${msg}`,
      });
      const res = await model;
      return res.text || "Sem resposta.";
    } catch (e) { return "Erro na IA."; }
  }
};

// --- COMPONENTES ---

const Login = ({ onLogin }) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const AUTHORIZED = [
    { id: '1', username: 'admin', name: 'Administrador', password: '123' },
    { id: '4', username: 'Thiago', name: 'Thiago', password: 'Dudinh@2015' }
  ];
  const handle = (e) => {
    e.preventDefault();
    const found = AUTHORIZED.find(u => u.username === user && u.password === pass);
    if (found) onLogin(found); else alert('Erro!');
  };
  return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center p-4">
      <form onSubmit={handle} className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md space-y-6">
        <h1 className="text-3xl font-black text-blue-600 text-center">SalesMaster</h1>
        <input type="text" placeholder="Usuário" className="w-full p-4 bg-gray-50 rounded-2xl border" onChange={e=>setUser(e.target.value)} />
        <input type="password" placeholder="Senha" className="w-full p-4 bg-gray-50 rounded-2xl border" onChange={e=>setPass(e.target.value)} />
        <button className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl">Acessar</button>
      </form>
    </div>
  );
};

const Sidebar = ({ user, active, setTab, onLogout }) => (
  <nav className="bg-blue-800 text-white w-64 p-6 hidden md:flex flex-col gap-8">
    <h1 className="text-2xl font-black">SalesMaster</h1>
    <div className="flex flex-col gap-2">
      {['dashboard', 'clients', 'agenda', 'ai'].map(t => (
        <button key={t} onClick={()=>setTab(t)} className={`p-4 rounded-xl text-left capitalize ${active === t ? 'bg-blue-600 shadow-lg' : 'hover:bg-blue-700'}`}>
          {t}
        </button>
      ))}
    </div>
    <button onClick={onLogout} className="mt-auto p-4 text-blue-300 hover:text-white text-left">Sair</button>
  </nav>
);

const Dashboard = ({ user, clients, sales, onUpdate }) => {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const today = new Date().toISOString().split('T')[0];
  const weeklyTotal = sales.reduce((acc, s) => acc + s.amount, 0);

  const saveSale = async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const sale = {
      id: editing?.id || crypto.randomUUID(),
      userId: user.id,
      clientId: data.get('clientId'),
      clientName: clients.find(c => c.id === data.get('clientId'))?.name || 'Cliente',
      amount: parseFloat(data.get('amount')),
      date: today
    };
    await dbService.put('sales', sale);
    setModal(false); setEditing(null); onUpdate();
  };

  const deleteSale = async (id) => {
    if (confirm('Excluir venda?')) {
      await dbService.delete('sales', id);
      onUpdate();
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Olá, {user.name}!</h2>
        <button onClick={()=>setModal(true)} className="bg-purple-600 text-white px-6 py-3 rounded-2xl font-bold">Nova Venda</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border">
          <p className="text-xs text-gray-400 font-bold uppercase">Clientes</p>
          <p className="text-2xl font-black">{clients.length}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border">
          <p className="text-xs text-gray-400 font-bold uppercase">Vendas Semana</p>
          <p className="text-2xl font-black text-purple-600">R$ {weeklyTotal.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b font-bold">Últimas Vendas</div>
        <table className="w-full text-left">
          <tbody className="divide-y">
            {sales.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="p-6 text-sm">{s.clientName}</td>
                <td className="p-6 font-bold text-purple-600">R$ {s.amount.toFixed(2)}</td>
                <td className="p-6 text-right">
                  <button onClick={()=>deleteSale(s.id)} className="text-red-400 p-2"><i className="fas fa-trash"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={saveSale} className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md space-y-4">
            <h3 className="text-xl font-bold">Registrar Venda</h3>
            <select name="clientId" required className="w-full p-4 bg-gray-50 border rounded-2xl">
              <option value="">Selecione o Cliente</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input name="amount" type="number" step="0.01" placeholder="Valor R$" required className="w-full p-4 bg-gray-50 border rounded-2xl" />
            <div className="flex gap-2 pt-4">
              <button type="submit" className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-bold">Salvar</button>
              <button type="button" onClick={()=>setModal(false)} className="flex-1 bg-gray-100 py-3 rounded-xl">Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// --- APP PRINCIPAL ---
const App = () => {
  const [user, setUser] = useState(() => JSON.parse(sessionStorage.getItem('sm_user')));
  const [tab, setTab] = useState('dashboard');
  const [data, setData] = useState({ clients: [], sales: [] });

  const refresh = useCallback(async () => {
    if (!user) return;
    const c = await dbService.getAllForUser('clients', user.id);
    const s = await dbService.getAllForUser('sales', user.id);
    setData({ clients: c, sales: s });
  }, [user]);

  useEffect(() => {
    dbService.init().then(refresh);
  }, [refresh]);

  if (!user) return <Login onLogin={u => { sessionStorage.setItem('sm_user', JSON.stringify(u)); setUser(u); }} />;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} active={tab} setTab={setTab} onLogout={() => { sessionStorage.removeItem('sm_user'); setUser(null); }} />
      <main className="flex-1 p-8 overflow-y-auto">
        {tab === 'dashboard' && <Dashboard user={user} clients={data.clients} sales={data.sales} onUpdate={refresh} />}
        {tab === 'clients' && <div className="p-10 text-center">Gestão de Clientes - Em breve</div>}
        {tab === 'agenda' && <div className="p-10 text-center">Agenda - Em breve</div>}
        {tab === 'ai' && <div className="p-10 text-center">Assistente IA - Configure sua API Key no index.html</div>}
      </main>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
