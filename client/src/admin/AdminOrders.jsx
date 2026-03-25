import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE as API } from '../utils/api';
import toast from 'react-hot-toast';
import { FaBox, FaTruck, FaCheckCircle, FaTimesCircle, FaSpinner, FaChevronDown, FaChevronUp, FaMapMarkerAlt, FaPhone, FaUser, FaShoppingBag, FaSearch, FaFilter, FaEye, FaBoxOpen } from 'react-icons/fa';

const STATUS_CONFIG = {
    'Order Confirmed': { color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500', icon: <FaCheckCircle />, label: 'Order Confirmed' },
    'Packed': { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500', icon: <FaBox />, label: 'Packed' },
    'Shipped': { color: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500', icon: <FaTruck />, label: 'Shipped' },
    'Out for Delivery': { color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500', icon: <FaTruck />, label: 'Out for Delivery' },
    'Delivered': { color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-500', icon: <FaCheckCircle />, label: 'Delivered' },
    'Cancelled': { color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', icon: <FaTimesCircle />, label: 'Cancelled' },
};

const ALL_STATUSES = ['Order Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['Order Confirmed'];
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black uppercase tracking-wider ${cfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
};

// ── Order Row Component ──────────────────────────────────────────────────────
const OrderRow = ({ order, onStatusChange, onMarkPacked }) => {
    const [expanded, setExpanded] = useState(false);
    const [statusLoading, setStatusLoading] = useState(false);
    const [packLoading, setPackLoading] = useState(false);
    const addr = order.shippingAddress;

    const handleStatusChange = async (newStatus) => {
        if (newStatus === order.orderStatus) return;
        setStatusLoading(true);
        await onStatusChange(order._id, newStatus);
        setStatusLoading(false);
    };

    const handleMarkPacked = async () => {
        setPackLoading(true);
        await onMarkPacked(order._id);
        setPackLoading(false);
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-indigo-200 hover:shadow-md transition-all">
            {/* ── Order Header ── */}
            <div className="flex flex-wrap items-center gap-4 px-6 py-4 bg-gray-50/70">
                {/* Order ID */}
                <div className="flex-1 min-w-[140px]">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order ID</p>
                    <p className="text-sm font-black text-gray-800 font-mono">#{order._id.slice(-8).toUpperCase()}</p>
                    <p className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>

                {/* Customer */}
                <div className="flex-1 min-w-[140px]">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</p>
                    <p className="text-sm font-bold text-gray-700">{order.user?.name || 'N/A'}</p>
                    <p className="text-[10px] text-gray-400">{order.user?.email}</p>
                </div>

                {/* Total */}
                <div className="min-w-[80px]">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</p>
                    <p className="text-lg font-black text-indigo-700">₹{order.totalPrice?.toLocaleString()}</p>
                    <p className="text-[10px] text-green-600 font-bold">{order.isPaid ? '✅ Paid' : '❌ Unpaid'}</p>
                </div>

                {/* Status Badge */}
                <div className="min-w-[140px]">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                    <StatusBadge status={order.orderStatus} />
                </div>

                {/* AWB */}
                {order.shippingInfo?.awbCode && (
                    <div className="min-w-[120px]">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">AWB / Tracking</p>
                        <p className="text-xs font-black text-purple-700">{order.shippingInfo.awbCode}</p>
                        <p className="text-[10px] text-gray-400">{order.shippingInfo.courier}</p>
                    </div>
                )}

                {/* Expand Button */}
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="ml-auto w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 transition-all"
                >
                    {expanded ? <FaChevronUp className="text-indigo-600 text-xs" /> : <FaChevronDown className="text-gray-400 text-xs" />}
                </button>
            </div>

            {/* ── Expanded Details ── */}
            {expanded && (
                <div className="px-6 py-5 border-t border-gray-100 grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Order Items */}
                    <div className="lg:col-span-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Order Items</p>
                        <div className="space-y-3">
                            {order.orderItems?.map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-14 h-14 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                        {item.finalImageUrl
                                            ? <img src={item.finalImageUrl} alt="" className="w-full h-full object-contain" />
                                            : <FaShoppingBag className="text-gray-400" />
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-gray-800 truncate">{item.template?.name || 'Custom Product'}</p>
                                        <p className="text-xs text-gray-400">Qty: {item.quantity || 1} × ₹{item.price}</p>
                                        {item.packingCharges > 0 && <p className="text-[10px] text-gray-400">Packing: ₹{item.packingCharges}</p>}
                                    </div>
                                    {item.finalImageUrl && (
                                        <a href={item.finalImageUrl} target="_blank" rel="noopener noreferrer"
                                            className="text-indigo-500 hover:text-indigo-700 text-xs font-black flex items-center gap-1">
                                            <FaEye /> View
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Price Breakdown */}
                        <div className="mt-4 bg-gray-50 rounded-xl p-3 space-y-1.5 text-xs">
                            <div className="flex justify-between"><span className="text-gray-500">Product Cost</span><span className="font-bold text-gray-800">₹{order.subtotal?.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Packing Charges</span><span className={`font-bold ${order.packingChargesTotal > 0 ? 'text-gray-800' : 'text-gray-300'}`}>₹{order.packingChargesTotal || 0}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Shipping Fee</span><span className={`font-bold ${order.shippingChargesTotal === 0 ? 'text-green-600' : 'text-gray-800'}`}>{order.shippingChargesTotal === 0 ? 'FREE' : `₹${order.shippingChargesTotal}`}</span></div>
                            <div className="flex justify-between border-t border-gray-200 pt-1.5"><span className="font-black text-gray-900">Total</span><span className="font-black text-indigo-700">₹{order.totalPrice?.toLocaleString()}</span></div>
                        </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="lg:col-span-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Delivery Address</p>
                        {addr ? (
                            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <FaUser className="text-gray-400 text-xs flex-shrink-0" />
                                    <span className="font-black text-gray-800">{addr.fullName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FaPhone className="text-gray-400 text-xs flex-shrink-0" />
                                    <span className="text-gray-600 font-medium">+91 {addr.phone}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <FaMapMarkerAlt className="text-gray-400 text-xs flex-shrink-0 mt-1" />
                                    <span className="text-gray-600 font-medium text-xs">
                                        {addr.addressLine1}{addr.addressLine2 && `, ${addr.addressLine2}`},
                                        {' '}{addr.city}, {addr.state} — {addr.pincode}
                                    </span>
                                </div>
                            </div>
                        ) : <p className="text-gray-400 text-sm">No address info</p>}

                        {/* Payment Info */}
                        {order.paymentResult?.razorpay_payment_id && (
                            <div className="mt-3 bg-green-50 rounded-xl p-3">
                                <p className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-1">Payment Reference</p>
                                <p className="text-xs text-green-700 font-mono">{order.paymentResult.razorpay_payment_id}</p>
                            </div>
                        )}
                    </div>

                    {/* Admin Controls */}
                    <div className="lg:col-span-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Admin Controls</p>

                        {/* Status Update Dropdown */}
                        <div className="mb-4">
                            <label className="text-xs font-black text-gray-500 mb-1.5 block">Update Status</label>
                            <div className="relative">
                                <select
                                    value={order.orderStatus}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    disabled={statusLoading}
                                    className="w-full appearance-none border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold bg-white focus:outline-none focus:border-indigo-400 cursor-pointer disabled:opacity-60"
                                >
                                    {ALL_STATUSES.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                                {statusLoading
                                    ? <FaSpinner className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500 animate-spin" />
                                    : <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                }
                            </div>
                        </div>

                        {/* Mark as Packed → NimbusPost */}
                        {order.orderStatus === 'Order Confirmed' && order.isPaid && (
                            <button
                                onClick={handleMarkPacked}
                                disabled={packLoading}
                                className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2
                                    ${packLoading
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 hover:-translate-y-0.5 shadow-orange-200'
                                    }`}
                            >
                                {packLoading
                                    ? <><FaSpinner className="animate-spin" /> Creating Shipment...</>
                                    : <><FaBox /> Mark as Packed + Ship</>
                                }
                            </button>
                        )}

                        {/* Tracking Info */}
                        {order.shippingInfo?.awbCode && (
                            <div className="mt-4 bg-indigo-50 rounded-xl p-4 space-y-2">
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Shipment Details</p>
                                <div className="text-xs space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">AWB Code</span>
                                        <span className="font-black text-indigo-700">{order.shippingInfo.awbCode}</span>
                                    </div>
                                    {order.shippingInfo.courier && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Courier</span>
                                            <span className="font-bold">{order.shippingInfo.courier}</span>
                                        </div>
                                    )}
                                    {order.shippingInfo.lastStatus && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Last Update</span>
                                            <span className="font-bold text-green-600">{order.shippingInfo.lastStatus}</span>
                                        </div>
                                    )}
                                </div>
                                {order.shippingInfo.trackingUrl && (
                                    <a
                                        href={order.shippingInfo.trackingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-xs text-indigo-600 font-black hover:text-indigo-800 mt-2"
                                    >
                                        <FaTruck /> Track Shipment →
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
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
            setOrders(data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load orders');
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
            toast.success(`Status updated to "${newStatus}"`);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Status update failed');
        }
    };

    // ── Mark as Packed → NimbusPost ────────────────────────────────────────
    const handleMarkPacked = async (orderId) => {
        const toastId = toast.loading('Packing order + creating shipment on NimbusPost...');
        try {
            const { data } = await axios.put(
                `${API}/orders/${orderId}/pack`,
                {},
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            setOrders(prev => prev.map(o => o._id === orderId ? data.order : o));
            if (data.awbCode) {
                toast.success(`✅ Packed! AWB: ${data.awbCode}`, { id: toastId, duration: 5000 });
            } else {
                toast.success('✅ Marked as Packed. NimbusPost shipment creation is pending.', { id: toastId });
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to pack order', { id: toastId });
        }
    };

    // ── KPIs ───────────────────────────────────────────────────────────────
    const kpis = {
        total: orders.length,
        paid: orders.filter(o => o.isPaid).length,
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/30 py-8 px-4">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* ── Header ── */}
                <div>
                    <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-1">Admin Panel</p>
                    <h1 className="text-3xl font-black text-gray-900">Order Management</h1>
                    <p className="text-gray-400 text-sm mt-1">Manage, pack, and track all customer orders</p>
                </div>

                {/* ── KPI Cards ── */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { label: 'Total Orders', value: kpis.total, color: 'from-blue-500 to-indigo-500' },
                        { label: 'Paid Orders', value: kpis.paid, color: 'from-green-500 to-emerald-500' },
                        { label: 'Packed/Shipped', value: kpis.packed, color: 'from-yellow-500 to-orange-500' },
                        { label: 'Delivered', value: kpis.delivered, color: 'from-purple-500 to-violet-500' },
                        { label: 'Revenue', value: `₹${kpis.revenue.toLocaleString()}`, color: 'from-rose-500 to-pink-500' },
                    ].map((kpi, i) => (
                        <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <p className="text-xs font-black text-gray-400 uppercase tracking-wider">{kpi.label}</p>
                            <p className={`text-2xl font-black mt-1 bg-gradient-to-r ${kpi.color} bg-clip-text text-transparent`}>
                                {kpi.value}
                            </p>
                        </div>
                    ))}
                </div>

                {/* ── Search + Filter Bar ── */}
                <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center shadow-sm">
                    <div className="flex-1 min-w-[200px] relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by Order ID, customer name or email..."
                            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-400"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <FaFilter className="text-gray-400 text-xs" />
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold bg-white focus:outline-none focus:border-indigo-400"
                        >
                            <option value="All">All Status</option>
                            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <span className="text-xs font-black text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
                        {filtered.length} results
                    </span>
                </div>

                {/* ── Orders List ── */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Loading orders...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-20 text-center bg-white rounded-2xl border border-gray-100">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaBoxOpen size={32} className="text-gray-300" />
                        </div>
                        <p className="text-xl font-black text-gray-500">No orders found</p>
                        <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filter</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map(order => (
                            <OrderRow
                                key={order._id}
                                order={order}
                                onStatusChange={handleStatusChange}
                                onMarkPacked={handleMarkPacked}
                            />
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
};

export default AdminOrders;
