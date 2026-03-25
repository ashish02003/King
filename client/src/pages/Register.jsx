import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaArrowRight, FaArrowLeft } from 'react-icons/fa';
import Logo from '../components/Logo';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const res = await register(name, email, password);
            if (res.success) {
                navigate('/');
            } else {
                setError(res.message);
            }
        } catch (err) {
            setError('Registration failed. Please try again.');
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
                    <span>Back</span>
                </button>

                {/* Visual Side (Left on Register) */}
                <div className="hidden lg:flex w-1/2 bg-luxury-blue-dark relative p-16 items-center flex-col justify-center overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full">
                        <div className="absolute top-20 left-10 w-64 h-64 bg-luxury-gold rounded-full blur-[100px] opacity-10"></div>
                        <div className="absolute bottom-20 right-10 w-64 h-64 bg-luxury-blue-light rounded-full blur-[100px] opacity-10"></div>
                    </div>

                    <div className="relative z-10 text-center">
                        <div className="w-[16rem] h-20 bg-white/10 backdrop-blur-3xl rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-2xl">
                            <Logo className="scale-150" />
                        </div>
                        <h2 className="text-3xl font-[900] text-white tracking-tight mb-2 leading-tight">Start Your <br />Custom Journey</h2>
                        <p className="text-luxury-gold-light/60 font-medium text-lg max-w-sm mx-auto">Create an account today and get exclusive access to premium design tools and offers.</p>

                        <div className="mt-8 p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg text-left">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                <p className="text-[10px] font-black text-white uppercase tracking-widest">Active Perk</p>
                            </div>
                            <p className="text-white font-bold">10% Off your first order</p>
                            <p className="text-blue-100/60 text-xs font-medium">Applied automatically at checkout</p>
                        </div>
                    </div>
                </div>

                {/* Form Side */}
                <div className="w-full lg:w-1/2 p-10 md:p-16">
                    <div className="mb-6">
                        <Link to="/" className="inline-block transform hover:scale-105 transition-transform lg:hidden"><Logo /></Link>
                        <h1 className="text-3xl font-[900] text-slate-900 mt-2 lg:mt-0 mb-1 tracking-tight">Create Account</h1>
                        <p className="text-slate-500 font-medium">Join our community of 10k+ creators</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold mb-6 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-luxury-gold transition-colors">
                                    <FaUser size={14} />
                                </div>
                                <input
                                    type="text"
                                    className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded outline-none focus:ring-4 focus:ring-luxury-gold/10 focus:border-luxury-gold transition-all font-medium text-slate-700"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
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
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Password</label>
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
                            className="w-full bg-luxury-charcoal text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-luxury-gold transition-all active:scale-[0.98] shadow-xl shadow-luxury-charcoal/20 flex items-center justify-center gap-2 group disabled:opacity-70 mt-4"
                        >
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                            {!isLoading && <FaArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>

                    <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-center text-sm font-medium text-slate-500">
                            Already have an account? <Link to="/login" className="text-luxury-gold font-black hover:underline ml-1">Sign In</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
