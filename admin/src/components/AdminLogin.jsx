import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const res = await login(email, password);
        if (!res.success) return setError(res.message);

        // `login()` persists `userInfo` to localStorage. Verify role before redirect.
        const userInfoRaw = localStorage.getItem('userInfo');
        const userInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null;

        if (userInfo?.role === 'admin') {
            navigate('/admin/dashboard');
        } else {
            setError('You are not authorized to access the admin panel.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
            <div className="bg-white p-12 shadow-2xl border border-slate-100 w-[450px] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
                <div className="mb-10 text-center">
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">Mimitiinaa Admin</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Secure Node Authorization Required</p>
                </div>
                
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-8 text-[11px] font-bold uppercase tracking-wider">
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identity Access</label>
                        <input
                            type="email"
                            className="w-full bg-slate-50 border-none py-4 px-5 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all outline-none"
                            placeholder="admin@mimitiinaa.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Protocol Key</label>
                        <input
                            type="password"
                            className="w-full bg-slate-50 border-none py-4 px-5 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all outline-none"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-slate-900 text-white py-5 font-black text-[11px] uppercase tracking-[0.35em] shadow-xl hover:bg-indigo-600 transition-all duration-300 active:scale-95"
                    >
                        Initialize Session
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;

