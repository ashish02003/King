import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { FaTrash, FaPlus, FaMinus, FaArrowLeft, FaShieldAlt } from 'react-icons/fa';

const QuickBuy = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { cartItems, updateQuantity, removeFromCart, setSelectedItemIds } = useCart();
    const { user } = useAuth();
    const [item, setItem] = useState(null);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        const foundItem = cartItems.find(i => i._id === id);
        if (foundItem) {
            setItem(foundItem);
            setSelectedItemIds([id]);
        }
    }, [id, cartItems, user, setSelectedItemIds]);

    const handleQtyChange = (delta) => {
        if (!item) return;
        const newQty = (item.quantity || 1) + delta;
        if (newQty < 1) return;
        updateQuantity(item._id, newQty);
    };

    if (!item) return (
        <div className="min-h-screen bg-primary-dark flex items-center justify-center">
            <div className="w-10 h-10 border-3 border-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    const subtotal = item.price * (item.quantity || 1);
    const packingChargesTotal = (item.packingCharges || 0) * (item.quantity || 1);
    const shippingChargesTotal = item.shippingCharges || 0;
    const totalPrice = subtotal + packingChargesTotal + shippingChargesTotal;

    return (
        <div className="min-h-screen bg-primary-dark pt-28 pb-20">
            <div className="max-w-5xl mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-12">
                    <div>
                        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[11px] font-semibold text-white/40 uppercase tracking-[0.15em] hover:text-gold transition-colors mb-3 group">
                            <FaArrowLeft size={10} className="group-hover:-translate-x-1 transition-transform" /> Back
                        </button>
                        <h1 className="text-4xl font-serif text-white">Review & Buy</h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-6">
                        <div className="luxury-card p-6 flex flex-col md:flex-row gap-8">
                            <div className="w-full md:w-56 aspect-square rounded-luxury bg-primary-light overflow-hidden border border-white/[0.06] relative group">
                                <img src={item.finalImageUrl || item.finalDesignUrl} className="w-full h-full object-cover p-5" alt="Product" />
                            </div>

                            <div className="flex-1 space-y-5">
                                <div>
                                    <span className="text-[10px] font-medium text-gold uppercase tracking-wider block mb-1">Personalized</span>
                                    <h2 className="text-2xl font-serif text-white">{item.template?.name || 'Custom Product'}</h2>
                                    <p className="text-white/40 text-sm mt-1">Individually crafted for your order.</p>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="bg-primary-light p-2 rounded-luxury border border-white/[0.06] flex items-center gap-5">
                                        <button onClick={() => handleQtyChange(-1)} className="text-white/50 hover:text-gold transition-colors" disabled={(item.quantity || 1) <= 1}><FaMinus size={10} /></button>
                                        <span className="text-white font-serif text-lg">{item.quantity || 1}</span>
                                        <button onClick={() => handleQtyChange(1)} className="text-white/50 hover:text-gold transition-colors"><FaPlus size={10} /></button>
                                    </div>
                                    <div className="h-6 w-[1px] bg-white/[0.06]"></div>
                                    <div>
                                        <p className="text-[10px] font-medium text-white/30 uppercase tracking-wider">Price</p>
                                        <p className="text-lg text-gold font-serif">₹{item.price}</p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/[0.06] flex gap-5">
                                    <button onClick={() => removeFromCart(item._id)} className="text-[10px] font-medium text-red-400/70 uppercase tracking-wider hover:text-red-400 flex items-center gap-1.5">
                                        <FaTrash size={9} /> Remove
                                    </button>
                                    <button onClick={() => navigate(`/customize/${item.template?._id || item.template}`)} className="text-[10px] font-medium text-gold uppercase tracking-wider hover:underline flex items-center gap-1.5">
                                        Edit Design
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="bg-primary border border-gold/10 p-6 rounded-luxury flex items-start gap-4">
                            <div className="w-10 h-10 bg-gold/10 rounded-luxury flex items-center justify-center text-gold flex-shrink-0">
                                <FaShieldAlt size={14} />
                            </div>
                            <div>
                                <h4 className="text-[11px] font-medium text-gold uppercase tracking-wider mb-0.5">Quality Guaranteed</h4>
                                <p className="text-white/40 text-xs leading-relaxed">
                                    Each piece is crafted using premium materials and professional printing techniques for a lasting finish.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-4">
                        <div className="luxury-card p-8 space-y-6 sticky top-28">
                            <h3 className="text-[11px] font-semibold text-gold uppercase tracking-[0.2em]">Order Summary</h3>

                            <div className="space-y-3">
                                <div className="flex justify-between text-xs">
                                    <span className="text-white/40">Subtotal</span>
                                    <span className="text-white">₹{subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-white/40">Packing</span>
                                    <span className="text-white">₹{packingChargesTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-white/40">Shipping</span>
                                    <span className="text-gold font-medium">{shippingChargesTotal === 0 ? 'Free' : `₹${shippingChargesTotal}`}</span>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/[0.06]">
                                <div className="flex justify-between items-end mb-8">
                                    <div>
                                        <p className="text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1">Total</p>
                                        <p className="text-4xl font-serif text-gold">₹{totalPrice.toLocaleString()}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigate('/checkout')}
                                    className="btn-gold w-full py-4"
                                >
                                    Proceed to Checkout
                                </button>

                                <button
                                    onClick={() => navigate('/')}
                                    className="w-full mt-4 text-[10px] font-medium text-white/30 uppercase tracking-wider hover:text-gold transition-colors text-center"
                                >
                                    Continue Shopping
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickBuy;
