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
        <div className="min-h-screen flex items-center justify-center bg-primary-dark p-6 relative overflow-hidden">
            {/* Background */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-gold/[0.04] rounded-full blur-[140px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent-purple/10 rounded-full blur-[120px]"></div>

            <div className="w-full max-w-5xl flex flex-row-reverse bg-primary rounded-luxury shadow-card overflow-hidden border border-white/[0.06] relative animate-fadeIn">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-7 right-7 flex items-center gap-2.5 text-[11px] font-semibold text-white/40 uppercase tracking-[0.15em] hover:text-gold transition-all group z-50"
                >
                    <span>Back</span>
                    <FaArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Right Side: Form */}
                <div className="w-full lg:w-1/2 p-12 md:p-16 lg:p-20">
                    <div className="mb-10">
                        <Logo />
                        <h1 className="text-3xl md:text-4xl font-serif text-white mt-8 mb-2">Create Account</h1>
                        <p className="text-white/40 text-sm">Start personalizing your products today</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-luxury text-sm mb-6 flex items-center gap-2 animate-fadeIn">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider ml-1">Full Name</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-white/30 group-focus-within:text-gold transition-colors">
                                    <FaUser size={13} />
                                </div>
                                <input
                                    type="text"
                                    className="input-luxury w-full pl-11"
                                    placeholder="Enter your full name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider ml-1">Email</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-white/30 group-focus-within:text-gold transition-colors">
                                    <FaEnvelope size={13} />
                                </div>
                                <input
                                    type="email"
                                    className="input-luxury w-full pl-11"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-white/30 group-focus-within:text-gold transition-colors">
                                    <FaLock size={13} />
                                </div>
                                <input
                                    type="password"
                                    className="input-luxury w-full pl-11"
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
                            className="btn-gold w-full flex items-center justify-center gap-2.5 mt-2 disabled:opacity-50"
                        >
                            {isLoading ? 'Creating...' : 'Create Account'}
                            {!isLoading && <FaArrowRight size={11} />}
                        </button>
                    </form>

                    <div className="mt-10 pt-6 border-t border-white/[0.06]">
                        <p className="text-center text-sm text-white/40">
                            Already have an account? <Link to="/login" className="text-gold font-semibold hover:underline ml-1">Sign In</Link>
                        </p>
                    </div>
                </div>

                {/* Left Side: Visual */}
                <div className="hidden lg:flex lg:w-1/2 bg-primary-light relative p-16 flex-col justify-center items-center overflow-hidden">
                    <div className="absolute inset-0">
                         <img
                            src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800"
                            className="w-full h-full object-cover opacity-15"
                            alt="Background"
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-primary via-transparent to-primary"></div>
                    </div>

                    <div className="relative z-10 text-center space-y-6">
                        <div className="w-20 h-20 bg-gold/10 backdrop-blur-xl border border-gold/20 rounded-luxury flex items-center justify-center mx-auto">
                             <Logo />
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-3xl font-serif text-white tracking-tight leading-tight">Begin Your <br /><span className="text-gold italic">Journey</span></h2>
                            <p className="text-white/40 text-sm max-w-xs mx-auto">Join us and start creating personalized products for every occasion.</p>
                        </div>

                        <div className="pt-6 grid grid-cols-2 gap-3">
                            <div className="p-4 bg-white/[0.04] backdrop-blur-md rounded-luxury border border-white/[0.06]">
                                <p className="text-gold font-bold text-lg">100%</p>
                                <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">Custom Made</p>
                            </div>
                            <div className="p-4 bg-white/[0.04] backdrop-blur-md rounded-luxury border border-white/[0.06]">
                                <p className="text-gold font-bold text-lg">24/7</p>
                                <p className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5">Support</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
