
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db, isDemoMode } from '../firebase';
import { useAuth } from '../App';
import { BankAccount, Transaction } from '../types';
// Add PieChart to the lucide-react imports to resolve the missing component error on line 90
import { Wallet, ArrowUpCircle, ArrowDownCircle, Plus, History, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Demo Data
    if (isDemoMode) {
      const demoAccounts: BankAccount[] = [
        { id: '1', name: '中國信託', bankName: 'CTBC', balance: 50000, color: 'bg-green-600', createdAt: Date.now() },
        { id: '2', name: '台新銀行', bankName: 'Taishin', balance: 12000, color: 'bg-red-500', createdAt: Date.now() }
      ];
      const demoTransactions: Transaction[] = [
        { id: '1', accountId: '1', amount: 1200, type: 'expense', category: '飲食', note: '午餐', date: '2024-03-20', createdAt: Date.now() },
        { id: '2', accountId: '1', amount: 45000, type: 'income', category: '薪資', note: '3月工資', date: '2024-03-05', createdAt: Date.now() }
      ];
      setAccounts(demoAccounts);
      setTransactions(demoTransactions);
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
  }, [user]);

  const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
  const monthlyIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const monthlyExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);

  const chartData = [
    { name: '收入', value: monthlyIncome, color: '#10b981' },
    { name: '支出', value: monthlyExpense, color: '#ef4444' }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">歡迎回來，{user?.email?.split('@')[0]}</h2>
          <p className="text-slate-500">這是您目前的財務概況</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            快速記帳
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="總資產" value={totalBalance} icon={<Wallet className="text-indigo-600" />} color="indigo" />
        <StatCard title="本月收入" value={monthlyIncome} icon={<ArrowUpCircle className="text-emerald-600" />} color="emerald" />
        <StatCard title="本月支出" value={monthlyExpense} icon={<ArrowDownCircle className="text-rose-600" />} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Charts */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6 text-slate-800 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-500" />
            收支比例分析
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6 text-slate-800 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-500" />
            最近交易
          </h3>
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <p className="text-center text-slate-400 py-10">尚無交易紀錄</p>
            ) : (
              transactions.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {t.type === 'income' ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{t.category}</p>
                      <p className="text-xs text-slate-500">{t.date} • {t.note}</p>
                    </div>
                  </div>
                  <span className={`font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h4 className="text-2xl font-bold text-slate-900">${value.toLocaleString()}</h4>
    </div>
    <div className={`p-3 rounded-xl bg-${color}-50`}>
      {icon}
    </div>
  </div>
);

export default Dashboard;
