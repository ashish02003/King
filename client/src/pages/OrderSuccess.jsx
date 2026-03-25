import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE as API } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
    FaCheckCircle, FaShoppingBag, FaTruck, FaBox,
    FaMapMarkerAlt, FaPhone, FaUser, FaHome, FaClipboardList
} from 'react-icons/fa';

const statusConfig = {
    'Order Confirmed': { color: 'bg-blue-100 text-blue-700', icon: '✅', step: 1 },
    'Packed': { color: 'bg-yellow-100 text-yellow-700', icon: '📦', step: 2 },
    'Shipped': { color: 'bg-purple-100 text-purple-700', icon: '🚚', step: 3 },
    'Out for Delivery': { color: 'bg-orange-100 text-orange-700', icon: '🛵', step: 4 },
    'Delivered': { color: 'bg-green-100 text-green-700', icon: '🎉', step: 5 },
    'Cancelled': { color: 'bg-red-100 text-red-700', icon: '❌', step: 0 },
};

const OrderSuccess = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

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
    }, [id, user]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400 font-bold uppercase text-sm tracking-widest">Loading Order...</p>
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

    const statusInfo = statusConfig[order.orderStatus] || statusConfig['Order Confirmed'];
    const addr = order.shippingAddress;
    const orderShort = order._id.slice(-8).toUpperCase();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/60 py-12 px-4">
            <div className="max-w-3xl mx-auto space-y-6">

                {/* ── Success Banner ───────────────────────────────────── */}
                <div className="bg-white rounded-3xl shadow-xl border border-green-100 overflow-hidden">
                    {/* Confetti-style top bar */}
                    <div className="h-2 bg-gradient-to-r from-green-400 via-blue-500 to-indigo-500" />
                    <div className="p-10 text-center">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 animate-pulse">
                            <FaCheckCircle className="text-green-500 text-5xl" />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 mb-2">
                            Order Placed Successfully! 🎉
                        </h1>
                        <p className="text-gray-400 font-medium">
                            Thank you for your order. We'll start processing it right away.
                        </p>
                    </div>
                </div>

                {/* ── Order Details Card ───────────────────────────────── */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-8 py-5 border-b border-gray-100">
                        <h2 className="font-black text-gray-800 text-lg flex items-center gap-2">
                            <FaClipboardList className="text-indigo-500" />
                            Order Details
                        </h2>
                    </div>
                    <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="bg-gray-50 rounded-2xl p-5">
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Order ID</p>
                            <p className="text-xl font-black text-gray-800">#{orderShort}</p>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-5">
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Payment Status</p>
                            <p className="text-lg font-black text-green-600 flex items-center gap-2">
                                <FaCheckCircle />
                                {order.isPaid ? 'Paid' : 'Pending'}
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-5">
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Order Status</p>
                            <span className="text-indigo-600 font-black text-sm bg-indigo-100 px-3 py-1.5 rounded-full uppercase tracking-tighter flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                {order.orderStatus}
                            </span>
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-5">
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Amount Paid</p>
                            <p className="text-2xl font-black" style={{ color: '#2D5A27' }}>₹{order.totalPrice?.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* ── Price Breakdown ──────────────────────────────────── */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-8 py-5 border-b border-gray-100">
                        <h2 className="font-black text-gray-800 flex items-center gap-2">
                            <FaBox className="text-orange-500" />
                            Price Breakdown
                        </h2>
                    </div>
                    <div className="p-8 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500 font-medium tracking-tight">Product Cost</span>
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
                            <span className="font-black text-gray-800">Total</span>
                            <span className="font-black text-xl" style={{ color: '#2D5A27' }}>₹{order.totalPrice?.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* ── Delivery Address ─────────────────────────────────── */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-8 py-5 border-b border-gray-100">
                        <h2 className="font-black text-gray-800 flex items-center gap-2">
                            <FaMapMarkerAlt className="text-red-500" />
                            Delivery Address
                        </h2>
                    </div>
                    <div className="p-8">
                        <div className="bg-gray-50 rounded-2xl p-5 space-y-2">
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

                {/* ── Tracking Info (if AWB available) ─────────────────── */}
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

                {/* ── Action Buttons ───────────────────────────────────── */}
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
