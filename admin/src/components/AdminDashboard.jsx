import { useState, useEffect, useCallback } from 'react';
import {
    Plus,
    Layers,
    Box,
    TrendingUp,
    Clock,
    CheckCircle2,
    MoreVertical,
    Edit3,
    Trash2,
    ArrowUpRight,
    ShoppingBag,
    Users,
    IndianRupee,
    Package,
    RefreshCw,
    Circle
} from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Order status colour map ─── */
const STATUS_COLOR = {
    'Order Confirmed': 'bg-blue-100 text-blue-600',
    'Packed':           'bg-amber-100 text-amber-600',
    'Shipped':          'bg-indigo-100 text-indigo-600',
    'Delivered':        'bg-emerald-100 text-emerald-600',
    'Cancelled':        'bg-red-100 text-red-600',
};

const AdminDashboard = () => {
    const { user } = useAuth();

    const [templates,   setTemplates]   = useState([]);
    const [orders,      setOrders]      = useState([]);
    const [users,       setUsers]       = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [refreshing,  setRefreshing]  = useState(false);

    const authHeaders = { headers: { Authorization: `Bearer ${user?.token}` } };

    const fetchAll = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const [tRes, oRes, uRes] = await Promise.all([
                axios.get(`${API_BASE}/templates`),
                axios.get(`${API_BASE}/orders`, authHeaders),
                axios.get(`${API_BASE}/auth/users`, authHeaders),
            ]);
            setTemplates(tRes.data  || []);
            setOrders(oRes.data     || []);
            setUsers(uRes.data      || []);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Dashboard fetch error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.token]);

    /* initial load */
    useEffect(() => { fetchAll(); }, [fetchAll]);

    /* Auto-refresh every 60 seconds */
    useEffect(() => {
        const id = setInterval(() => fetchAll(true), 60_000);
        return () => clearInterval(id);
    }, [fetchAll]);

    /* ─── Derived stats ─── */
    const totalRevenue = orders
        .filter(o => o.isPaid)
        .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

    const pendingOrders = orders.filter(o =>
        o.orderStatus === 'Order Confirmed' || o.orderStatus === 'Packed'
    ).length;

    const deliveredOrders = orders.filter(o => o.orderStatus === 'Delivered').length;

    const uniqueCategories = [...new Set(templates.map(t => t.category))].length;

    /* newest 5 orders for the activity feed */
    const recentOrders = orders.slice(0, 5);

    /* ─── Template delete ─── */
    const handleDelete = async (id) => {
        if (!window.confirm('Delete this template?')) return;
        try {
            await axios.delete(`${API_BASE}/templates/${id}`, authHeaders);
            setTemplates(prev => prev.filter(t => t._id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    /* ─── Stat Card Component ─── */
    const StatCard = ({ title, value, icon: Icon, color, sub, live }) => (
        <motion.div
            whileHover={{ y: -2 }}
            className="bg-white p-4 border border-slate-100 shadow-sm flex flex-col gap-4 relative overflow-hidden"
        >
            {live && (
                <span className="absolute top-3 right-3 flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                </span>
            )}
            <div className="flex justify-between items-start">
                <div className={`w-12 h-12 ${color} flex items-center justify-center text-white shadow-lg shadow-current/10 rounded-lg`}>
                    <Icon size={22} />
                </div>
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-2xl font-black text-slate-800 leading-none tracking-tighter">{value}</h3>
                {sub && <p className="text-[10px] font-bold text-slate-400 mt-1">{sub}</p>}
            </div>
        </motion.div>
    );

    /* ─── Skeleton placeholder ─── */
    const SkeletonCard = () => (
        <div className="h-36 bg-slate-100 animate-pulse" />
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-10">

            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-6">
                <div>
                    <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tighter uppercase">Workspace Overview</h1>
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
                        <Clock size={12} />
                        <span className="hidden sm:inline">
                            {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
                        </span>
                        <span className="sm:hidden">
                            {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Loading...'}
                        </span>
                        {refreshing && <RefreshCw size={10} className="animate-spin ml-1 text-indigo-400" />}
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => fetchAll(true)}
                        disabled={refreshing}
                        className="flex items-center gap-1.5 border border-slate-200 bg-white text-slate-500 px-2.5 py-1.5 text-xs font-bold hover:border-indigo-400 hover:text-indigo-600 transition-all disabled:opacity-50 flex-shrink-0"
                        title="Refresh data"
                    >
                        <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                    <Link
                        to="/admin/create-template"
                        className="flex items-center gap-1.5 bg-green-900 text-white px-3 py-2 rounded font-bold transition-all hover:-translate-y-0.5 active:scale-95 text-xs sm:text-sm flex-1 sm:flex-none justify-center sm:justify-start"
                    >
                        <Plus size={16} />
                        <span className="sm:hidden">New Template</span>
                        <span className="hidden sm:inline">Create New Template</span>
                    </Link>
                </div>
            </div>

            {/* ── Real-Time Stats Grid: 2 cols mobile → 3 cols tablet → 6 cols desktop ── */}
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-pulse">
                    {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <StatCard title="Total Products"  value={templates.length}                              icon={Box}         color="bg-indigo-600" sub={`${uniqueCategories} categories`} live />
                    <StatCard title="Total Orders"    value={orders.length}                                 icon={ShoppingBag} color="bg-amber-500"  sub={`${pendingOrders} pending`}      live />
                    <StatCard title="Revenue"         value={`₹${totalRevenue.toLocaleString()}`}          icon={IndianRupee} color="bg-emerald-500" sub="From paid orders"               live />
                    <StatCard title="Customers"       value={users.filter(u => u.role !== 'admin').length} icon={Users}       color="bg-blue-500"   sub="Registered accounts"             live />
                    <StatCard title="Delivered"       value={deliveredOrders}                               icon={CheckCircle2} color="bg-teal-500"  sub="Completed orders"                live />
                    <StatCard title="Categories"      value={uniqueCategories}                              icon={Layers}      color="bg-violet-500" sub={`${templates.length} products`}  live />
                </div>
            )}

            {/* ── Two-column layout: stacked on mobile, side-by-side on large ── */}
            {!loading && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

                    {/* Recent Orders feed */}
                    <div className="lg:col-span-2 bg-white border border-slate-100 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-50">
                            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Recent Orders</h2>
                            <Link to="/admin/orders" className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1 uppercase tracking-widest whitespace-nowrap">
                                View All <ArrowUpRight size={12} />
                            </Link>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {recentOrders.length === 0 ? (
                                <p className="text-center text-slate-300 text-sm font-bold py-10">No orders yet</p>
                            ) : recentOrders.map((order, idx) => (
                                <motion.div
                                    key={order._id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.04 }}
                                    className="flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-slate-50/60 transition-colors"
                                >
                                    <div className="w-8 h-8 bg-indigo-50 flex items-center justify-center flex-shrink-0">
                                        <Package size={14} className="text-indigo-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-slate-900 truncate">{order.user?.name || 'Customer'}</p>
                                        <p className="text-[10px] text-slate-400 font-bold truncate">#{order._id.slice(-8).toUpperCase()} · {new Date(order.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-xs sm:text-sm font-black text-slate-800">₹{order.totalPrice?.toLocaleString()}</p>
                                        <span className={`text-[9px] font-black px-1.5 py-0.5 uppercase tracking-wide ${STATUS_COLOR[order.orderStatus] || 'bg-slate-100 text-slate-500'}`}>
                                            {order.orderStatus}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Quick metrics panel — stacks below on mobile */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                        {/* Order status breakdown */}
                        <div className="bg-white border border-slate-100 shadow-sm p-4 sm:p-6">
                            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Order Status</h2>
                            <div className="space-y-3">
                                {[
                                    { label: 'Order Confirmed', color: 'bg-blue-500' },
                                    { label: 'Packed',          color: 'bg-amber-500' },
                                    { label: 'Shipped',         color: 'bg-indigo-500' },
                                    { label: 'Delivered',       color: 'bg-emerald-500' },
                                    { label: 'Cancelled',       color: 'bg-red-400'   },
                                ].map(({ label, color }) => {
                                    const count = orders.filter(o => o.orderStatus === label).length;
                                    const pct = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;
                                    return (
                                        <div key={label}>
                                            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                                                <span className="truncate mr-2">{label}</span>
                                                <span className="text-slate-800 flex-shrink-0">{count}</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${pct}%` }}
                                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                                    className={`h-full ${color}`}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Top products */}
                        <div className="bg-white border border-slate-100 shadow-sm p-4 sm:p-6">
                            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Top Products</h2>
                            <div className="space-y-3">
                                {templates.slice(0, 4).map((t, i) => (
                                    <div key={t._id} className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-slate-300 w-4 flex-shrink-0">{i + 1}</span>
                                        <div className="w-8 h-8 bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 flex-shrink-0">
                                            {t.previewImage ? <img src={t.previewImage} alt={t.name} className="w-full h-full object-cover" /> : <Box size={14} className="text-slate-300" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-slate-800 truncate">{t.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold">₹{t.basePrice}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Recent Deployments product grid ── */}
            <section className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-base sm:text-xl font-black text-slate-900 uppercase tracking-tight">Recent Deployments</h2>
                    <Link to="/admin/products" className="text-xs font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1 uppercase tracking-widest whitespace-nowrap">
                        <span className="hidden sm:inline">View All Repository</span>
                        <span className="sm:hidden">View All</span>
                        <ArrowUpRight size={13} />
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
                        {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-100" />)}
                    </div>
                ) : templates.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-slate-100 p-12 sm:p-20 text-center space-y-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 flex items-center justify-center mx-auto">
                            <Box size={32} className="text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No deployments found.</p>
                        <Link to="/admin/create-template" className="inline-block text-indigo-600 font-black text-xs uppercase tracking-widest border-b-2 border-indigo-600 pb-1">Initialize First Template</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                        {templates.map(template => (
                            <motion.div
                                key={template._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 overflow-hidden flex flex-col"
                            >
                                <div className="relative aspect-video overflow-hidden">
                                    <img src={template.previewImage} alt={template.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                    <div className="absolute top-3 left-3">
                                        <span className="bg-white/90 backdrop-blur text-[10px] font-black px-2 py-0.5 shadow-sm text-slate-700 uppercase tracking-widest">{template.category}</span>
                                    </div>
                                    {!template.demoImageUrl && (
                                        <div className="absolute top-3 right-3">
                                            <span className="bg-amber-500 text-white text-[8px] font-black px-2 py-1 uppercase shadow-lg">Action Required</span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-3 flex flex-col flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight mb-0.5 truncate">{template.name}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {template._id.slice(-8)}</p>
                                        </div>
                                        <button className="p-1 hover:bg-slate-50 text-slate-300 flex-shrink-0 ml-1">
                                            <MoreVertical size={15} />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                                        <div className="text-sm font-black text-slate-900 tracking-tighter">₹{template.basePrice}</div>
                                        <div className="flex gap-1.5">
                                            <Link to={`/admin/edit-template/${template._id}`} className="w-7 h-7 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all" title="Edit">
                                                <Edit3 size={13} />
                                            </Link>
                                            <button onClick={() => handleDelete(template._id)} className="w-7 h-7 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white transition-all" title="Delete">
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default AdminDashboard;
