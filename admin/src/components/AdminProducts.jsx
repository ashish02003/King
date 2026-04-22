import { useState, useEffect } from 'react';
import {
    Plus,
    Box,
    Star,
    MessageSquare,
    Edit3,
    Trash2,
    Search,
    Filter,
    ChevronRight,
    TrendingUp,
    LayoutGrid,
    AlertCircle,
    ArrowUpRight
} from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

const AdminProducts = () => {
    const [templates, setTemplates] = useState([]);
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const { data } = await axios.get(`${API_BASE}/templates`);
                setTemplates(data || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchTemplates();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Confirm permanent deletion of this blueprint?')) {
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                };
                await axios.delete(`${API_BASE}/templates/${id}`, config);
                setTemplates(templates.filter(t => t._id !== id));
            } catch (error) {
                console.error(error);
            }
        }
    };

    const uniqueCategories = [...new Set(templates.map(t => t.category))].filter(Boolean).sort();

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto space-y-10">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase mb-2 leading-none">Global Repository</h1>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Manage your design ecosystem and digital assets</p>
                </div>
                <Link
                    to="/admin/create-template"
                    className="flex items-center gap-2 bg-green-900 text-white px-8 py-3 rounded  font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 transition-all hover:-translate-y-1 active:scale-95"
                >
                    <Plus size={18} strokeWidth={3} /> Create Product
                </Link>
            </div>

            {/* Controls Bar */}
            <div className="bg-white p-1 shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-4">
                <div className="flex bg-slate-50 p-1.5 gap-1 w-full lg:w-auto overflow-x-auto no-scrollbar">
                    {['All', 'Premium', 'Active', 'Archived'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-8 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto px-2">
                    <div className="relative flex-1 lg:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Find templates by ID or tag..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 border-none py-3.5 pl-11 pr-4 text-[11px] font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white transition-all placeholder:text-slate-300 placeholder:uppercase placeholder:font-black placeholder:tracking-tighter"
                        />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-96 bg-slate-100 animate-pulse"></div>
                    ))}
                </div>
            ) : templates.length === 0 ? (
                <div className="bg-white p-32 text-center border-2 border-dashed border-slate-100 space-y-6">
                    <div className="w-20 h-20 bg-slate-50 flex items-center justify-center mx-auto mb-4">
                        <Box size={40} className="text-slate-100" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-black text-slate-900 uppercase">Registry Empty</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No active blueprints detected in global repository</p>
                    </div>
                    <Link to="/admin/create-template" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-black transition-all">
                        Initialize First <ChevronRight size={14} />
                    </Link>
                </div>
            ) : (
                <div className="space-y-20">
                    {uniqueCategories.map(category => {
                        const categoryTemplates = filteredTemplates.filter(t => t.category === category);
                        if (categoryTemplates.length === 0) return null;

                        return (
                            <motion.div
                                key={category}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="space-y-8"
                            >
                                <div className="flex items-center justify-between group">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">{category}</h2>
                                            <div className="h-px w-20 bg-slate-100 group-hover:w-40 transition-all duration-700"></div>
                                        </div>
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mt-2">{categoryTemplates.length} BLUESPRINTS ACTIVE</span>
                                    </div>
                                    <button className="text-[9px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                                        Product Ops <ArrowUpRight size={14} strokeWidth={3} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                    <AnimatePresence>
                                        {categoryTemplates.map((template, idx) => (
                                            <motion.div
                                                key={template._id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="group bg-white shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500 border border-slate-100 flex flex-col overflow-hidden relative"
                                            >
                                                {/* Header Badges */}
                                                <div className="absolute top-4 left-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="bg-slate-900 text-white text-[8px] font-black px-2.5 py-1 uppercase tracking-widest shadow-xl">
                                                        ID: {template._id.slice(-6)}
                                                    </span>
                                                </div>

                                                {/* Visual Repository */}
                                                <div className="relative h-56 bg-white overflow-hidden">
                                                    <div className="w-full h-full bg-slate-50 overflow-hidden p-2 group-hover:bg-slate-100 transition-colors duration-500">
                                                        <img
                                                            src={template.previewImage}
                                                            alt={template.name}
                                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                        />
                                                    </div>

                                                    {!template.demoImageUrl && (
                                                        <div className="absolute bottom-10 right-10 animate-pulse">
                                                            <div className="bg-amber-500 text-white p-2 shadow-lg border-4 border-white">
                                                                <AlertCircle size={14} strokeWidth={3} />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Data Points */}
                                                <div className="px-4 pt-2 flex-1 flex flex-col">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h3 className="font-black text-slate-900 text-base leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2 mb-1">
                                                                {template.name}
                                                            </h3>
                                                            <div className="flex items-center gap-1.5">
                                                                <Star size={10} className="text-amber-400 fill-amber-400" />
                                                                <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase">4.9 Prime Tech</span>
                                                            </div>
                                                        </div>
                                                        <div className="bg-indigo-50 text-indigo-600 p-2">
                                                            <LayoutGrid size={14} />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 border-t border-slate-50">
                                                        <div>
                                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Engagements</p>
                                                            <div className="flex items-center gap-1">
                                                                <TrendingUp size={10} className="text-emerald-500" />
                                                                <span className="text-sm font-black text-slate-800">1.2k</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Unit Index</p>
                                                            <span className="text-sm font-black text-slate-800 tracking-tighter">₹{template.basePrice}</span>
                                                        </div>
                                                    </div>

                                                    {/* Operations Interface */}
                                                    <div className="mt-auto flex gap-3 -pt-4 border-t border-slate-50">
                                                        <Link
                                                            to={`/admin/edit-template/${template._id}`}
                                                            className="flex-1 h-12 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-500 flex items-center justify-center gap-2 transition-all group/btn"
                                                        >
                                                            <Edit3 size={16} className="group-hover/btn:scale-110 transition-transform" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">Update</span>
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(template._id)}
                                                            className="w-12 h-12 bg-slate-50 hover:bg-red-500 hover:text-white text-slate-400 flex items-center justify-center transition-all"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AdminProducts;

