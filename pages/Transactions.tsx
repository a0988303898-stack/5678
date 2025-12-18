
import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, doc, getDoc, updateDoc, orderBy } from 'firebase/firestore';
import { db, isDemoMode } from '../firebase';
import { useAuth } from '../App';
import { Transaction, BankAccount } from '../types';
import { DEFAULT_CATEGORIES, getIcon } from '../constants';
import { Plus, Filter, Calendar, Tag, Info, DollarSign } from 'lucide-react';

const Transactions: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [accountId, setAccountId] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0].name);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!user) return;
    if (isDemoMode) {
      setAccounts([{ id: '1', name: '預設帳戶', bankName: 'DEMO', balance: 50000, color: 'bg-blue-500', createdAt: 0 }]);
      setTransactions([{ id: '1', accountId: '1', amount: 500, type: 'expense', category: '飲食', note: '晚餐', date: '2024-03-21', createdAt: 0 }]);
      return;
    }
    if (!db) return;

    const qAccounts = query(collection(db, 'accounts'), where('userId', '==', user.uid));
    const unsubAccounts = onSnapshot(qAccounts, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankAccount));
      setAccounts(data);
      if (data.length > 0) setAccountId(data[0].id);
    });

    const qTrans = query(collection(db, 'transactions'), where('userId', '==', user.uid), orderBy('date', 'desc'));
    const unsubTrans = onSnapshot(qTrans, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    });

    return () => { unsubAccounts(); unsubTrans(); };
  }, [user]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemoMode) return alert("展示模式下無法新增紀錄。");
    if (!db || !user || !accountId) return;

    try {
      const transAmount = Number(amount);
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        accountId,
        amount: transAmount,
        type,
        category,
        note,
        date,
        createdAt: Date.now()
      });

      // Update account balance
      const accountRef = doc(db, 'accounts', accountId);
      const accountSnap = await getDoc(accountRef);
      if (accountSnap.exists()) {
        const currentBalance = accountSnap.data().balance;
        const newBalance = type === 'income' ? currentBalance + transAmount : currentBalance - transAmount;
        await updateDoc(accountRef, { balance: newBalance });
      }

      setIsModalOpen(false);
      setAmount('');
      setNote('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">財務收支紀錄</h2>
          <p className="text-slate-500">掌握每一筆金流去向</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          記一筆
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">日期</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">類別</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">帳戶</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">內容</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">金額</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.map(t => {
                const account = accounts.find(a => a.id === t.accountId);
                return (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600">{t.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-slate-100 rounded-lg text-slate-600">
                          {getIcon(DEFAULT_CATEGORIES.find(c => c.name === t.category)?.icon || '')}
                        </span>
                        <span className="font-medium text-slate-800">{t.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{account?.name || '未知帳戶'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{t.note}</td>
                    <td className={`px-6 py-4 text-sm font-bold text-right ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400">尚無交易紀錄</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-slate-800">新增財務紀錄</h3>
            <form onSubmit={handleAddTransaction} className="space-y-5">
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                <button 
                  type="button" onClick={() => setType('expense')}
                  className={`py-2 px-4 rounded-lg font-bold transition-all ${type === 'expense' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-500'}`}
                >支出</button>
                <button 
                  type="button" onClick={() => setType('income')}
                  className={`py-2 px-4 rounded-lg font-bold transition-all ${type === 'income' ? 'bg-white text-emerald-500 shadow-sm' : 'text-slate-500'}`}
                >收入</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700">金額</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700">日期</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" required />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700">銀行帳戶</label>
                  <select value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700">分類</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                    {DEFAULT_CATEGORIES.filter(c => c.type === type).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700">備註</label>
                <div className="relative">
                  <Info className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <textarea value={note} onChange={e => setNote(e.target.value)} className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none min-h-[100px]" placeholder="寫點什麼..." />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-xl">取消</button>
                <button type="submit" className="flex-1 py-4 font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100">儲存紀錄</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
