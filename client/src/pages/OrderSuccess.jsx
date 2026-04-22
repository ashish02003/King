import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE as API } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
    FaCheckCircle, FaShoppingBag, FaTruck, FaBox,
    FaMapMarkerAlt, FaPhone, FaUser, FaHome, FaClipboardList,
    FaMoneyBillWave, FaCreditCard, FaGift, FaStar, FaHeart
} from 'react-icons/fa';
import { MdLocalShipping } from 'react-icons/md';

// ── Confetti Particle ───────────────────────────────────────────────────────
const ConfettiCanvas = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const colors = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#2D5A27'];
        const particles = Array.from({ length: 120 }, () => ({
            x: Math.random() * canvas.width,
            y: -20,
            r: Math.random() * 8 + 3,
            d: Math.random() * 120 + 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.floor(Math.random() * 10) - 10,
            tiltAngle: 0,
            tiltAngleInc: Math.random() * 0.07 + 0.05,
            vx: Math.random() * 2 - 1,
            vy: Math.random() * 3 + 1.5,
            opacity: 1,
            shape: Math.random() > 0.5 ? 'rect' : 'circle'
        }));

        let frame = 0;
        let animId;

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            frame++;
            particles.forEach((p) => {
                p.tiltAngle += p.tiltAngleInc;
                p.y += p.vy;
                p.x += p.vx;
                p.tilt = Math.sin(p.tiltAngle) * 12;
                p.opacity = Math.max(0, 1 - p.y / (canvas.height * 0.9));
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color;
                if (p.shape === 'rect') {
                    ctx.save();
                    ctx.translate(p.x + p.tilt, p.y);
                    ctx.rotate(p.tiltAngle);
                    ctx.fillRect(-p.r / 2, -p.r / 2, p.r * 2, p.r);
                    ctx.restore();
                } else {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
            ctx.globalAlpha = 1;
            if (frame < 200) animId = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(animId);
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-50"
            style={{ mixBlendMode: 'multiply' }}
        />
    );
};

// ── Status Config ────────────────────────────────────────────────────────────
const statusConfig = {
    'Pending': { color: 'bg-amber-100 text-amber-700', icon: '⏳' },
    'Order Confirmed': { color: 'bg-blue-100 text-blue-700', icon: '✅' },
    'Packed': { color: 'bg-yellow-100 text-yellow-700', icon: '📦' },
    'Shipped': { color: 'bg-purple-100 text-purple-700', icon: '🚚' },
    'Out for Delivery': { color: 'bg-orange-100 text-orange-700', icon: '🛵' },
    'Delivered': { color: 'bg-green-100 text-green-700', icon: '🎉' },
    'Cancelled': { color: 'bg-red-100 text-red-700', icon: '❌' },
};

const paymentStatusConfig = {
    'Paid': { color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: <FaCheckCircle className="text-emerald-500" />, label: 'Paid' },
    'To be paid on delivery': { color: 'text-amber-700 bg-amber-50 border-amber-200', icon: <FaMoneyBillWave className="text-amber-500" />, label: 'To be paid on delivery' },
    'Pending': { color: 'text-slate-600 bg-slate-50 border-slate-200', icon: <FaClipboardList className="text-slate-400" />, label: 'Pending' },
    'Failed': { color: 'text-red-600 bg-red-50 border-red-200', icon: <FaClipboardList className="text-red-400" />, label: 'Failed' },
};

const OrderSuccess = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showConfetti, setShowConfetti] = useState(true);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        const fetchOrder = async () => {
            try {
                const { data } = await axios.get(`${API}/orders/${id}`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setOrder(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
        const timer = setTimeout(() => setShowConfetti(false), 4000);
        return () => clearTimeout(timer);
    }, [id, user]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400 font-bold uppercase text-sm tracking-widest">Loading your order...</p>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500 text-lg font-bold">Order not found.</p>
                    <Link to="/" className="mt-4 inline-block text-indigo-600 font-black">← Go Home</Link>
                </div>
            </div>
        );
    }

    const isCOD = order.paymentMethod === 'cod';
    const statusInfo = statusConfig[order.orderStatus] || statusConfig['Pending'];
    const payInfo = paymentStatusConfig[order.paymentStatus] || paymentStatusConfig['Pending'];
    const addr = order.shippingAddress;
    const orderShort = order._id.slice(-8).toUpperCase();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 py-12 px-4 relative overflow-hidden">
            {showConfetti && <ConfettiCanvas />}

            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-100/30 rounded-full blur-3xl" />
            </div>

            <div className="max-w-2xl mx-auto space-y-6 relative">

                {/* ── THANK YOU HERO CARD ────────────────────────────────────── */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100/80 overflow-hidden">
                    {/* Gradient top bar */}
                    <div className={`h-2 ${isCOD ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400' : 'bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500'}`} />

                    <div className="px-10 py-10 text-center">
                        {/* Big animated icon */}
                        <div className="relative inline-flex items-center justify-center mb-6">
                            <div className={`w-28 h-28 rounded-full flex items-center justify-center shadow-xl ${isCOD ? 'bg-amber-50 shadow-amber-100' : 'bg-green-50 shadow-green-100'}`}>
                                {isCOD ? (
                                    <FaMoneyBillWave className="text-amber-500 text-5xl" />
                                ) : (
                                    <FaCheckCircle className="text-green-500 text-5xl" />
                                )}
                            </div>
                            {/* Sparkle badges */}
                            <div className="absolute -top-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                <FaStar className="text-white text-xs" />
                            </div>
                            <div className="absolute -bottom-1 -left-1 w-7 h-7 bg-pink-400 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                <FaHeart className="text-white text-[10px]" />
                            </div>
                        </div>

                        {/* Thank you message */}
                        <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
                            {isCOD ? 'Order Placed! 🛵' : 'Payment Successful! 🎉'}
                        </h1>
                        <p className="text-gray-400 font-medium text-sm leading-relaxed max-w-sm mx-auto">
                            {isCOD
                                ? `Thank you for your order! Please keep ₹${order.totalPrice?.toLocaleString()} ready at the time of delivery.`
                                : 'Thank you for shopping with us! Your payment was successful and we\'ll start processing your order right away.'
                            }
                        </p>

                        {/* Order ID tag */}
                        <div className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-gray-50 border border-gray-200 rounded-full">
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Order</span>
                            <span className="text-sm font-black text-gray-900 font-mono">#{orderShort}</span>
                        </div>
                    </div>
                </div>

                {/* ── STATUS GRID ────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Order Status */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Order Status</p>
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${statusInfo.color}`}>
                            <span>{statusInfo.icon}</span>
                            Pending
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium mt-2">Your order is being processed</p>
                    </div>

                    {/* Payment Status */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Payment Status</p>
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black border ${payInfo.color}`}>
                            {payInfo.icon}
                            <span>{payInfo.label}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium mt-2">
                            {isCOD ? 'Pay when you receive' : 'Payment confirmed'}
                        </p>
                    </div>

                    {/* Payment Method */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Payment Method</p>
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black ${isCOD ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'}`}>
                            {isCOD ? <FaMoneyBillWave /> : <FaCreditCard />}
                            {isCOD ? 'Cash on Delivery' : 'Online Payment'}
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                            {isCOD ? 'Amount Payable' : 'Amount Paid'}
                        </p>
                        <p className="text-2xl font-black" style={{ color: '#2D5A27' }}>₹{order.totalPrice?.toLocaleString()}</p>
                        {isCOD && <p className="text-[10px] text-amber-600 font-bold mt-1">Pay on delivery</p>}
                    </div>
                </div>

                {/* ── COD REMINDER BANNER ────────────────────────────────────── */}
                {isCOD && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl border border-amber-200 p-6 flex items-start gap-4 shadow-sm">
                        <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-200">
                            <MdLocalShipping className="text-white text-xl" />
                        </div>
                        <div>
                            <p className="font-black text-amber-900 text-sm uppercase tracking-wide mb-1">Cash on Delivery Instructions</p>
                            <p className="text-amber-700 text-xs font-medium leading-relaxed">
                                Please keep <span className="font-black">₹{order.totalPrice?.toLocaleString()}</span> in cash ready at the time of delivery.
                                Our delivery partner will collect the payment from you at your doorstep.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── PRICE BREAKDOWN ────────────────────────────────────────── */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-8 py-5 border-b border-gray-50">
                        <h2 className="font-black text-gray-800 flex items-center gap-2">
                            <FaBox className="text-orange-500" />
                            Price Breakdown
                        </h2>
                    </div>
                    <div className="p-8 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500 font-medium tracking-tight">Product Cost (Incl. GST)</span>
                            <span className="font-bold text-gray-800">₹{order.subtotal?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500 font-medium tracking-tight">Packing Charges</span>
                            <span className={`font-bold ${order.packingChargesTotal > 0 ? 'text-gray-800' : 'text-gray-300'}`}>
                                ₹{order.packingChargesTotal?.toLocaleString() || '0'}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500 font-medium tracking-tight">Shipping Fee</span>
                            <span className={`font-bold ${order.shippingChargesTotal === 0 ? 'text-green-600' : 'text-gray-800'}`}>
                                {order.shippingChargesTotal === 0 ? 'FREE' : `₹${order.shippingChargesTotal?.toLocaleString()}`}
                            </span>
                        </div>
                        <div className="border-t pt-3 flex justify-between">
                            <span className="font-black text-gray-800">Total {isCOD ? 'Payable' : 'Paid'}</span>
                            <span className="font-black text-xl" style={{ color: '#2D5A27' }}>₹{order.totalPrice?.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* ── DELIVERY ADDRESS ───────────────────────────────────────── */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-8 py-5 border-b border-gray-50">
                        <h2 className="font-black text-gray-800 flex items-center gap-2">
                            <FaMapMarkerAlt className="text-red-500" />
                            Delivery Address
                        </h2>
                    </div>
                    <div className="p-8">
                        <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                            <div className="flex items-center gap-2">
                                <FaUser className="text-gray-400 text-xs" />
                                <span className="font-black text-gray-800">{addr?.fullName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaPhone className="text-gray-400 text-xs" />
                                <span className="text-gray-600 font-medium">+91 {addr?.phone}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <FaMapMarkerAlt className="text-gray-400 text-xs mt-1" />
                                <span className="text-gray-600 font-medium">
                                    {addr?.addressLine1}
                                    {addr?.addressLine2 && `, ${addr.addressLine2}`}
                                    , {addr?.city}, {addr?.state} — {addr?.pincode}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── TRACKING INFO (if AWB) ─────────────────────────────────── */}
                {order.shippingInfo?.awbCode && (
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-3xl border border-indigo-100 overflow-hidden">
                        <div className="px-8 py-5 border-b border-indigo-100">
                            <h2 className="font-black text-indigo-800 flex items-center gap-2">
                                <FaTruck className="text-indigo-500" />
                                Shipping Tracking
                            </h2>
                        </div>
                        <div className="p-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <p className="text-xs font-black uppercase text-indigo-400 tracking-wider mb-1">AWB / Tracking ID</p>
                                <p className="font-black text-indigo-800 text-lg">{order.shippingInfo.awbCode}</p>
                            </div>
                            {order.shippingInfo.courier && (
                                <div>
                                    <p className="text-xs font-black uppercase text-indigo-400 tracking-wider mb-1">Courier Partner</p>
                                    <p className="font-black text-indigo-800">{order.shippingInfo.courier}</p>
                                </div>
                            )}
                            {order.shippingInfo.trackingUrl && (
                                <div>
                                    <a
                                        href={order.shippingInfo.trackingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                                    >
                                        <FaTruck /> Track Order
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── WHAT'S NEXT BANNER ────────────────────────────────────── */}
                <div className="bg-gradient-to-r from-gray-900 to-slate-800 rounded-3xl p-8">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">What happens next?</p>
                    <div className="space-y-3">
                        {[
                            { icon: '✅', text: 'Order received & being processed', sub: 'Right now' },
                            { icon: '📦', text: 'Your item gets packed carefully', sub: '1–2 business days' },
                            { icon: '🚚', text: 'Shipped to your address', sub: '2–5 business days' },
                            { icon: isCOD ? '💵' : '🎁', text: isCOD ? 'Pay when your order arrives' : 'Delivered to your doorstep', sub: 'Enjoy your order!' },
                        ].map((step, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <span className="text-xl">{step.icon}</span>
                                <div>
                                    <p className="text-white font-bold text-sm">{step.text}</p>
                                    <p className="text-gray-500 text-xs font-medium">{step.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── ACTION BUTTONS ────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                        to="/profile"
                        className="flex-1 py-4 bg-[#700000] hover:bg-[#5a0000] text-white rounded-2xl font-black text-center text-sm uppercase tracking-widest transition-all shadow-lg shadow-red-900/10 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    >
                        <FaClipboardList /> View My Orders
                    </Link>
                    <Link
                        to="/"
                        className="flex-1 py-4 bg-white border-2 border-gray-200 text-gray-600 rounded-2xl font-black text-center text-sm uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                    >
                        <FaHome /> Continue Shopping
                    </Link>
                </div>

            </div>
        </div>
    );
};

export default OrderSuccess;
