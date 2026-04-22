import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../utils/api';
import {
    FaUserCircle, FaBoxOpen, FaHistory, FaShieldAlt,
    FaSignOutAlt, FaEye, FaEyeSlash, FaCheckCircle,
    FaShoppingBag, FaEdit, FaTimes, FaPencilAlt,
    FaLock, FaEnvelope, FaUser, FaCamera, FaTrash,
    FaTruck, FaMapMarkerAlt, FaPhone, FaBox,
    FaMoneyBillWave, FaCreditCard, FaExternalLinkAlt, FaFileInvoice
} from 'react-icons/fa';
import toast from 'react-hot-toast';

// ─── Avatar Section ────────────────────────────────────────────────────────
const AvatarSection = ({ user, onUpload, onDelete }) => {
    const fileRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!allowed.includes(file.type)) {
            return toast.error('Please select a JPG, PNG or WebP image');
        }
        if (file.size > 5 * 1024 * 1024) {
            return toast.error('Image must be under 5MB');
        }

        setUploading(true);
        setUploadProgress(0);
        const result = await onUpload(file, (percent) => {
            setUploadProgress(percent);
        });
        setUploading(false);
        setUploadProgress(0);
        if (result?.success) {
            toast.success('Profile photo updated!');
        } else {
            toast.error(result?.message || 'Upload failed');
        }
        // Reset file input
        if (fileRef.current) fileRef.current.value = '';
    };

    const handleDelete = async () => {
        setShowDeleteConfirm(false);
        setDeleting(true);
        const result = await onDelete();
        setDeleting(false);
        if (result?.success) {
            toast.success('Profile photo removed');
        } else {
            toast.error(result?.message || 'Failed to remove photo');
        }
    };

    const hasAvatar = !!user?.avatar;

    return (
        <div className="relative flex-shrink-0 group">
            {/* Avatar Display */}
            <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-2xl shadow-blue-200 border-4 border-white">
                {hasAvatar ? (
                    <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-5xl">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>

            {/* Uploading/Deleting overlay */}
            {(uploading || deleting) && (
                <div className="absolute inset-0 bg-black/40 rounded-3xl flex flex-col items-center justify-center">
                    <div className="w-10 h-10 rounded-full border-4 border-white border-t-transparent animate-spin mb-2"></div>
                    {uploading && (
                        <span className="text-xs font-bold text-white">
                            {uploadProgress}%
                        </span>
                    )}
                </div>
            )}

            {/* Camera button - Upload / Change */}
            <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading || deleting}
                className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all hover:scale-110 active:scale-95 border-3 border-white disabled:opacity-50"
                title={hasAvatar ? 'Change Photo' : 'Upload Photo'}
            >
                <FaCamera size={14} />
            </button>

            {/* Delete button (only if avatar exists) */}
            {hasAvatar && !uploading && !deleting && (
                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center shadow-lg shadow-red-200 hover:bg-red-600 transition-all hover:scale-110 active:scale-95 border-2 border-white opacity-0 group-hover:opacity-100"
                    title="Remove Photo"
                >
                    <FaTrash size={10} />
                </button>
            )}

            {/* Verified badge */}
            <div className="absolute -bottom-2 -left-2 bg-green-500 text-white p-1.5 rounded-lg border-3 border-white shadow-md">
                <FaCheckCircle size={12} />
            </div>

            {/* Hidden file input */}
            <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Delete Confirmation Popup */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
                    <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full animate-fadeIn text-center">
                        <button onClick={() => setShowDeleteConfirm(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100">
                            <FaTimes className="text-gray-400 text-sm" />
                        </button>
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                            <FaTrash size={22} className="text-red-500" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">Remove Photo?</h3>
                        <p className="text-gray-500 font-medium text-sm mb-8">
                            Are you sure you want to remove your profile photo? Your avatar will be replaced with default initials.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-3 rounded-2xl border-2 border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 py-3 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200 text-sm"
                            >
                                Yes, Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Edit Profile Modal ─────────────────────────────────────────────────────
const EditProfileModal = ({ isOpen, onClose, user, onSave }) => {
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName(user?.name || '');
            setEmail(user?.email || '');
        }
    }, [isOpen, user]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !email.trim()) return toast.error('Name and email are required');
        setSaving(true);
        const result = await onSave(name.trim(), email.trim());
        setSaving(false);
        if (result?.success) {
            toast.success('Profile updated!');
            onClose();
        } else {
            toast.error(result?.message || 'Failed to update profile');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-fadeIn">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <FaTimes className="text-gray-400" />
                </button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                        <FaPencilAlt className="text-blue-600 text-lg" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900">Edit Profile</h2>
                        <p className="text-sm text-gray-400 font-medium">Update your account details</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Full Name</label>
                        <div className="relative">
                            <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your full name"
                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Email Address</label>
                        <div className="relative">
                            <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-3.5 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Logout Confirmation Modal ─────────────────────────────────────────────
const LogoutModal = ({ isOpen, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full animate-fadeIn text-center">
                <button onClick={onCancel} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100">
                    <FaTimes className="text-gray-400 text-sm" />
                </button>
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                    <FaSignOutAlt size={24} className="text-red-500" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Logout?</h3>
                <p className="text-gray-500 font-medium mb-8">
                    Are you sure you want to end your session? You'll need to log in again to access your account.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        Stay In
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-3.5 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                    >
                        Yes, Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Password Field ────────────────────────────────────────────────────────
const PasswordField = ({ label, value, onChange, show, onToggle, placeholder }) => (
    <div>
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-2">{label}</label>
        <div className="relative">
            <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
            <input
                type={show ? 'text' : 'password'}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full pl-11 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl font-semibold text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <button
                type="button"
                onClick={onToggle}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
            >
                {show ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
            </button>
        </div>
    </div>
);

// ─── Status Badge ──────────────────────────────────────────────────────────
const StatusBadge = ({ status, deliveryStatus }) => {
    const styles = {
        'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
        'Order Confirmed': 'bg-blue-50 text-blue-700 border-blue-200',
        'Processing': 'bg-blue-50 text-blue-700 border-blue-200',
        'Packed': 'bg-yellow-50 text-yellow-700 border-yellow-200',
        'Shipped': 'bg-purple-50 text-purple-700 border-purple-200',
        'Out for Delivery': 'bg-orange-50 text-orange-700 border-orange-200',
        'Delivered': 'bg-green-50 text-green-700 border-green-200',
        'Cancelled': 'bg-red-50 text-red-700 border-red-200',
    };
    const icons = {
        'Pending': '⏳', 'Order Confirmed': '✅', 'Packed': '📦', 'Shipped': '🚚',
        'Out for Delivery': '🛵', 'Delivered': '🎉', 'Cancelled': '❌', 'Processing': '⚙️',
    };
    
    // If shipped, show delivery status too
    const showDelivery = status === 'Shipped' && deliveryStatus && deliveryStatus !== 'None';

    return (
        <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${styles[status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                <span>{icons[status] || '📋'}</span>
                {status}
            </span>
            {showDelivery && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border-blue-200">
                    <span>📍</span> {deliveryStatus}
                </span>
            )}
        </div>
    );
};

// ─── Payment Status Badge ──────────────────────────────────────────────────
const PaymentBadge = ({ paymentStatus, paymentMethod }) => {
    const isCOD = paymentMethod === 'cod';
    if (isCOD) {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black bg-amber-50 text-amber-700 border-amber-200">
                <FaMoneyBillWave size={9} />
                Pay on Delivery
            </span>
        );
    }
    const paid = paymentStatus === 'Paid';
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black ${paid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200'
            }`}>
            <FaCreditCard size={9} />
            {paymentStatus || 'Pending'}
        </span>
    );
};

// ─── Main Profile Component ────────────────────────────────────────────────
const Profile = () => {
    const { user, logout, updateProfile, updateAvatar, deleteAvatar } = useAuth();
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');

    // Edit profile modal
    const [showEditModal, setShowEditModal] = useState(false);

    // Logout modal
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
    const [changingPwd, setChangingPwd] = useState(false);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const { data } = await axios.get(`${API_BASE}/orders/myorders`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setOrders(data);
            } catch (err) {
                console.error('Error fetching orders:', err);
            } finally {
                setOrdersLoading(false);
            }
        };
        if (user) fetchOrders();
    }, [user]);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (!currentPassword || !newPassword || !confirmPassword)
            return toast.error('Please fill all password fields');
        if (newPassword !== confirmPassword)
            return toast.error('New passwords do not match');
        if (newPassword.length < 6)
            return toast.error('Password must be at least 6 characters');
        setChangingPwd(true);
        try {
            await axios.put(
                `${API_BASE}/auth/change-password`,
                { currentPassword, newPassword },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            toast.success('Password updated successfully!');
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update password');
        } finally {
            setChangingPwd(false);
        }
    };

    const togglePwd = (field) =>
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));

    const tabs = [
        { id: 'profile', label: 'Account Info', icon: <FaUserCircle /> },
        { id: 'orders', label: 'Order History', icon: <FaShoppingBag /> },
        { id: 'security', label: 'Security', icon: <FaShieldAlt /> },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 py-6 sm:py-12">
            {/* Modals */}
            <EditProfileModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                user={user}
                onSave={updateProfile}
            />
            <LogoutModal
                isOpen={showLogoutModal}
                onConfirm={() => { setShowLogoutModal(false); logout(); }}
                onCancel={() => setShowLogoutModal(false)}
            />

            <div className="container mx-auto px-4 max-w-6xl">
                {/* ── Page Header ── */}
                <div className="mb-6 sm:mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div>
                        <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">Welcome back</p>
                        <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight leading-none">
                            {user?.name?.split(' ')[0]}'s Dashboard
                        </h1>
                        <p className="text-gray-400 font-medium mt-1 sm:mt-2 text-sm">Manage your profile, track orders and keep your account secure.</p>
                    </div>
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl bg-white text-red-500 font-bold border border-red-100 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm group text-sm"
                    >
                        <FaSignOutAlt className="group-hover:translate-x-0.5 transition-transform" />
                        Logout
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8">
                    {/* ── Sidebar (desktop) / Horizontal tabs (mobile) ── */}
                    <div className="lg:col-span-1">
                        {/* Mobile: horizontal scrollable tab bar */}
                        <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                            {/* Mini profile chip */}
                            <div className="flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm px-3 py-2 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0">
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-sm">
                                            {user?.name?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <span className="text-xs font-black text-gray-700 whitespace-nowrap">{user?.name?.split(' ')[0]}</span>
                            </div>
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === tab.id
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                            : 'bg-white text-gray-500 border border-gray-100 hover:border-blue-200'
                                        }`}
                                >
                                    <span>{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Desktop: vertical sidebar */}
                        <div className="hidden lg:block space-y-2">
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-4 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg shadow-blue-200">
                                    {user?.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-xl">
                                            {user?.name?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-black text-gray-900 truncate text-sm">{user?.name}</p>
                                    <p className="text-xs text-gray-400 font-medium truncate">{user?.email}</p>
                                </div>
                            </div>
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all text-left text-sm ${activeTab === tab.id
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200/60 scale-[1.02]'
                                            : 'bg-white text-gray-500 hover:bg-blue-50 hover:text-blue-600 border border-gray-100'
                                        }`}
                                >
                                    <span className="text-lg">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Content ── */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-2xl sm:rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">

                            {/* ── Account Info Tab ── */}
                            {activeTab === 'profile' && (
                                <div className="p-5 sm:p-8 lg:p-10 animate-fadeIn">
                                    <div className="flex items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3">
                                        <div>
                                            <h2 className="text-lg sm:text-2xl font-black text-gray-900">Account Information</h2>
                                            <p className="text-gray-400 font-medium text-xs sm:text-sm mt-1">Your personal details and preferences</p>
                                        </div>
                                        <button
                                            onClick={() => setShowEditModal(true)}
                                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 sm:px-5 sm:py-2.5 bg-gray-900 text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-gray-800 transition-colors shadow-md"
                                        >
                                            <FaEdit size={12} /> Edit
                                        </button>
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-10 items-start">
                                        {/* Avatar with upload/delete */}
                                        <AvatarSection
                                            user={user}
                                            onUpload={updateAvatar}
                                            onDelete={deleteAvatar}
                                        />

                                        {/* Info Grid */}
                                        <div className="flex-1 space-y-6">
                                            {/* Photo tip */}
                                            <div className="bg-blue-50/60 rounded-2xl px-5 py-3 border border-blue-100 flex items-center gap-3">
                                                <FaCamera className="text-blue-500 flex-shrink-0" />
                                                <p className="text-xs text-blue-700 font-medium">
                                                    <strong>Tip:</strong> Hover over your photo to see upload & delete options. Supported formats: JPG, PNG, WebP (max 5MB).
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="bg-gray-50 rounded-2xl p-5">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1">Full Name</label>
                                                    <p className="text-xl font-black text-gray-900">{user?.name}</p>
                                                </div>
                                                <div className="bg-gray-50 rounded-2xl p-5">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1">Email Address</label>
                                                    <p className="text-base font-bold text-gray-700 break-all">{user?.email}</p>
                                                </div>
                                                <div className="bg-gray-50 rounded-2xl p-5">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1">Account Type</label>
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-black uppercase tracking-wider">
                                                        {user?.role}
                                                    </span>
                                                </div>
                                                <div className="bg-gray-50 rounded-2xl p-5">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-1">Account Status</label>
                                                    <span className="inline-flex items-center gap-2 text-green-600 font-black text-sm">
                                                        <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                                                        Active & Verified
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── Order History Tab ── */}
                            {activeTab === 'orders' && (
                                <div className="p-5 sm:p-8 lg:p-10 animate-fadeIn min-h-[400px] sm:min-h-[500px]">
                                    <div className="flex items-center justify-between mb-6 sm:mb-8 gap-3">
                                        <div>
                                            <h2 className="text-lg sm:text-2xl font-black text-gray-900">Order History</h2>
                                            <p className="text-gray-400 font-medium text-xs sm:text-sm mt-1">Track and review your past purchases</p>
                                        </div>
                                        <span className="text-xs sm:text-sm font-black text-gray-400 bg-gray-50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-gray-100 flex-shrink-0">
                                            {orders.length} Total
                                        </span>
                                    </div>

                                    {ordersLoading ? (
                                        <div className="py-24 flex flex-col items-center justify-center text-gray-300">
                                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                                            <p className="font-bold uppercase tracking-widest text-xs">Loading orders...</p>
                                        </div>
                                    ) : orders.length === 0 ? (
                                        <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                                <FaBoxOpen size={32} className="text-gray-200" />
                                            </div>
                                            <h4 className="text-xl font-black text-gray-800 mb-2">No orders yet</h4>
                                            <p className="text-gray-400 font-medium mb-6">You haven't placed any orders yet.</p>
                                            <Link to="/" className="bg-[#700000] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-red-900/10 hover:bg-[#5a0000] transition-all inline-block">
                                                Start Shopping
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {[...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(order => {
                                                const addr = order.shippingAddress;
                                                const orderShort = order._id.slice(-8).toUpperCase();
                                                return (
                                                    <div key={order._id} className="border border-gray-100 rounded-2xl sm:rounded-3xl hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all overflow-hidden">
                                                        {/* Order Header */}
                                                        <div className="flex flex-wrap gap-2 sm:gap-3 justify-between items-center px-4 sm:px-6 py-3 sm:py-4 bg-gray-50/80 border-b border-gray-100">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow">
                                                                    <FaHistory size={12} className="text-white" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order ID </p>
                                                                    <p className="text-sm font-black text-gray-800 font-mono">#{orderShort}</p>
                                                                    <p className="text-[10px] text-gray-400">
                                                                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col gap-2">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="w-12 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mt-0.5">Order Status</span>
                                                                    <div className="flex-1"><StatusBadge status={order.orderStatus} deliveryStatus={order.deliveryStatus} /></div>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="w-12 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mt-0.5">Payment Status</span>
                                                                    <div className="flex-1"><PaymentBadge paymentStatus={order.paymentStatus} paymentMethod={order.paymentMethod} /></div>
                                                                </div>
                                                            </div>
                                                            <p className="text-xl font-black" style={{ color: '#2D5A27' }}>₹{order.totalPrice?.toLocaleString()}</p>
                                                        </div>

                                                        {/* Order Items */}
                                                        <div className="p-6">
                                                            <div className="space-y-3 mb-5">
                                                                {order.orderItems?.map((item, i) => (
                                                                    <div key={i} className="flex items-center gap-4">
                                                                        <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex-shrink-0 flex items-center justify-center relative group overflow-hidden">
                                                                            {(item.finalImageUrl || item.finalDesignUrl) ? (
                                                                                <>
                                                                                    <img src={item.finalImageUrl || item.finalDesignUrl} alt="item" className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                                                                                    <a
                                                                                        href={item.finalImageUrl || item.finalDesignUrl}
                                                                                        target="_blank"
                                                                                        rel="noreferrer"
                                                                                        className="absolute top-1 right-1 bg-black/60 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                    >
                                                                                        <FaExternalLinkAlt className="text-white text-[8px]" />
                                                                                    </a>
                                                                                </>
                                                                            ) : (
                                                                                <FaShoppingBag className="text-gray-300 text-xl" />
                                                                            )}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="font-black text-gray-800 text-sm truncate">{item.template?.name || 'Custom Product'}</p>
                                                                            <p className="text-xs text-gray-400">Qty: {item.quantity || item.qty || 1} × ₹{Math.round(item.price + (item.price * (item.gst || 0) / 100))}</p>
                                                                        </div>
                                                                        <p className="font-black text-gray-700 text-sm">₹{Math.round((item.price + (item.price * (item.gst || 0) / 100)) * (item.quantity || item.qty || 1)).toLocaleString()}</p>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* Price Breakdown */}
                                                            {(order.subtotal != null) && (
                                                                <div className="bg-gray-50 rounded-2xl p-4 mb-4 space-y-1.5 text-xs">
                                                                    <div className="flex justify-between"><span className="text-gray-500 font-medium flex items-center gap-1"><FaShoppingBag className="text-gray-400" /> Product Cost (Incl. GST)</span><span className="font-bold text-gray-800">₹{Math.round((order.subtotal || 0) + (order.gstTotal || 0)).toLocaleString()}</span></div>
                                                                    <div className="flex justify-between"><span className="text-gray-500 font-medium flex items-center gap-1"><FaBox className="text-gray-400" /> Packing Charges</span><span className={`font-bold ${order.packingChargesTotal > 0 ? 'text-gray-800' : 'text-gray-300'}`}>₹{order.packingChargesTotal || 0}</span></div>
                                                                    <div className="flex justify-between"><span className="text-gray-500 font-medium flex items-center gap-1"><FaTruck className="text-gray-400" /> Shipping Fee</span><span className={`font-bold ${order.shippingChargesTotal === 0 ? 'text-green-600' : 'text-gray-800'}`}>{order.shippingChargesTotal === 0 ? 'FREE' : `₹${order.shippingChargesTotal}`}</span></div>
                                                                    <div className="flex justify-between border-t border-gray-200 pt-1.5"><span className="font-black text-gray-900">Total Paid</span><span className="font-black" style={{ color: '#2D5A27' }}>₹{order.totalPrice?.toLocaleString()}</span></div>
                                                                </div>
                                                            )}

                                                            <div className="flex justify-end gap-3 mt-4">
                                                                <Link
                                                                    to={`/invoice/${order._id}`}
                                                                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-black transition-all shadow-sm"
                                                                >
                                                                    <FaFileInvoice size={12} /> View Invoice
                                                                </Link>
                                                            </div>

                                                            {/* Delivery Address */}
                                                            {addr && (
                                                                <div className="bg-blue-50/50 rounded-2xl p-4 mb-4">
                                                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Delivery Address</p>
                                                                    <div className="space-y-1 text-xs">
                                                                        <div className="flex items-center gap-2"><FaUser className="text-blue-400" /><span className="font-bold text-gray-700">{addr.fullName}</span></div>
                                                                        <div className="flex items-center gap-2"><FaPhone className="text-blue-400" /><span className="text-gray-600">+91 {addr.phone}</span></div>
                                                                        <div className="flex items-start gap-2"><FaMapMarkerAlt className="text-blue-400 mt-0.5" /><span className="text-gray-600">{addr.addressLine1}{addr.addressLine2 && `, ${addr.addressLine2}`}, {addr.city}, {addr.state} — {addr.pincode}</span></div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Tracking Info - Show if Shipped */}
                                                            {order.orderStatus === 'Shipped' && (
                                                                <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100 flex flex-col md:flex-row gap-6 items-center mt-4">
                                                                    <div className="flex-1 space-y-3 w-full">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                                                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">Live Shipment Updates</p>
                                                                        </div>
                                                                        
                                                                        <div className="space-y-2">
                                                                            <div className="flex flex-col">
                                                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Current Delivery Status</span>
                                                                                <span className="text-sm font-black text-slate-800 uppercase tracking-tight">
                                                                                    {order.deliveryStatus !== 'None' ? order.deliveryStatus : (order.shippingInfo?.lastStatus || 'Shipped / In Transit')}
                                                                                </span>
                                                                            </div>
                                                                            <div className="grid grid-cols-2 gap-4 pt-2">
                                                                                <div>
                                                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block mb-0.5">Tracking ID (AWB)</span>
                                                                                    <span className="text-[11px] font-black text-slate-600 font-mono">
                                                                                        {order.shippingInfo?.awbCode || 'Pending Assignment'}
                                                                                    </span>
                                                                                </div>
                                                                                <div>
                                                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block mb-0.5">Courier Partner</span>
                                                                                    <span className="text-[11px] font-bold text-slate-600">
                                                                                        {order.shippingInfo?.courier || 'Standard Logistics'}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {order.shippingInfo?.trackingUrl ? (
                                                                        <a
                                                                            href={order.shippingInfo.trackingUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex items-center gap-2 justify-center px-8 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100 whitespace-nowrap w-full md:w-auto"
                                                                        >
                                                                            <FaTruck size={14} /> Track Order
                                                                        </a>
                                                                    ) : (
                                                                        <div className="px-8 py-3 bg-gray-100 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed whitespace-nowrap w-full md:w-auto text-center border border-gray-200">
                                                                            Tracking URL Pending
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Security Tab ── */}
                            {activeTab === 'security' && (
                                <div className="p-5 sm:p-8 lg:p-10 animate-fadeIn">
                                    <div className="mb-6 sm:mb-8">
                                        <h2 className="text-lg sm:text-2xl font-black text-gray-900">Security Settings</h2>
                                        <p className="text-gray-400 font-medium text-xs sm:text-sm mt-1">Keep your account safe with a strong password</p>
                                    </div>

                                    <div className="max-w-md">
                                        <div className="flex items-center gap-4 p-5 bg-blue-50 rounded-2xl border border-blue-100 mb-8">
                                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow shadow-blue-200">
                                                <FaShieldAlt className="text-white text-sm" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-blue-900">Password Protection</p>
                                                <p className="text-xs text-blue-600 font-medium">Use a strong, unique password for maximum security.</p>
                                            </div>
                                        </div>

                                        <form onSubmit={handlePasswordChange} className="space-y-5">
                                            <PasswordField
                                                label="Current Password"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                show={showPasswords.current}
                                                onToggle={() => togglePwd('current')}
                                                placeholder="Enter current password"
                                            />
                                            <PasswordField
                                                label="New Password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                show={showPasswords.new}
                                                onToggle={() => togglePwd('new')}
                                                placeholder="Enter new password"
                                            />
                                            <PasswordField
                                                label="Confirm New Password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                show={showPasswords.confirm}
                                                onToggle={() => togglePwd('confirm')}
                                                placeholder="Confirm new password"
                                            />

                                            <button
                                                type="submit"
                                                disabled={changingPwd}
                                                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] mt-2"
                                            >
                                                {changingPwd ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                                        Updating...
                                                    </span>
                                                ) : 'Update Password'}
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
