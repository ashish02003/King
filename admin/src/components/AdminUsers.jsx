import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../utils/api';
import {
    Search,
    Users,
    UserCheck,
    UserMinus,
    Mail,
    Shield,
    Calendar,
    MoreHorizontal,
    SearchX,
    ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';

const AdminUsers = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data } = await axios.get(`${API_BASE}/auth/users`, {
                    headers: { Authorization: `Bearer ${currentUser.token}` }
                });
                setUsers(data || []);
            } catch (error) {
                console.error('Failed to fetch users', error);
            } finally {
                setLoading(false);
            }
        };

        if (currentUser) fetchUsers();
    }, [currentUser]);

    const activeThreshold = 7 * 24 * 60 * 60 * 1000;
    const now = new Date();

    const stats = {
        total: users.length,
        active: users.filter(u => u.lastActive && (now - new Date(u.lastActive)) < activeThreshold).length,
        inactive: users.filter(u => !u.lastActive || (now - new Date(u.lastActive)) >= activeThreshold).length
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const KPICard = ({ title, value, icon: Icon, color, subText }) => (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-white p-6 shadow-sm border border-slate-100 flex items-center gap-5 transition-all"
        >
            <div className={`w-14 h-14 ${color} flex items-center justify-center text-white shadow-lg rounded-full shadow-current/10`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-3xl font-black text-slate-900 leading-none tracking-tighter">{value}</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-2">{subText}</p>
            </div>
        </motion.div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tighter uppercase mb-2 leading-none">User Directory</h1>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Scale your community presence & engagement</p>
                </div>
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search by identity or credentials..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none font-bold text-xs text-slate-900 placeholder:text-slate-300"
                    />
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KPICard
                    title="Community Registry"
                    value={stats.total}
                    icon={Users}
                    color="bg-indigo-600"
                    subText="Total verified profiles"
                />
                <KPICard
                    title="Active Pulse"
                    value={stats.active}
                    icon={UserCheck}
                    color="bg-emerald-500"
                    subText="Engagement within 7 days"
                />
                <KPICard
                    title="Dormant Cells"
                    value={stats.inactive}
                    icon={UserMinus}
                    color="bg-orange-500"
                    subText="Silent for over 168 hours"
                />
            </div>

            {/* Users Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white shadow-sm border border-slate-100 overflow-hidden"
            >
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Identity Profile</th>
                                <th>Security clearance</th>
                                <th>Operational state</th>
                                <th>Temporal Log</th>
                                <th className="text-center">Nodes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Querying Database...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center">
                                        <SearchX size={40} className="mx-auto text-slate-100 mb-4" />
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">No identities found</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u, idx) => {
                                    const isActive = u.lastActive && (now - new Date(u.lastActive)) < activeThreshold;
                                    return (
                                        <motion.tr
                                            key={u._id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="hover:bg-slate-50/50 transition-colors group"
                                        >
                                            <td>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 flex items-center justify-center text-sm font-black text-indigo-600 shadow-sm overflow-hidden flex-shrink-0">
                                                        {u.avatar ? (
                                                            <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                                                        ) : u.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{u.name}</span>
                                                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold mt-1">
                                                            <Mail size={10} /> {u.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider border ${u.role === 'admin'
                                                    ? 'bg-purple-50 text-purple-600 border-purple-100'
                                                    : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                                    }`}>
                                                    <Shield size={10} />
                                                    {u.role}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider">
                                                        <div className={`w-1.5 h-1.5 ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                                        <span className={isActive ? 'text-emerald-600' : 'text-slate-400'}>
                                                            {isActive ? 'Active' : 'Dormant'}
                                                        </span>
                                                    </div>
                                                    <span className="text-[9px] text-slate-300 font-bold ml-3.5">
                                                        {isActive ? 'High Pulse' : 'Signal Lost'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex flex-col gap-1 text-[10px] font-bold text-slate-600">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={12} className="text-slate-300" />
                                                        <span className="text-slate-300 text-[9px] uppercase tracking-tighter">Registered:</span>
                                                        {new Date(u.createdAt).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 flex items-center justify-center"><div className="w-1 h-1 bg-slate-200"></div></div>
                                                        <span className="text-slate-300 text-[9px] uppercase tracking-tighter">Protocol:</span>
                                                        {u.lastActive ? new Date(u.lastActive).toLocaleDateString() : 'None'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-2 hover:bg-slate-100 text-slate-400 transition-colors">
                                                        <ExternalLink size={16} />
                                                    </button>
                                                    <button className="p-2 hover:bg-slate-100 text-slate-400 transition-colors">
                                                        <MoreHorizontal size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
};

export default AdminUsers;
