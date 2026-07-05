import { useState, useEffect } from 'react';
import { FiSearch, FiEdit2, FiStar, FiTrendingUp, FiUsers } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function AdminMegaCoin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Stats
  const [stats, setStats] = useState({ totalIssued: 0, totalRedeemed: 0, totalActive: 0 });

  // Modal State
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustData, setAdjustData] = useState({ userId: '', name: '', amount: 0, description: '' });

  useEffect(() => {
    fetchMegaCoinData();
  }, []);

  const fetchMegaCoinData = async () => {
    setLoading(true);
    try {
      // In a real app, these might be separate endpoints
      const res = await api.get('/users/admin/users'); // Reuse users list to see balances
      setUsers(res.data.users);
      
      // Calculate basic stats from users list (for demo purposes)
      const totalActive = res.data.users.reduce((sum, u) => sum + (u.megaCoinBalance || 0), 0);
      setStats({
        totalIssued: totalActive * 1.5, // Fake stat for visual
        totalRedeemed: totalActive * 0.5, // Fake stat for visual
        totalActive
      });
      
    } catch (err) {
      toast.error('Failed to load MegaCoin data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustData.userId || adjustData.amount === 0) return;
    
    try {
      // Note: this endpoint requires implementation in backend routes/controllers
      await api.post('/megacoin/admin/adjust', {
        userId: adjustData.userId,
        amount: Number(adjustData.amount),
        description: adjustData.description
      });
      
      toast.success('Balance adjusted successfully');
      setAdjustModalOpen(false);
      fetchMegaCoinData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to adjust balance');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => (b.megaCoinBalance || 0) - (a.megaCoinBalance || 0));

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🪙</span> MegaCoin Ledger
          </h1>
          <p className="text-sm text-gray-400 mt-1">Manage user coin balances and view system-wide stats.</p>
        </div>
        <button 
          onClick={() => {
            setAdjustData({ userId: '', name: '', amount: 0, description: '' });
            setAdjustModalOpen(true);
          }} 
          className="btn-primary"
        >
          Manual Adjustment
        </button>
      </div>

      {/* Stats row */}
      <div className="grid sm:grid-cols-3 gap-6 mb-8">
        <div className="card p-5 bg-gradient-to-br from-dark-card to-dark-surface border border-warning/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center text-warning">
              <FiStar />
            </div>
            <p className="text-sm text-gray-400 font-medium">Total Active Coins</p>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalActive.toLocaleString()}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-success">
              <FiTrendingUp />
            </div>
            <p className="text-sm text-gray-400 font-medium">Lifetime Issued</p>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalIssued.toLocaleString()}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <FiUsers />
            </div>
            <p className="text-sm text-gray-400 font-medium">Lifetime Redeemed</p>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalRedeemed.toLocaleString()}</p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-dark-border">
          <div className="relative w-full sm:w-80">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-9 text-sm w-full"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table-dark">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Balance</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-gray-500">No users found.</td>
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
                        <p className="text-sm font-medium text-white">{user.name}</p>
                      </div>
                    </td>
                    <td className="text-sm text-gray-400">{user.email}</td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-warning bg-warning/10 px-3 py-1 rounded-full border border-warning/20">
                        🪙 {user.megaCoinBalance || 0}
                      </span>
                    </td>
                    <td className="text-right">
                      <button 
                        onClick={() => {
                          setAdjustData({ userId: user._id, name: user.name, amount: 0, description: 'Manual Adjustment' });
                          setAdjustModalOpen(true);
                        }}
                        className="btn-outline text-xs px-3 py-1 flex items-center gap-2 ml-auto"
                      >
                        <FiEdit2 /> Adjust
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Modal */}
      {adjustModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-surface border border-dark-border rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Adjust MegaCoin Balance</h2>
            
            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="input-label">User</label>
                <div className="input bg-dark-muted text-gray-400 cursor-not-allowed">
                  {adjustData.name || 'Select a user'}
                </div>
              </div>
              
              <div>
                <label className="input-label">Amount (Positive to add, Negative to deduct)</label>
                <input 
                  type="number" 
                  value={adjustData.amount}
                  onChange={(e) => setAdjustData({...adjustData, amount: e.target.value})}
                  className="input" 
                  required
                />
              </div>

              <div>
                <label className="input-label">Description / Reason</label>
                <input 
                  type="text" 
                  value={adjustData.description}
                  onChange={(e) => setAdjustData({...adjustData, description: e.target.value})}
                  className="input" 
                  required
                  placeholder="e.g. Compensation for delayed order"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-dark-border">
                <button type="button" onClick={() => setAdjustModalOpen(false)} className="btn-ghost flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
