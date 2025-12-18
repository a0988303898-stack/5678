
import React, { useState } from 'react';
// Explicitly importing required auth functions to satisfy modular export checks
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, isDemoMode as firebaseUnconfigured } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Wallet, Mail, Lock, AlertCircle, FlaskConical, ShieldCheck } from 'lucide-react';

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
      setError("Firebase 未配置，無法使用正式模式。請點擊下方的「進入測試模式」進行預覽。");
      return;
    }
    if (!auth) return;

    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      setError('登入失敗：' + (err.message || '請檢查信箱與密碼'));
    } finally {
      setLoading(false);
    }
  };

  const handleTestMode = () => {
    enterTestMode();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-900">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-8">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Wallet className="text-white w-10 h-10" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-center text-slate-900 mb-2">SmartFinance</h2>
          <p className="text-center text-slate-500 mb-8">請選擇進入模式以管理您的資產</p>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl flex items-center gap-3 mb-6">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 mb-2">
                <ShieldCheck className="w-4 h-4" />
                <span>正式模式 (需資料庫連線)</span>
              </div>
              <div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="電子郵件"
                    required
                  />
                </div>
              </div>
              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="密碼"
                    required
                  />
                </div>
              </div>
              <button
                disabled={loading}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50"
              >
                {loading ? '登入中...' : '正式登入'}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">或者</span></div>
            </div>

            <button
              onClick={handleTestMode}
              className="w-full border-2 border-indigo-600 text-indigo-600 font-bold py-4 rounded-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
            >
              <FlaskConical className="w-5 h-5" />
              進入測試模式 (免帳號)
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center text-slate-500">
            還沒有正式帳號？{' '}
            <Link to="/register" className="text-indigo-600 font-bold hover:underline">
              立即註冊
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
