import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../utils/api';
import {
    FaUserCircle, FaBoxOpen, FaHistory, FaShieldAlt,
    FaSignOutAlt, FaCheckCircle,
    FaShoppingBag, FaTimes,
    FaLock, FaUser, FaCamera,
    FaPhone,
    FaFileInvoice
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const AvatarSection = ({ user, onUpload, onDelete }) => {
    const fileRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!allowed.includes(file.type)) return toast.error('JPG, PNG or WebP required');
        if (file.size > 5 * 1024 * 1024) return toast.error('Under 5MB required');

        setUploading(true);
        setUploadProgress(0);
        const result = await onUpload(file, (percent) => setUploadProgress(percent));
        setUploading(false);
        if (result?.success) toast.success('Photo updated');
        else toast.error(result?.message || 'Update failed');
        if (fileRef.current) fileRef.current.value = '';
    };

    return (
        <div className="relative group flex-shrink-0">
            <div className="w-28 h-28 rounded-luxury overflow-hidden border-2 border-gold/20 relative">
                {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-primary-light flex items-center justify-center text-gold font-serif text-4xl italic">
                        {user?.name?.charAt(0)}
                    </div>
                )}
                {(uploading || deleting) && (
                    <div className="absolute inset-0 bg-primary-dark/60 flex items-center justify-center">
                        <div className="w-7 h-7 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1.5 -right-1.5 w-9 h-9 bg-gold text-primary-dark rounded-luxury flex items-center justify-center hover:scale-105 transition-transform border-2 border-primary-dark"
            >
                <FaCamera size={12} />
            </button>

            <input ref={fileRef} type="file" onChange={handleFileSelect} className="hidden" accept="image/*" />
        </div>
    );
};

const Profile = () => {
    const { user, logout, updateProfile, updateAvatar, deleteAvatar } = useAuth();
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');
    const [showEditModal, setShowEditModal] = useState(false);
    const [changingPwd, setChangingPwd] = useState(false);
    const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const { data } = await axios.get(`${API_BASE}/orders/myorders`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setOrders(data);
            } catch (err) { console.error(err); } finally { setOrdersLoading(false); }
        };
        if (user) fetchOrders();
    }, [user]);

    const handlePwdChange = async (e) => {
        e.preventDefault();
        if (passwords.next !== passwords.confirm) return toast.error('Passwords do not match');
        setChangingPwd(true);
        try {
            await axios.put(`${API_BASE}/auth/change-password`, {
                currentPassword: passwords.current,
                newPassword: passwords.next
            }, { headers: { Authorization: `Bearer ${user.token}` } });
            toast.success('Password updated');
            setPasswords({ current: '', next: '', confirm: '' });
        } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); } finally { setChangingPwd(false); }
    };

    return (
        <div className="min-h-screen bg-primary-dark pt-28 pb-20">
            <div className="max-w-7xl mx-auto px-6 md:px-12">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-14">
                    <div>
                        <p className="text-gold text-[10px] font-semibold uppercase tracking-[0.2em] mb-2">My Account</p>
                        <h1 className="text-4xl font-serif text-white">Hello, {user?.name?.split(' ')[0]}</h1>
                    </div>
                    <button onClick={logout} className="btn-outline flex items-center gap-2 text-red-400 border-red-400/30 hover:bg-red-400/10 hover:border-red-400/40">
                        <FaSignOutAlt size={12} /> Sign Out
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Tab Navigation */}
                    <div className="lg:col-span-3 space-y-1.5">
                        {[
                            { id: 'profile', label: 'Profile', icon: <FaUser size={13} /> },
                            { id: 'orders', label: 'Orders', icon: <FaHistory size={13} /> },
                            { id: 'security', label: 'Security', icon: <FaShieldAlt size={13} /> }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-luxury font-medium text-sm transition-all ${activeTab === tab.id ? 'bg-gold text-primary-dark' : 'text-white/50 hover:bg-white/[0.03] hover:text-white/70'}`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="lg:col-span-9">
                        <div className="luxury-card p-8 md:p-10 animate-fadeIn">
                            {activeTab === 'profile' && (
                                <div className="space-y-10">
                                    <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
                                        <AvatarSection user={user} onUpload={updateAvatar} onDelete={deleteAvatar} />
                                        <div className="flex-1 space-y-6 w-full">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-medium text-white/30 uppercase tracking-wider">Full Name</label>
                                                    <p className="text-lg text-white font-serif">{user?.name}</p>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-medium text-white/30 uppercase tracking-wider">Email</label>
                                                    <p className="text-lg text-white font-serif">{user?.email}</p>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-medium text-white/30 uppercase tracking-wider">Status</label>
                                                    <div className="flex items-center gap-2 text-gold">
                                                        <FaCheckCircle size={12} />
                                                        <span className="text-sm font-medium">Verified</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button onClick={() => setShowEditModal(true)} className="btn-gold px-6 py-2.5 text-[10px]">Edit Profile</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'orders' && (
                                <div className="space-y-6">
                                    {ordersLoading ? (
                                        <div className="py-16 flex justify-center">
                                            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    ) : orders.length === 0 ? (
                                        <div className="text-center py-16 space-y-5">
                                            <FaBoxOpen size={36} className="text-white/10 mx-auto" />
                                            <p className="text-white/40 text-sm">No orders yet.</p>
                                            <Link to="/" className="btn-gold inline-block">Browse Designs</Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {orders.map(order => (
                                                <div key={order._id} className="p-5 rounded-luxury bg-white/[0.02] border border-white/[0.06] hover:border-gold/20 transition-all">
                                                    <div className="flex flex-wrap justify-between items-center gap-4 mb-5 pb-5 border-b border-white/[0.06]">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 bg-gold/10 rounded-luxury flex items-center justify-center text-gold">
                                                                <FaShoppingBag size={14} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-medium text-white/30 uppercase tracking-wider">Order ID</p>
                                                                <p className="text-white font-medium font-mono text-sm">#{order._id.slice(-8).toUpperCase()}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-medium text-white/30 uppercase tracking-wider">Total</p>
                                                            <p className="text-lg font-serif text-gold">₹{order.totalPrice?.toLocaleString()}</p>
                                                        </div>
                                                        <div className={`px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider ${order.orderStatus === 'Delivered' ? 'bg-green-500/10 text-green-400' : 'bg-gold/10 text-gold'}`}>
                                                            {order.orderStatus}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        {order.orderItems?.map((item, i) => (
                                                            <div key={i} className="flex items-center gap-3">
                                                                <img src={item.finalImageUrl} className="w-10 h-10 rounded-luxury bg-primary-light object-cover" />
                                                                <div className="flex-1">
                                                                    <p className="text-white text-xs font-medium truncate">{item.template?.name}</p>
                                                                    <p className="text-white/30 text-[10px] mt-0.5">Qty: {item.quantity}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="mt-5 pt-4 border-t border-white/[0.06] flex justify-end">
                                                        <Link to={`/invoice/${order._id}`} className="text-[10px] font-medium text-gold uppercase tracking-wider hover:underline flex items-center gap-1.5">
                                                            <FaFileInvoice size={11} /> Invoice
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <form onSubmit={handlePwdChange} className="max-w-md space-y-6">
                                    <div className="space-y-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-medium text-white/30 uppercase tracking-wider">Current Password</label>
                                            <input type="password" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} className="input-luxury w-full" placeholder="••••••••" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-medium text-white/30 uppercase tracking-wider">New Password</label>
                                            <input type="password" value={passwords.next} onChange={e => setPasswords({...passwords, next: e.target.value})} className="input-luxury w-full" placeholder="••••••••" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-medium text-white/30 uppercase tracking-wider">Confirm Password</label>
                                            <input type="password" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} className="input-luxury w-full" placeholder="••••••••" />
                                        </div>
                                    </div>
                                    <button disabled={changingPwd} className="btn-gold w-full flex items-center justify-center gap-2.5">
                                        {changingPwd ? 'Updating...' : 'Update Password'}
                                        <FaLock size={11} />
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-primary-dark/80 backdrop-blur-luxury" onClick={() => setShowEditModal(false)}></div>
                    <div className="relative bg-primary border border-white/10 p-8 md:p-10 rounded-luxury max-w-md w-full space-y-6 animate-fadeIn">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-serif text-white">Edit Profile</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-white/40 hover:text-white transition-colors"><FaTimes /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-white/30 uppercase tracking-wider">Full Name</label>
                                <input type="text" defaultValue={user?.name} className="input-luxury w-full" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-medium text-white/30 uppercase tracking-wider">Email</label>
                                <input type="email" defaultValue={user?.email} className="input-luxury w-full" />
                            </div>
                        </div>
                        <button onClick={() => setShowEditModal(false)} className="btn-gold w-full py-3.5">Save Changes</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
