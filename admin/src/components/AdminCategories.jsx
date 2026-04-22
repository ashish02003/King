import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
    Trash2,
    Plus,
    Edit3,
    Layers,
    UploadCloud,
    Archive,
    Maximize2,
    Info,
    X,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { API_BASE } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [name, setName] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [description, setDescription] = useState('');
    const [stock, setStock] = useState(0);
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const fetchProducts = async () => {
        try {
            const { data } = await axios.get(`${API_BASE}/categories`);
            setProducts(data || []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load products');
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const resetForm = () => {
        setName('');
        setImageFile(null);
        setDescription('');
        setStock(0);
        setWidth(0);
        setHeight(0);
        setEditId(null);
        if (document.getElementById('fileInput')) {
            document.getElementById('fileInput').value = '';
        }
    };

    const handleEdit = (prod) => {
        setEditId(prod._id);
        setName(prod.name);
        setDescription(prod.description || '');
        setStock(prod.stock || 0);
        setWidth(prod.dimensions?.width || 0);
        setHeight(prod.dimensions?.height || 0);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name) return toast.error('Product name is required');

        setLoading(true);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                    'Content-Type': 'multipart/form-data'
                }
            };

            const formData = new FormData();
            formData.append('name', name);
            formData.append('description', description);
            formData.append('stock', stock);
            formData.append('width', width);
            formData.append('height', height);
            if (imageFile) {
                formData.append('image', imageFile);
            }

            if (editId) {
                await axios.put(`${API_BASE}/categories/${editId}`, formData, config);
                toast.success('Product protocol updated!');
            } else {
                await axios.post(`${API_BASE}/categories`, formData, config);
                toast.success('New product initialized!');
            }

            resetForm();
            fetchProducts();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Protocol failure during save');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure? This will wipe the product data.')) return;

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            };
            await axios.delete(`${API_BASE}/categories/${id}`, config);
            toast.success('Product purged');
            fetchProducts();
        } catch (error) {
            toast.error('Purge failed');
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-xl font-black text-slate-700 tracking-tighter uppercase mb-2 leading-none">Category Infrastructure</h1>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Configure global category segmentation & resource logic</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
                {/* Form Section */}
                <motion.div
                    layout
                    className="xl:col-span-4 space-y-6"
                >
                    <div className="bg-white p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                      

                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-md font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                {editId ? <Edit3 size={20} className="text-indigo-600" /> : <Plus size={20} className="text-indigo-600" />}
                                {editId ? 'Modify Category' : 'New Category'}
                            </h2>
                            {editId && (
                                <button onClick={resetForm} className="p-2 hover:bg-red-50 text-red-400 transition-colors">
                                    <X size={18} />
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border-none py-3.5 px-4 text-xs font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all outline-none"
                                    placeholder="e.g. CORE ELECTRONICS"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Universal Asset Upload</label>
                                <div className="group relative">
                                    <input
                                        id="fileInput"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => setImageFile(e.target.files[0])}
                                    />
                                    <label
                                        htmlFor="fileInput"
                                        className="flex flex-col items-center justify-center border-2 border-dashed border-slate-100 py-8 cursor-pointer hover:bg-indigo-50/30 hover:border-indigo-200 transition-all"
                                    >
                                        <UploadCloud size={32} className="text-slate-200 group-hover:text-indigo-400 transition-colors mb-2" />
                                        <span className="text-[10px] font-black text-slate-400 group-hover:text-indigo-600 uppercase tracking-widest leading-none">
                                            {imageFile ? imageFile.name : 'Select Data Asset'}
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Stock</label>
                                    <div className="relative">
                                        <Archive size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                        <input
                                            type="number"
                                            className="w-full bg-slate-50 border-none py-3.5 pl-10 pr-4 text-xs font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all outline-none"
                                            value={stock}
                                            onChange={(e) => setStock(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5 opacity-50">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">System ID</label>
                                    <input disabled className="w-full bg-slate-100 border-none py-3.5 px-4 text-[10px] font-black uppercase text-slate-400" placeholder="AUTO-GEN" />
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 space-y-4">
                                <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                                    <Maximize2 size={12} /> Render Logic (px)
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="number"
                                        placeholder="W"
                                        className="w-full bg-white border-none py-2.5 px-3 text-[10px] font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                                        value={width}
                                        onChange={(e) => setWidth(e.target.value)}
                                    />
                                    <input
                                        type="number"
                                        placeholder="H"
                                        className="w-full bg-white border-none py-2.5 px-3 text-[10px] font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                                        value={height}
                                        onChange={(e) => setHeight(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Functional Log</label>
                                <textarea
                                    className="w-full bg-slate-50 border-none py-3.5 px-4 text-xs font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all outline-none h-24"
                                    placeholder="Internal descriptor..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`group w-full py-4 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 disabled:opacity-50
                                    ${editId ? 'bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700' : 'bg-slate-900 shadow-slate-100 hover:bg-black'}`}
                            >
                                {loading ? 'Saving...' : (editId ? 'Update Category' : 'Add Category')}
                            </button>
                        </form>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-100 p-6 flex items-start gap-4">
                        <Info size={18} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] font-bold text-indigo-400 leading-relaxed uppercase tracking-wider">
                            Products define the canvas geometry for individual product templates. Ensure correct aspect ratios for optimal user experience.
                        </p>
                    </div>
                </motion.div>

                {/* List Section */}
                <div className="xl:col-span-8 space-y-6">
                    <div className="bg-white shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                            <h2 className="text-md font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                <Layers size={20} className="text-slate-300" /> Active Categories
                            </h2>
                            <span className="text-[10px] font-black bg-slate-50 text-slate-400 px-3 py-1 uppercase tracking-widest">
                                {products.length} Nodes
                            </span>
                        </div>

                        <div className="p-2 overflow-x-auto custom-scrollbar">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Blueprint</th>
                                        <th>Metrics</th>
                                        <th className="text-center">State</th>
                                        <th className="text-right px-10">Operations</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    <AnimatePresence mode="popLayout">
                                        {products.map((prod, idx) => (
                                            <motion.tr
                                                key={prod._id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className={`group hover:bg-indigo-50/30 transition-all ${editId === prod._id ? 'bg-indigo-50/50' : ''}`}
                                            >
                                                <td>
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 bg-white border border-slate-100 shadow-sm flex items-center justify-center p-1 group-hover:scale-105 transition-transform duration-500 overflow-hidden flex-shrink-0">
                                                            {prod.image ? (
                                                                <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Layers size={18} className="text-slate-100" />
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase leading-tight">{prod.name}</span>
                                                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mt-1 truncate max-w-[150px]">{prod.description || 'NO DESCRIPTOR'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-900 uppercase tracking-tighter">
                                                            <Archive size={10} className="text-slate-300" /> {prod.stock}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                            <Maximize2 size={10} className="text-slate-200" /> {prod.dimensions?.width}×{prod.dimensions?.height}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-center px-4">
                                                    <div className="flex flex-col items-center">
                                                        <div className={`w-2 h-2 mb-1 ${prod.stock > 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></div>
                                                        <span className={`text-[8px] font-black uppercase tracking-widest ${prod.stock > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                            {prod.stock > 0 ? 'Operational' : 'Depleted'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="text-right px-10">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEdit(prod)}
                                                            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                                                            title="Edit Configuration"
                                                        >
                                                            <Edit3 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(prod._id)}
                                                            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                                            title="Wipe Data"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                            {products.length === 0 && (
                                <div className="py-20 text-center space-y-4">
                                    <div className="w-16 h-16 bg-slate-50 flex items-center justify-center mx-auto">
                                        <Layers size={32} className="text-slate-100" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Global Registry Empty</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminProducts; // Named as per current usage, but labels are updated
