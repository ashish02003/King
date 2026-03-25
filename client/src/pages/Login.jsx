import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FaEnvelope, FaLock, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import Logo from '../components/Logo';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const res = await login(email, password);
            if (res.success) {
                navigate('/');
            } else {
                setError(res.message);
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-[100vh] flex items-center justify-center bg-luxury-cream font-sans p-6">
            <div className="w-full max-w-5xl flex bg-white rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.04)] overflow-hidden border border-luxury-cream relative">
                {/* Back Button - Inside Container */}
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-6 left-6 flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-luxury-gold transition-colors group z-50"
                >
                    <div className="w-7 h-7 rounded-full border border-luxury-cream flex items-center justify-center group-hover:border-luxury-gold/20 transition-all bg-white shadow-sm">
                        <FaArrowLeft size={8} />
                    </div>
                    <span className="hidden sm:inline">Back</span>
                </button>

                {/* Left Side: Form */}
                <div className="w-full lg:w-1/2 p-10 md:p-16">
                    <div className="mb-6 pt-4">
                        <Link to="/" className="inline-block transform hover:scale-105 transition-transform"><Logo /></Link>
                        <h1 className="text-3xl font-[900] text-slate-900 mt-4 mb-1 tracking-tight">Welcome Back</h1>
                        <p className="text-slate-500 font-medium">Please enter your details to sign in</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-luxury-gold transition-colors">
                                    <FaEnvelope size={14} />
                                </div>
                                <input
                                    type="email"
                                    className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded outline-none focus:ring-4 focus:ring-luxury-gold/10 focus:border-luxury-gold transition-all font-medium text-slate-700"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                                <Link to="/forgot-password" size={12} className="text-[11px] font-black text-luxury-gold uppercase tracking-widest hover:underline">Forgot?</Link>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-luxury-gold transition-colors">
                                    <FaLock size={14} />
                                </div>
                                <input
                                    type="password"
                                    className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded outline-none focus:ring-4 focus:ring-luxury-gold/10 focus:border-luxury-gold transition-all font-medium text-slate-700"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-luxury-charcoal text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-luxury-gold transition-all active:scale-[0.98] shadow-xl shadow-luxury-charcoal/20 flex items-center justify-center gap-2 group disabled:opacity-70"
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                            {!isLoading && <FaArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>

                    <div className="mt-2 pt-2 border-t border-slate-100">
                        <p className="text-center text-sm font-medium text-slate-500">
                            Don't have an account? <Link to="/register" className="text-luxury-gold font-black hover:underline ml-1">Create Account</Link>
                        </p>
                    </div>
                </div>

                {/* Right Side: Visual */}
                <div className="hidden lg:flex w-1/2 bg-luxury-blue-dark relative p-16 items-center flex-col justify-center overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full">
                        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-luxury-gold rounded-full blur-[120px] opacity-10"></div>
                        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-luxury-blue-light rounded-full blur-[120px] opacity-10"></div>
                    </div>

                    <div className="relative z-10 text-center">
                        <div className="w-[16rem] h-20 bg-white/10 backdrop-blur-3xl rounded-3xl flex items-center justify-center mx-auto mb-10 border border-white/20 shadow-2xl">
                            <Logo className="scale-150" />
                        </div>
                        <h2 className="text-4xl font-[900] text-white tracking-tight mb-6 leading-tight">Craft Your <br /><span className="text-luxury-gold-light">Perfect Story</span></h2>
                        <p className="text-luxury-gold-light/60 font-medium text-lg max-w-sm mx-auto">Join thousands of creators who turn imagination into reality every single day.</p>


                        <div className="mt-12 flex items-center justify-center gap-6">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0b1e3b] bg-slate-800 overflow-hidden ring-1 ring-white/10">
                                        <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="avatar" />
                                    </div>
                                ))}
                            </div>
                            <p className="text-white/50 text-xs font-black uppercase tracking-widest">10k+ Members</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
