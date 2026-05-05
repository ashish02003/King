import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaTrash, FaPlus, FaMinus, FaArrowLeft, FaShieldAlt, FaPencilAlt, FaShoppingBag
} from 'react-icons/fa';

const Cart = () => {
    const { cartItems, selectedItemIds, toggleSelection, getSelectedItems, removeFromCart, updateQuantity, loading } = useCart();
    const navigate = useNavigate();
    const [removeModal, setRemoveModal] = useState({ isOpen: false, itemId: null, itemName: '' });

    const selectedItems = getSelectedItems();

    const subtotal = selectedItems.reduce((acc, item) => acc + ((item.price * (1 + (item.gst || 0) / 100)) * (item.quantity || 1)), 0);
    const packingChargesTotal = selectedItems.reduce((acc, item) => acc + ((item.packingCharges || 0) * (item.quantity || 1)), 0);
    const shippingChargesTotal = selectedItems.reduce((acc, item) => acc + (item.shippingCharges || 0), 0);
    const totalPrice = Math.round(subtotal + packingChargesTotal + shippingChargesTotal);
    const totalItems = selectedItems.reduce((acc, item) => acc + (item.quantity || 1), 0);

    const handleRemoveClick = (item) => {
        setRemoveModal({
            isOpen: true,
            itemId: item._id,
            itemName: item.template?.name || 'Custom Product'
        });
    };

    const handleConfirmRemove = () => {
        removeFromCart(removeModal.itemId);
        setRemoveModal({ isOpen: false, itemId: null, itemName: '' });
    };

    const handleQtyChange = (item, delta) => {
        const newQty = (item.quantity || 1) + delta;
        if (newQty >= 1) {
            updateQuantity(item._id, newQty);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-primary-dark flex items-center justify-center">
                <div className="w-10 h-10 border-3 border-gold border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-primary-dark pt-28 pb-20">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-[11px] font-semibold text-white/40 uppercase tracking-[0.15em] hover:text-gold transition-colors group"
                        >
                            <FaArrowLeft size={10} className="group-hover:-translate-x-1 transition-transform" />
                            <span>Continue Shopping</span>
                        </button>
                        <h1 className="text-4xl font-serif text-white">Your Cart</h1>
                        <p className="text-white/40 text-sm">
                            {selectedItems.length} of {cartItems.length} items selected for checkout
                        </p>
                    </div>
                </div>

                {cartItems.length === 0 ? (
                    <div className="luxury-card p-16 text-center space-y-6 animate-fadeIn">
                        <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto text-gold">
                            <FaShoppingBag size={24} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-serif text-white">Your cart is empty</h2>
                            <p className="text-white/40 text-sm">Start by browsing our designs and customizing a product.</p>
                        </div>
                        <Link to="/" className="btn-gold inline-block">Browse Designs</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Cart Items */}
                        <div className="lg:col-span-8 space-y-4">
                            {cartItems.map((item) => {
                                const isSelected = selectedItemIds.includes(item._id);
                                return (
                                    <div
                                        key={item._id}
                                        className={`luxury-card p-5 flex flex-col md:flex-row gap-6 items-center transition-all duration-300 ${isSelected ? 'opacity-100' : 'opacity-40 hover:opacity-60'}`}
                                    >
                                        <div className="flex items-center gap-5 w-full md:w-auto">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelection(item._id)}
                                                className="w-4 h-4 rounded border-white/10 bg-primary-light text-gold focus:ring-gold cursor-pointer accent-gold"
                                            />
                                            <div className="w-24 h-24 rounded-luxury bg-primary-light border border-white/[0.06] overflow-hidden flex-shrink-0">
                                                <img
                                                    src={item.finalImageUrl || item.finalDesignUrl || 'https://via.placeholder.com/150'}
                                                    alt={item.template?.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-3 w-full">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-base font-serif text-white">{item.template?.name || 'Custom Product'}</h3>
                                                    <p className="text-[10px] text-gold font-medium uppercase tracking-wider mt-0.5">Personalized</p>
                                                </div>
                                                <p className="text-xl font-serif text-white">
                                                    ₹{Math.round((item.price * (1 + (item.gst || 0) / 100)) * (item.quantity || 1)).toLocaleString()}
                                                </p>
                                            </div>

                                            <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                                                <div className="flex items-center bg-primary-light rounded-luxury border border-white/[0.06] p-0.5">
                                                    <button
                                                        onClick={() => handleQtyChange(item, -1)}
                                                        className="w-7 h-7 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                                                    >
                                                        <FaMinus size={9} />
                                                    </button>
                                                    <span className="w-8 text-center text-sm font-medium text-white">{item.quantity || 1}</span>
                                                    <button
                                                        onClick={() => handleQtyChange(item, 1)}
                                                        className="w-7 h-7 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                                                    >
                                                        <FaPlus size={9} />
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => navigate(`/customize/${item.template?._id || item.template}`)}
                                                        className="text-[10px] font-medium text-white/40 hover:text-gold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                                                    >
                                                        <FaPencilAlt size={9} /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveClick(item)}
                                                        className="text-[10px] font-medium text-red-400/70 hover:text-red-400 uppercase tracking-wider transition-colors flex items-center gap-1.5"
                                                    >
                                                        <FaTrash size={9} /> Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Summary */}
                        <div className="lg:col-span-4">
                            <div className="luxury-card p-7 sticky top-28 space-y-6">
                                <h2 className="text-[11px] font-semibold text-gold uppercase tracking-[0.2em]">Order Summary</h2>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white/40">Subtotal ({totalItems} items)</span>
                                        <span className="text-white font-medium">₹{Math.round(subtotal).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white/40">Packing</span>
                                        <span className="text-white font-medium">₹{packingChargesTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white/40">Shipping</span>
                                        {shippingChargesTotal === 0
                                            ? <span className="text-gold font-medium">Free</span>
                                            : <span className="text-white font-medium">₹{shippingChargesTotal.toLocaleString()}</span>
                                        }
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-white/[0.06] flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] font-medium text-white/30 uppercase tracking-wider mb-1">Total</p>
                                        <p className="text-3xl font-serif text-white">₹{totalPrice.toLocaleString()}</p>
                                    </div>
                                </div>

                                <button
                                    disabled={selectedItems.length === 0}
                                    onClick={() => navigate('/checkout')}
                                    className="btn-gold w-full flex items-center justify-center gap-2.5 py-3.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Proceed to Checkout
                                    <FaArrowLeft className="rotate-180" size={11} />
                                </button>

                                <div className="flex items-start gap-3 p-3.5 rounded-luxury bg-white/[0.02] border border-white/[0.04]">
                                    <FaShieldAlt className="text-gold mt-0.5 flex-shrink-0" size={12} />
                                    <p className="text-[10px] text-white/30 leading-relaxed">
                                        Secured by industry-standard encryption for a safe checkout experience.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Remove Confirmation Modal */}
            {removeModal.isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-primary-dark/80 backdrop-blur-luxury" onClick={() => setRemoveModal({ isOpen: false })}></div>
                    <div className="relative bg-primary border border-white/10 p-8 rounded-luxury max-w-sm w-full text-center space-y-5 animate-fadeIn">
                        <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
                            <FaTrash size={20} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-serif text-white">Remove Item?</h3>
                            <p className="text-white/40 text-sm">Remove "{removeModal.itemName}" from your cart?</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setRemoveModal({ isOpen: false })} className="flex-1 py-3 rounded-luxury border border-white/10 text-white font-medium text-sm hover:bg-white/5 transition-all">Keep</button>
                            <button onClick={handleConfirmRemove} className="flex-1 py-3 rounded-luxury bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-all">Remove</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;
