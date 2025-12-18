
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';
import { BankAccount, Transaction } from '../types';
import { Wallet, ArrowUpCircle, ArrowDownCircle, History, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Dashboard: React.FC = () => {
  const { user, isTestMode } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    if (isTestMode) {
      const savedAccs = localStorage.getItem('smartfinance_accounts');
      const savedTrans = localStorage.getItem('smartfinance_transactions');
      
      setAccounts(savedAccs ? JSON.parse(savedAccs) : []);
      setTransactions(savedTrans ? JSON.parse(savedTrans) : []);
      setLoading(false);
      return;
    }

    if (!db) return;

    const qAccounts = query(collection(db, 'accounts'), where('userId', '==', user.uid));
    const unsubAccounts = onSnapshot(qAccounts, (snapshot) => {
      setAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankAccount)));
    });

    const qTrans = query(
      collection(db, 'transactions'), 
      where('userId', '==', user.uid),
      orderBy('date', 'desc'),
      limit(5)
    );
    const unsubTrans = onSnapshot(qTrans, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
      setLoading(false);
    });

    return () => { unsubAccounts(); unsubTrans(); };
  }, [user, isTestMode]);

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
  const monthlyIncome = transactions
    .filter(t => t.type === 'income' && t.date.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((acc, curr) => acc + curr.amount, 0);
  const monthlyExpense = transactions
    .filter(t => t.type === 'expense' && t.date.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((acc, curr) => acc + curr.amount, 0);

  const chartData = [
    { name: '本月收入', value: monthlyIncome || 0, color: '#10b981' },
    { name: '本月支出', value: monthlyExpense || 0, color: '#ef4444' }
  ];

  if (loading) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800">
            {isTestMode ? '在地數據概覽' : `主儀表板`}
          </h2>
          <p className="text-slate-400 font-medium">
            {isTestMode ? '資料目前存於您的瀏覽器中' : `歡迎回來，${user?.email?.split('@')[0]}`}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="總資產" value={totalBalance} icon={<Wallet className="text-indigo-600" />} color="indigo" />
        <StatCard title="本月收入" value={monthlyIncome} icon={<ArrowUpCircle className="text-emerald-600" />} color="emerald" />
        <StatCard title="本月支出" value={monthlyExpense} icon={<ArrowDownCircle className="text-rose-600" />} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-8 text-slate-800 flex items-center gap-3">
            <PieChart className="w-5 h-5 text-indigo-500" />
            本月收支比例
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={50}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-8 text-slate-800 flex items-center gap-3">
            <History className="w-5 h-5 text-indigo-500" />
            最近活動
          </h3>
          <div className="space-y-4">
            {transactions.slice(0, 5).map(t => (
              <div key={t.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {t.type === 'income' ? <ArrowUpCircle className="w-6 h-6" /> : <ArrowDownCircle className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{t.category}</p>
                    <p className="text-xs text-slate-400 font-bold">{t.date}</p>
                  </div>
                </div>
                <span className={`text-lg font-black ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
                </span>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="text-center py-10">
                 <p className="text-slate-300 font-bold">尚無活動紀錄</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) => (
  <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-start justify-between group hover:border-indigo-100 transition-all">
    <div>
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{title}</p>
      <h4 className="text-3xl font-black text-slate-900">${value.toLocaleString()}</h4>
    </div>
    <div className={`p-4 rounded-2xl bg-${color}-50 group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
  </div>
);

export default Dashboard;
