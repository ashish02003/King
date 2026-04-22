import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE as API } from '../utils/api';
import toast from 'react-hot-toast';
import {
    Box,
    Truck,
    CheckCircle2,
    XCircle,
    Loader2,
    ChevronDown,
    ChevronUp,
    MapPin,
    Phone,
    User,
    ImageIcon,
    FileText,
    ShoppingBag,
    Search,
    Filter,
    Eye,
    Package,
    IndianRupee,
    Calendar,
    ArrowRightCircle,
    BadgeCheck,
    CreditCard,
    ExternalLink,
    Clock,
    Banknote,
    Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CONFIG = {
    'Pending': { color: 'bg-amber-50 text-amber-600 border-amber-100', dot: 'bg-amber-500', icon: <Clock size={12} />, label: 'Pending' },
    'Processing': { color: 'bg-blue-50 text-blue-600 border-blue-100', dot: 'bg-blue-500', icon: <Loader2 size={12} className="animate-spin" />, label: 'Processing' },
    'Order Confirmed': { color: 'bg-blue-50 text-blue-600 border-blue-100', dot: 'bg-blue-500', icon: <CheckCircle2 size={12} />, label: 'Confirmed' },
    'Packed': { color: 'bg-amber-50 text-amber-600 border-amber-100', dot: 'bg-amber-500', icon: <Package size={12} />, label: 'Packed' },
    'Shipped': { color: 'bg-indigo-50 text-indigo-600 border-indigo-100', dot: 'bg-indigo-500', icon: <Truck size={12} />, label: 'Shipped' },
    'Delivered': { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', dot: 'bg-emerald-500', icon: <BadgeCheck size={12} />, label: 'Delivered' },
    'Cancelled': { color: 'bg-rose-50 text-rose-600 border-rose-100', dot: 'bg-rose-500', icon: <XCircle size={12} />, label: 'Cancelled' },
};

const DELIVERY_STATUS_CONFIG = {
    'Pending': { color: 'bg-amber-50 text-amber-600', label: 'Pending' },
    'In Transit': { color: 'bg-blue-50 text-blue-600', label: 'In Transit' },
    'Out for Delivery': { color: 'bg-orange-50 text-orange-600', label: 'Out for Delivery' },
    'Delivered': { color: 'bg-emerald-50 text-emerald-600', label: 'Delivered' },
    'None': { color: 'bg-slate-50 text-slate-400', label: 'N/A' },
};

const PAYMENT_STATUS_CONFIG = {
    'Paid': { color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: <BadgeCheck size={10} />, label: 'Paid' },
    'To be paid on delivery': { color: 'bg-amber-50 text-amber-600 border-amber-200', icon: <Banknote size={10} />, label: 'Pay on Delivery' },
    'Pending': { color: 'bg-slate-50 text-slate-500 border-slate-200', icon: <Clock size={10} />, label: 'Pending' },
    'Failed': { color: 'bg-rose-50 text-rose-600 border-rose-200', icon: <XCircle size={10} />, label: 'Failed' },
};

const ALL_STATUSES = ['Pending', 'Processing', 'Order Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];
const ALL_DELIVERY_STATUSES = ['Pending', 'In Transit', 'Out for Delivery', 'Delivered', 'None'];
const ALL_PAYMENT_STATUSES = ['Pending', 'Paid', 'To be paid on delivery', 'Failed'];

const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['Pending'];
    return (
        <span className={`inline-flex items-center gap-2 px-3 py-1 border text-xs font-semibold ${cfg.color}`}>
            <span className={`w-1.5 h-1.5 ${cfg.dot} animate-pulse`} />
            {cfg.icon}
            {cfg.label}
        </span>
    );
};

const PaymentStatusBadge = ({ paymentStatus, paymentMethod }) => {
    const isCOD = paymentMethod === 'cod';
    const key = isCOD && paymentStatus !== 'Paid' ? 'To be paid on delivery' : (paymentStatus || 'Pending');
    const cfg = PAYMENT_STATUS_CONFIG[key] || PAYMENT_STATUS_CONFIG['Pending'];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-lg text-[10px] font-black uppercase tracking-wider ${cfg.color}`}>
            {cfg.icon} {cfg.label}
            {isCOD && <span className="ml-1 font-black text-[8px] opacity-70">(COD)</span>}
        </span>
    );
};

const DeliveryStatusBadge = ({ status }) => {
    const cfg = DELIVERY_STATUS_CONFIG[status] || DELIVERY_STATUS_CONFIG['None'];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-lg text-[10px] font-black uppercase tracking-wider ${cfg.color} border-current opacity-80`}>
            <Truck size={10} /> {cfg.label}
        </span>
    );
};

// ── Order Row Component ──────────────────────────────────────────────────────────────────
const OrderRow = ({ order, onStatusChange, onMarkShipped, onMarkCODPaid, onDeliveryStatusChange, index }) => {
    const [expanded, setExpanded] = useState(false);
    const [statusLoading, setStatusLoading] = useState(false);
    const [shipLoading, setShipLoading] = useState(false);
    const [deliveryStatusLoading, setDeliveryStatusLoading] = useState(false);
    const [codPaidLoading, setCodPaidLoading] = useState(false);
    const addr = order.shippingAddress;

    const handleStatusChange = async (newStatus) => {
        if (newStatus === order.orderStatus) return;
        setStatusLoading(true);
        await onStatusChange(order._id, newStatus);
        setStatusLoading(false);
    };

    const handleDeliveryStatusChange = async (newStatus) => {
        if (newStatus === order.deliveryStatus) return;
        setDeliveryStatusLoading(true);
        await onDeliveryStatusChange(order._id, newStatus);
        setDeliveryStatusLoading(false);
    };

    const handleMarkShipped = async () => {
        setShipLoading(true);
        await onMarkShipped(order._id);
        setShipLoading(false);
    };

    const handleMarkCODPaid = async () => {
        setCodPaidLoading(true);
        await onMarkCODPaid(order._id);
        setCodPaidLoading(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-white border transition-all duration-300 overflow-hidden ${expanded ? 'border-indigo-200 shadow-xl shadow-indigo-500/5' : 'border-slate-100 hover:border-indigo-100 hover:shadow-lg hover:shadow-slate-200/50'}`}
        >
            {/* ── Order Header ── */}
            <div className={`flex flex-wrap items-center gap-6 px-8 py-6 transition-colors ${expanded ? 'bg-indigo-50/30' : 'bg-white'}`}>
                {/* Order ID */}
                <div className="flex-1 min-w-[160px]">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Order Vector</span>
                        <div className="h-px w-8 bg-slate-100"></div>
                    </div>
                    <p className="text-sm font-black text-slate-900 font-mono tracking-tighter">#{order._id.slice(-10).toUpperCase()}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <Calendar size={10} strokeWidth={3} />
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        <span className="text-slate-200 mx-1">/</span>
                        <Clock size={10} strokeWidth={3} />
                        {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>

                {/* Customer */}
                <div className="flex-1 min-w-[180px]">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Entity</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs uppercase">
                            {order.user?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{order.user?.name || 'GUEST USER'}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">{order.user?.email}</p>
                        </div>
                    </div>
                </div>

                {/* Total + Payment Method */}
                <div className="min-w-[100px]">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Payload</span>
                    </div>
                    <div className="flex items-baseline gap-0.5">
                        <span className="text-sm font-black text-slate-400">₹</span>
                        <p className="text-xl font-black text-indigo-600 tracking-tighter leading-none">{order.totalPrice?.toLocaleString()}</p>
                    </div>
                    <div className={`inline-flex items-center gap-1 mt-1 font-black uppercase text-[8px] tracking-widest ${order.paymentMethod === 'cod' ? 'text-amber-500' : (order.isPaid ? 'text-emerald-500' : 'text-rose-500')
                        }`}>
                        {order.paymentMethod === 'cod' ? <Banknote size={8} strokeWidth={3} /> : (order.isPaid ? <BadgeCheck size={8} strokeWidth={3} /> : <XCircle size={8} strokeWidth={3} />)}
                        {order.paymentMethod === 'cod' ? 'COD' : (order.isPaid ? 'Prepaid' : 'Awaiting')}
                    </div>
                </div>

                {/* Status Badge + Payment */}
                <div className="min-w-[160px] space-y-2">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Operational State</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <StatusBadge status={order.orderStatus} />
                        <div className="flex items-center gap-2">
                            <PaymentStatusBadge paymentStatus={order.paymentStatus} paymentMethod={order.paymentMethod} />
                            {order.orderStatus === 'Shipped' && <DeliveryStatusBadge status={order.deliveryStatus} />}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 ml-auto">
                    {order.shippingInfo?.awbCode && (
                        <div className="hidden xl:flex flex-col items-end mr-4">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1 leading-none text-right">L-ID: {order.shippingInfo.courier?.toUpperCase()}</span>
                            <span className="text-[10px] font-black text-indigo-500 tracking-widest font-mono leading-none">{order.shippingInfo.awbCode}</span>
                        </div>
                    )}
                    <a
                        href={`/admin/invoice/${order._id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                        title="View Invoice"
                    >
                        <FileText size={20} strokeWidth={3} />
                    </a>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${expanded ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                    >
                        {expanded ? <ChevronUp size={20} strokeWidth={3} /> : <ChevronDown size={20} strokeWidth={3} />}
                    </button>
                </div>
            </div>

            {/* ── Expanded Details ── */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-50 overflow-hidden"
                    >
                        <div className="px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-10 bg-slate-50/30">

                            {/* Order Items */}
                            <div className="lg:col-span-5 space-y-6">
                                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <ShoppingBag size={14} className="text-slate-300" /> Manifest Contents
                                </h3>
                                <div className="space-y-4">
                                    {order.orderItems?.map((item, i) => (
                                        <div key={i} className="flex items-center gap-5 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group">
                                            <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                                                {item.finalImageUrl
                                                    ? <img src={item.finalImageUrl} alt="" className="w-full h-full object-cover group-hover:rotate-6 group-hover:scale-110 transition-transform duration-500" />
                                                    : <Package className="text-slate-200" size={24} />
                                                }
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-slate-900 uppercase tracking-tight leading-none mb-1 group-hover:text-indigo-600 transition-colors">{item.template?.name || 'CUSTOM BLUEPRINT'}</p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg uppercase tracking-widest leading-none">QTY: {item.quantity || 1}</span>
                                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">₹{Math.round(item.price + (item.price * (item.gst || 0) / 100))} UNIT</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {item.userUploadedImages && item.userUploadedImages.map((imgUrl, uIdx) => (
                                                    <a key={`uImg_${uIdx}`} href={imgUrl} target="_blank" rel="noopener noreferrer" title="View Original User Image"
                                                        className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white shadow-sm flex items-center justify-center transition-all group-hover:-translate-y-1">
                                                        <ImageIcon size={16} />
                                                    </a>
                                                ))}
                                                {item.finalImageUrl && (
                                                    <a href={item.finalImageUrl} target="_blank" rel="noopener noreferrer" title="View Rendered Overlay"
                                                        className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white flex items-center justify-center transition-all group-hover:-translate-y-1">
                                                        <ExternalLink size={16} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Price Matrix */}
                                <div className="bg-slate-900 rounded-3xl p-6 space-y-4 shadow-xl">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        <span>Product Cost (Incl. GST)</span>
                                        <span className="text-white">₹{Math.round((order.subtotal || 0) + (order.gstTotal || 0)).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        <span>Packing Index</span>
                                        <span className={order.packingChargesTotal > 0 ? 'text-white' : 'text-slate-700'}>₹{order.packingChargesTotal || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        <span>Logistics Fee</span>
                                        <span className={order.shippingChargesTotal === 0 ? 'text-emerald-400' : 'text-white'}>{order.shippingChargesTotal === 0 ? 'NEUTRAL' : `₹${order.shippingChargesTotal}`}</span>
                                    </div>
                                    <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-400">Grand Payload</span>
                                        <span className="text-xl font-black text-white tracking-tighter">₹{order.totalPrice?.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Delivery Address */}
                            <div className="lg:col-span-4 space-y-6">
                                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <MapPin size={14} className="text-slate-300" /> Deployment Address
                                </h3>
                                {addr ? (
                                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 flex-shrink-0">
                                                <User size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1.5 leading-none">Recipient</p>
                                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{addr.fullName}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 flex-shrink-0">
                                                <Phone size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1.5 leading-none">Contact Channel</p>
                                                <p className="text-sm font-black text-slate-900">+91 {addr.phone}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 flex-shrink-0">
                                                <MapPin size={18} />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1.5 leading-none">Geolocation</p>
                                                <p className="text-xs font-bold text-slate-600 leading-relaxed uppercase tracking-wide">
                                                    {addr.addressLine1}{addr.addressLine2 && `, ${addr.addressLine2}`}<br />
                                                    {addr.city}, {addr.state} — <span className="text-slate-900 font-black">{addr.pincode}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 rounded-3xl p-8 text-center border-2 border-dashed border-slate-100">
                                        <MapPin size={32} className="mx-auto text-slate-200 mb-2" />
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Incomplete Data Stream</p>
                                    </div>
                                )}

                                {order.paymentResult?.razorpay_payment_id && (
                                    <div className="bg-emerald-50/50 rounded-2xl p-4 flex items-center gap-4">
                                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-500">
                                            <CreditCard size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-0.5 leading-none">TXN ID</p>
                                            <p className="text-[10px] font-black text-emerald-700 font-mono tracking-tighter leading-none">{order.paymentResult.razorpay_payment_id}</p>
                                        </div>
                                    </div>
                                )}

                                {/* COD Payment Info */}
                                {order.paymentMethod === 'cod' && (
                                    <div className={`rounded-2xl p-4 flex items-center gap-4 ${order.paymentStatus === 'Paid' ? 'bg-emerald-50/50' : 'bg-amber-50/60'}`}>
                                        <div className={`p-2 rounded-xl ${order.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
                                            <Banknote size={18} />
                                        </div>
                                        <div>
                                            <p className={`text-[9px] font-black uppercase tracking-widest mb-0.5 leading-none ${order.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>Cash on Delivery</p>
                                            <p className={`text-[10px] font-black font-mono tracking-tighter leading-none ${order.paymentStatus === 'Paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                {order.paymentStatus === 'Paid' ? '✓ Payment Collected' : 'Payment Pending at Door'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Admin Controls */}
                            <div className="lg:col-span-3 space-y-6">
                                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <ArrowRightCircle size={14} className="text-slate-300" /> Operation Nexus
                                </h3>

                                <div className="space-y-4">
                                    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-4">
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block leading-none ml-1">Update Order Status</label>
                                            <div className="relative group">
                                                <select
                                                    value={order.orderStatus}
                                                    onChange={(e) => handleStatusChange(e.target.value)}
                                                    disabled={statusLoading}
                                                    className="w-full appearance-none bg-slate-50 border-none rounded-2xl px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all cursor-pointer disabled:opacity-60 outline-none"
                                                >
                                                    {ALL_STATUSES.map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-indigo-600 transition-colors">
                                                    {statusLoading ? <Loader2 className="animate-spin" size={16} /> : <ChevronDown size={16} />}
                                                </div>
                                            </div>
                                        </div>

                                        {/* COD: Mark as Paid */}
                                        {order.paymentMethod === 'cod' && order.paymentStatus !== 'Paid' && (
                                            <button
                                                onClick={handleMarkCODPaid}
                                                disabled={codPaidLoading}
                                                className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3
                                                    ${codPaidLoading
                                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                        : 'bg-amber-500 text-white hover:bg-amber-600 hover:-translate-y-1 active:scale-95 shadow-amber-100'
                                                    }`}
                                            >
                                                {codPaidLoading
                                                    ? <><Loader2 className="animate-spin" size={14} /> Updating...</>
                                                    : <><Banknote size={14} strokeWidth={3} /> Mark COD as Paid</>
                                                }
                                            </button>
                                        )}

                                        {/* Ship Now Button for Pending, Processing, or Confirmed orders */}
                                        {(order.orderStatus === 'Pending' || order.orderStatus === 'Processing' || order.orderStatus === 'Order Confirmed') && (
                                            <button
                                                onClick={handleMarkShipped}
                                                disabled={shipLoading}
                                                className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3
                                                    ${shipLoading
                                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                        : 'bg-indigo-600 text-white hover:bg-slate-900 hover:-translate-y-1 active:scale-95 shadow-indigo-100'
                                                    }`}
                                            >
                                                {shipLoading
                                                    ? <><Loader2 className="animate-spin" size={14} /> Shipping...</>
                                                    : <><Truck size={14} strokeWidth={3} /> Ship Now</>
                                                }
                                            </button>
                                        )}

                                        {/* Delivery Status Update (only when shipped) */}
                                        {order.orderStatus === 'Shipped' && (
                                            <div>
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block leading-none ml-1">Update Delivery Status</label>
                                                <div className="relative group">
                                                    <select
                                                        value={order.deliveryStatus || 'Pending'}
                                                        onChange={(e) => handleDeliveryStatusChange(e.target.value)}
                                                        disabled={deliveryStatusLoading}
                                                        className="w-full appearance-none bg-slate-50 border-none rounded-2xl px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all cursor-pointer disabled:opacity-60 outline-none"
                                                    >
                                                        {ALL_DELIVERY_STATUSES.map(s => (
                                                            <option key={s} value={s}>{s}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-indigo-600 transition-colors">
                                                        {deliveryStatusLoading ? <Loader2 className="animate-spin" size={16} /> : <ChevronDown size={16} />}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Tracking Context */}
                                    {order.shippingInfo?.awbCode && (
                                        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-4">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Logistics Context</p>
                                                <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center bg-slate-50 rounded-xl p-3">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tracking AWB</span>
                                                    <span className="text-[10px] font-black text-indigo-600 font-mono tracking-tighter">{order.shippingInfo.awbCode}</span>
                                                </div>
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Registry Handler</span>
                                                    <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">{order.shippingInfo.courier || 'UNKNOWN'}</span>
                                                </div>
                                            </div>

                                            {order.shippingInfo.trackingUrl && (
                                                <a
                                                    href={order.shippingInfo.trackingUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all group"
                                                >
                                                    Audit Transit <ExternalLink size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// ── Main AdminOrders Component ───────────────────────────────────────────────
const AdminOrders = () => {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    const fetchOrders = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API}/orders`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setOrders(data || []);
        } catch (err) {
            console.error(err);
            toast.error('Contextual stream failed to initialize');
        } finally {
            setLoading(false);
        }
    }, [user.token]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    // ── Status Change ──────────────────────────────────────────────────────
    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await axios.put(
                `${API}/orders/${orderId}/status`,
                { orderStatus: newStatus },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            setOrders(prev => prev.map(o => o._id === orderId ? { ...o, orderStatus: newStatus } : o));
            toast.success(`Order status updated to: "${newStatus}"`);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Status update failed');
        }
    };

    // ── Mark COD as Paid ───────────────────────────────────────────────────
    const handleMarkCODPaid = async (orderId) => {
        try {
            await axios.put(
                `${API}/orders/${orderId}/status`,
                { paymentStatus: 'Paid' },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            setOrders(prev => prev.map(o => o._id === orderId ? { ...o, paymentStatus: 'Paid', isPaid: true } : o));
            toast.success('COD Payment marked as collected');
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to update payment status');
        }
    };

    // ── Update Delivery Status ─────────────────────────────────────────────
    const handleDeliveryStatusChange = async (orderId, newStatus) => {
        try {
            await axios.put(
                `${API}/orders/${orderId}/status`,
                { deliveryStatus: newStatus },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            setOrders(prev => prev.map(o => o._id === orderId ? { ...o, deliveryStatus: newStatus } : o));
            toast.success(`Delivery status updated: ${newStatus}`);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Delivery status update failed');
        }
    };

    // ── Ship Order → NimbusPost ───────────────────────────────────────────
    const handleMarkShipped = async (orderId) => {
        const toastId = toast.loading('Initializing Nimbus Logistics Protocol...');
        try {
            const { data } = await axios.put(
                `${API}/orders/${orderId}/ship`,
                {},
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            setOrders(prev => prev.map(o => o._id === orderId ? data.order : o));
            if (data.awbCode) {
                toast.success(`Logistics Active: AWB ${data.awbCode}`, { id: toastId, duration: 5000 });
            } else {
                toast.success('Wait-state initialized (Manual Check for AWB)', { id: toastId });
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Logistics handshake failed', { id: toastId });
        }
    };

    // ── KPIs ───────────────────────────────────────────────────────────────
    const kpis = {
        total: orders.length,
        paid: orders.filter(o => o.isPaid).length,
        cod: orders.filter(o => o.paymentMethod === 'cod').length,
        packed: orders.filter(o => ['Packed', 'Shipped', 'Out for Delivery', 'Delivered'].includes(o.orderStatus)).length,
        delivered: orders.filter(o => o.orderStatus === 'Delivered').length,
        revenue: orders.filter(o => o.isPaid).reduce((s, o) => s + (o.totalPrice || 0), 0),
    };

    // ── Filters ────────────────────────────────────────────────────────────
    const filtered = orders.filter(o => {
        const matchSearch = search === '' ||
            o._id.toLowerCase().includes(search.toLowerCase()) ||
            o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
            o.user?.email?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'All' || o.orderStatus === filterStatus;
        return matchSearch && matchStatus;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-10">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase mb-2 leading-none">Command & Control</h1>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">End-to-end logistics monitoring and fulfillment nexus</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-indigo-50 text-indigo-600 px-6 py-4 rounded-2xl flex flex-col justify-center items-center shadow-sm">
                        <span className="text-[8px] font-black uppercase tracking-widest leading-none mb-1 text-indigo-400">Yield</span>
                        <span className="text-lg font-black tracking-tighter leading-none">₹{kpis.revenue.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* ── KPI Stream ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Orders', value: kpis.total, icon: <ArrowRightCircle size={18} />, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Paid Online', value: kpis.paid, icon: <BadgeCheck size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'COD Orders', value: kpis.cod, icon: <Banknote size={18} />, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Delivered', value: kpis.delivered, icon: <CheckCircle2 size={18} />, color: 'text-slate-900', bg: 'bg-slate-100' },
                ].map((kpi, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-colors"
                    >
                        <div>
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1 leading-none">{kpi.label}</p>
                            <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{kpi.value.toLocaleString()}</p>
                        </div>
                        <div className={`w-12 h-12 rounded-2xl ${kpi.bg} ${kpi.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                            {kpi.icon}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ── Search + Filter Nexus ── */}
            <div className="bg-white rounded-[2.5rem] p-3 shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-4">
                <div className="flex-1 min-w-[300px] relative group px-2">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={16} />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="SEARCH VECTORS BY ID, ENTITY OR EMAIL..."
                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-[10px] font-black tracking-widest uppercase text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all placeholder:text-slate-300"
                    />
                </div>
                <div className="flex items-center gap-4 w-full lg:w-auto px-2">
                    <div className="relative group flex-1 lg:w-64">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="w-full appearance-none pl-10 pr-10 py-4 bg-slate-50 border-none rounded-2xl text-[10px] font-black tracking-widest uppercase text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all cursor-pointer"
                        >
                            <option value="All">All Status Filters</option>
                            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-focus-within:text-indigo-600 transition-colors" size={16} />
                    </div>
                    <span className="hidden xl:flex text-[9px] font-black text-slate-400 bg-slate-50 px-4 py-4 rounded-2xl uppercase tracking-[0.2em]">
                        {filtered.length} Indexed
                    </span>
                </div>
            </div>

            {/* ── Orders Flow ── */}
            <div className="space-y-6">
                {loading ? (
                    <div className="space-y-6 py-12">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-slate-100 rounded-[2rem] animate-pulse"></div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-32 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                            <Box size={32} className="text-slate-200" />
                        </div>
                        <p className="text-xl font-black text-slate-900 uppercase">Registry Empty</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">No matching vectors found in search parameters</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map((order, idx) => (
                            <OrderRow
                                key={order._id}
                                order={order}
                                onStatusChange={handleStatusChange}
                                onMarkShipped={handleMarkShipped}
                                onMarkCODPaid={handleMarkCODPaid}
                                onDeliveryStatusChange={handleDeliveryStatusChange}
                                index={idx}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminOrders;
