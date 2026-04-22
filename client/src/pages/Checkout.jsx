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
    FaTruck,
    FaMoneyBillWave,
    FaCreditCard,
    FaShieldAlt
} from 'react-icons/fa';
import { MdLocalShipping } from 'react-icons/md';
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
    const { user, updateProfile } = useAuth();
    const [saveAddress, setSaveAddress] = useState(true);
    const [savingAddress, setSavingAddress] = useState(false);

    const selectedItems = buyNowItem ? [buyNowItem] : getSelectedItems();
    const [step, setStep] = useState(1);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('razorpay'); // 'razorpay' | 'cod'

    const [address, setAddress] = useState({
        fullName: user?.name || '',
        phone: user?.shippingAddress?.phone || '',
        addressLine1: user?.shippingAddress?.addressLine1 || '',
        addressLine2: user?.shippingAddress?.addressLine2 || '',
        city: user?.shippingAddress?.city || '',
        state: user?.shippingAddress?.state || '',
        pincode: user?.shippingAddress?.pincode || ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (orderPlaced) return;
        if (!user) { navigate('/login'); return; }
        if (!buyNowItem && selectedItems.length === 0) { navigate('/cart'); }
    }, [user, selectedItems, buyNowItem, orderPlaced]);

    // Price calculations
    const productBaseTotal = selectedItems.reduce((acc, item) => {
        return acc + (Number(item.price) * (item.quantity || 1));
    }, 0);

    const gstTotal = selectedItems.reduce((acc, item) => {
        const itemGst = (Number(item.price) * (Number(item.gst) || 0)) / 100;
        return acc + (itemGst * (item.quantity || 1));
    }, 0);

    const subtotalWithGst = productBaseTotal + gstTotal;

    const packingChargesTotal = selectedItems.reduce(
        (acc, item) => acc + ((Number(item.packingCharges) || 0) * (item.quantity || 1)), 0
    );

    const shippingChargesTotal = selectedItems.reduce(
        (acc, item) => acc + (Number(item.shippingCharges) || 0), 0
    );

    const totalPrice = Math.round(subtotalWithGst + packingChargesTotal + shippingChargesTotal);

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

    // ── Place COD Order ─────────────────────────────────────────────────────
    const handleCODOrder = async () => {
        setPaymentLoading(true);
        try {
            const orderPayload = {
                orderItems: selectedItems.map(item => ({
                    template: item.template?._id || item.template,
                    customizedJson: item.customizedJson || item.canvasJSON || {},
                    userUploadedImages: item.userUploadedImages || [],
                    finalImageUrl: item.finalImageUrl || item.finalDesignUrl || '',
                    price: item.price,
                    packingCharges: item.packingCharges || 0,
                    shippingCharges: item.shippingCharges || 0,
                    quantity: item.quantity || 1,
                    gst: item.gst || 0
                })),
                shippingAddress: address,
                subtotal: productBaseTotal,
                gstTotal,
                packingChargesTotal,
                shippingChargesTotal,
                totalPrice,
                paymentMethod: 'cod',
                isBuyNow: !!buyNowItem
            };

            const { data: createdOrder } = await axios.post(
                `${API}/orders`,
                orderPayload,
                { headers: { Authorization: `Bearer ${user.token}` } }
            );

            setOrderPlaced(true);
            if (buyNowItem) setBuyNowItem(null);
            else await clearCart();

            toast.success('🛵 Order placed! Pay on delivery.');
            navigate(`/order-success/${createdOrder._id}`, { replace: true });
        } catch (err) {
            toast.error('Order creation failed. Please try again.');
        } finally {
            setPaymentLoading(false);
        }
    };

    // ── Place Razorpay Order ────────────────────────────────────────────────
    const handleRazorpayOrder = async () => {
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
                theme: { color: '#563C8C' },
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
                                userUploadedImages: item.userUploadedImages || [],
                                finalImageUrl: item.finalImageUrl || item.finalDesignUrl || '',
                                price: item.price,
                                packingCharges: item.packingCharges || 0,
                                shippingCharges: item.shippingCharges || 0,
                                quantity: item.quantity || 1,
                                gst: item.gst || 0
                            })),
                            shippingAddress: address,
                            subtotal: productBaseTotal,
                            gstTotal,
                            packingChargesTotal,
                            shippingChargesTotal,
                            totalPrice,
                            paymentMethod: 'razorpay',
                            paymentResult: verifyData.paymentResult,
                            isBuyNow: !!buyNowItem
                        };

                        const { data: createdOrder } = await axios.post(
                            `${API}/orders`,
                            orderPayload,
                            { headers: { Authorization: `Bearer ${user.token}` } }
                        );

                        setOrderPlaced(true);
                        if (buyNowItem) setBuyNowItem(null);
                        else await clearCart();

                        toast.success('🎉 Order placed successfully!');
                        navigate(`/order-success/${createdOrder._id}`, { replace: true });
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

    const handlePlaceOrder = () => {
        if (paymentMethod === 'cod') handleCODOrder();
        else handleRazorpayOrder();
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
                    {/* LEFT COLUMN */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Progress Stepper */}
                        <div className="flex items-center gap-4 mb-2">
                            <div className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${step === 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-green-600 text-white'}`}>
                                1. Shipping Address
                            </div>
                            <div className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${step === 2 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-200 text-gray-400'}`}>
                                2. Payment
                            </div>
                        </div>

                        {/* Step 1: Address Form */}
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
                                <div className="px-8 pb-8 space-y-4">
                                    <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer group hover:bg-white hover:border-indigo-200 transition-all">
                                        <input
                                            type="checkbox"
                                            checked={saveAddress}
                                            onChange={(e) => setSaveAddress(e.target.checked)}
                                            className="w-5 h-5 accent-indigo-600 transition-transform group-active:scale-90"
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-gray-800 tracking-tight uppercase">Save address for future use</span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">Safe & secure checkout next time</span>
                                        </div>
                                    </label>

                                    <button 
                                        onClick={async () => { 
                                            if (validate()) {
                                                if (saveAddress) {
                                                    setSavingAddress(true);
                                                    await updateProfile(address.fullName, user.email, {
                                                        phone: address.phone,
                                                        addressLine1: address.addressLine1,
                                                        addressLine2: address.addressLine2,
                                                        city: address.city,
                                                        state: address.state,
                                                        pincode: address.pincode
                                                    });
                                                    setSavingAddress(false);
                                                }
                                                setStep(2); 
                                            }
                                        }} 
                                        disabled={savingAddress}
                                        className="w-full py-4.5 bg-luxury-purple text-white font-black rounded-2xl shadow-xl shadow-luxury-purple/20 hover:-translate-y-0.5 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                                    >
                                        {savingAddress ? 'Saving Securely...' : 'Continue to Payment ↠'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Payment Method */}
                        {step === 2 && (
                            <div className="space-y-5">
                                {/* Address summary */}
                                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-2">
                                                <FaMapMarkerAlt className="text-indigo-500" /> Shipping To
                                            </h3>
                                            <button onClick={() => setStep(1)} className="text-xs font-black text-indigo-600 underline">Change</button>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
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

                                {/* Payment Method Selection */}
                                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="p-6 border-b border-gray-50">
                                        <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest flex items-center gap-2">
                                            <FaCreditCard className="text-indigo-500" /> Select Payment Method
                                        </h3>
                                    </div>
                                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Razorpay Option */}
                                        <button
                                            onClick={() => setPaymentMethod('razorpay')}
                                            className={`relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all text-left group ${
                                                paymentMethod === 'razorpay'
                                                    ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100'
                                                    : 'border-gray-200 bg-gray-50 hover:border-indigo-300'
                                            }`}
                                        >
                                            {paymentMethod === 'razorpay' && (
                                                <div className="absolute top-3 right-3 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                                                    <FaCheckCircle className="text-white text-xs" />
                                                </div>
                                            )}
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${paymentMethod === 'razorpay' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-400'}`}>
                                                <FaCreditCard />
                                            </div>
                                            <div className="text-center">
                                                <p className="font-black text-gray-900 text-sm uppercase tracking-wide">Pay Online</p>
                                                <p className="text-xs text-gray-500 font-medium mt-1">UPI, Cards, NetBanking, Wallets</p>
                                                <div className="flex items-center justify-center gap-1 mt-2 text-[10px] font-bold text-green-600 uppercase tracking-widest">
                                                    <FaShieldAlt size={8} /> Secure Payment
                                                </div>
                                            </div>
                                        </button>

                                        {/* COD Option */}
                                        <button
                                            onClick={() => setPaymentMethod('cod')}
                                            className={`relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all text-left group ${
                                                paymentMethod === 'cod'
                                                    ? 'border-amber-500 bg-amber-50 shadow-lg shadow-amber-100'
                                                    : 'border-gray-200 bg-gray-50 hover:border-amber-300'
                                            }`}
                                        >
                                            {paymentMethod === 'cod' && (
                                                <div className="absolute top-3 right-3 w-5 h-5 bg-amber-600 rounded-full flex items-center justify-center">
                                                    <FaCheckCircle className="text-white text-xs" />
                                                </div>
                                            )}
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${paymentMethod === 'cod' ? 'bg-amber-500 text-white' : 'bg-white text-amber-400'}`}>
                                                <FaMoneyBillWave />
                                            </div>
                                            <div className="text-center">
                                                <p className="font-black text-gray-900 text-sm uppercase tracking-wide">Cash on Delivery</p>
                                                <p className="text-xs text-gray-500 font-medium mt-1">Pay when you receive the order</p>
                                                <div className="flex items-center justify-center gap-1 mt-2 text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                                                    <MdLocalShipping size={10} /> Pay on Delivery
                                                </div>
                                            </div>
                                        </button>
                                    </div>

                                    {/* COD notice */}
                                    {paymentMethod === 'cod' && (
                                        <div className="mx-6 mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                                            <FaMoneyBillWave className="text-amber-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-xs font-black text-amber-800 uppercase tracking-wide">Cash on Delivery Selected</p>
                                                <p className="text-xs text-amber-700 font-medium mt-1">
                                                    Please keep ₹{totalPrice.toLocaleString()} ready at the time of delivery. Our delivery partner will collect the payment.
                                                </p>
                                            </div>
                                        </div>
                                    )}
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
                                                    <span className="text-[10px] font-bold text-slate-500">Unit Price: ₹{Math.round(Number(item.price) * (1 + (Number(item.gst) || 0) / 100)).toLocaleString()} (Incl. GST)</span>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[10px] font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-100">Qty: {item.quantity || 1}</span>
                                                    </div>
                                                </div>
                                                <p className="text-[14px] font-[1000] text-slate-900 mt-2">₹{Math.round((Number(item.price) * (1 + (Number(item.gst) || 0) / 100)) * (item.quantity || 1)).toLocaleString()}</p>
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
                                        <span>Product Cost (Incl. GST)</span>
                                    </div>
                                    <span className="text-slate-900">₹{Math.round(subtotalWithGst).toLocaleString()}</span>
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
                                            ₹{Math.round(totalPrice).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                {/* Payment Badge */}
                                {step === 2 && paymentMethod === 'cod' && (
                                    <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                                        <FaMoneyBillWave className="text-amber-500" size={12} />
                                        <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Pay on Delivery</span>
                                    </div>
                                )}

                                {/* CTA Button */}
                                <div className="mt-8">
                                    {step === 2 ? (
                                        <button
                                            onClick={handlePlaceOrder}
                                            disabled={paymentLoading}
                                            className={`w-full py-5 text-white font-black rounded-3xl shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest text-[13px] ${
                                                paymentMethod === 'cod'
                                                    ? 'bg-luxury-gold hover:bg-luxury-gold-dark shadow-luxury-gold/20'
                                                    : 'bg-luxury-purple hover:bg-luxury-purple-dark shadow-luxury-purple/20'
                                            }`}
                                        >
                                            {paymentLoading ? (
                                                <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : paymentMethod === 'cod' ? (
                                                <><FaMoneyBillWave size={12} /> Place COD Order – ₹{totalPrice.toLocaleString()}</>
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
