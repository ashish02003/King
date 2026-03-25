import { useState, useEffect } from 'react';
import { FaPlus, FaBoxOpen, FaStar, FaRegComment, FaEdit, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../utils/api';

const AdminProducts = () => {
    const [templates, setTemplates] = useState([]);
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('All');

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const { data } = await axios.get(`${API_BASE}/templates`);
                setTemplates(data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchTemplates();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this template?')) {
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
                alert('Error deleting template');
            }
        }
    };

    const uniqueCategories = [...new Set(templates.map(t => t.category))].filter(Boolean).sort();

    return (
        <div className="max-w-7xl mx-auto">
            
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 mt-2">
                <div>
                    <h1 className="text-2xl font-[1000] text-gray-900 tracking-tight">Product Catalog</h1>
                    <p className="text-sm font-semibold text-gray-400 mt-1">Manage all your store products from here</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Link 
                        to="/admin/create-template" 
                        className="bg-[#6B46C1] text-white px-5 py-2.5 rounded-xl hover:bg-[#553C9A] font-bold shadow-md shadow-purple-200 transition-all flex items-center gap-2"
                    >
                        <FaPlus /> Create New Product
                    </Link>
                </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="bg-white rounded-3xl p-3 shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex bg-gray-50 rounded-2xl p-1 gap-1 w-full md:w-auto">
                    {['All', 'Popular', 'Recent'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                                activeTab === tab 
                                ? 'bg-white text-gray-900 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                
                {/* Search in List (Visual) */}
                <div className="relative w-full md:w-64">
                    <input 
                        type="text" 
                        placeholder="Search products..." 
                        className="w-full bg-gray-50 border-transparent rounded-xl py-2 pl-4 pr-10 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#6B46C1]/20 focus:bg-white transition-all"
                    />
                    <svg className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
            </div>

            {/* Products Grouped by Category */}
            {templates.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 border-dashed">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaBoxOpen className="text-gray-300 text-2xl" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No products yet</h3>
                    <p className="text-gray-400 text-sm font-semibold mb-6">Create your first product to start selling.</p>
                    <Link to="/admin/create-template" className="inline-block bg-[#6B46C1] text-white px-6 py-2.5 rounded-xl font-bold shadow-sm hover:-translate-y-0.5 transition-all">
                        Add Product
                    </Link>
                </div>
            ) : (
                <div className="space-y-12">
                    {uniqueCategories.map(category => {
                        const categoryTemplates = templates.filter(t => t.category === category);
                        if (categoryTemplates.length === 0) return null;

                        return (
                            <div key={category} className="mb-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase">{category}</h2>
                                    <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-2 py-0.5 rounded uppercase">{categoryTemplates.length} items</span>
                                    <div className="h-px bg-gray-100 flex-1 ml-4"></div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {categoryTemplates.map(template => (
                                        <div key={template._id} className="bg-white rounded-[1.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 flex flex-col group overflow-hidden">
                                            
                                            {/* Image Box */}
                                            <div className="relative h-48 bg-gray-50 w-full overflow-hidden">
                                                <img src={template.previewImage} alt={template.name} className="w-full h-full object-cover mix-blend-multiply opacity-95 group-hover:scale-105 transition-transform duration-500" />
                                                
                                                {/* Overlay Badges */}
                                                <div className="absolute top-3 left-3 flex gap-2">
                                                    <span className="bg-white/90 backdrop-blur text-gray-900 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm">
                                                        {template.category}
                                                    </span>
                                                </div>

                                                {!template.demoImageUrl && (
                                                    <div className="absolute top-3 right-3 bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-sm uppercase">
                                                        No Demo
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content Info */}
                                            <div className="p-5 flex-1 flex flex-col">
                                                <h3 className="font-bold text-gray-900 text-base mb-1 truncate" title={template.name}>
                                                    {template.name}
                                                </h3>
                                                <p className="text-[11px] font-semibold text-gray-400 mb-3">{template.category} Edition</p>

                                                {/* Rating (Mock functionality to match design) */}
                                                <div className="flex items-center gap-1 mb-4">
                                                    <div className="flex text-amber-400 text-[10px] gap-0.5">
                                                        <FaStar /><FaStar /><FaStar /><FaStar /><FaStar className="text-gray-300" />
                                                    </div>
                                                    <div className="w-1 h-1 rounded-full bg-gray-300 mx-1"></div>
                                                    <div className="flex items-center text-[10px] font-bold text-gray-400 gap-1.5">
                                                        <FaRegComment className="mt-[-1px]" /> 24
                                                    </div>
                                                </div>

                                                {/* Mock Stats (Sales/Revenue) */}
                                                <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-4 mb-4">
                                                    <div>
                                                        <p className="text-[15px] font-[900] text-gray-800 leading-none mb-1">128</p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Total Sales</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[15px] font-[900] text-gray-800 leading-none mb-1">
                                                            ₹{(template.basePrice * 23).toLocaleString()}
                                                        </p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Revenue</p>
                                                    </div>
                                                </div>

                                                {/* Price & Actions Row */}
                                                <div className="mt-auto flex items-end justify-between border-t border-gray-50 pt-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xl font-[1000] text-gray-900 tracking-tight">₹{template.basePrice}</span>
                                                        <span className="text-xs font-bold text-gray-400 line-through">₹{template.basePrice + 199}</span>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex gap-1.5">
                                                        <Link
                                                            to={`/admin/edit-template/${template._id}`}
                                                            className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-[#F2EFFD] text-gray-500 hover:text-[#6B46C1] flex items-center justify-center transition-colors"
                                                            title="Edit Product"
                                                        >
                                                            <FaEdit size={14} />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(template._id)}
                                                            className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-500 flex items-center justify-center transition-colors"
                                                            title="Delete Product"
                                                        >
                                                            <FaTrash size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            
        </div>
    );
};

export default AdminProducts;

