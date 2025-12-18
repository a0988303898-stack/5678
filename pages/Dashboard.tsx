
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';
import { BankAccount, Transaction } from '../types';
import { getDailyFortune } from '../geminiService';
import { Wallet, ArrowUpCircle, ArrowDownCircle, History, Sparkles, Zap, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Fortune {
  score: number;
  fortune: string;
  luckyColor: string;
  tip: string;
}

const Dashboard: React.FC = () => {
  const { user, isTestMode } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fortune, setFortune] = useState<Fortune | null>(null);
  const [loadingFortune, setLoadingFortune] = useState(false);

  useEffect(() => {
    if (!user) return;

    if (isTestMode) {
      const savedAccs = localStorage.getItem('smartfinance_accounts');
      const savedTrans = localStorage.getItem('smartfinance_transactions');
      setAccounts(savedAccs ? JSON.parse(savedAccs) : []);
      setTransactions(savedTrans ? JSON.parse(savedTrans) : []);
      return;
    }

    if (!db) return;
    const unsubAccounts = onSnapshot(query(collection(db, 'accounts'), where('userId', '==', user.uid)), (snap) => {
      setAccounts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankAccount)));
    });
    const unsubTrans = onSnapshot(query(collection(db, 'transactions'), where('userId', '==', user.uid), orderBy('date', 'desc'), limit(5)), (snap) => {
      setTransactions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    });
    return () => { unsubAccounts(); unsubTrans(); };
  }, [user, isTestMode]);

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);

  const fetchFortune = async () => {
    setLoadingFortune(true);
    const result = await getDailyFortune(totalBalance);
    if (result) setFortune(result);
    setLoadingFortune(false);
  };

  const monthlyIncome = transactions
    .filter(t => t.type === 'income' && t.date.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((acc, curr) => acc + curr.amount, 0);
  const monthlyExpense = transactions
    .filter(t => t.type === 'expense' && t.date.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header & Fortune Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col justify-center">
          <h2 className="text-4xl font-black text-slate-800 tracking-tight mb-2">
            Hey, {user?.email?.split('@')[0] || '朋友'}
          </h2>
          <p className="text-slate-400 font-bold text-lg">
            今天打算如何讓您的財富更進一步？
          </p>
        </div>
        
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2rem] blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden min-h-[160px] flex flex-col justify-between">
            {fortune ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-wider">
                    <Star className="w-3 h-3 fill-indigo-600" /> 今日金運: {fortune.score}%
                  </div>
                  <div className="text-xs font-bold text-slate-400">幸運色: {fortune.luckyColor}</div>
                </div>
                <p className="text-slate-800 font-black leading-tight">{fortune.fortune}</p>
                <p className="text-xs text-slate-500 font-medium italic">“ {fortune.tip} ”</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
                  <Sparkles className="text-indigo-600 w-6 h-6 animate-pulse" />
                </div>
                <button 
                  onClick={fetchFortune}
                  disabled={loadingFortune}
                  className="text-sm font-black text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  {loadingFortune ? '正在讀取星象...' : '查看今日金運占卜 →'}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="淨資產總計" value={totalBalance} icon={<Wallet className="text-white" />} gradient="from-indigo-600 to-blue-500" />
        <StatCard title="本月總流入" value={monthlyIncome} icon={<ArrowUpCircle className="text-white" />} gradient="from-emerald-500 to-teal-400" />
        <StatCard title="本月總流出" value={monthlyExpense} icon={<ArrowDownCircle className="text-white" />} gradient="from-rose-500 to-orange-400" />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transactions List */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
              <History className="w-6 h-6 text-indigo-500" />
              最近的交易活動
            </h3>
            <button className="text-sm font-bold text-indigo-600">查看全部</button>
          </div>
          <div className="space-y-4">
            {transactions.map(t => (
              <div key={t.id} className="flex items-center justify-between p-5 rounded-3xl bg-slate-50/50 hover:bg-slate-50 transition-all cursor-default group">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {t.type === 'income' ? <ArrowUpCircle className="w-7 h-7" /> : <ArrowDownCircle className="w-7 h-7" />}
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-lg">{t.category}</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{t.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xl font-black ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
                  </span>
                  <p className="text-[10px] text-slate-300 font-bold uppercase">{t.note || '無備註'}</p>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                 <p className="text-slate-400 font-bold">目前還沒有交易數據，開始記錄吧！</p>
              </div>
            )}
          </div>
        </div>

        {/* Mini Chart / Insight */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
             <Zap className="w-6 h-6 text-amber-500" />
             本月收支概覽
          </h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: '收入', value: monthlyIncome, color: '#10b981' },
                { name: '支出', value: monthlyExpense, color: '#ef4444' }
              ]} margin={{top: 0, right: 0, left: -20, bottom: 0}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 14, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" radius={[12, 12, 12, 12]} barSize={45}>
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
             <p className="text-xs font-bold text-indigo-700 leading-relaxed">
               您的收支差距為 <span className="font-black">${Math.abs(monthlyIncome - monthlyExpense).toLocaleString()}</span>，
               {monthlyIncome > monthlyExpense ? '做得好！本月處於盈餘狀態。' : '本月支出較多，建議檢視非必要花費。'}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, gradient }: { title: string, value: number, icon: React.ReactNode, gradient: string }) => (
  <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} p-8 rounded-[2.5rem] shadow-xl group hover:-translate-y-1 transition-all duration-300`}>
    <div className="relative z-10 flex flex-col justify-between h-full">
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
          {icon}
        </div>
        <div className="text-white/40 group-hover:text-white/60 transition-colors">
          <Zap className="w-8 h-8 opacity-20" />
        </div>
      </div>
      <div>
        <p className="text-white/70 text-sm font-bold uppercase tracking-widest mb-1">{title}</p>
        <h4 className="text-4xl font-black text-white tracking-tighter">${value.toLocaleString()}</h4>
      </div>
    </div>
    <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
  </div>
);

export default Dashboard;
