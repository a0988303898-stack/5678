
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, isDemoMode } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, Mail, Lock, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemoMode) {
      setError("當前處於展示模式，請點擊「進入展示系統」按鈕直接存取。");
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

  const enterDemo = () => {
    // Note: In a real app, you'd mock a user object.
    // Here we just navigate and let App component handle the demo state if needed.
    // But since auth listener handles state, we can't truly "log in" without a provider.
    // For this specific requirement, we show a notice.
    alert("為了展示完整功能，建議您配置 Firebase 環境變數或在 GitHub Secrets 中設定。目前頁面僅供 UI 預覽。");
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
          <h2 className="text-3xl font-extrabold text-center text-slate-900 mb-2">歡迎回來</h2>
          <p className="text-center text-slate-500 mb-8">登入 SmartFinance 管理您的資產</p>

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl flex items-center gap-3 mb-6">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">電子郵件</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">密碼</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            <button
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
            >
              {loading ? '登入中...' : '登入系統'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-500 mb-4">
              還沒有帳號？{' '}
              <Link to="/register" className="text-indigo-600 font-bold hover:underline">
                立即註冊
              </Link>
            </p>
            {isDemoMode && (
               <button 
               onClick={enterDemo}
               className="text-sm text-slate-400 hover:text-slate-600"
             >
               進入展示模式 (僅限開發預覽)
             </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
