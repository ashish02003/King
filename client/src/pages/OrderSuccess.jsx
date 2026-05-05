import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE as API } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
    FaCheckCircle, FaTruck, FaBox,
    FaPhone, FaHome, FaClipboardList,
    FaMoneyBillWave, FaStar
} from 'react-icons/fa';

const ConfettiCanvas = () => {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const colors = ['#C9A14A', '#E6C77B', '#FFFFFF', '#1A1333'];
        const particles = Array.from({ length: 80 }, () => ({
            x: Math.random() * canvas.width,
            y: -20,
            r: Math.random() * 4 + 2,
            vy: Math.random() * 2 + 1,
            vx: Math.random() * 2 - 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            opacity: 1
        }));
        let frame = 0;
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            frame++;
            particles.forEach(p => {
                p.y += p.vy; p.x += p.vx;
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
            });
            if (frame < 150) requestAnimationFrame(draw);
        };
        draw();
    }, []);
    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />;
};

const OrderSuccess = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const { data } = await axios.get(`${API}/orders/${id}`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setOrder(data);
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        if (user) fetchOrder();
    }, [id, user]);

    if (loading) return (
        <div className="min-h-screen bg-primary-dark flex items-center justify-center">
            <div className="w-10 h-10 border-3 border-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!order) return null;

    const isCOD = order.paymentMethod === 'cod';
    const addr = order.shippingAddress;

    return (
        <div className="min-h-screen bg-primary-dark pt-28 pb-20 relative overflow-hidden">
            <ConfettiCanvas />
            <div className="max-w-3xl mx-auto px-6 relative z-10">
                <div className="luxury-card p-10 text-center space-y-8 animate-fadeIn">
                    <div className="relative inline-block">
                        <div className="w-28 h-28 rounded-full bg-gold/10 flex items-center justify-center border-2 border-gold/20">
                            {isCOD ? <FaMoneyBillWave className="text-gold text-4xl" /> : <FaCheckCircle className="text-gold text-4xl" />}
                        </div>
                        <div className="absolute -top-1 -right-1 w-8 h-8 bg-gold text-primary-dark rounded-full flex items-center justify-center">
                            <FaStar size={14} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-serif text-white">Order Confirmed!</h1>
                        <p className="text-white/40 text-sm">Thank you for your order. We'll start preparing it right away.</p>
                    </div>

                    <div className="flex justify-center">
                        <div className="px-5 py-2 bg-white/[0.03] border border-white/[0.06] rounded-full">
                            <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider">Order ID: </span>
                            <span className="text-white font-mono text-sm">#{order._id.slice(-8).toUpperCase()}</span>
                        </div>
                    </div>

                    <div className="w-full h-[1px] bg-white/[0.06]"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                        <div className="space-y-3">
                            <h3 className="text-[11px] font-medium text-gold uppercase tracking-wider">Payment Summary</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/40">Subtotal</span>
                                    <span className="text-white">₹{order.subtotal?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-white/40">Shipping & Packing</span>
                                    <span className="text-white">₹{(order.shippingChargesTotal + order.packingChargesTotal).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-lg font-serif pt-2 border-t border-white/[0.06]">
                                    <span className="text-gold">Total</span>
                                    <span className="text-gold">₹{order.totalPrice?.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-[11px] font-medium text-gold uppercase tracking-wider">Delivery Address</h3>
                            <div className="text-sm space-y-1 text-white/60">
                                <p className="font-medium text-white text-sm">{addr?.fullName}</p>
                                <p>{addr?.addressLine1}, {addr?.city}</p>
                                <p>{addr?.state} — {addr?.pincode}</p>
                                <p className="text-white/30 pt-1 flex items-center gap-1.5"><FaPhone size={9} /> +91 {addr?.phone}</p>
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-[1px] bg-white/[0.06]"></div>

                    {/* Timeline */}
                    <div className="bg-primary-light p-5 rounded-luxury border border-white/[0.06] text-left space-y-3">
                        <h3 className="text-[11px] font-medium text-gold uppercase tracking-wider">Order Timeline</h3>
                        <div className="space-y-3">
                            {[
                                { icon: <FaBox size={12} />, label: 'Order Confirmed', time: 'Completed' },
                                { icon: <FaCheckCircle size={12} />, label: 'Preparing', time: 'In Progress' },
                                { icon: <FaTruck size={12} />, label: 'Shipping', time: 'Pending' }
                            ].map((step, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className={`w-7 h-7 rounded-luxury flex items-center justify-center ${i === 0 ? 'bg-gold text-primary-dark' : 'bg-white/[0.04] text-white/30'}`}>{step.icon}</div>
                                    <div className="flex-1">
                                        <p className={`text-xs font-medium ${i === 0 ? 'text-white' : 'text-white/40'}`}>{step.label}</p>
                                        <p className="text-[10px] text-white/20">{step.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        <Link to="/profile" className="btn-gold flex items-center justify-center gap-2">
                            <FaClipboardList size={12} /> My Orders
                        </Link>
                        <Link to="/" className="btn-outline flex items-center justify-center gap-2">
                            <FaHome size={12} /> Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccess;
