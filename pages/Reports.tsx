
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, isDemoMode } from '../firebase';
import { useAuth } from '../App';
import { Transaction, BankAccount } from '../types';
import { getFinancialAdvice } from '../geminiService';
import { BrainCircuit, Sparkles, TrendingDown, TrendingUp, Info } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [advice, setAdvice] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (isDemoMode) {
      setTransactions([
        { id: '1', accountId: '1', amount: 5000, type: 'expense', category: '飲食', note: '', date: '2024-03-01', createdAt: 0 },
        { id: '2', accountId: '1', amount: 3000, type: 'expense', category: '交通', note: '', date: '2024-03-02', createdAt: 0 },
        { id: '3', accountId: '1', amount: 12000, type: 'income', category: '薪資', note: '', date: '2024-03-05', createdAt: 0 },
      ]);
      return;
    }
    if (!db) return;

    const qT = query(collection(db, 'transactions'), where('userId', '==', user.uid));
    const unsubT = onSnapshot(qT, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    });

    const qA = query(collection(db, 'accounts'), where('userId', '==', user.uid));
    const unsubA = onSnapshot(qA, (snapshot) => {
      setAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankAccount)));
    });

    return () => { unsubT(); unsubA(); };
  }, [user]);

  const generateAIAdvice = async () => {
    setAnalyzing(true);
    const result = await getFinancialAdvice(transactions, accounts);
    setAdvice(result);
    setAnalyzing(false);
  };

  const expenseData = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc: any[], curr) => {
      const existing = acc.find(item => item.name === curr.category);
      if (existing) {
        existing.value += curr.amount;
      } else {
        acc.push({ name: curr.category, value: curr.amount });
      }
      return acc;
    }, []);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <header>
        <h2 className="text-2xl font-bold text-slate-800">智能財務分析</h2>
        <p className="text-slate-500">視覺化報表與 AI 驅動的理財建議</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Chart Section */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold mb-8 text-slate-800 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-rose-500" />
              支出類別分佈
            </h3>
            <div className="h-80">
              {expenseData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 italic">尚無支出數據可供分析</div>
              )}
            </div>
          </div>

          {/* AI Advisor Panel */}
          <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10">
               <BrainCircuit className="w-32 h-32" />
             </div>
             <div className="relative z-10">
               <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
                   <Sparkles className="w-6 h-6 text-white" />
                 </div>
                 <h3 className="text-xl font-bold">Gemini 3 Pro AI 理財顧問</h3>
               </div>
               
               {advice ? (
                 <div className="prose prose-invert max-w-none bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                    <div className="whitespace-pre-wrap leading-relaxed text-slate-200">
                      {advice}
                    </div>
                    <button 
                      onClick={generateAIAdvice}
                      disabled={analyzing}
                      className="mt-6 text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      {analyzing ? '分析中...' : '重新分析 →'}
                    </button>
                 </div>
               ) : (
                 <div className="text-center py-10">
                   <p className="text-slate-400 mb-6">讓我們來分析您的消費習慣，給予您最專業的財務建議。</p>
                   <button 
                    onClick={generateAIAdvice}
                    disabled={analyzing}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
                   >
                     {analyzing ? 'AI 正在思考中...' : '開始 AI 財務分析'}
                   </button>
                 </div>
               )}
             </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">財務亮點</h3>
             <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center gap-3 text-emerald-700 font-bold mb-1">
                    <TrendingUp className="w-5 h-5" />
                    <span>本月結餘正向</span>
                  </div>
                  <p className="text-sm text-emerald-600/80">您的收入大於支出，保持良好的儲蓄習慣！</p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                   <div className="flex items-center gap-3 text-amber-700 font-bold mb-1">
                    <Info className="w-5 h-5" />
                    <span>消費警示</span>
                  </div>
                  <p className="text-sm text-amber-600/80">本月「餐飲」支出較上月增長了 15%，建議適度控制。</p>
                </div>
             </div>
           </div>

           <div className="bg-indigo-600 p-6 rounded-3xl shadow-lg text-white">
             <h3 className="font-bold mb-2">設定財務目標？</h3>
             <p className="text-indigo-100 text-sm mb-4">即將推出的功能：設定目標存款、自動存錢計畫。</p>
             <button className="w-full bg-white/20 hover:bg-white/30 text-white font-bold py-2 rounded-xl transition-all">
               敬請期待
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
