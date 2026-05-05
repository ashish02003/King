import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../utils/api';
import { FaChevronRight, FaPlus, FaMinus, FaMagic, FaShieldAlt, FaTruck, FaBox } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TemplateDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart, setBuyNowItem, buyNowItem } = useCart();
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [addingToCart, setAddingToCart] = useState(false);
    const [selectedImage, setSelectedImage] = useState('');
    const [zoomState, setZoomState] = useState({ isVisible: false, x: 0, y: 0 });

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setZoomState({ isVisible: true, x, y });
    };

    useEffect(() => {
        const fetchTemplate = async () => {
            setLoading(true);
            try {
                const { data } = await axios.get(`${API_BASE}/templates/${id}`);
                setTemplate(data);
                setQuantity(data.moq || 1);
                setSelectedImage(data.demoImageUrl || data.previewImage || data.backgroundImageUrl);
            } catch (err) { setError('Product not found'); } finally { setLoading(false); }
        };
        if (id) fetchTemplate();
        window.scrollTo(0, 0);
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-primary-dark flex items-center justify-center">
            <div className="w-10 h-10 border-3 border-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (error || !template) return (
        <div className="min-h-screen bg-primary-dark flex flex-col items-center justify-center text-center p-6 space-y-6">
            <h1 className="text-3xl font-serif text-white">Product Not Found</h1>
            <Link to="/" className="btn-gold">Back to Home</Link>
        </div>
    );

    const defaultImage = template.demoImageUrl || template.previewImage || template.backgroundImageUrl;
    const allImages = [defaultImage, ...(template.galleryImages || [])].filter(Boolean);

    return (
        <div className="min-h-screen bg-primary-dark pt-28 pb-20">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2.5 text-[11px] font-medium text-white/40 mb-10 overflow-x-auto whitespace-nowrap">
                    <Link to="/" className="hover:text-gold transition-colors">Home</Link>
                    <FaChevronRight size={7} className="text-white/15" />
                    <Link to={`/category/${template.category}`} className="hover:text-gold transition-colors">{template.category}</Link>
                    <FaChevronRight size={7} className="text-white/15" />
                    <span className="text-white/60 truncate max-w-[200px]">{template.name}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                    {/* Image Gallery */}
                    <div className="lg:col-span-7 space-y-5">
                        <div className="flex flex-col md:flex-row gap-4">
                            {allImages.length > 1 && (
                                <div className="flex md:flex-col gap-3 order-2 md:order-1 overflow-x-auto md:overflow-visible">
                                    {allImages.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedImage(img)}
                                            className={`w-16 h-16 rounded-luxury overflow-hidden border-2 transition-all flex-shrink-0 ${selectedImage === img ? 'border-gold shadow-glow' : 'border-transparent opacity-40 hover:opacity-70 bg-white/[0.03]'}`}
                                        >
                                            <img src={img} className="w-full h-full object-cover" alt="Detail" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div
                                className="flex-1 aspect-square bg-primary-light rounded-luxury border border-white/[0.06] overflow-hidden relative group cursor-crosshair order-1 md:order-2"
                                onMouseMove={handleMouseMove}
                                onMouseLeave={() => setZoomState({ ...zoomState, isVisible: false })}
                            >
                                <img
                                    src={selectedImage}
                                    alt={template.name}
                                    className="w-full h-full object-cover transition-transform duration-500"
                                    style={{ transformOrigin: `${zoomState.x}% ${zoomState.y}%`, transform: zoomState.isVisible ? 'scale(1.5)' : 'scale(1)' }}
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="pt-8 border-t border-white/[0.06] space-y-6">
                            <div className="space-y-3">
                                <h3 className="text-[11px] font-semibold text-gold uppercase tracking-[0.2em]">Description</h3>
                                <p className="text-white/50 text-base leading-relaxed font-light">
                                    {template.description || "A premium quality product designed for personalization, combining timeless elegance with modern craftsmanship."}
                                </p>
                            </div>

                            {template.benefits?.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-[11px] font-semibold text-gold uppercase tracking-[0.2em]">Highlights</h3>
                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {template.benefits.map((benefit, i) => (
                                            <li key={i} className="flex items-center gap-2.5 text-sm text-white/60">
                                                <div className="w-1 h-1 rounded-full bg-gold"></div>
                                                {benefit}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Purchase Panel */}
                    <div className="lg:col-span-5">
                        <div className="luxury-card p-8 md:p-10 space-y-8 sticky top-28">
                            <div className="space-y-3">
                                <h1 className="text-3xl md:text-4xl font-serif text-white tracking-tight leading-tight">{template.name}</h1>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-3xl font-serif text-gold">₹{(template.basePrice * (1 + (template.gst || 0) / 100)).toLocaleString()}</span>
                                    <span className="text-[11px] text-white/30 italic">Inclusive of taxes</span>
                                </div>
                            </div>

                            {/* Product Details */}
                            <div className="space-y-0">
                                <div className="flex justify-between items-center py-3.5 border-b border-white/[0.06]">
                                    <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Category</span>
                                    <span className="text-white text-sm font-medium">{template.category}</span>
                                </div>
                                <div className="flex justify-between items-center py-3.5 border-b border-white/[0.06]">
                                    <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Min Order</span>
                                    <span className="text-white text-sm font-medium">{template.moq || 1}</span>
                                </div>
                                <div className="flex justify-between items-center py-3.5">
                                    <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Shipping</span>
                                    <span className="text-gold text-sm font-medium">{template.shippingCharges === 0 ? 'Free' : `₹${template.shippingCharges}`}</span>
                                </div>
                            </div>

                            {/* Quantity & Actions */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3.5 bg-primary-light rounded-luxury border border-white/[0.06]">
                                    <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Quantity</span>
                                    <div className="flex items-center gap-5">
                                        <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="text-white/60 hover:text-gold transition-colors disabled:opacity-20" disabled={quantity <= (template.moq || 1)}><FaMinus size={11} /></button>
                                        <span className="text-lg font-serif text-white min-w-[20px] text-center">{quantity}</span>
                                        <button onClick={() => setQuantity(q => q + 1)} className="text-white/60 hover:text-gold transition-colors"><FaPlus size={11} /></button>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setBuyNowItem({ template, price: template.basePrice, quantity, customizedJson: {}, finalImageUrl: defaultImage, packingCharges: template.packingCharges || 0, shippingCharges: template.shippingCharges || 0, gst: template.gst || 0 });
                                        navigate(`/customize/${template._id}`);
                                    }}
                                    className="btn-gold w-full flex items-center justify-center gap-2.5 py-4"
                                >
                                    <FaMagic size={13} /> Personalize & Buy
                                </button>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => {
                                            setBuyNowItem({ template, price: template.basePrice, quantity, customizedJson: {}, finalImageUrl: defaultImage, packingCharges: template.packingCharges || 0, shippingCharges: template.shippingCharges || 0, gst: template.gst || 0 });
                                            navigate('/checkout');
                                        }}
                                        className="btn-outline py-3.5 text-[10px]"
                                    >
                                        Buy Now
                                    </button>
                                    <button
                                        onClick={async () => {
                                            setAddingToCart(true);
                                            await addToCart({ template: template._id, price: template.basePrice, quantity, customizedJson: {}, finalImageUrl: defaultImage, packingCharges: template.packingCharges || 0, shippingCharges: template.shippingCharges || 0, gst: template.gst || 0 });
                                            setAddingToCart(false);
                                            toast.success('Added to cart');
                                        }}
                                        disabled={addingToCart}
                                        className="btn-outline py-3.5 text-[10px]"
                                    >
                                        {addingToCart ? 'Adding...' : 'Add to Cart'}
                                    </button>
                                </div>
                            </div>

                            {/* Trust Icons */}
                            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-white/[0.06]">
                                <div className="text-center space-y-1.5">
                                    <FaShieldAlt className="text-gold mx-auto" size={16} />
                                    <p className="text-[9px] text-white/30 uppercase tracking-wider font-medium">Secure</p>
                                </div>
                                <div className="text-center space-y-1.5 border-x border-white/[0.06]">
                                    <FaTruck className="text-gold mx-auto" size={16} />
                                    <p className="text-[9px] text-white/30 uppercase tracking-wider font-medium">Fast</p>
                                </div>
                                <div className="text-center space-y-1.5">
                                    <FaBox className="text-gold mx-auto" size={16} />
                                    <p className="text-[9px] text-white/30 uppercase tracking-wider font-medium">Premium</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TemplateDetails;
