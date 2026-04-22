import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import mylogo from '../assets/Mimitiinaa_Logo.svg';
import {
    LayoutDashboard,
    ShoppingBag,
    Layers,
    Box,
    Users,
    Settings,
    LogOut,
    Search,
    Bell,
    Menu,
    X,
    ChevronRight,
    ChevronLeft,
    HelpCircle,
    UserCircle,
    PanelLeftClose,
    PanelLeftOpen
} from 'lucide-react';

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    const toggleCollapse = (e) => {
        e.stopPropagation();
        setIsCollapsed(prev => !prev);
    };

    const sidebarItems = [
        { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
        { path: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
        { path: '/admin/categories', icon: Layers, label: 'Categories' },
        { path: '/admin/products', icon: Box, label: 'Products' },
        { path: '/admin/users', icon: Users, label: 'Customers' },
    ];

    const NavItem = ({ item }) => {
        const isActive = location.pathname === item.path || (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
        const Icon = item.icon;

        return (
            <Link
                to={item.path}
                className={`relative flex items-center gap-3 px-3 py-2.5 my-0.5 transition-all duration-300 group
                    ${isActive
                        ? 'bg-luxury-purple/10 text-luxury-purple-dark border-l-4 border-luxury-purple'
                        : 'text-slate-500 hover:bg-luxury-cream hover:text-luxury-purple border-l-4 border-transparent'
                    } ${isCollapsed ? 'justify-center mx-1' : 'mx-1'}`}
                title={isCollapsed ? item.label : ''}
            >
                <Icon size={isCollapsed ? 20 : 18} className={`flex-shrink-0 transition-transform duration-300 ${!isActive && 'group-hover:scale-110'}`} />

                {!isCollapsed && (
                    <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                        {item.label}
                    </span>
                )}

                {isActive && !isCollapsed && (
                    <motion.div
                        layoutId="active-pill"
                        className="ml-auto"
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <ChevronRight size={14} className="opacity-50" />
                    </motion.div>
                )}
            </Link>
        );
    };

    return (
        <div className="flex bg-luxury-cream min-h-screen text-slate-800 font-sans selection:bg-luxury-purple/10 selection:text-luxury-purple-dark">
            {/* Desktop Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? 70 : 260 }}
                className="hidden lg:flex flex-col bg-white border-r border-slate-100 fixed top-0 left-0 bottom-0 z-50 shadow-[10px_0_40px_rgba(0,0,0,0.02)]"
            >
                {/* Brand Logo + Top Collapse Button */}
                <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center flex-col gap-1 px-2' : 'px-4 justify-between border-b border-slate-50'}`}>
                    <AnimatePresence mode="wait">
                        {!isCollapsed ? (
                            <motion.div
                                key="full-logo"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex items-center gap-3"
                            >
                                <div className="flex items-center gap-2.5 overflow-hidden">
                                    <img src={mylogo} alt="Mimitiinaa" className="h-6 sm:h-7 w-auto object-contain flex-shrink-0" />
                                    <span className="text-base sm:text-[1.1rem] font-black bg-gradient-to-r from-luxury-purple-dark to-luxury-purple bg-clip-text text-transparent tracking-tight leading-none mt-0.5 truncate">
                                        Mimitiinaa
                                    </span>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="collapsed-logo"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                className="flex items-center justify-center h-8"
                            >
                                <img src={mylogo} alt="M" className="h-6 w-auto object-contain" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Top Collapse Toggle Button */}
                    <button
                        onClick={toggleCollapse}
                        title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                        className={`flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-luxury-purple hover:bg-luxury-purple/10 transition-all duration-200 flex-shrink-0 ${isCollapsed ? 'mt-1' : ''}`}
                    >
                        {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                    </button>
                </div>

                {/* Primary Navigation */}
                <div className="flex-1 mt-1 overflow-y-auto px-1 custom-scrollbar">
                    <div className="mb-8">
                        {!isCollapsed && <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-4 mb-4">Management</p>}
                        {sidebarItems.map((item, index) => (
                            <NavItem key={index} item={item} />
                        ))}
                    </div>

                    <div className="mb-4">
                        {!isCollapsed && <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-4 mb-4">Settings</p>}
                        <NavItem item={{ path: '/admin/settings', icon: Settings, label: 'Settings' }} />
                        <Link to="#" className={`flex items-center gap-3 px-3 py-2.5 transition-all duration-300 text-slate-500 hover:bg-luxury-cream hover:text-luxury-purple group border-l-4 border-transparent ${isCollapsed ? 'justify-center mx-1' : 'mx-1'}`}>
                            <HelpCircle size={isCollapsed ? 20 : 18} className="group-hover:rotate-12 transition-transform" />
                            {!isCollapsed && <span className="text-sm font-medium">Support Desk</span>}
                        </Link>
                    </div>
                </div>

                {/* Sidebar Footer — Logout only, no Collapse button here */}
                <div className="p-4 border-t border-slate-50 space-y-2">
                    <button
                        onClick={handleLogout}
                        className={`flex items-center gap-3 p-3 w-full bg-slate-50 text-slate-500 hover:bg-red-600 hover:text-white font-semibold text-sm transition-all duration-300 group ${isCollapsed ? 'justify-center' : ''}`}
                    >
                        <LogOut size={16} className="group-hover:-translate-x-1 transition-transform flex-shrink-0" />
                        {!isCollapsed && <span>Logout</span>}
                    </button>
                </div>
            </motion.aside>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] lg:hidden"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 180 }}
                            className="fixed inset-y-0 left-0 z-[110] w-[280px] bg-white lg:hidden flex flex-col p-6 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                    <img src={mylogo} alt="Mimitiinaa" className="h-6 w-auto object-contain flex-shrink-0" />
                                    <span className="text-lg font-black bg-gradient-to-r from-luxury-purple-dark to-luxury-purple bg-clip-text text-transparent tracking-tight truncate">Mimitiinaa</span>
                                </div>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-50 text-slate-400 flex-shrink-0 rounded-md">
                                    <X size={20} />
                                </button>
                            </div>
                            <nav className="space-y-2">
                                {sidebarItems.map((item, index) => (
                                    <Link
                                        key={index}
                                        to={item.path}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-4 px-6 py-3 transition-all text-sm font-medium ${location.pathname === item.path ? 'bg-slate-900 text-white' : 'text-slate-500 border border-slate-100 hover:bg-slate-50'}`}
                                    >
                                        <item.icon size={18} />
                                        <span>{item.label}</span>
                                    </Link>
                                ))}
                            </nav>
                            <div className="mt-auto pt-6 border-t border-slate-100">
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-4 px-6 py-3 w-full text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
                                >
                                    <LogOut size={18} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Content Area */}
            <main className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isCollapsed ? 'lg:ml-[70px]' : 'lg:ml-[260px]'}`}>
                {/* Header */}
                <header className={`h-16 sticky top-0 z-40 transition-all duration-300 px-3 sm:px-10 flex items-center justify-between
                    ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm' : 'bg-transparent'}`}
                >
                    <div className="flex items-center gap-2 sm:gap-4 w-full max-w-lg min-w-0">
                        <button
                            className="lg:hidden p-2 sm:p-3 text-slate-600 bg-white shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors flex-shrink-0 rounded-md"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu size={20} />
                        </button>
                        
                        {/* Mobile Logo in Header */}
                        <div className="lg:hidden flex items-center gap-2 pr-2 min-w-0">
                            <img src={mylogo} alt="Mimitiinaa" className="h-6 w-auto object-contain flex-shrink-0" />
                            <span className="text-base sm:text-lg font-black bg-gradient-to-r from-indigo-950 to-indigo-600 bg-clip-text text-transparent tracking-tight truncate">Mimitiinaa</span>
                        </div>

                        <div className="hidden sm:flex relative items-center group w-full">
                            <Search size={18} className="absolute left-4 text-slate-400 pointer-events-none group-focus-within:text-luxury-purple transition-colors" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full bg-white border border-slate-100 py-2.5 pl-12 pr-4 text-sm font-medium text-slate-900 shadow-sm placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-luxury-purple/10 focus:border-luxury-purple transition-all rounded-md"
                            />
                            <div className="absolute right-4 px-2 py-0.5 border border-slate-100 bg-slate-50 text-[10px] text-slate-400 font-semibold shadow-inner rounded-sm">⌘ K</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4 ml-auto pl-2 flex-shrink-0">
                        <div className="hidden md:flex flex-col items-end mr-2 text-right">
                            <span className="text-sm font-bold text-slate-900 leading-none">{user?.name}</span>
                            <span className="text-xs font-medium text-luxury-purple mt-1">Prime Admin</span>
                        </div>

                        <button className="relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-slate-400 bg-white border border-slate-100 hover:bg-slate-50 transition-all shadow-sm rounded-md">
                            <Bell size={18} />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 border-2 border-white"></span>
                        </button>

                        {/* Profile photo → navigates to Settings (Profile+Password page) */}
                        <button
                            onClick={() => navigate('/admin/settings')}
                            className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 border-2 border-white shadow-md overflow-hidden flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all"
                            title="Profile & Settings"
                        >
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Profile" className="w-full h-full rounded object-cover" />
                            ) : (
                                <UserCircle size={24} className="text-luxury-purple-light" />
                            )}
                        </button>
                    </div>
                </header>

                {/* App Viewport */}
                <div className="p-3 sm:p-6 lg:p-8 pb-16">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
