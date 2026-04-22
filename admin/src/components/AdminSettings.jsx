import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { API_BASE } from '../utils/api';
import {
    UserCircle,
    Camera,
    Trash2,
    Lock,
    Save,
    Eye,
    EyeOff,
    CheckCircle,
    AlertCircle,
    Loader2,
    ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

/* ─── Small reusable alert ──── */
const Alert = ({ type, message }) => {
    if (!message) return null;
    const isSuccess = type === 'success';
    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold border ${isSuccess
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-700'
                }`}
        >
            {isSuccess ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {message}
        </motion.div>
    );
};

export default function AdminSettings() {
    const { user, updateProfile, updateAvatar, deleteAvatar } = useAuth();
    const fileInputRef = useRef(null);

    /* ── Tab state ── */
    const [activeTab, setActiveTab] = useState('profile');

    /* ── Profile form ── */
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
    const [savingProfile, setSavingProfile] = useState(false);

    /* ── Avatar ── */
    const [avatarLoading, setAvatarLoading] = useState(false);
    const [uploadPct, setUploadPct] = useState(0);

    /* ── Password form ── */
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pwMsg, setPwMsg] = useState({ type: '', text: '' });
    const [savingPw, setSavingPw] = useState(false);

    /* ── Invoice Settings ── */
    const [invoiceSettings, setInvoiceSettings] = useState({
        companyName: '',
        logoUrl: '',
        signatureUrl: '',
        addressLine: '',
        phone: '',
        email: '',
        gstin: '',
        bankDetails: {
            accountName: '',
            bankName: '',
            accountNo: '',
            ifscCode: ''
        },
        qrCodeUrl: ''
    });
    const [savingInvoice, setSavingInvoice] = useState(false);
    const [invMsg, setInvMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await axios.get(`${API_BASE}/settings`);
                if (data) setInvoiceSettings(data);
            } catch (err) {
                console.error('Error fetching settings:', err);
            }
        };
        fetchSettings();
    }, []);

    /* ── Handlers ── */
    const handleProfileSave = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        setProfileMsg({ type: '', text: '' });
        const result = await updateProfile(name, email);
        setProfileMsg({
            type: result.success ? 'success' : 'error',
            text: result.success ? 'Profile updated successfully!' : result.message,
        });
        setSavingProfile(false);
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarLoading(true);
        setUploadPct(0);
        const result = await updateAvatar(file, (pct) => setUploadPct(pct));
        if (!result.success) {
            setProfileMsg({ type: 'error', text: result.message });
        }
        setAvatarLoading(false);
        setUploadPct(0);
    };

    const handleDeleteAvatar = async () => {
        if (!window.confirm('Remove your profile photo?')) return;
        setAvatarLoading(true);
        const result = await deleteAvatar();
        if (!result.success) {
            setProfileMsg({ type: 'error', text: result.message });
        }
        setAvatarLoading(false);
    };

    const handlePasswordSave = async (e) => {
        e.preventDefault();
        setPwMsg({ type: '', text: '' });

        if (!currentPassword || !newPassword || !confirmPassword) {
            return setPwMsg({ type: 'error', text: 'All fields are required.' });
        }
        if (newPassword.length < 6) {
            return setPwMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
        }
        if (newPassword !== confirmPassword) {
            return setPwMsg({ type: 'error', text: 'New passwords do not match.' });
        }

        setSavingPw(true);
        try {
            await axios.put(
                `${API_BASE}/auth/change-password`,
                { currentPassword, newPassword },
                { headers: { Authorization: `Bearer ${user.token}` } }
            );
            setPwMsg({ type: 'success', text: 'Password changed successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setPwMsg({
                type: 'error',
                text: err.response?.data?.message || 'Failed to change password.',
            });
        } finally {
            setSavingPw(false);
        }
    };

    const handleInvoiceSave = async (e) => {
        e.preventDefault();
        setSavingInvoice(true);
        setInvMsg({ type: '', text: '' });
        try {
            const { data } = await axios.put(`${API_BASE}/settings`, invoiceSettings, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setInvoiceSettings(data);
            setInvMsg({ type: 'success', text: 'Invoice settings updated!' });
            toast.success('Business credentials saved!');
        } catch (err) {
            setInvMsg({ type: 'error', text: 'Failed to update settings.' });
            toast.error('Sync failed');
        } finally {
            setSavingInvoice(false);
        }
    };

    const handleAssetUpload = async (file, field) => {
        if (!file) return;
        
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = async () => {
            const base64data = reader.result;
            const loadingToast = toast.loading(`Uploading ${field}...`);
            try {
                const { data } = await axios.post(`${API_BASE}/upload`, { image: base64data });
                
                if (field.includes('.')) {
                    const [parent, child] = field.split('.');
                    setInvoiceSettings(prev => ({
                        ...prev,
                        [parent]: { ...prev[parent], [child]: data.url }
                    }));
                } else {
                    setInvoiceSettings(prev => ({ ...prev, [field]: data.url }));
                }
                toast.success('Asset synced!', { id: loadingToast });
            } catch (err) {
                toast.error('Upload failed', { id: loadingToast });
            }
        };
    };

    const pwStrength = (() => {
        if (!newPassword) return null;
        if (newPassword.length < 6) return { label: 'Weak', color: 'bg-red-400', width: '33%' };
        if (newPassword.length < 10) return { label: 'Fair', color: 'bg-amber-400', width: '66%' };
        return { label: 'Strong', color: 'bg-emerald-500', width: '100%' };
    })();

    const TABS = [
        { id: 'profile', label: 'Profile' },
        { id: 'security', label: 'Security' },
        { id: 'invoice', label: 'Invoice' },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Account Settings</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Manage your profile, security and business preferences
                </p>
            </div>

            {/* Tab Bar */}
            <div className="flex border-b border-slate-100">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative px-6 py-3 text-sm font-bold transition-colors ${activeTab === tab.id
                            ? 'text-indigo-600'
                            : 'text-slate-400 hover:text-slate-700'
                            }`}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="tab-underline"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
                            />
                        )}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">

                {/* ══ PROFILE TAB ══ */}
                {activeTab === 'profile' && (
                    <motion.div
                        key="profile"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <div className="bg-white border border-slate-100 shadow-sm p-8 rounded-3xl">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Profile Photo</h2>
                            <div className="flex items-center gap-8">
                                <div className="relative flex-shrink-0">
                                    <div className="w-24 h-24 bg-indigo-50 border-4 border-white shadow-xl rounded-2xl overflow-hidden flex items-center justify-center">
                                        {avatarLoading ? (
                                            <div className="flex flex-col items-center gap-1">
                                                <Loader2 size={24} className="text-indigo-400 animate-spin" />
                                                {uploadPct > 0 && <span className="text-[9px] font-black text-indigo-400">{uploadPct}%</span>}
                                            </div>
                                        ) : user?.avatar ? (
                                            <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <UserCircle size={48} className="text-indigo-300" />
                                        )}
                                    </div>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute -bottom-1 -right-1 w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-indigo-700 transition"
                                    >
                                        <Camera size={14} />
                                    </button>
                                    <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                </div>
                                <div className="space-y-3">
                                    <p className="text-sm font-semibold text-slate-700">Display Identity</p>
                                    <p className="text-xs text-slate-400">Update your photo visible to other staff.</p>
                                    {user?.avatar && (
                                        <button onClick={handleDeleteAvatar} className="text-xs text-red-500 font-bold hover:underline flex items-center gap-1">
                                            <Trash2 size={12} /> Remove photo
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-100 shadow-sm p-8 rounded-3xl">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Personal Details</h2>
                            {profileMsg.text && <Alert type={profileMsg.type} message={profileMsg.text} />}
                            <form onSubmit={handleProfileSave} className="space-y-6 mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full border border-slate-100 px-5 py-3.5 text-sm font-bold bg-slate-50 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full border border-slate-100 px-5 py-3.5 text-sm font-bold bg-slate-50 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all" />
                                    </div>
                                </div>
                                <button type="submit" disabled={savingProfile} className="px-8 py-3.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-600 transition-all flex items-center gap-2">
                                    {savingProfile ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Updates
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}

                {/* ══ SECURITY TAB ══ */}
                {activeTab === 'security' && (
                    <motion.div
                        key="security"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <div className="bg-white border border-slate-100 shadow-sm p-8 rounded-3xl">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Security & Password</h2>
                            {pwMsg.text && <Alert type={pwMsg.type} message={pwMsg.text} />}
                            <form onSubmit={handlePasswordSave} className="space-y-6 mt-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                                    <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="w-full border border-slate-100 px-5 py-3.5 text-sm font-bold bg-slate-50 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="w-full border border-slate-100 px-5 py-3.5 text-sm font-bold bg-slate-50 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full border border-slate-100 px-5 py-3.5 text-sm font-bold bg-slate-50 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all" />
                                    </div>
                                </div>
                                <button type="submit" disabled={savingPw} className="px-8 py-3.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-rose-600 transition-all flex items-center gap-2">
                                    {savingPw ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />} Update Password
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}

                {/* ══ INVOICE TAB ══ */}
                {activeTab === 'invoice' && (
                    <motion.div
                        key="invoice"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { label: 'Logo', field: 'logoUrl' },
                                { label: 'Signature', field: 'signatureUrl' },
                                { label: 'QR Code', field: 'qrCodeUrl' }
                            ].map(asset => (
                                <div key={asset.field} className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm text-center">
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">{asset.label}</p>
                                    <div className="w-full aspect-square bg-slate-50 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center overflow-hidden mb-4 relative group">
                                        {invoiceSettings[asset.field] ? (
                                            <img src={invoiceSettings[asset.field]} alt={asset.label} className="w-full h-full object-contain p-2" />
                                        ) : (
                                            <ImageIcon size={32} className="text-slate-200" />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <label className="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                                                Replace
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleAssetUpload(e.target.files[0], asset.field)} />
                                            </label>
                                        </div>
                                    </div>
                                    {!invoiceSettings[asset.field] && (
                                        <label className="cursor-pointer inline-flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">
                                            <Camera size={12} /> Upload {asset.label}
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleAssetUpload(e.target.files[0], asset.field)} />
                                        </label>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="bg-white border border-slate-100 shadow-sm p-8 rounded-3xl">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Business Information</h2>
                            {invMsg.text && <Alert type={invMsg.type} message={invMsg.text} />}
                            <form onSubmit={handleInvoiceSave} className="space-y-6 mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name</label>
                                        <input type="text" value={invoiceSettings.companyName} onChange={e => setInvoiceSettings(prev => ({ ...prev, companyName: e.target.value }))} className="w-full border border-slate-100 px-5 py-3.5 text-sm font-bold bg-slate-50 rounded-2xl focus:bg-white outline-none" placeholder="Mimitiinaa" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GSTIN Number</label>
                                        <input type="text" value={invoiceSettings.gstin} onChange={e => setInvoiceSettings(prev => ({ ...prev, gstin: e.target.value }))} className="w-full border border-slate-100 px-5 py-3.5 text-sm font-bold bg-slate-50 rounded-2xl focus:bg-white outline-none" placeholder="07AHEPP8198B1Z3" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address (Full Line)</label>
                                        <input type="text" value={invoiceSettings.addressLine} onChange={e => setInvoiceSettings(prev => ({ ...prev, addressLine: e.target.value }))} className="w-full border border-slate-100 px-5 py-3.5 text-sm font-bold bg-slate-50 rounded-2xl focus:bg-white outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Email</label>
                                        <input type="email" value={invoiceSettings.email} onChange={e => setInvoiceSettings(prev => ({ ...prev, email: e.target.value }))} className="w-full border border-slate-100 px-5 py-3.5 text-sm font-bold bg-slate-50 rounded-2xl focus:bg-white outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                        <input type="text" value={invoiceSettings.phone} onChange={e => setInvoiceSettings(prev => ({ ...prev, phone: e.target.value }))} className="w-full border border-slate-100 px-5 py-3.5 text-sm font-bold bg-slate-50 rounded-2xl focus:bg-white outline-none" />
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-50">
                                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-6">Banking Details (For Invoice Footer)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Name</label>
                                            <input type="text" value={invoiceSettings.bankDetails?.accountName} onChange={e => setInvoiceSettings(prev => ({ ...prev, bankDetails: { ...prev.bankDetails, accountName: e.target.value } }))} className="w-full border border-slate-100 px-5 py-3.5 text-sm font-bold bg-slate-50 rounded-2xl focus:bg-white outline-none" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bank Name</label>
                                            <input type="text" value={invoiceSettings.bankDetails?.bankName} onChange={e => setInvoiceSettings(prev => ({ ...prev, bankDetails: { ...prev.bankDetails, bankName: e.target.value } }))} className="w-full border border-slate-100 px-5 py-3.5 text-sm font-bold bg-slate-50 rounded-2xl focus:bg-white outline-none" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Number</label>
                                            <input type="text" value={invoiceSettings.bankDetails?.accountNo} onChange={e => setInvoiceSettings(prev => ({ ...prev, bankDetails: { ...prev.bankDetails, accountNo: e.target.value } }))} className="w-full border border-slate-100 px-5 py-3.5 text-sm font-bold bg-slate-50 rounded-2xl focus:bg-white outline-none" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">IFSC Code</label>
                                            <input type="text" value={invoiceSettings.bankDetails?.ifscCode} onChange={e => setInvoiceSettings(prev => ({ ...prev, bankDetails: { ...prev.bankDetails, ifscCode: e.target.value } }))} className="w-full border border-slate-100 px-5 py-3.5 text-sm font-bold bg-slate-50 rounded-2xl focus:bg-white outline-none" />
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" disabled={savingInvoice} className="px-8 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100">
                                    {savingInvoice ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Business Settings
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}