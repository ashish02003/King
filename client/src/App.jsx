import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import CustomizeProduct from './pages/CustomizeProduct';


import Profile from './pages/Profile';
import Cart from './pages/Cart';
import ProductCategory from './pages/ProductCategory';
import TemplateDetails from './pages/TemplateDetails';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import QuickBuy from './pages/QuickBuy';
import Invoice from './pages/Invoice';
import { FaShoppingCart, FaChevronDown, FaSignOutAlt, FaUserCircle, FaTimes } from 'react-icons/fa';
import { Toaster } from 'react-hot-toast';
import { CartProvider, useCart } from './context/CartContext';
import Logo from './components/Logo';

// Logout Confirmation Modal
const LogoutModal = ({ isOpen, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-primary-dark/80 backdrop-blur-luxury" onClick={onCancel} />
            <div className="relative bg-primary rounded-luxury border border-white/10 shadow-2xl p-8 max-w-sm w-full animate-fadeIn text-center">
                <button onClick={onCancel} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 transition-colors">
                    <FaTimes className="text-accent-soft text-sm" />
                </button>
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
                    <FaSignOutAlt size={24} className="text-red-500" />
                </div>
                <h3 className="text-2xl font-serif text-white mb-2">Sign Out</h3>
                <p className="text-accent-soft text-sm mb-8">
                    Are you sure you want to sign out of your account?
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 rounded-luxury border border-white/10 font-semibold text-white text-sm hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-3 rounded-luxury bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
};

// Navigation Component
const Navigation = () => {
    const { user, logout } = useAuth();
    const { cartItems } = useCart();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (isProfileOpen && !e.target.closest('.profile-dropdown')) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isProfileOpen]);

    const isAuthPage = ['/login', '/register'].includes(location.pathname);
    const isAdminDashboard = location.pathname.startsWith('/admin');

    if (isAuthPage || isAdminDashboard) return null;

    const handleLogoutClick = () => {
        setIsProfileOpen(false);
        setShowLogoutModal(true);
    };

    const handleConfirmLogout = () => {
        setShowLogoutModal(false);
        logout();
    };

    const navLinks = [
        { label: 'Home', path: '/' },
        { label: 'Designs', path: '/#designs' },
    ];

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname + location.hash === path;
    };

    return (
        <>
            <LogoutModal
                isOpen={showLogoutModal}
                onConfirm={handleConfirmLogout}
                onCancel={() => setShowLogoutModal(false)}
            />
            <header className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-500 ${scrolled
                ? 'bg-primary-dark/90 backdrop-blur-luxury border-b border-white/[0.06] py-4'
                : 'bg-transparent py-6'
                }`}>
                <nav className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                        <Logo />
                    </Link>

                    {/* Nav Links - Only Home & Designs */}
                    <div className="hidden md:flex items-center gap-10">
                        {navLinks.map((item) => (
                            <Link
                                key={item.label}
                                to={item.path}
                                className={`text-[11px] font-semibold uppercase tracking-[0.2em] relative group transition-colors duration-300 ${
                                    isActive(item.path) ? 'text-gold' : 'text-white/70 hover:text-gold'
                                }`}
                            >
                                {item.label}
                                <span className={`absolute -bottom-1.5 left-0 h-[2px] bg-gold transition-all duration-300 ${
                                    isActive(item.path) ? 'w-full' : 'w-0 group-hover:w-full'
                                }`}></span>
                            </Link>
                        ))}
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-5">
                        {/* Cart */}
                        <Link to="/cart" className="relative text-white/80 hover:text-gold transition-colors duration-300 p-2">
                            <FaShoppingCart size={18} />
                            {cartItems.length > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 bg-gold text-primary-dark text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                                    {cartItems.length}
                                </span>
                            )}
                        </Link>

                        {/* User */}
                        {user ? (
                            <div className="relative profile-dropdown">
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center gap-2 py-1.5 pl-1.5 pr-3 rounded-full border border-white/10 hover:border-gold/40 transition-all duration-300 bg-white/[0.03]"
                                >
                                    <div className="w-7 h-7 rounded-full bg-gold/10 flex items-center justify-center text-gold text-xs font-bold uppercase">
                                        {user.avatar ? <img src={user.avatar} className="w-full h-full rounded-full object-cover" /> : user.name.charAt(0)}
                                    </div>
                                    <FaChevronDown className={`text-[9px] text-white/50 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isProfileOpen && (
                                    <div className="absolute right-0 mt-3 w-56 bg-primary border border-white/10 rounded-luxury shadow-card py-2 animate-fadeIn">
                                        <div className="px-4 py-3 border-b border-white/[0.06]">
                                            <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest mb-0.5">Account</p>
                                            <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                                        </div>
                                        <div className="py-1">
                                            <Link to="/profile" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-gold hover:bg-white/[0.03] transition-all">
                                                <FaUserCircle size={14} /> Profile
                                            </Link>
                                            <button onClick={handleLogoutClick} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-all">
                                                <FaSignOutAlt size={14} /> Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="flex items-center gap-2 py-2.5 px-6 rounded-full border border-gold/40 text-gold text-[11px] font-semibold uppercase tracking-[0.15em] hover:bg-gold hover:text-primary-dark transition-all duration-300"
                            >
                                <FaUserCircle size={14} />
                                Sign In
                            </Link>
                        )}
                    </div>
                </nav>
            </header>
        </>
    );
};

function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <Router>
                    <div className="min-h-screen bg-primary-dark text-white font-sans">
                        <Toaster
                            position="top-center"
                            toastOptions={{
                                style: {
                                    background: '#1A1333',
                                    color: '#FFFFFF',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                },
                            }}
                        />
                        <Navigation />
                        <main className="transition-all duration-500">
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route path="/admin/*" element={<div />} />
                                <Route path="/category/:categoryName" element={<ProductCategory />} />
                                <Route path="/product/:id" element={<TemplateDetails />} />
                                <Route path="/customize/:id" element={<CustomizeProduct />} />
                                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                                <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                                <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                                <Route path="/order-success/:id" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
                                <Route path="/quick-buy/:id" element={<ProtectedRoute><QuickBuy /></ProtectedRoute>} />
                                <Route path="/invoice/:orderId" element={<ProtectedRoute><Invoice /></ProtectedRoute>} />
                            </Routes>
                        </main>
                    </div>
                </Router>
            </CartProvider>
        </AuthProvider>
    );
}

export default App;
