
import React, { useState, useEffect } from 'react';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';
import { BankAccount } from '../types';
import { Plus, Trash2, Building2, CreditCard } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'smartfinance_accounts';

const Accounts: React.FC = () => {
  const { user, isTestMode } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('');
  const [balance, setBalance] = useState(0);

  // 初始化與資料監聽
  useEffect(() => {
    if (!user) return;

    if (isTestMode) {
      // 在地儲存模式
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setAccounts(JSON.parse(saved));
      } else {
        const initial = [
          { id: 't1', name: '預設錢包', bankName: '現金', balance: 5000, color: 'bg-indigo-600', createdAt: Date.now() }
        ];
        setAccounts(initial);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initial));
      }
      return;
    }

    // Firebase 模式
    if (!db) return;
    const q = query(collection(db, 'accounts'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankAccount)));
    });
    return unsubscribe;
  }, [user, isTestMode]);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isTestMode) {
      const newAcc: BankAccount = {
        id: 'acc_' + Date.now(),
        name,
        bankName,
        balance: Number(balance),
        color: 'bg-indigo-600',
        createdAt: Date.now()
      };
      const updated = [...accounts, newAcc];
      setAccounts(updated);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      setIsModalOpen(false);
      resetForm();
      return;
    }

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
      resetForm();
    } catch (err) {
      alert("儲存失敗，請檢查權限。");
    }
  };

  const deleteAccount = async (id: string) => {
    if (!confirm("確定要刪除此帳戶嗎？此動作無法復原。")) return;

    if (isTestMode) {
      const updated = accounts.filter(a => a.id !== id);
      setAccounts(updated);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return;
    }
    
    if (!db) return;
    await deleteDoc(doc(db, 'accounts', id));
  };

  const resetForm = () => {
    setName('');
    setBankName('');
    setBalance(0);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">資產帳戶</h2>
          <p className="text-slate-500">{isTestMode ? '在地儲存模式：資料儲存於此瀏覽器' : '雲端同步模式：資料已安全加密'}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
        >
          <Plus className="w-5 h-5" />
          新增帳戶
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(account => (
          <div key={account.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className={`h-2 bg-indigo-600`} />
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-indigo-50 rounded-2xl">
                  <Building2 className="w-6 h-6 text-indigo-600" />
                </div>
                <button onClick={() => deleteAccount(account.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">{account.name}</h3>
              <p className="text-slate-400 text-sm mb-6 font-medium">{account.bankName}</p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">CURRENT BALANCE</p>
                  <p className="text-3xl font-black text-slate-900">
                    <span className="text-lg mr-1 text-slate-400">$</span>
                    {account.balance.toLocaleString()}
                  </p>
                </div>
                <CreditCard className="w-12 h-12 text-slate-50 opacity-20" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-bold mb-6 text-slate-800">建立新帳戶</h3>
            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">帳戶自訂名稱</label>
                <input 
                  value={name} onChange={e => setName(e.target.value)}
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" 
                  placeholder="如：我的主錢包" required 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">銀行/機構名稱</label>
                <input 
                  value={bankName} onChange={e => setBankName(e.target.value)}
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" 
                  placeholder="如：中國信託 / 現金" required 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">初始金額</label>
                <input 
                  type="number" value={balance} onChange={e => setBalance(Number(e.target.value))}
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-black text-xl" 
                  required 
                />
              </div>
              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-bold text-slate-400 hover:bg-slate-50 rounded-2xl transition-all">取消</button>
                <button type="submit" className="flex-1 py-4 font-bold bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">建立帳戶</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
