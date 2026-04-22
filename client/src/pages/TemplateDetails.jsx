import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../utils/api';
import { Layout, Row, Col, Typography, Button, Skeleton, Result } from 'antd';
import { FaChevronRight } from 'react-icons/fa';

import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const { Content } = Layout;
const { Paragraph } = Typography;

const TemplateDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToCart, setBuyNowItem, buyNowItem } = useCart();
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [addingToCart, setAddingToCart] = useState(false);
    const [selectedImage, setSelectedImage] = useState('');
    const [zoomState, setZoomState] = useState({ isVisible: false, x: 0, y: 0, lensX: 0, lensY: 0 });

    const handleMouseMove = (e) => {
        const container = e.currentTarget;
        const rect = container.getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const lensWidth = 150;
        const lensHeight = 150;

        let lensX = x - lensWidth / 2;
        let lensY = y - lensHeight / 2;

        if (lensX < 0) lensX = 0;
        if (lensY < 0) lensY = 0;
        if (lensX > rect.width - lensWidth) lensX = rect.width - lensWidth;
        if (lensY > rect.height - lensHeight) lensY = rect.height - lensHeight;

        const zoomX = (lensX / (rect.width - lensWidth)) * 100;
        const zoomY = (lensY / (rect.height - lensHeight)) * 100;

        setZoomState({
            isVisible: true,
            x: zoomX,
            y: zoomY,
            lensX,
            lensY,
            lensWidth,
            lensHeight
        });
    };

    const handleMouseLeave = () => {
        setZoomState({ ...zoomState, isVisible: false });
    };

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
                if (buyNowItem?.template?._id === data._id) {
                    setQuantity(buyNowItem.quantity);
                } else {
                    setQuantity(data.moq || 1);
                }
                setSelectedImage(data.demoImageUrl || data.previewImage || data.backgroundImageUrl);
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

    const defaultImage = template.demoImageUrl || template.previewImage || template.backgroundImageUrl;
    const allImages = [defaultImage, ...(template.galleryImages || [])].filter(Boolean);

    return (
        <Layout className="min-h-screen font-sans bg-white pt-0">
            <Content className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 pb-12">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
                    <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
                        <Link to="/" className="text-[10px] font-black uppercase text-gray-400 hover:text-[#111] tracking-widest transition-colors">Home</Link>
                        <FaChevronRight className="text-[8px] text-gray-300" />
                        <Link to={`/category/${template.category}`} className="text-[10px] font-black uppercase text-gray-400 hover:text-[#111] tracking-widest transition-colors">{template.category}</Link>
                        <FaChevronRight className="text-[8px] text-gray-300" />
                        <span className="text-[10px] font-black uppercase text-[#111] tracking-widest truncate max-w-[150px]">{template.name}</span>
                    </div>
                </div>

                <Row gutter={[32, 24]} align="top">
                    <Col xs={24} md={12} lg={14} className="md:sticky md:top-24 self-start z-[50]">
                        <div className="flex flex-col md:flex-row gap-4 relative">
                            {allImages.length > 1 && (
                                <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto no-scrollbar pb-2 md:pb-0 md:pr-2 md:w-24 flex-shrink-0" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                                    {allImages.map((img, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedImage(img)}
                                            className={`relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${selectedImage === img ? 'border-[#111] opacity-100 shadow-md' : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-200 bg-gray-50'}`}
                                        >
                                            <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover mix-blend-multiply" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div
                                className="flex-1 flex items-center justify-center p-8 group relative bg-[#F9F9F9] rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl w-full cursor-crosshair"
                                style={{ 
                                    minHeight: '400px', 
                                    maxHeight: 'calc(100vh - 200px)'
                                }}
                                onMouseMove={handleMouseMove}
                                onMouseLeave={handleMouseLeave}
                            >
                                <div className="absolute top-4 left-4 z-10">
                                    <span className="bg-[#111] text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full shadow-lg">
                                        Premium Quality
                                    </span>
                                </div>

                                <img
                                    src={selectedImage || defaultImage}
                                    alt={template.name}
                                    className="max-w-full h-auto object-contain mix-blend-multiply transition-all duration-300 transform group-hover:scale-[1.02]"
                                    style={{ maxHeight: '100%', width: 'auto' }}
                                />

                                <AnimatePresence>
                                    {zoomState.isVisible && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute border border-black/10 bg-black/5 pointer-events-none z-20 rounded-lg"
                                            style={{
                                                left: `${zoomState.lensX}px`,
                                                top: `${zoomState.lensY}px`,
                                                width: `${zoomState.lensWidth}px`,
                                                height: `${zoomState.lensHeight}px`
                                            }}
                                        />
                                    )}
                                </AnimatePresence>
                            </div>

                            <AnimatePresence>
                                {zoomState.isVisible && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="absolute left-full top-0 ml-4 z-[1000] border-2 border-white bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] overflow-hidden hidden md:block"
                                        style={{
                                            width: '500px',
                                            height: '500px',
                                            backgroundImage: `url(${selectedImage || defaultImage})`,
                                            backgroundPosition: `${zoomState.x}% ${zoomState.y}%`,
                                            backgroundSize: '250%',
                                            backgroundRepeat: 'no-repeat',
                                            backgroundBlendMode: 'multiply'
                                        }}
                                    />
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Description & Uses Section */}
                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-[0.1em] mb-4 flex items-center gap-3">
                                <span className="w-6 h-0.1 bg-gray-900"></span>
                                Product Description
                            </h3>
                            <Paragraph className="text-gray-600 text-[14px] font-medium leading-relaxed whitespace-pre-wrap mb-2 pl-8">
                                {template.description || "Premium custom design product. Perfect for gifting or personal use."}
                            </Paragraph>

                            {/* DEBUG: {console.log('Template Data:', template)} */}
                            {template.uses && template.uses.length > 0 && (
                                <div className="mt-8">
                                    <h3 className="text-[12px] font-black text-gray-900 uppercase tracking-[0.2em] mb-1 flex items-center gap-3 ml-8">

                                        Best For
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {template.uses.map((use, idx) => (
                                            <div key={idx} className="bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl">
                                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider ml-4">{use}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Col>

                    <Col xs={24} md={12} lg={10}>
                        <div className="flex flex-col h-full pl-0 md:pl-10">
                            <div className="mb-10">
                                <h1 className="text-[38px] sm:text-[52px] font-black text-[#111] mb-3 leading-[1.0] tracking-tighter mt-0">
                                    {template.name}
                                </h1>
                                <div className="flex items-center gap-4">
                                    <span className="text-[32px] sm:text-[40px] font-black text-[#E53E3E]">
                                        ₹{(template.basePrice * (1 + (template.gst || 0) / 100)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </span>
                                    <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mt-2">(Incl. GST)</span>
                                </div>

                                {template.benefits && template.benefits.length > 0 && (
                                    <div className="mt-6 space-y-3">
                                        <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                                            <span className="w-6 h-0.5 bg-gray-900"></span>
                                            Product Highlights
                                        </h4>
                                        <ul className="list-none p-0 m-0 grid grid-cols-1 gap-3">
                                            {template.benefits.map((benefit, idx) => (
                                                <li key={idx} className="flex items-start gap-3 group">
                                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)] flex-shrink-0 group-hover:scale-125 transition-transform"></div>
                                                    <span className="text-[13px] font-bold text-gray-600 leading-tight group-hover:text-gray-900 transition-colors">
                                                        {benefit}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white p-7 mb-10 rounded-2xl border border-gray-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.08)] space-y-5">
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
                                    <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">GST</span>
                                    <span className="text-[#111] font-black">{template.gst || 0}% (Included)</span>
                                </div>
                                <div className="flex justify-between items-center text-[13px]">
                                    <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Shipping</span>
                                    <span className={template.shippingCharges > 0 ? 'text-[#111] font-black' : 'text-green-600 font-black'}>
                                        {template.shippingCharges > 0 ? `₹${template.shippingCharges}` : 'FREE EXPRESS SHIPPING'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-6 mb-12 items-start w-full">
                                <div className="flex items-center gap-6 w-full py-4 px-6 bg-[#f8fafc] rounded-2xl border border-slate-100">
                                    <span className="text-[15px] font-black uppercase tracking-[0.2em] text-[#94a3b8]">Quantity</span>
                                    <div className="flex items-center gap-6">
                                        <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl hover:shadow-md transition-all text-slate-900 font-black disabled:opacity-30" disabled={quantity <= (template.moq || 1)}>-</button>
                                        <span className="text-[18px] font-black text-[#111] min-w-8 text-center">{quantity}</span>
                                        <button onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 rounded-xl hover:shadow-md transition-all text-[#111] font-black">+</button>
                                    </div>
                                    <div className="flex-1 text-right">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Subtotal</span>
                                        <span className="text-[18px] font-black text-[#2D5A27]">₹{((template.basePrice * (1 + (template.gst || 0) / 100)) * quantity).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                    <button
                                        onClick={() => {
                                            setBuyNowItem({ template, price: template.basePrice, quantity, customizedJson: {}, finalImageUrl: defaultImage, packingCharges: template.packingCharges || 0, shippingCharges: template.shippingCharges || 0, gst: template.gst || 0 });
                                            navigate(`/customize/${template._id}`);
                                        }}
                                        className="bg-[#111] text-white h-[40px] font-black text-[14px] uppercase tracking-[0.20em] shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all rounded-md cursor-pointer"
                                    >CUSTOMIZE NOW</button>
                                    <button
                                        onClick={() => {
                                            setBuyNowItem({ template, price: template.basePrice, quantity, customizedJson: {}, finalImageUrl: defaultImage, packingCharges: template.packingCharges || 0, shippingCharges: template.shippingCharges || 0, gst: template.gst || 0 });
                                            navigate('/checkout');
                                        }}
                                        className="bg-[#2D5A27] text-white h-[40px] font-black text-[14px] uppercase tracking-[0.20em] shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all rounded-md cursor-pointer"
                                    >BUY NOW</button>
                                    <button
                                        onClick={async () => {
                                            setAddingToCart(true);
                                            await addToCart({ template: template._id, price: template.basePrice, quantity, customizedJson: {}, finalImageUrl: defaultImage, packingCharges: template.packingCharges || 0, shippingCharges: template.shippingCharges || 0, gst: template.gst || 0 });
                                            setAddingToCart(false);
                                        }}
                                        disabled={addingToCart}
                                        className="sm:col-span-2 bg-transparent text-[#111] h-[40px] font-black text-[11px] uppercase tracking-[0.25em] border-2 border-slate-100/80 hover:bg-slate-50 transition-all rounded-md cursor-pointer"
                                    >{addingToCart ? "ADDING..." : "ADD TO CART"}</button>
                                </div>
                            </div>

                            <Link to={`/category/${template.category}`} className="w-full">
                                <button className="w-full text-gray-700 font-black  uppercase tracking-[0.2em] text-[#999] hover:text-[#111] transition-colors flex items-center justify-center gap-3 group cursor-pointer py-1 ">
                                    <span className="group-hover:tracking-[0.2em] transition-all">Explore similar products</span> <FaChevronRight className="text-[10px] group-hover:translate-x-1 transition-transform" />
                                </button>
                            </Link>
                        </div>
                    </Col>
                </Row>
            </Content>
        </Layout>
    );
};

export default TemplateDetails;
