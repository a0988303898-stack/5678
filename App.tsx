
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth, isDemoMode } from './firebase';
import { LayoutDashboard, Wallet, Receipt, PieChart, LogOut, LogIn, UserPlus, ShieldAlert } from 'lucide-react';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Accounts from './pages/Accounts';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';

// Context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {}
});

export const useAuth = () => useContext(AuthContext);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const logout = async () => {
    if (auth) {
      await signOut(auth);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium">SmartFinance 載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      <Router>
        <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
          {user && <Sidebar />}
          <div className="flex-1 overflow-auto">
            {isDemoMode && (
              <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-amber-800 text-sm">
                <ShieldAlert className="w-4 h-4" />
                <span>目前處於「離線展示模式」，資料將不會儲存至雲端。</span>
              </div>
            )}
            <Routes>
              <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
              <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
              <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
              <Route path="/accounts" element={user ? <Accounts /> : <Navigate to="/login" />} />
              <Route path="/transactions" element={user ? <Transactions /> : <Navigate to="/login" />} />
              <Route path="/reports" element={user ? <Reports /> : <Navigate to="/login" />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthContext.Provider>
  );
};

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: '儀表板', path: '/' },
    { icon: <Wallet className="w-5 h-5" />, label: '銀行帳戶', path: '/accounts' },
    { icon: <Receipt className="w-5 h-5" />, label: '收支紀錄', path: '/transactions' },
    { icon: <PieChart className="w-5 h-5" />, label: '報表與 AI', path: '/reports' },
  ];

  return (
    <div className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col h-auto md:h-screen sticky top-0 z-20">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <Wallet className="text-white w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
          SmartFinance
        </h1>
      </div>
      
      <nav className="flex-1 p-4 flex flex-row md:flex-col overflow-x-auto md:overflow-x-hidden gap-1">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-slate-50 text-slate-600 hover:text-indigo-600 whitespace-nowrap"
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 hidden md:block">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-red-50 text-red-500 font-medium"
        >
          <LogOut className="w-5 h-5" />
          <span>登出</span>
        </button>
      </div>
    </div>
  );
};

export default App;
