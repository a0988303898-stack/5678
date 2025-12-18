
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, isDemoMode as firebaseUnconfigured } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Wallet, Mail, Lock, AlertCircle, FlaskConical, ShieldCheck, ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { enterTestMode } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (firebaseUnconfigured) {
      setError("Firebase 未配置。請點擊「進入測試模式」預覽。");
      return;
    }
    if (!auth) return;

    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      setError('登入失敗，請確認帳號密碼。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 mesh-gradient relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600/20 rounded-full blur-[80px]"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-10 border border-white/20">
          <div className="flex justify-center mb-10">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 rotate-12">
              <Wallet className="text-white w-10 h-10 -rotate-12" />
            </div>
          </div>
          
          <h2 className="text-4xl font-black text-center text-slate-900 mb-2 tracking-tighter">SmartFinance</h2>
          <p className="text-center text-slate-400 font-bold mb-10 uppercase tracking-widest text-xs">未來金融管理系統</p>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-5 py-3 rounded-2xl flex items-center gap-3 mb-8 animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
               <label className="text-xs font-black text-slate-400 uppercase tracking-wider ml-1">正式存取</label>
               <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold"
                  placeholder="電子郵件"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
               <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold"
                  placeholder="安全性密碼"
                  required
                />
              </div>
            </div>

            <button
              disabled={loading}
              className="group w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-slate-800 transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
            >
              {loading ? '身分驗證中...' : '登入系統'}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="h-px bg-slate-100 flex-1"></div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">or sandbox</span>
            <div className="h-px bg-slate-100 flex-1"></div>
          </div>

          <button
            onClick={() => { enterTestMode(); navigate('/'); }}
            className="w-full border-2 border-indigo-100 text-indigo-600 font-black py-4 rounded-2xl hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center justify-center gap-3"
          >
            <FlaskConical className="w-5 h-5" />
            以測試模式啟動
          </button>

          <div className="mt-10 text-center">
            <p className="text-slate-400 font-bold text-sm">
              還沒有帳號？{' '}
              <Link to="/register" className="text-indigo-600 hover:underline">
                立即加入我們
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
