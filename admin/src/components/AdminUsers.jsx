import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../utils/api';

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
                setUsers(data);
            } catch (error) {
                console.error('Failed to fetch users', error);
            } finally {
                setLoading(false);
            }
        };

        if (currentUser) fetchUsers();
    }, [currentUser]);

    // Active threshold: 7 days
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
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex items-center gap-5 transition-all hover:shadow-xl hover:-translate-y-1">
            <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-white shadow-lg`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{title}</p>
                <h3 className="text-3xl font-black text-gray-900 leading-none">{value}</h3>
                <p className="text-[10px] font-bold text-gray-400 mt-2">{subText}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 lg:p-10 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase mb-2">User Management</h1>
                        <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em]">Oversee your community and engagement metrics</p>
                    </div>
                    <div className="relative w-full md:w-80">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 focus:border-blue-500 transition-all outline-none font-bold text-sm"
                        />
                    </div>
                </div>

                {/* KPI Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <KPICard
                        title="Total Community"
                        value={stats.total}
                        icon={FaUsers}
                        color="bg-blue-600 shadow-blue-200"
                        subText="Overall registered accounts"
                    />
                    <KPICard
                        title="Active Now"
                        value={stats.active}
                        icon={FaUserCheck}
                        color="bg-emerald-500 shadow-emerald-200"
                        subText="Logged in within 7 days"
                    />
                    <KPICard
                        title="Inactive Users"
                        value={stats.inactive}
                        icon={FaUserSlash}
                        color="bg-orange-500 shadow-orange-200"
                        subText="Silent for more than a week"
                    />
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">User Profile</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Security & Role</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Activity Log</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Fetching user data...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-8 py-20 text-center">
                                            <FaUsers size={40} className="mx-auto text-gray-200 mb-4" />
                                            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No users match your search</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((u) => {
                                        const isActive = u.lastActive && (now - new Date(u.lastActive)) < activeThreshold;
                                        return (
                                            <tr key={u._id} className="hover:bg-blue-50/30 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-gray-100 to-white border border-gray-200 flex items-center justify-center text-lg font-black text-gray-700 shadow-sm overflow-hidden flex-shrink-0">
                                                            {u.avatar ? (
                                                                <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                                                            ) : u.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors">{u.name}</span>
                                                            <div className="flex items-center gap-2 text-xs text-gray-400 font-bold">
                                                                <FaEnvelope size={10} />
                                                                {u.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${u.role === 'admin'
                                                            ? 'bg-purple-50 text-purple-600 border border-purple-100'
                                                            : 'bg-blue-50 text-blue-600 border border-blue-100'
                                                        }`}>
                                                        <FaShieldAlt size={10} />
                                                        {u.role}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-orange-400'}`}></div>
                                                            <span className={`text-[11px] font-black uppercase tracking-wider ${isActive ? 'text-emerald-600' : 'text-orange-500'}`}>
                                                                {isActive ? 'Active Now' : 'Inactive'}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] text-gray-400 font-bold">
                                                            {isActive ? 'Always Engaged' : 'Needs attention'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-1 text-[11px] font-bold text-gray-600">
                                                        <div className="flex items-center gap-2">
                                                            <FaCalendarAlt className="text-gray-300" />
                                                            <span className="text-gray-400">Joined:</span>
                                                            {new Date(u.createdAt).toLocaleDateString()}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                                                            <span className="text-gray-400">Pulse:</span>
                                                            {u.lastActive ? new Date(u.lastActive).toLocaleDateString() : 'Never'}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminUsers;
