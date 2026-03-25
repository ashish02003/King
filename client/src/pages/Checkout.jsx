import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { API_BASE as API } from '../utils/api';
import {
    FaArrowLeft,
    FaCheckCircle,
    FaMapMarkerAlt,
    FaLock,
    FaUser,
    FaPhone,
    FaShoppingBag,
    FaBox,
    FaTruck
} from 'react-icons/fa';
import toast from 'react-hot-toast';

// Load Razorpay script dynamically
const loadRazorpay = () => new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
});

// ── Field Component ─────────
const Field = ({ label, name, value, onChange, error, type = 'text', placeholder, maxLength }) => (
    <div className="flex flex-col gap-1">
        <label className="text-xs font-black text-gray-500 uppercase tracking-wider">{label}</label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            maxLength={maxLength}
            className={`w-full px-4 py-3 rounded-2xl border-2 text-sm font-medium outline-none transition-all
                ${error
                    ? 'border-red-400 bg-red-50 focus:border-red-500'
                    : 'border-gray-200 bg-gray-50 focus:border-indigo-400 focus:bg-white'
                }`}
        />
        {error && (
            <span className="text-xs text-red-500 font-bold">{error}</span>
        )}
    </div>
);

const Checkout = () => {
    const navigate = useNavigate();
    const { getSelectedItems, clearCart, buyNowItem, setBuyNowItem } = useCart();
    const { user } = useAuth();

    const selectedItems = buyNowItem ? [buyNowItem] : getSelectedItems();
    const [step, setStep] = useState(1);
    const [paymentLoading, setPaymentLoading] = useState(false);

    const [address, setAddress] = useState({
        fullName: user?.name || '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        if (!buyNowItem && selectedItems.length === 0) { navigate('/cart'); }
    }, [user, selectedItems, buyNowItem]);

    // Subtotal tracks the user's defined "Original Price" (Base + Packing), evaluating to 69.
    const subtotal = selectedItems.reduce((acc, item) => {
        const itemOriginalPrice = Number(item.price) + (Number(item.packingCharges) || 0);
        return acc + (itemOriginalPrice * (item.quantity || 1));
    }, 0);

    const packingChargesTotal = selectedItems.reduce(
        (acc, item) => acc + ((Number(item.packingCharges) || 0) * (item.quantity || 1)), 0
    );

    const shippingChargesTotal = selectedItems.reduce(
        (acc, item) => acc + (Number(item.shippingCharges) || 0), 0
    );

    const totalPrice = subtotal + packingChargesTotal + shippingChargesTotal;

    const validate = () => {
        const e = {};
        if (!address.fullName.trim()) e.fullName = 'Full name is required';
        if (!address.phone.match(/^\d{10}$/)) e.phone = 'Enter valid 10-digit phone';
        if (!address.addressLine1.trim()) e.addressLine1 = 'Address is required';
        if (!address.city.trim()) e.city = 'City is required';
        if (!address.state.trim()) e.state = 'State is required';
        if (!address.pincode.match(/^\d{6}$/)) e.pincode = 'Enter valid 6-digit pincode';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleChange = (e) => {
        setAddress(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    };

    const handlePayNow = async () => {
        if (!validate()) return;
        setPaymentLoading(true);

        const loaded = await loadRazorpay();
        if (!loaded) {
            toast.error('Payment gateway failed to load.');
            setPaymentLoading(false);
            return;
        }

        try {
            const { data: razorpayOrder } = await axios.post(
                `${API}/payment/create-order`,
                { amount: totalPrice },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );

            const options = {
                key: razorpayOrder.keyId,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: 'Mimitiinaa',
                order_id: razorpayOrder.orderId,
                prefill: { name: address.fullName, email: user.email, contact: address.phone },
                theme: { color: '#2D5A27' },
                handler: async (response) => {
                    try {
                        const { data: verifyData } = await axios.post(
                            `${API}/payment/verify`,
                            {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            },
                            { headers: { Authorization: `Bearer ${user.token}` } }
                        );

                        if (!verifyData.success) {
                            toast.error('Payment verification failed!');
                            return;
                        }

                        const orderPayload = {
                            orderItems: selectedItems.map(item => ({
                                template: item.template?._id || item.template,
                                customizedJson: item.customizedJson || item.canvasJSON || {},
                                finalImageUrl: item.finalImageUrl || item.finalDesignUrl || '',
                                price: item.price,
                                packingCharges: item.packingCharges || 0,
                                shippingCharges: item.shippingCharges || 0,
                                quantity: item.quantity || 1
                            })),
                            shippingAddress: address,
                            subtotal,
                            packingChargesTotal,
                            shippingChargesTotal,
                            totalPrice,
                            paymentResult: verifyData.paymentResult
                        };

                        const { data: createdOrder } = await axios.post(
                            `${API}/orders`,
                            orderPayload,
                            { headers: { Authorization: `Bearer ${user.token}` } }
                        );

                        if (buyNowItem) setBuyNowItem(null);
                        else await clearCart();

                        toast.success('🎉 Order placed successfully!');
                        navigate(`/order-success/${createdOrder._id}`);
                    } catch (err) {
                        toast.error('Order creation failed.');
                    } finally {
                        setPaymentLoading(false);
                    }
                },
                modal: { ondismiss: () => setPaymentLoading(false) }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            toast.error('Payment failed to initiate.');
            setPaymentLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 py-10 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-2xl border-2 border-gray-200 bg-white shadow-sm">
                        <FaArrowLeft className="text-gray-500" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Checkout</h1>
                        <p className="text-sm text-gray-400 font-medium">Industry Standard Secure Checkout</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* LEFT COLUMN: Shipping & Address */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Progress Stepper */}
                        <div className="flex items-center gap-4 mb-2">
                             <div className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${step === 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-green-600 text-white'}`}>
                                 1. Shipping Address
                             </div>
                             <div className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${step === 2 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-200 text-gray-400'}`}>
                                 2. Payment Review
                             </div>
                        </div>

                        {/* Step 1 Form */}
                        {step === 1 && (
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <Field label="Full Name" name="fullName" value={address.fullName} onChange={handleChange} error={errors.fullName} placeholder="Your Name" />
                                    <Field label="Phone" name="phone" value={address.phone} onChange={handleChange} error={errors.phone} type="tel" placeholder="10-digit mobile" maxLength={10} />
                                    <div className="sm:col-span-2">
                                        <Field label="Address Line 1" name="addressLine1" value={address.addressLine1} onChange={handleChange} error={errors.addressLine1} placeholder="House / Street" />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <Field label="Address Line 2" name="addressLine2" value={address.addressLine2} onChange={handleChange} placeholder="Landmark / Area" />
                                    </div>
                                    <Field label="City" name="city" value={address.city} onChange={handleChange} error={errors.city} />
                                    <Field label="State" name="state" value={address.state} onChange={handleChange} error={errors.state} />
                                    <Field label="Pincode" name="pincode" value={address.pincode} onChange={handleChange} error={errors.pincode} maxLength={6} />
                                </div>
                                <div className="px-8 pb-8">
                                    <button onClick={() => { if (validate()) setStep(2); }} className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg hover:-translate-y-0.5 transition-all text-sm uppercase tracking-widest">
                                        Continue to Payment →
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2 Review */}
                        {step === 2 && (
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                                <div className="p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest">Shipping To:</h3>
                                        <button onClick={() => setStep(1)} className="text-xs font-black text-indigo-600 underline">Change Address</button>
                                    </div>
                                    <div className="bg-slate-50 p-6 rounded-2xl space-y-3">
                                        <div className="flex items-center gap-3">
                                            <FaUser className="text-slate-400 text-xs" />
                                            <p className="font-black text-slate-800">{address.fullName} <span className="text-slate-400 font-bold ml-2">| +91 {address.phone}</span></p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <FaMapMarkerAlt className="text-slate-400 text-xs mt-1" />
                                            <p className="text-slate-600 font-medium text-sm">
                                                {address.addressLine1}, {address.addressLine2 ? `${address.addressLine2}, ` : ''} 
                                                <span className="block">{address.city}, {address.state} — {address.pincode}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden sticky top-10">
                            {/* Summary Header */}
                            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                                        <FaShoppingBag className="text-white" />
                                    </div>
                                    <div>
                                        <h2 className="font-black text-slate-900 uppercase tracking-widest text-sm">Review Order</h2>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Final check before payment</p>
                                    </div>
                                </div>
                            </div>

                            {/* Item List */}
                            <div className="p-6 space-y-4 max-h-[300px] overflow-y-auto bg-white">
                                {selectedItems.map((item, i) => {
                                    const combinedPrice = Number(item.price) + (Number(item.packingCharges) || 0);
                                    return (
                                        <div key={i} className="flex gap-4 p-4 rounded-3xl bg-slate-50/50 border border-slate-100 items-start">
                                            <img 
                                                src={item.finalImageUrl || item.finalDesignUrl || 'https://placehold.co/100'} 
                                                className="w-16 h-16 rounded-xl object-cover bg-white border border-slate-100"
                                                alt={item.template?.name} 
                                            />
                                                <div className="flex-1 min-w-0">
                                                <p className="font-black text-slate-900 text-[13px] truncate uppercase">{item.template?.name || 'Product'}</p>
                                                <div className="flex flex-col gap-1 mt-1">
                                                    <span className="text-[10px] font-bold text-slate-500">Original Price: ₹{(Number(item.price) + (Number(item.packingCharges) || 0)).toLocaleString()}</span>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-100">Qty: {item.quantity || 1}</span>
                                                    </div>
                                                </div>
                                                <p className="text-[14px] font-[1000] text-slate-900 mt-2">₹{(combinedPrice * (item.quantity || 1)).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Breakdown Footer */}
                            <div className="p-8 bg-slate-50/30 border-t border-slate-100 space-y-4">
                                <div className="flex justify-between items-center text-[12px] font-bold text-slate-500 uppercase tracking-widest">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 text-[10px] shadow-sm">
                                            <FaBox />
                                        </div>
                                        <span>Product Base Price</span>
                                    </div>
                                    <span className="text-slate-900">₹{subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-[12px] font-bold text-slate-500 uppercase tracking-widest">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 text-[10px] shadow-sm">
                                            📦
                                        </div>
                                        <span>Packing Charges</span>
                                    </div>
                                    <span className="text-slate-900">+ ₹{packingChargesTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-[12px] font-bold text-slate-500 uppercase tracking-widest">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 text-[10px] shadow-sm">
                                            <FaTruck />
                                        </div>
                                        <span>Standard Shipping</span>
                                    </div>
                                    <span className={shippingChargesTotal === 0 ? 'text-emerald-500 font-black' : 'text-slate-900'}>
                                        {shippingChargesTotal === 0 ? 'FREE' : `+ ₹${shippingChargesTotal.toLocaleString()}`}
                                    </span>
                                </div>

                                <div className="pt-6 border-t-2 border-dashed border-slate-200 mt-2">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1">
                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Grand Total</p>
                                            <p className="text-[9px] text-slate-400 font-bold italic uppercase tracking-tighter">(Taxes Included)</p>
                                        </div>
                                        <p className="text-[40px] font-[1000] text-[#2D5A27] leading-[0.8] tracking-tighter">
                                            ₹{totalPrice.toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                {/* Payment Button */}
                                <div className="mt-8">
                                    {step === 2 ? (
                                        <button
                                            onClick={handlePayNow}
                                            disabled={paymentLoading}
                                            className="w-full py-5 bg-[#2D5A27] text-white font-black rounded-3xl shadow-xl shadow-green-900/10 hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-[13px]"
                                        >
                                            {paymentLoading ? (
                                                <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <><FaLock size={12} /> Pay ₹{totalPrice.toLocaleString()} Securely</>
                                            )}
                                        </button>
                                    ) : (
                                        <div className="w-full py-5 bg-slate-200 text-slate-400 font-black rounded-3xl text-center uppercase tracking-widest text-[11px]">
                                            Continue address to pay
                                        </div>
                                    )}
                                    <div className="flex justify-center items-center gap-2 mt-4 text-[10px] font-bold text-slate-400 uppercase">
                                        <FaLock size={10} /> 256-bit SSL Layered Security
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
