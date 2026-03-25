import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FiGrid,
    FiShoppingCart,
    FiBox,
    FiLayers,
    FiUsers,
    FiMessageSquare,
    FiTrendingUp,
    FiFileText,
    FiSettings,
    FiLogOut,
    FiSearch,
    FiBell,
    FiMenu
} from 'react-icons/fi';

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const sidebarItems = [
        { path: '/admin/dashboard', icon: <FiGrid />, label: 'Dashboard' },
        { path: '/admin/orders', icon: <FiShoppingCart />, label: 'Orders' },
        { path: '/admin/categories', icon: <FiLayers />, label: 'Categories' },
        { path: '/admin/products', icon: <FiBox />, label: 'Products' },
        { path: '/admin/users', icon: <FiUsers />, label: 'Customers' },
    ];

    const bottomItems = [
        { path: '/admin/settings', icon: <FiSettings />, label: 'Settings' },
    ];

    const NavItem = ({ item }) => {
        const isActive = location.pathname === item.path;
        return (
            <Link
                to={item.path}
                className={`flex items-center gap-4 px-6 py-3 my-1 transition-all
                    ${isActive 
                        ? 'bg-[#F2EFFD] text-[#6B46C1] border-r-4 border-[#6B46C1] font-[800]' 
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 font-semibold'
                    } ${isCollapsed ? 'justify-center border-r-0 rounded-xl mx-2 px-0 w-12 h-12' : ''}`}
                title={isCollapsed ? item.label : ''}
            >
                <span className={`text-xl ${isActive ? 'text-[#6B46C1]' : 'text-gray-400 group-hover:text-gray-600'}`}>
                    {item.icon}
                </span>
                {!isCollapsed && <span className="text-[14px]">{item.label}</span>}
            </Link>
        );
    };

    // Sidebar width logic
    const sidebarWidth = isCollapsed ? 'w-[80px]' : 'w-[260px]';

    return (
        <div className="flex bg-[#F8F9FB] min-h-screen font-sans">
            {/* Sidebar Desktop */}
            <aside 
                className={`hidden lg:flex flex-col bg-white border-r border-[#Eef0f4] fixed top-0 left-0 bottom-0 z-20 transition-all duration-300 ${sidebarWidth}`}
            >
                {/* Logo Area */}
                <div className={`h-20 flex items-center border-b border-transparent ${isCollapsed ? 'justify-center px-0' : 'px-8 justify-between'}`}>
                    {!isCollapsed && (
                        <h1 className="text-2xl font-[1000] text-gray-900 tracking-tight flex items-center gap-2">
                            <span className="text-[#6B46C1]"><FiBox /></span> Mimitiinaa
                        </h1>
                    )}
                    <button 
                        onClick={() => setIsCollapsed(!isCollapsed)} 
                        className={`p-2 text-gray-400 hover:text-[#6B46C1] hover:bg-gray-50 rounded-lg transition-all ${isCollapsed ? '' : ''}`}
                    >
                        <FiMenu size={22} />
                    </button>
                </div>

                {/* Main Nav with hidden scrollbar */}
                <nav className="flex-1 mt-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {sidebarItems.map((item, index) => (
                        <NavItem key={index} item={item} />
                    ))}
                    
                    <div className={`py-4 mt-4 border-t border-gray-50 ${isCollapsed ? 'px-2' : 'px-6'}`}>
                        {!isCollapsed && <p className="text-xs uppercase font-bold text-gray-300 tracking-widest mb-2 px-0">Others</p>}
                        
                        <Link to="#" className={`flex items-center gap-4 py-3 text-gray-500 hover:hover:text-gray-700 font-semibold transition-all group ${isCollapsed ? 'justify-center rounded-xl w-12 h-12 hover:bg-gray-50 mx-auto' : 'px-0'}`} title={isCollapsed ? "Messages" : ""}>
                            <span className="text-xl text-gray-400 group-hover:text-gray-600"><FiMessageSquare /></span>
                            {!isCollapsed && <span className="text-[14px]">Messages / Chat</span>}
                        </Link>
                        
                        <Link to="#" className={`flex items-center gap-4 py-3 text-gray-500 hover:hover:text-gray-700 font-semibold transition-all group ${isCollapsed ? 'justify-center rounded-xl w-12 h-12 hover:bg-gray-50 mx-auto' : 'px-0'}`} title={isCollapsed ? "Campaigns" : ""}>
                            <span className="text-xl text-gray-400 group-hover:text-gray-600"><FiTrendingUp /></span>
                            {!isCollapsed && <span className="text-[14px]">Marketing / Campaigns</span>}
                        </Link>
                        
                        <Link to="#" className={`flex items-center gap-4 py-3 text-gray-500 hover:hover:text-gray-700 font-semibold transition-all group ${isCollapsed ? 'justify-center rounded-xl w-12 h-12 hover:bg-gray-50 mx-auto' : 'px-0'}`} title={isCollapsed ? "Reports" : ""}>
                            <span className="text-xl text-gray-400 group-hover:text-gray-600"><FiFileText /></span>
                            {!isCollapsed && <span className="text-[14px]">Reports</span>}
                        </Link>
                    </div>
                </nav>

                {/* Bottom Nav */}
                <div className="mb-6 border-t border-gray-50 pt-2">
                    {bottomItems.map((item, index) => (
                        <NavItem key={index} item={item} />
                    ))}
                    <button 
                        onClick={handleLogout}
                        className={`flex items-center gap-4 py-3 my-1 text-left text-gray-500 hover:text-red-600 font-semibold transition-all group ${isCollapsed ? 'justify-center rounded-xl w-12 h-12 hover:bg-red-50 mx-auto mx-2' : 'px-6 w-full hover:bg-red-50'}`}
                        title={isCollapsed ? "Log out" : ""}
                    >
                        <span className="text-xl text-gray-400 group-hover:text-red-500"><FiLogOut /></span>
                        {!isCollapsed && <span className="text-[14px]">Log out</span>}
                    </button>
                </div>
            </aside>

            {/* Mobile Sidebar Backstop */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
            )}

            {/* Mobile Sidebar Panel (Always expanded when open) */}
            <aside className={`fixed inset-y-0 left-0 z-40 w-[260px] bg-white transform transition-transform duration-300 lg:hidden flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-20 flex items-center px-8 border-b border-[#Eef0f4] justify-between">
                    <h1 className="text-2xl font-[1000] text-gray-900 tracking-tight flex items-center gap-2">
                        <span className="text-[#6B46C1]"><FiBox /></span> Mimitiinaa
                    </h1>
                </div>
                <nav className="flex-1 mt-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {sidebarItems.map((item, index) => (
                        <Link
                            key={index}
                            to={item.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center gap-4 px-6 py-3 my-1 transition-all ${location.pathname === item.path ? 'bg-[#F2EFFD] text-[#6B46C1] border-r-4 border-[#6B46C1] font-[800]' : 'text-gray-500 hover:bg-gray-50 font-semibold'}`}
                        >
                            <span className={`text-xl ${location.pathname === item.path ? 'text-[#6B46C1]' : 'text-gray-400'}`}>{item.icon}</span>
                            <span className="text-[14px]">{item.label}</span>
                        </Link>
                    ))}
                    <div className="px-6 py-4 mt-4 border-t border-gray-50">
                        <p className="text-xs uppercase font-bold text-gray-300 tracking-widest mb-2">Others</p>
                        <Link to="#" className="flex items-center gap-4 py-3 text-gray-500 font-semibold transition-all"><span className="text-xl text-gray-400"><FiMessageSquare /></span><span className="text-[14px]">Messages / Chat</span></Link>
                        <Link to="#" className="flex items-center gap-4 py-3 text-gray-500 font-semibold transition-all"><span className="text-xl text-gray-400"><FiTrendingUp /></span><span className="text-[14px]">Marketing / Campaigns</span></Link>
                        <Link to="#" className="flex items-center gap-4 py-3 text-gray-500 font-semibold transition-all"><span className="text-xl text-gray-400"><FiFileText /></span><span className="text-[14px]">Reports</span></Link>
                    </div>
                </nav>
                <div className="mb-6 border-t border-gray-50 pt-2">
                    <Link to="/admin/settings" onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center gap-4 px-6 py-3 my-1 transition-all ${location.pathname.includes('/admin/settings') ? 'bg-[#F2EFFD] text-[#6B46C1] border-r-4 border-[#6B46C1] font-[800]' : 'text-gray-500 hover:bg-gray-50 font-semibold'}`}>
                        <span className={`text-xl ${location.pathname.includes('/admin/settings') ? 'text-[#6B46C1]' : 'text-gray-400'}`}><FiSettings /></span>
                        <span className="text-[14px]">Settings</span>
                    </Link>
                    
                    <button onClick={handleLogout} className="flex items-center gap-4 px-6 py-3 my-1 w-full text-left text-gray-500 hover:bg-red-50 hover:text-red-500 font-semibold transition-all">
                        <span className="text-xl text-gray-400"><FiLogOut /></span>
                        <span className="text-[14px]">Log out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[260px]'} z-10`}>
                {/* Header Navbar */}
                <header className="h-20 bg-white shadow-sm flex items-center justify-between px-4 sm:px-8 sticky top-0 z-10 w-full border-b border-gray-100">
                    
                    {/* Menu and Search Container */}
                    <div className="flex items-center gap-4 w-full max-w-xl">
                        {/* Mobile Menu Button */}
                        <button 
                            className="lg:hidden p-2 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <FiMenu size={22} />
                        </button>

                        {/* Search Bar */}
                        <div className="hidden sm:flex relative w-full">
                            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                            <input 
                                type="text" 
                                placeholder="Search anything..." 
                                className="w-full bg-gray-50 border-transparent rounded-full py-2.5 pl-12 pr-4 text-sm font-semibold text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6B46C1]/20 focus:border-[#6B46C1] transition-all"
                            />
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3 sm:gap-6 ml-auto">
                        <button className="text-gray-400 hover:text-[#6B46C1] hover:bg-gray-50 p-2 rounded-full transition-all">
                            <FiSettings className="text-xl" />
                        </button>
                        <button className="relative text-gray-400 hover:text-[#6B46C1] hover:bg-gray-50 p-2 rounded-full transition-all">
                            <FiBell className="text-xl" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border border-white rounded-full"></span>
                        </button>
                        <Link to="/admin/settings" className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center cursor-pointer hover:border-[#6B46C1] transition-all">
                            {user?.avatar ? (
                                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="font-bold text-gray-600">{user?.name?.charAt(0) || 'A'}</span>
                            )}
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-4 sm:p-8 pb-12 overflow-x-hidden min-h-[calc(100vh-80px)]">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;

