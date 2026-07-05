import { useState, useEffect } from 'react';
import { FiSearch, FiShield, FiUser, FiUserX, FiCheck } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users/admin/users');
      setUsers(res.data.users);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await api.patch(`/users/admin/users/${userId}/toggle`);
      toast.success('User status updated');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">User Management</h1>
          <p className="text-sm text-gray-400 mt-1">Manage customers, admins, and account access.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search by name or email" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-9 text-sm"
          />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-dark">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>MegaCoins</th>
                <th>Joined</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">No users found.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-dark-muted flex items-center justify-center overflow-hidden">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-gray-400">{user.name[0]?.toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        user.role === 'admin' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-gray-800 text-gray-400 border border-gray-700'
                      }`}>
                        {user.role === 'admin' ? <FiShield /> : <FiUser />} {user.role}
                      </span>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-warning">
                        🪙 {user.megaCoinBalance || 0}
                      </span>
                    </td>
                    <td className="text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      {user.isActive ? (
                        <span className="badge-success">Active</span>
                      ) : (
                        <span className="badge-error">Banned</span>
                      )}
                    </td>
                    <td className="text-right">
                      {user.role !== 'admin' && (
                        <button 
                          onClick={() => handleToggleStatus(user._id)}
                          className={`btn-outline text-xs px-2 py-1 flex items-center gap-1 ml-auto ${
                            user.isActive ? 'text-error border-error/50 hover:bg-error/10 hover:border-error' : 'text-success border-success/50 hover:bg-success/10 hover:border-success'
                          }`}
                        >
                          {user.isActive ? <><FiUserX /> Ban</> : <><FiCheck /> Unban</>}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
