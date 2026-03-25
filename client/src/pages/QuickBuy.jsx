import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { FaTrash, FaPlus, FaMinus, FaArrowLeft, FaShoppingBag, FaBox, FaTruck, FaShieldAlt } from 'react-icons/fa';
import { Layout, Row, Col, Card, Button, Typography, Empty, Space, Divider, Tag } from 'antd';

const { Content } = Layout;
const { Title, Text } = Typography;

const QuickBuy = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { cartItems, updateQuantity, removeFromCart, setSelectedItemIds } = useCart();
    const { user } = useAuth();
    
    const [item, setItem] = useState(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        // Fetch from Cart context (items are already fetched or newly added)
        const foundItem = cartItems.find(i => i._id === id);
        if (foundItem) {
            setItem(foundItem);
            // Ensure this item is the only one selected for checkout
            setSelectedItemIds([id]);
        }
    }, [id, cartItems, user, setSelectedItemIds]);

    const handleQtyChange = (delta) => {
        if (!item) return;
        const newQty = (item.quantity || 1) + delta;
        if (newQty < 1) return;
        
        updateQuantity(item._id, newQty);
    };

    if (!item) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Loading Preview...</p>
                </div>
            </div>
        );
    }

    const subtotal = item.price * (item.quantity || 1);
    const packingChargesTotal = (item.packingCharges || 0) * (item.quantity || 1);
    const shippingChargesTotal = item.shippingCharges || 0;
    const totalPrice = subtotal + packingChargesTotal + shippingChargesTotal;

    return (
        <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Content style={{ padding: '40px 16px' }}>
                <div className="container mx-auto max-w-5xl">
                    <Space align="center" size="large" style={{ marginBottom: 32 }}>
                        <Button
                            type="default"
                            shape="circle"
                            icon={<FaArrowLeft />}
                            onClick={() => navigate(-1)}
                            className="shadow-sm border-gray-200"
                        />
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight m-0 uppercase italic">Review Your Order</h1>
                            <Text type="secondary" className="font-medium text-indigo-500 uppercase tracking-widest text-[10px]">Verify your selection before checkout</Text>
                        </div>
                    </Space>

                    <Row gutter={[24, 24]}>
                        {/* Left: Product Card */}
                        <Col xs={24} lg={15}>
                            <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-indigo-100/50 overflow-hidden bg-white" bodyStyle={{ padding: '32px' }}>
                                <div className="flex flex-col md:flex-row gap-8">
                                    {/* Image Section */}
                                    <div className="w-full md:w-56 h-56 rounded-3xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0 relative group">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50/50 to-transparent"></div>
                                        <img 
                                            src={item.finalImageUrl || item.finalDesignUrl} 
                                            alt={item.template?.name} 
                                            className="w-full h-full object-contain p-4 drop-shadow-xl transition-transform duration-500 group-hover:scale-110" 
                                        />
                                    </div>

                                    {/* Info Section */}
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <Tag className="mb-2 border-none bg-indigo-50 text-indigo-600 font-black text-[9px] uppercase px-3 py-0.5 rounded-full tracking-widest">Selected For You</Tag>
                                            <h2 className="text-2xl font-black text-gray-900 leading-tight">
                                                {item.template?.name || 'Custom Product'}
                                            </h2>
                                            <p className="text-sm text-gray-400 font-medium mt-1">Personalized Custom Design</p>
                                        </div>

                                        <div className="flex items-center gap-4 py-2">
                                            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-1 flex items-center shadow-sm">
                                                <button 
                                                    onClick={() => handleQtyChange(-1)}
                                                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white text-gray-500 transition-all font-black text-lg disabled:opacity-30"
                                                    disabled={(item.quantity || 1) <= 1}
                                                >
                                                    <FaMinus size={12} />
                                                </button>
                                                <span className="w-12 text-center font-black text-gray-900 text-lg">
                                                    {item.quantity || item.qty || 1}
                                                </span>
                                                <button 
                                                    onClick={() => handleQtyChange(1)}
                                                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white text-gray-500 transition-all font-black text-lg"
                                                >
                                                    <FaPlus size={12} />
                                                </button>
                                            </div>
                                            <div className="h-10 w-[1px] bg-gray-100"></div>
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Unit Price</p>
                                                <p className="text-lg font-black text-gray-900 leading-none">₹{item.price}</p>
                                            </div>
                                        </div>

                                        <Divider style={{ margin: '16px 0' }} />
                                        
                                        <div className="flex gap-3">
                                            <Button 
                                                icon={<FaTrash />} 
                                                danger 
                                                type="text" 
                                                className="font-black uppercase tracking-widest text-[10px] flex items-center gap-2"
                                                onClick={() => { 
                                                    removeFromCart(item._id); 
                                                    navigate('/'); 
                                                }}
                                            >
                                                Discard
                                            </Button>
                                            <Button 
                                                to={`/customize/${item.template?._id || item.template}`} 
                                                type="link" 
                                                className="font-black uppercase tracking-widest text-[10px] text-indigo-500 flex items-center gap-2"
                                                onClick={() => navigate(`/customize/${item.template?._id || item.template}`)}
                                            >
                                                Edit Design
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <div className="mt-8 p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 flex items-start gap-4">
                                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
                                    <FaShieldAlt className="text-indigo-600" />
                                </div>
                                <div>
                                    <h4 className="font-black text-indigo-900 text-sm uppercase tracking-wider">Quality Guarantee</h4>
                                    <p className="text-xs text-indigo-700/60 font-medium leading-relaxed mt-1">
                                        We use premium materials and high-definition printing. If you are not satisfied with the print quality, we offer a hassle-free replacement.
                                    </p>
                                </div>
                            </div>
                        </Col>

                        {/* Right: Summary Card */}
                        <Col xs={24} lg={9}>
                            <Card className="rounded-[2.5rem] border-none shadow-2xl shadow-indigo-100/50 sticky top-24 overflow-hidden" bodyStyle={{ padding: 0 }}>
                                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6">
                                    <h3 className="text-white font-black uppercase tracking-[0.2em] text-xs m-0">Cart Summary</h3>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <div className="flex items-center gap-3 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                                                <FaShoppingBag className="text-indigo-400" />
                                                Product Cost
                                            </div>
                                            <span className="font-black text-gray-900">₹{subtotal.toLocaleString()}</span>
                                        </div>

                                        <div className="flex justify-between items-center text-sm">
                                            <div className="flex items-center gap-3 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                                                <FaBox className="text-orange-400" />
                                                Packing Fee
                                            </div>
                                            <span className={`font-black ${packingChargesTotal > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                                                ₹{packingChargesTotal.toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center text-sm">
                                            <div className="flex items-center gap-3 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                                                <FaTruck className="text-blue-400" />
                                                Shipping
                                            </div>
                                            {shippingChargesTotal === 0 
                                                ? <Tag color="green" className="m-0 border-none font-black text-[9px] px-2 rounded-lg">FREE</Tag>
                                                : <span className="font-black text-gray-900">₹{shippingChargesTotal.toLocaleString()}</span>
                                            }
                                        </div>
                                    </div>

                                    <Divider className="my-2" />

                                    <div>
                                        <div className="flex justify-between items-end mb-8">
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Grand Total</p>
                                                <p className="text-[42px] font-black leading-none m-0" style={{ color: '#2D5A27' }}>
                                                    ₹{totalPrice.toLocaleString()}
                                                </p>
                                            </div>
                                            <span className="bg-green-50 text-green-600 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest border border-green-100">Savings Applied</span>
                                        </div>

                                        <button 
                                            onClick={() => navigate('/checkout')}
                                            className="w-full py-5 bg-[#2D5A27] hover:bg-[#23471e] text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl shadow-green-900/10 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
                                        >
                                            Checkout Now <span className="text-xl">→</span>
                                        </button>
                                        
                                        <button 
                                            onClick={() => navigate('/')}
                                            className="w-full mt-4 py-3 bg-transparent text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-indigo-600 transition-all"
                                        >
                                            ← Continue Shopping
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </Content>
        </Layout>
    );
};

export default QuickBuy;
