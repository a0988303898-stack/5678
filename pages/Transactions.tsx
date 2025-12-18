
import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, doc, getDoc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';
import { Transaction, BankAccount } from '../types';
import { DEFAULT_CATEGORIES, getIcon } from '../constants';
import { Plus, DollarSign } from 'lucide-react';

const LOCAL_TRANS_KEY = 'smartfinance_transactions';
const LOCAL_ACCOUNTS_KEY = 'smartfinance_accounts';

const Transactions: React.FC = () => {
  const { user, isTestMode } = useAuth();
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

    if (isTestMode) {
      // 在地交易紀錄
      const savedTrans = localStorage.getItem(LOCAL_TRANS_KEY);
      const savedAccs = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
      
      const accs = savedAccs ? JSON.parse(savedAccs) : [];
      setAccounts(accs);
      if (accs.length > 0 && !accountId) setAccountId(accs[0].id);
      
      setTransactions(savedTrans ? JSON.parse(savedTrans) : []);
      return;
    }

    if (!db) return;

    const qAccounts = query(collection(db, 'accounts'), where('userId', '==', user.uid));
    const unsubAccounts = onSnapshot(qAccounts, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankAccount));
      setAccounts(data);
      if (data.length > 0 && !accountId) setAccountId(data[0].id);
    });

    const qTrans = query(collection(db, 'transactions'), where('userId', '==', user.uid), orderBy('date', 'desc'));
    const unsubTrans = onSnapshot(qTrans, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
    });

    return () => { unsubAccounts(); unsubTrans(); };
  }, [user, isTestMode]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const transAmount = Number(amount);
    
    if (isTestMode) {
      const newTrans: Transaction = {
        id: 'tr_' + Date.now(),
        accountId,
        amount: transAmount,
        type,
        category,
        note,
        date,
        createdAt: Date.now()
      };
      
      // 更新交易清單
      const updatedTrans = [newTrans, ...transactions];
      setTransactions(updatedTrans);
      localStorage.setItem(LOCAL_TRANS_KEY, JSON.stringify(updatedTrans));
      
      // 更新在地帳戶餘額
      const updatedAccs = accounts.map(a => {
        if (a.id === accountId) {
          const newBalance = type === 'income' ? a.balance + transAmount : a.balance - transAmount;
          return { ...a, balance: newBalance };
        }
        return a;
      });
      setAccounts(updatedAccs);
      localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(updatedAccs));

      setIsModalOpen(false);
      setAmount(''); setNote('');
      return;
    }

    if (!db || !user || !accountId) return;
    try {
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

      const accountRef = doc(db, 'accounts', accountId);
      const accountSnap = await getDoc(accountRef);
      if (accountSnap.exists()) {
        const currentBalance = accountSnap.data().balance;
        const newBalance = type === 'income' ? currentBalance + transAmount : currentBalance - transAmount;
        await updateDoc(accountRef, { balance: newBalance });
      }

      setIsModalOpen(false);
      setAmount(''); setNote('');
    } catch (err) {
      alert("儲存失敗。");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">交易明細</h2>
          <p className="text-slate-500">記錄您的日常每一筆金流</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
        >
          <Plus className="w-5 h-5" />
          記一筆
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">日期</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">類別</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">帳戶</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">備註</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">金額</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.map(t => {
                const account = accounts.find(a => a.id === t.accountId);
                return (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-500">{t.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="p-2 bg-slate-100 rounded-xl text-slate-600">
                          {getIcon(DEFAULT_CATEGORIES.find(c => c.name === t.category)?.icon || '')}
                        </span>
                        <span className="font-bold text-slate-700">{t.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold">
                        {account?.name || '未知帳戶'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{t.note || '-'}</td>
                    <td className={`px-6 py-4 text-base font-black text-right ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-300 font-medium">尚無任何交易紀錄</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-bold mb-6 text-slate-800">新增紀錄</h3>
            <form onSubmit={handleAddTransaction} className="space-y-6">
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl">
                <button 
                  type="button" onClick={() => { setType('expense'); setCategory(DEFAULT_CATEGORIES[0].name); }}
                  className={`py-3 rounded-xl font-bold transition-all ${type === 'expense' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400'}`}
                >支出</button>
                <button 
                  type="button" onClick={() => { setType('income'); setCategory(DEFAULT_CATEGORIES.find(c => c.type === 'income')?.name || ''); }}
                  className={`py-3 rounded-xl font-bold transition-all ${type === 'income' ? 'bg-white text-emerald-500 shadow-sm' : 'text-slate-400'}`}
                >收入</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">金額</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full pl-10 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-black text-xl" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">日期</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">選擇帳戶</label>
                  <select value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold">
                    {accounts.length > 0 ? accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>) : <option disabled>請先建立帳戶</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">類別</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold">
                    {DEFAULT_CATEGORIES.filter(c => c.type === type).map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">備註</label>
                <input value={note} onChange={e => setNote(e.target.value)} className="w-full px-4 py-4 bg-slate-50 rounded-2xl outline-none font-medium" placeholder="寫點什麼..." />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-bold text-slate-400 hover:bg-slate-50 rounded-2xl">取消</button>
                <button type="submit" disabled={accounts.length === 0} className="flex-1 py-4 font-bold bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-lg disabled:opacity-50">儲存紀錄</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
