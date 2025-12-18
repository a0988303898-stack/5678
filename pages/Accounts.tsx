
import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, isDemoMode } from '../firebase';
import { useAuth } from '../App';
import { BankAccount } from '../types';
import { Plus, Trash2, Edit3, Building2, CreditCard } from 'lucide-react';

const Accounts: React.FC = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('');
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (!user) return;
    if (isDemoMode) {
      setAccounts([
        { id: '1', name: '主要薪轉', bankName: '國泰世華', balance: 120000, color: 'bg-indigo-600', createdAt: Date.now() },
        { id: '2', name: '儲蓄帳戶', bankName: '玉山銀行', balance: 500000, color: 'bg-emerald-600', createdAt: Date.now() }
      ]);
      return;
    }
    if (!db) return;

    const q = query(collection(db, 'accounts'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankAccount)));
    });
    return unsubscribe;
  }, [user]);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemoMode) return alert("展示模式下無法新增資料。");
    if (!db || !user) return;

    try {
      await addDoc(collection(db, 'accounts'), {
        userId: user.uid,
        name,
        bankName,
        balance: Number(balance),
        color: 'bg-indigo-600',
        createdAt: Date.now()
      });
      setIsModalOpen(false);
      setName('');
      setBankName('');
      setBalance(0);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAccount = async (id: string) => {
    if (isDemoMode) return alert("展示模式下無法刪除資料。");
    if (!db) return;
    if (confirm("確定要刪除此帳戶嗎？這將會導致資料永久丟失。")) {
      await deleteDoc(doc(db, 'accounts', id));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">銀行帳戶管理</h2>
          <p className="text-slate-500">管理您的所有存款與數位帳戶</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          新增帳戶
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(account => (
          <div key={account.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-md transition-all">
            <div className={`h-3 bg-indigo-600`} />
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 rounded-xl">
                  <Building2 className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => deleteAccount(account.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-800">{account.name}</h3>
              <p className="text-slate-400 text-sm mb-4">{account.bankName}</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">當前餘額</p>
                  <p className="text-2xl font-black text-slate-900">${account.balance.toLocaleString()}</p>
                </div>
                <CreditCard className="w-10 h-10 text-slate-100" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6">新增銀行帳戶</h3>
            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">帳戶名稱</label>
                <input 
                  value={name} onChange={e => setName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="例如：生活開銷帳戶" required 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">銀行名稱</label>
                <input 
                  value={bankName} onChange={e => setBankName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" placeholder="例如：中國信託" required 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">初始餘額</label>
                <input 
                  type="number" value={balance} onChange={e => setBalance(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" required 
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">取消</button>
                <button type="submit" className="flex-1 py-3 font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">建立帳戶</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
