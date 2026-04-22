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
import { FaShoppingCart, FaUser, FaChevronDown, FaChevronUp, FaSignOutAlt, FaUserCircle, FaTimes } from 'react-icons/fa';
import { Toaster } from 'react-hot-toast';
import { CartProvider, useCart } from './context/CartContext';
import Logo from './components/Logo';

import TopInfoBar from './components/TopInfoBar';

// Logout Confirmation Modal
const LogoutModal = ({ isOpen, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full animate-fadeIn text-center">
                <button onClick={onCancel} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100">
                    <FaTimes className="text-gray-400 text-sm" />
                </button>
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                    <FaSignOutAlt size={24} className="text-red-500" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Logout?</h3>
                <p className="text-gray-500 font-medium mb-8">
                    Are you sure you want to end your session? You'll need to log in again to access your account.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        Stay In
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-3.5 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                    >
                        Yes, Logout
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

    // Hide header on auth pages and admin layout
    const isAuthPage = ['/login', '/register', '/admin/src/components/AdminLogin'].includes(location.pathname);
    const isAdminDashboard = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login';

    if (isAuthPage || isAdminDashboard) return null;

    const handleLogoutClick = () => {
        setIsProfileOpen(false);
        setShowLogoutModal(true);
    };

    const handleConfirmLogout = () => {
        setShowLogoutModal(false);
        logout();
    };

    const handleDesignsClick = (e) => {
        if (location.pathname === '/') {
            e.preventDefault();
            const element = document.getElementById('designs');
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    const handleHomeClick = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
            <LogoutModal
                isOpen={showLogoutModal}
                onConfirm={handleConfirmLogout}
                onCancel={() => setShowLogoutModal(false)}
            />
            <header className={`w-full sticky top-0 z-[9999] transition-all duration-700 font-sans ${scrolled
                ? 'bg-white/95 backdrop-blur-2xl shadow-[0_8px_32px_rgba(66,45,107,0.12)] py-1.5 border-b-2 border-luxury-purple/30'
                : 'bg-transparent py-5 border-b border-white/5'
                }`}>
                <nav className="max-w-7xl mx-auto px-6 h-12 md:h-16 flex items-center justify-between">
                    {/* Left: Logo */}
                    <Link to="/" onClick={handleHomeClick} className="hover:opacity-90 transition-all transform active:scale-95">
                        <Logo />
                    </Link>

                    {/* Middle: Desktop Nav Links */}
                    <div className="hidden lg:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
                        <Link to="/" onClick={handleHomeClick} className="text-[13px] font-[900] text-luxury-purple hover:text-luxury-purple-dark transition-colors uppercase tracking-[0.15em] relative group">
                            Home
                            <span className="absolute -bottom-1 w-full h-[3px] bg-luxury-purple scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                        </Link>
                        <Link 
                            to="/#designs" 
                            onClick={handleDesignsClick}
                            className="text-[13px] font-[900] text-luxury-purple hover:text-luxury-purple-dark transition-colors uppercase tracking-[0.15em] relative group"
                        >
                            Designs
                            <span className="absolute -bottom-1 w-full h-[3px] bg-luxury-purple scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                        </Link>
                        {user && user.role === 'admin' && (
                            <Link to="/admin" className="text-[13px] font-[900] text-luxury-purple hover:text-luxury-purple-dark transition-colors uppercase tracking-[0.15em] relative group">
                                Admin
                                <span className="absolute -bottom-1 w-full h-[3px] bg-luxury-purple scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                            </Link>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3">
                        {/* Cart */}
                        {(!user || user.role !== 'admin') && (
                            <Link to="/cart" className="relative p-2.5 rounded-full hover:bg-luxury-purple/10 transition-all text-[#422d6b] hover:text-luxury-purple active:scale-90">
                                <FaShoppingCart size={20} />
                                {cartItems.length > 0 && (
                                    <span className="absolute top-1 right-1 bg-luxury-purple text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full ring-[3px] ring-white">
                                        {cartItems.length}
                                    </span>
                                )}
                            </Link>
                        )}

                        {/* Account */}
                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className="flex items-center gap-2 p-1 pl-2 pr-1 rounded-full border border-luxury-purple/20 hover:border-luxury-purple/40 hover:bg-luxury-purple/5 transition-all active:scale-95 bg-white shadow-sm"
                                >
                                    <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-luxury-purple/5 flex-shrink-0">
                                        {user.avatar ? (
                                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-luxury-purple flex items-center justify-center text-white text-[12px] font-black uppercase">
                                                {user.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <FaChevronDown className={`text-[9px] text-luxury-purple/40 mr-2 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Dropdown Menu */}
                                {isProfileOpen && (
                                    <>
                                        <div className="fixed inset-0 z-[9998]" onClick={() => setIsProfileOpen(false)} />
                                        <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-[0_20px_50px_rgba(86,60,140,0.15)] border border-luxury-purple/10 py-3 z-[9999] animate-fadeIn">
                                            <div className="px-5 py-4 border-b border-luxury-purple/5">
                                                <p className="text-[10px] font-black text-luxury-purple/40 uppercase tracking-widest mb-1 leading-none">Account</p>
                                                <p className="text-[15px] font-[900] text-luxury-purple-dark truncate leading-none mb-1">{user.name}</p>
                                                <p className="text-xs text-luxury-purple/60 font-medium truncate">{user.email}</p>
                                            </div>

                                            <div className="py-2">
                                                <Link
                                                    to="/profile"
                                                    onClick={() => setIsProfileOpen(false)}
                                                    className="flex items-center gap-3 px-5 py-3 text-[13px] font-bold text-luxury-purple hover:bg-luxury-purple/5 transition-all"
                                                >
                                                    <FaUserCircle size={16} />
                                                    Personal Profile
                                                </Link>

                                                {user.role === 'admin' && (
                                                    <div className="border-t border-slate-50 my-1 pt-1">
                                                        <Link
                                                            to="/admin/orders"
                                                            onClick={() => setIsProfileOpen(false)}
                                                            className="flex items-center gap-3 px-5 py-3 text-[13px] font-bold text-luxury-purple hover:bg-luxury-purple/5 transition-all"
                                                        >
                                                            <FaShoppingCart size={16} />
                                                            Order Management
                                                        </Link>
                                                        <Link
                                                            to="/admin/users"
                                                            onClick={() => setIsProfileOpen(false)}
                                                            className="flex items-center gap-3 px-5 py-3 text-[13px] font-bold text-luxury-purple hover:bg-luxury-purple/5 transition-all"
                                                        >
                                                            <FaUser size={16} />
                                                            User Directory
                                                        </Link>
                                                    </div>
                                                )}

                                                {user.role !== 'admin' && (
                                                    <Link
                                                        to="/cart"
                                                        onClick={() => setIsProfileOpen(false)}
                                                        className="flex items-center gap-3 px-5 py-3 text-[13px] font-bold text-luxury-purple hover:bg-luxury-purple/5 transition-all"
                                                    >
                                                        <FaShoppingCart size={16} />
                                                        Shopping Cart
                                                        {cartItems.length > 0 && (
                                                            <span className="ml-auto bg-luxury-purple/10 text-luxury-purple text-[10px] font-black px-2 py-0.5 rounded-full">{cartItems.length}</span>
                                                        )}
                                                    </Link>
                                                )}
                                            </div>

                                            <div className="border-t border-slate-50 pt-2 px-2">
                                                <button
                                                    onClick={handleLogoutClick}
                                                    className="w-full flex items-center gap-3 px-3 py-3 text-[13px] font-black text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                >
                                                    <FaSignOutAlt size={16} />
                                                    Sign Out
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <Link to="/login" className="px-6 py-2.5 rounded-full text-xs font-black text-white bg-luxury-purple hover:bg-luxury-purple-dark transition-all active:scale-95 shadow-lg shadow-luxury-purple/20 uppercase tracking-widest">
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
                    <div className="min-h-screen bg-luxury-cream font-sans text-luxury-purple-dark">
                        <Toaster 
                            position="top-center" 
                            reverseOrder={false} 
                            containerStyle={{ zIndex: 99999, top: 40 }}
                            toastOptions={{
                                style: {
                                    fontSize: '13px',
                                    fontWeight: 'bold',
                                    borderRadius: '12px',
                                    padding: '12px 24px',
                                },
                            }}
                        />
                        <Navigation />
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            {/* Standalone admin app is served by Express under `/admin/*`.
                                In local `client` dev-server this route won't exist, so we
                                intentionally render nothing to avoid "No routes matched". */}
                            <Route path="/admin/*" element={<div />} />


                            <Route path="/category/:categoryName" element={<ProductCategory />} />
                            <Route path="/product/:id" element={<TemplateDetails />} />
                            <Route path="/customize/:id" element={<CustomizeProduct />} />
                            <Route path="/profile" element={
                                <ProtectedRoute>
                                    <Profile />
                                </ProtectedRoute>
                            } />
                            <Route path="/cart" element={
                                <ProtectedRoute>
                                    <Cart />
                                </ProtectedRoute>
                            } />
                            <Route path="/checkout" element={
                                <ProtectedRoute>
                                    <Checkout />
                                </ProtectedRoute>
                            } />
                            <Route path="/order-success/:id" element={
                                <ProtectedRoute>
                                    <OrderSuccess />
                                </ProtectedRoute>
                            } />
                            <Route path="/quick-buy/:id" element={
                                <ProtectedRoute>
                                    <QuickBuy />
                                </ProtectedRoute>
                            } />
                            <Route path="/invoice/:orderId" element={
                                <ProtectedRoute>
                                    <Invoice />
                                </ProtectedRoute>
                            } />
                        </Routes>
                    </div>
                </Router>
            </CartProvider>
        </AuthProvider>
    );
}

export default App;
