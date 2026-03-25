import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../utils/api';
import { Layout, Row, Col, Typography, Button, Space, Skeleton, Result } from 'antd';
import { FaChevronRight } from 'react-icons/fa';

import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const TemplateDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToCart, setSelectedItemIds, buyNowItem, setBuyNowItem } = useCart();
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [addingToCart, setAddingToCart] = useState(false);

    // Persist quantity changes to buyNowItem state
    useEffect(() => {
        if (template && buyNowItem?.template?._id === template._id) {
            setBuyNowItem(prev => ({ ...prev, quantity }));
        }
    }, [quantity, template, setBuyNowItem]);

    useEffect(() => {
        const fetchTemplate = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data } = await axios.get(`${API_BASE}/templates/${id}`);
                setTemplate(data);
                
                // Initialize quantity from existing buyNowItem if it matches
                if (buyNowItem?.template?._id === data._id) {
                    setQuantity(buyNowItem.quantity);
                } else {
                    setQuantity(data.moq || 1);
                }
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.message || 'Product not found');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchTemplate();
        window.scrollTo(0, 0);
    }, [id, buyNowItem?.template?._id]);

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto p-10">
                <Skeleton active avatar paragraph={{ rows: 10 }} />
            </div>
        );
    }

    if (error || !template) {
        return (
            <Result
                status="404"
                title="Product not found"
                subTitle={error}
                extra={<Button onClick={() => navigate('/')}>Back Home</Button>}
            />
        );
    }

    const productImage = template.demoImageUrl || template.previewImage || template.backgroundImageUrl;

    return (
        <Layout className="min-h-screen font-sans bg-white pt-0">
            <Content className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 pb-12">
                
                {/* Modern Breadcrumbs & Back Button */}
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
                    <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
                        <Link to="/" className="text-[10px] font-black uppercase text-gray-400 hover:text-[#111] tracking-widest transition-colors">Home</Link>
                        <FaChevronRight className="text-[8px] text-gray-300" />
                        <Link to={`/category/${template.category}`} className="text-[10px] font-black uppercase text-gray-400 hover:text-[#111] tracking-widest transition-colors">{template.category}</Link>
                        <FaChevronRight className="text-[8px] text-gray-300" />
                        <span className="text-[10px] font-black uppercase text-[#111] tracking-widest truncate max-w-[150px]">{template.name}</span>
                    </div>
                </div>

                <Row gutter={[32, 24]} align="top" className="pt-0 m-0">
                    {/* Left side: Product Image (Modernized & Interactive) */}
                    <Col xs={24} md={12} className="pt-0">
                        <div className="flex items-center justify-center p-8 group relative bg-[#F9F9F9] rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-2xl">
                            {/* Premium Badge */}
                            <div className="absolute top-4 left-4 z-10">
                                <span className="bg-[#111] text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full shadow-lg">
                                    Premium Quality
                                </span>
                            </div>

                            <img
                                src={productImage}
                                alt={template.name}
                                className="max-w-full h-auto object-contain mix-blend-multiply transition-all duration-700 transform group-hover:scale-110 drop-shadow-2xl"
                                style={{ maxHeight: '520px' }}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://placehold.co/800x800/f8fafc/666?text=' + template.name.replace(/ /g, '+');
                                }}
                            />

                            {/* Decorative glass effect */}
                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        </div>

                        {/* Description Below Image */}
                        <div className="mt-12 pt-8 border-t-2 border-gray-50">
                            <h3 className="text-[14px] font-black text-[#111] mb-6 uppercase tracking-[0.3em] flex items-center gap-2">
                                <span className="w-8 h-[2px] bg-[#111]"></span> Description
                            </h3>
                            <Paragraph className="text-[#666] text-[15px] leading-[1.8] m-0 font-medium">
                                {template.description || "Premium custom design product. Perfect for gifting or personal use, our high-quality prints ensure durability and vibrant colors that last. Each product is crafted with precision."}
                            </Paragraph>
                        </div>
                    </Col>

                    {/* Right side: Modernized Content Sections */}
                    <Col xs={24} md={12} className="pt-0">
                        <div className="flex flex-col h-full pl-0 md:pl-10 pt-0">
                            {/* Product Name & Price */}
                            <div className="mb-10">
                                <h1 className="text-[38px] sm:text-[52px] font-black text-[#111] mb-3 leading-[1.0] tracking-tighter mt-0">
                                    {template.name}
                                </h1>
                                <div className="flex items-center gap-4">
                                    <span className="text-[32px] sm:text-[40px] font-black text-[#E53E3E]">
                                        ₹{(template.basePrice + (template.packingCharges || 0)).toLocaleString('en-IN')}.00
                                    </span>
                                    <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mt-2">(Incl. Packing)</span>
                                </div>
                            </div>

                            {/* Section 1: Info & Charges (Modern Card) */}
                            <div className="bg-white p-7 mb-10 rounded-2xl border border-gray-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.08)] space-y-5 max-w-lg transition-all hover:shadow-xl">
                                <div className="flex justify-between items-center text-[13px]">
                                    <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Category</span>
                                    <span className="text-[#111] font-black">{template.category}</span>
                                </div>
                                <div className="flex justify-between items-center text-[13px]">
                                    <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Minimum Order</span>
                                    <span className="text-[#111] font-black">{template.moq || 1} Pcs</span>
                                </div>
                                <div className="flex justify-between items-center text-[13px]">
                                    <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Packing Fee</span>
                                    <span className={template.packingCharges > 0 ? 'text-[#111] font-black' : 'text-green-600 font-black'}>
                                        {template.packingCharges > 0 ? `₹${template.packingCharges}` : 'COMPLIMENTARY'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-[13px]">
                                    <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Shipping</span>
                                    <span className={template.shippingCharges > 0 ? 'text-[#111] font-black' : 'text-green-600 font-black'}>
                                        {template.shippingCharges > 0 ? `₹${template.shippingCharges}` : 'FREE EXPRESS SHIPPING'}
                                    </span>
                                </div>
                            </div>

                            {/* Section 2: Actions - Modernized Buttons */}
                            <div className="flex flex-col gap-6 mb-12 items-start max-w-lg w-full">
                                {/* Quantity Selector */}
                                <div className="flex items-center gap-6 w-full py-4 px-6 bg-[#f8fafc] rounded-2xl border border-slate-100">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#94a3b8]">Select Quantity</span>
                                    <div className="flex items-center gap-6">
                                        <button 
                                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl hover:shadow-md transition-all text-[#111] font-black disabled:opacity-30"
                                            disabled={quantity <= (template.moq || 1)}
                                        >
                                            -
                                        </button>
                                        <span className="text-[18px] font-black text-[#111] min-w-8 text-center">{quantity}</span>
                                        <button 
                                            onClick={() => setQuantity(q => q + 1)}
                                            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl hover:shadow-md transition-all text-[#111] font-black"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <div className="flex-1 text-right">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Subtotal</span>
                                        <span className="text-[18px] font-black text-[#2D5A27]">₹{((template.basePrice + (template.packingCharges || 0)) * quantity).toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                    <button
                                        onClick={() => {
                                            // Set basic buyNowItem state before customizing so quantity is preserved
                                            setBuyNowItem({
                                                template: template,
                                                price: template.basePrice,
                                                quantity: quantity,
                                                customizedJson: {},
                                                finalImageUrl: productImage,
                                                packingCharges: template.packingCharges || 0,
                                                shippingCharges: template.shippingCharges || 0
                                            });
                                            navigate(`/customize/${template._id}`);
                                        }}
                                        className="bg-[#111] text-white h-[64px] font-black text-[14px] uppercase tracking-[0.20em] shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer rounded-2xl border-none outline-none"
                                    >
                                        CUSTOMIZE NOW
                                    </button>
                                    <button
                                        onClick={() => {
                                            setBuyNowItem({
                                                template: template,
                                                price: template.basePrice,
                                                quantity: quantity,
                                                customizedJson: {},
                                                finalImageUrl: productImage,
                                                packingCharges: template.packingCharges || 0,
                                                shippingCharges: template.shippingCharges || 0
                                            });
                                            navigate('/checkout');
                                        }}
                                        className="bg-[#2D5A27] text-white h-[64px] font-black text-[14px] uppercase tracking-[0.20em] shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer rounded-2xl border-none outline-none flex items-center justify-center gap-2"
                                    >
                                        BUY NOW
                                    </button>
                                    <button
                                        onClick={async () => {
                                            setAddingToCart(true); 
                                            const payload = {
                                                template: template._id,
                                                price: template.basePrice,
                                                quantity: quantity,
                                                customizedJson: {},
                                                finalImageUrl: productImage,
                                                packingCharges: template.packingCharges || 0,
                                                shippingCharges: template.shippingCharges || 0
                                            };
                                            await addToCart(payload);
                                            setAddingToCart(false);
                                        }}
                                        disabled={addingToCart}
                                        className="sm:col-span-2 bg-transparent text-[#111] h-[58px] font-black text-[11px] uppercase tracking-[0.25em] border-2 border-slate-100/80 hover:bg-slate-50 transition-all cursor-pointer rounded-2xl"
                                    >
                                        {addingToCart ? "ADDING..." : "ADD TO CART"}
                                    </button>
                                </div>
                            </div>

                            <Link to={`/category/${template.category}`} className="w-full">
                                <button className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-[#999] hover:text-[#111] transition-colors flex items-center justify-center gap-3 group cursor-pointer py-2">
                                    <span className="group-hover:tracking-[0.3em] transition-all">Explore similar products</span> <FaChevronRight className="text-[10px] group-hover:translate-x-1 transition-transform" />
                                </button>
                            </Link>

                            {/* Section 3: Uses & Benefits - Refined */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                                {/* USES */}
                                {template.uses && template.uses.length > 0 && (
                                    <div className="space-y-5">
                                        <h3 className="text-[11px] font-black text-[#111] uppercase tracking-[0.3em] pb-2 border-b-2 border-gray-100 inline-block">
                                            Usage
                                        </h3>
                                        <ul className="list-none p-0 space-y-4">
                                            {template.uses.map((use, idx) => (
                                                <li key={idx} className="flex items-start gap-3 text-[#555] text-[13px] font-bold leading-relaxed group">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#111] mt-1.5 transition-transform group-hover:scale-150"></span>
                                                    <span>{use}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* BENEFITS */}
                                {template.benefits && template.benefits.length > 0 && (
                                    <div className="space-y-5">
                                        <h3 className="text-[11px] font-black text-[#111] uppercase tracking-[0.3em] pb-2 border-b-2 border-gray-100 inline-block">
                                            Highlights
                                        </h3>
                                        <ul className="list-none p-0 space-y-4">
                                            {template.benefits.map((benefit, idx) => (
                                                <li key={idx} className="flex items-start gap-3 text-[#555] text-[13px] font-bold leading-relaxed group">
                                                    <span className="text-green-500 font-black transition-transform group-hover:rotate-12">✓</span>
                                                    <span>{benefit}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Col>
                </Row>
            </Content>
        </Layout>
    );
};

export default TemplateDetails;
