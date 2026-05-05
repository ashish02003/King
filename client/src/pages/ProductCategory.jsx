import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../utils/api';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaSearch, FaArrowLeft } from 'react-icons/fa';

const ProductCategory = () => {
    const { categoryName } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const queryTerm = searchParams.get('q') || '';

    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(queryTerm);

    const isSearch = categoryName === 'Search';

    const displayCategory = isSearch ? 'Search Results' :
        categoryName === 'mugs' ? 'Mug' :
            categoryName === 'sippers' ? 'Sippers / Bottles' :
                categoryName;

    useEffect(() => {
        const fetchTemplates = async () => {
            setLoading(true);
            try {
                const url = isSearch
                    ? `${API_BASE}/templates`
                    : `${API_BASE}/templates?category=${displayCategory}`;

                const { data } = await axios.get(url);
                setTemplates(data);
                if (isSearch) setSearchTerm(queryTerm);
            } catch (error) {
                console.error('Error fetching templates:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTemplates();
    }, [displayCategory, isSearch, queryTerm]);

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.category && t.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.variantNo && t.variantNo.includes(searchTerm))
    );

    return (
        <div className="min-h-screen bg-primary-dark pt-28 pb-20">
            {/* Header */}
            <div className="max-w-7xl mx-auto px-6 md:px-12 mb-16">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10">
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-[11px] font-semibold text-white/40 uppercase tracking-[0.15em] hover:text-gold transition-colors group"
                        >
                            <FaArrowLeft size={10} className="group-hover:-translate-x-1 transition-transform" />
                            <span>Back</span>
                        </button>
                        <h1 className="text-4xl md:text-5xl font-serif text-white">
                            {isSearch ? `Search Results` : `${displayCategory}`}
                        </h1>
                        <p className="text-white/40 text-sm max-w-lg">
                            {isSearch
                                ? `Showing results for "${searchTerm || queryTerm}"`
                                : `Browse our collection of ${displayCategory} designs.`
                            }
                        </p>
                    </div>

                    <div className="relative group max-w-sm w-full">
                        <input
                            type="text"
                            placeholder="Search designs..."
                            className="input-luxury w-full pr-11"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <FaSearch size={13} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-gold transition-colors" />
                    </div>
                </div>

                <div className="w-full h-[1px] bg-white/[0.06]"></div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <div className="w-10 h-10 border-3 border-gold border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gold text-[10px] font-semibold uppercase tracking-[0.3em]">Loading...</p>
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="luxury-card py-24 text-center space-y-6">
                        <p className="text-white/40 text-sm">No designs found matching your search.</p>
                        <button
                            onClick={() => navigate('/')}
                            className="btn-gold"
                        >
                            Browse All Designs
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-8">
                        {filteredTemplates.map((template) => (
                            <div
                                key={template._id}
                                className="group cursor-pointer"
                                onClick={() => navigate(`/product/${template._id}`)}
                            >
                                <div className="aspect-[4/5] rounded-luxury overflow-hidden border border-white/[0.06] group-hover:border-gold/20 transition-all duration-500 bg-primary-light relative mb-4">
                                    <img
                                        src={template.demoImageUrl || template.previewImage || template.backgroundImageUrl}
                                        alt={template.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-75 group-hover:opacity-100"
                                    />
                                    <div className="absolute top-3 left-3">
                                        <span className="text-[9px] font-semibold text-primary-dark bg-gold/90 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                            {template.category}
                                        </span>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-5">
                                        <span className="text-gold text-[10px] font-semibold uppercase tracking-wider">
                                            View Details →
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1 px-1">
                                    <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wider group-hover:text-gold transition-colors truncate">{template.name}</h3>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-lg font-serif text-gold">₹{Math.round((template.basePrice || 0) * (1 + (template.gst || 0) / 100))}</p>
                                        <p className="text-[10px] text-white/30">
                                            {template.shippingCharges === 0 ? 'Free delivery' : `+ ₹${template.shippingCharges}`}
                                        </p>
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
