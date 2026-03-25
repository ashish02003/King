import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../utils/api';
import { useParams, useNavigate } from 'react-router-dom';
import { FaSearch, FaChevronRight, FaShoppingCart, FaMagic, FaArrowLeft } from 'react-icons/fa';

const ProductCategory = () => {
    const { categoryName } = useParams();
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const displayCategory = categoryName === 'mugs' ? 'Mug' :
        categoryName === 'sippers' ? 'Sippers / Bottles' :
            categoryName;

    useEffect(() => {
        const fetchTemplates = async () => {
            setLoading(true);
            try {
                const { data } = await axios.get(`${API_BASE}/templates?category=${displayCategory}`);
                setTemplates(data);
            } catch (error) {
                console.error('Error fetching templates:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTemplates();
    }, [displayCategory]);

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.variantNo && t.variantNo.includes(searchTerm))
    );

    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Header Section */}
            <div className="bg-luxury-cream py-12 px-4 border-b border-luxury-cream/50 relative">
                <div className="container mx-auto relative">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="lg:absolute left-0 top-1/2 lg:-translate-y-1/2 mb-6 lg:mb-0 flex items-center gap-2 text-[10px] font-black text-luxury-charcoal uppercase tracking-widest hover:text-luxury-gold transition-colors group"
                    >
                        <div className="w-8 h-8 rounded-full border border-luxury-gold/20 flex items-center justify-center group-hover:border-luxury-gold transition-all bg-white shadow-sm">
                            <FaArrowLeft size={10} />
                        </div>
                        <span className="hidden sm:inline">Back to Shop</span>
                    </button>

                    <div className="text-center">
                        <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-4">
                            {displayCategory} Collection
                        </h1>
                        <p className="text-gray-500 font-medium max-w-2xl mx-auto mb-8">
                            Customize your {displayCategory} with your favorite photos and designs. High-quality printing with worldwide shipping.
                        </p>

                        {/* Search Bar */}
                        <div className="max-w-xl mx-auto relative group">
                            <input
                                type="text"
                                placeholder={`Search ${displayCategory}...`}
                                className="w-full bg-white border-2 border-luxury-cream/80 rounded-full py-4 px-6 pr-14 shadow-sm focus:border-luxury-gold focus:ring-4 focus:ring-luxury-gold/10 transition-all outline-none font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-luxury-gold transition-colors">
                                <FaSearch size={20} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-l-4 border-luxury-gold mb-4"></div>
                        <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-xs">Loading {displayCategory}...</p>
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                        <p className="text-gray-400 font-bold uppercase tracking-widest">No {displayCategory} found for your search.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {filteredTemplates.map((template) => (
                            <div key={template._id} className="group relative">
                                {/* Product Card */}
                                <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 transition-all duration-300 hover:shadow-xl hover:border-luxury-gold/50 hover:-translate-y-1">
                                    <div className="aspect-square overflow-hidden relative bg-gray-50">
                                        <img
                                            src={template.demoImageUrl || template.previewImage || template.backgroundImageUrl}
                                            alt={template.name}
                                            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://placehold.co/400x400/f8fafc/BFA75D?text=' + template.name.replace(' ', '+');
                                            }}
                                        />
                                    </div>

                                    <div className="p-4 text-center">
                                        <h3 className="text-sm font-bold text-gray-800 mb-2 line-clamp-2 min-h-[2.5rem]">{template.name}</h3>
                                        <div className="mb-3">
                                            <p className="text-lg font-black text-luxury-green m-0">₹{template.basePrice + (template.packingCharges || 0)}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                                {template.shippingCharges === 0 ? 'Free Delivery' : `+ ₹${template.shippingCharges} Shipping`}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/product/${template._id}`)}
                                            className="w-full bg-[#2D5A27] text-white py-2 rounded-lg font-bold text-xs uppercase tracking-wide hover:bg-[#23471e] transition-all"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductCategory;
