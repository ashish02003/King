import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { API_BASE as API } from '../utils/api';
import {
    FaArrowLeft, FaLock,
    FaCreditCard, FaMoneyBillWave, FaShieldAlt, FaCheckCircle, FaArrowRight
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const loadRazorpay = () => new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
});

const CheckoutField = ({ label, name, value, onChange, error, type = 'text', placeholder, maxLength }) => (
    <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider ml-1">{label}</label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            maxLength={maxLength}
            className={`input-luxury w-full ${error ? 'border-red-500/50 focus:border-red-500' : ''}`}
        />
        {error && <p className="text-[10px] text-red-400 font-medium ml-1">{error}</p>}
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
    const [paymentMethod, setPaymentMethod] = useState('razorpay');

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
        if (!user) { navigate('/login'); return; }
        if (!buyNowItem && selectedItems.length === 0) { navigate('/cart'); }
    }, [user, selectedItems, buyNowItem]);

    const productBaseTotal = selectedItems.reduce((acc, item) => acc + (Number(item.price) * (item.quantity || 1)), 0);
    const gstTotal = selectedItems.reduce((acc, item) => acc + (((Number(item.price) * (Number(item.gst) || 0)) / 100) * (item.quantity || 1)), 0);
    const subtotalWithGst = productBaseTotal + gstTotal;
    const packingChargesTotal = selectedItems.reduce((acc, item) => acc + ((Number(item.packingCharges) || 0) * (item.quantity || 1)), 0);
    const shippingChargesTotal = selectedItems.reduce((acc, item) => acc + (Number(item.shippingCharges) || 0), 0);
    const totalPrice = Math.round(subtotalWithGst + packingChargesTotal + shippingChargesTotal);

    const validate = () => {
        const e = {};
        if (!address.fullName.trim()) e.fullName = 'Name is required';
        if (!address.phone.match(/^\d{10}$/)) e.phone = '10-digit phone required';
        if (!address.addressLine1.trim()) e.addressLine1 = 'Address is required';
        if (!address.city.trim()) e.city = 'City is required';
        if (!address.state.trim()) e.state = 'State is required';
        if (!address.pincode.match(/^\d{6}$/)) e.pincode = '6-digit pincode required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleChange = (e) => {
        setAddress(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    };

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
            const { data } = await axios.post(`${API}/orders`, orderPayload, { headers: { Authorization: `Bearer ${user.token}` } });
            if (buyNowItem) setBuyNowItem(null); else await clearCart();
            toast.success('Order placed successfully!');
            navigate(`/order-success/${data._id}`, { replace: true });
        } catch (err) {
            toast.error('Order failed. Please try again.');
        } finally { setPaymentLoading(false); }
    };

    const handleRazorpayOrder = async () => {
        setPaymentLoading(true);
        const loaded = await loadRazorpay();
        if (!loaded) { toast.error('Payment gateway error'); setPaymentLoading(false); return; }
        try {
            const { data: rzOrder } = await axios.post(`${API}/payment/create-order`, { amount: totalPrice }, { headers: { Authorization: `Bearer ${user.token}` } });
            const options = {
                key: rzOrder.keyId,
                amount: rzOrder.amount,
                currency: rzOrder.currency,
                name: 'Mimitiinaa',
                order_id: rzOrder.orderId,
                prefill: { name: address.fullName, email: user.email, contact: address.phone },
                theme: { color: '#C9A14A' },
                handler: async (response) => {
                    try {
                        const { data: vData } = await axios.post(`${API}/payment/verify`, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        }, { headers: { Authorization: `Bearer ${user.token}` } });

                        if (!vData.success) { toast.error('Verification failed'); return; }

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
                            paymentResult: vData.paymentResult,
                            isBuyNow: !!buyNowItem
                        };
                        const { data } = await axios.post(`${API}/orders`, orderPayload, { headers: { Authorization: `Bearer ${user.token}` } });
                        if (buyNowItem) setBuyNowItem(null); else await clearCart();
                        toast.success('Order placed successfully!');
                        navigate(`/order-success/${data._id}`, { replace: true });
                    } catch (err) { toast.error('Finalization failed.'); } finally { setPaymentLoading(false); }
                },
                modal: { ondismiss: () => setPaymentLoading(false) }
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) { toast.error('Payment gateway error.'); setPaymentLoading(false); }
    };

    const handlePlaceOrder = () => { if (paymentMethod === 'cod') handleCODOrder(); else handleRazorpayOrder(); };

    return (
        <div className="min-h-screen bg-primary-dark pt-28 pb-20">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                <div className="flex items-center gap-5 mb-10">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-luxury border border-white/10 hover:border-gold/40 transition-all">
                        <FaArrowLeft className="text-white/40" size={13} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-serif text-white">Checkout</h1>
                        <p className="text-gold text-[10px] font-medium uppercase tracking-[0.2em] mt-0.5">Secure & Encrypted</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-6">
                        {/* Stepper */}
                        <div className="flex items-center gap-6 border-b border-white/[0.06] pb-6">
                            <button onClick={() => setStep(1)} className={`text-[11px] font-semibold uppercase tracking-wider flex items-center gap-2.5 ${step === 1 ? 'text-gold' : 'text-white/40'}`}>
                                <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] ${step === 1 ? 'border-gold bg-gold text-primary-dark' : 'border-white/10'}`}>1</span>
                                Shipping
                            </button>
                            <div className="flex-1 h-[1px] bg-white/[0.06]"></div>
                            <button disabled={step < 2} className={`text-[11px] font-semibold uppercase tracking-wider flex items-center gap-2.5 ${step === 2 ? 'text-gold' : 'text-white/40'}`}>
                                <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] ${step === 2 ? 'border-gold bg-gold text-primary-dark' : 'border-white/10'}`}>2</span>
                                Payment
                            </button>
                        </div>

                        {step === 1 ? (
                            <div className="luxury-card p-8 md:p-10 space-y-6 animate-fadeIn">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <CheckoutField label="Full Name" name="fullName" value={address.fullName} onChange={handleChange} error={errors.fullName} placeholder="Your full name" />
                                    <CheckoutField label="Phone" name="phone" value={address.phone} onChange={handleChange} error={errors.phone} type="tel" placeholder="10-digit mobile" maxLength={10} />
                                    <div className="md:col-span-2">
                                        <CheckoutField label="Address Line 1" name="addressLine1" value={address.addressLine1} onChange={handleChange} error={errors.addressLine1} placeholder="House, Building, Street" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <CheckoutField label="Address Line 2" name="addressLine2" value={address.addressLine2} onChange={handleChange} placeholder="Landmark (Optional)" />
                                    </div>
                                    <CheckoutField label="City" name="city" value={address.city} onChange={handleChange} error={errors.city} />
                                    <CheckoutField label="State" name="state" value={address.state} onChange={handleChange} error={errors.state} />
                                    <CheckoutField label="Pincode" name="pincode" value={address.pincode} onChange={handleChange} error={errors.pincode} maxLength={6} />
                                </div>

                                <div className="flex flex-col gap-5 pt-6 border-t border-white/[0.06]">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="w-4 h-4 rounded border-white/10 bg-primary-light text-gold focus:ring-gold accent-gold" />
                                        <span className="text-xs text-white/40">Save this address for future orders</span>
                                    </label>

                                    <button
                                        onClick={async () => {
                                            if (validate()) {
                                                if (saveAddress) {
                                                    setSavingAddress(true);
                                                    await updateProfile(address.fullName, user.email, {
                                                        phone: address.phone, addressLine1: address.addressLine1, addressLine2: address.addressLine2,
                                                        city: address.city, state: address.state, pincode: address.pincode
                                                    });
                                                    setSavingAddress(false);
                                                }
                                                setStep(2);
                                            }
                                        }}
                                        disabled={savingAddress}
                                        className="btn-gold w-full py-3.5 flex items-center justify-center gap-2.5 disabled:opacity-50"
                                    >
                                        {savingAddress ? 'Saving...' : 'Continue to Payment'}
                                        <FaArrowRight size={11} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-fadeIn">
                                <div className="luxury-card p-6 flex justify-between items-center">
                                    <div className="space-y-1">
                                        <h3 className="text-[11px] font-medium text-gold uppercase tracking-wider">Shipping To</h3>
                                        <p className="text-white font-medium text-sm">{address.fullName} • {address.city}</p>
                                        <p className="text-white/40 text-xs">{address.addressLine1}</p>
                                    </div>
                                    <button onClick={() => setStep(1)} className="text-[10px] font-medium text-gold uppercase tracking-wider hover:underline">Edit</button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setPaymentMethod('razorpay')}
                                        className={`luxury-card p-6 text-left space-y-3 transition-all duration-300 border-2 ${paymentMethod === 'razorpay' ? 'border-gold bg-gold/[0.03]' : 'border-transparent'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className={`w-10 h-10 rounded-luxury flex items-center justify-center ${paymentMethod === 'razorpay' ? 'bg-gold text-primary-dark' : 'bg-primary-light text-white/40'}`}>
                                                <FaCreditCard size={18} />
                                            </div>
                                            {paymentMethod === 'razorpay' && <FaCheckCircle className="text-gold" size={14} />}
                                        </div>
                                        <div>
                                            <h4 className="text-white font-medium text-sm">Pay Online</h4>
                                            <p className="text-white/30 text-[11px] mt-0.5">UPI, Cards, NetBanking</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => setPaymentMethod('cod')}
                                        className={`luxury-card p-6 text-left space-y-3 transition-all duration-300 border-2 ${paymentMethod === 'cod' ? 'border-gold bg-gold/[0.03]' : 'border-transparent'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className={`w-10 h-10 rounded-luxury flex items-center justify-center ${paymentMethod === 'cod' ? 'bg-gold text-primary-dark' : 'bg-primary-light text-white/40'}`}>
                                                <FaMoneyBillWave size={18} />
                                            </div>
                                            {paymentMethod === 'cod' && <FaCheckCircle className="text-gold" size={14} />}
                                        </div>
                                        <div>
                                            <h4 className="text-white font-medium text-sm">Cash on Delivery</h4>
                                            <p className="text-white/30 text-[11px] mt-0.5">Pay when you receive</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-4">
                        <div className="luxury-card sticky top-28 overflow-hidden">
                            <div className="p-6 border-b border-white/[0.06] bg-white/[0.02]">
                                <h2 className="text-[11px] font-semibold text-gold uppercase tracking-[0.2em]">Order Summary</h2>
                            </div>

                            <div className="p-6 space-y-4 max-h-[350px] overflow-y-auto scrollbar-hide">
                                {selectedItems.map((item, i) => (
                                    <div key={i} className="flex gap-3 items-center border-b border-white/[0.06] pb-3 last:border-0 last:pb-0">
                                        <div className="w-14 h-14 rounded-luxury bg-primary-light overflow-hidden flex-shrink-0">
                                            <img src={item.finalImageUrl || item.finalDesignUrl} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white text-xs font-medium truncate">{item.template?.name}</p>
                                            <p className="text-white/30 text-[10px] mt-0.5">Qty: {item.quantity}</p>
                                            <p className="text-white font-medium mt-1 text-sm">₹{Math.round((item.price * (1 + (item.gst || 0) / 100)) * (item.quantity || 1)).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-6 bg-primary-light space-y-3">
                                <div className="flex justify-between text-xs">
                                    <span className="text-white/40">Subtotal</span>
                                    <span className="text-white font-medium">₹{Math.round(subtotalWithGst).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-white/40">Packing</span>
                                    <span className="text-white font-medium">₹{packingChargesTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-xs pb-3 border-b border-white/[0.06]">
                                    <span className="text-white/40">Shipping</span>
                                    <span className="text-gold font-medium">{shippingChargesTotal === 0 ? 'Free' : `₹${shippingChargesTotal}`}</span>
                                </div>
                                <div className="flex justify-between items-end pt-2">
                                    <div>
                                        <p className="text-[10px] font-medium text-white/30 uppercase tracking-wider mb-0.5">Total</p>
                                        <p className="text-2xl font-serif text-white">₹{totalPrice.toLocaleString()}</p>
                                    </div>
                                </div>

                                {step === 2 && (
                                    <button
                                        disabled={paymentLoading}
                                        onClick={handlePlaceOrder}
                                        className="btn-gold w-full mt-6 flex items-center justify-center gap-2.5 py-3.5 disabled:opacity-50"
                                    >
                                        {paymentLoading ? 'Processing...' : `Place Order – ₹${totalPrice.toLocaleString()}`}
                                        <FaShieldAlt size={11} />
                                    </button>
                                )}
                                <p className="text-center text-[9px] text-white/20 uppercase tracking-wider mt-3 flex items-center justify-center gap-1.5">
                                    <FaLock size={7} /> Secure 256-bit Encryption
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
