import { useState, useEffect } from 'react';
import { FiRefreshCw, FiEye, FiCheck, FiX, FiFilter } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function AdminReturns() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const [expandedId, setExpandedId] = useState(null);
  const [updateData, setUpdateData] = useState({ status: '', adminNote: '', refundAmount: 0 });

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await api.get('/returns/admin');
      setReturns(res.data.returns);
    } catch (err) {
      toast.error('Failed to load returns');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (returnId) => {
    try {
      await api.put(`/returns/admin/${returnId}`, updateData);
      toast.success('Return request updated');
      fetchReturns();
      setExpandedId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const filteredReturns = statusFilter === 'all' 
    ? returns 
    : returns.filter(r => r.status === statusFilter);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'requested': return <span className="badge-warning">Requested</span>;
      case 'under-review': return <span className="badge-info">Under Review</span>;
      case 'approved': return <span className="badge-primary">Approved</span>;
      case 'rejected': return <span className="badge-error">Rejected</span>;
      case 'refunded': return <span className="badge-success">Refunded</span>;
      default: return <span className="badge-primary">{status}</span>;
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Return Requests</h1>
          <p className="text-sm text-gray-400 mt-1">Manage customer product returns and refunds.</p>
        </div>
        <div className="flex items-center gap-2">
          <FiFilter className="text-gray-400" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input py-1.5 text-sm bg-dark-surface border-dark-border"
          >
            <option value="all">All Statuses</option>
            <option value="requested">Requested</option>
            <option value="under-review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-dark">
            <thead>
              <tr>
                <th>Return ID</th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Reason</th>
                <th>Date</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">No return requests found.</td>
                </tr>
              ) : (
                filteredReturns.map((req) => (
                  <tr key={req._id}>
                    <td className="font-mono text-xs uppercase">{req._id.substring(req._id.length - 8)}</td>
                    <td className="font-mono text-xs uppercase text-gray-400">{req.order.substring(req.order.length - 8)}</td>
                    <td>
                      <p className="text-sm font-medium text-white">{req.user?.name}</p>
                    </td>
                    <td className="text-sm capitalize">{req.reason.replace('-', ' ')}</td>
                    <td className="text-sm">{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td>{getStatusBadge(req.status)}</td>
                    <td className="text-right">
                      <button 
                        onClick={() => {
                          if (expandedId === req._id) {
                            setExpandedId(null);
                          } else {
                            setExpandedId(req._id);
                            setUpdateData({
                              status: req.status,
                              adminNote: req.adminNote || '',
                              refundAmount: req.refundAmount || 0
                            });
                          }
                        }}
                        className="btn-ghost text-xs px-2 py-1 flex items-center gap-1 ml-auto"
                      >
                        <FiEye /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {expandedId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-lg bg-dark-surface border-l border-dark-border h-full overflow-y-auto shadow-2xl p-6">
            {(() => {
              const req = returns.find(r => r._id === expandedId);
              if(!req) return null;
              
              return (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2"><FiRefreshCw className="text-primary" /> Return Details</h2>
                      <p className="text-xs text-gray-400 font-mono mt-1">ID: {req._id}</p>
                    </div>
                    <button onClick={() => setExpandedId(null)} className="text-gray-400 hover:text-white">✕</button>
                  </div>

                  <div className="card p-4 space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Reason for Return</p>
                      <p className="text-sm text-white font-medium capitalize">{req.reason.replace('-', ' ')}</p>
                      {req.reasonDetail && (
                        <p className="text-sm text-gray-400 mt-2 p-3 bg-dark-card rounded border border-dark-border">"{req.reasonDetail}"</p>
                      )}
                    </div>

                    {req.evidenceImages?.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Evidence Photos</p>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {req.evidenceImages.map((img, i) => (
                            <a key={i} href={img.url} target="_blank" rel="noreferrer" className="shrink-0">
                              <img src={img.url} alt="Evidence" className="w-20 h-20 rounded-lg object-cover border border-dark-border hover:border-primary transition-colors cursor-pointer" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="card p-4">
                    <h3 className="text-sm font-semibold text-white border-b border-dark-border pb-2 mb-3">Update Return</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="input-label text-xs">Status</label>
                        <select 
                          value={updateData.status} 
                          onChange={(e) => setUpdateData({...updateData, status: e.target.value})}
                          className="input text-sm"
                        >
                          <option value="requested">Requested</option>
                          <option value="under-review">Under Review</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      </div>

                      {updateData.status === 'approved' || updateData.status === 'refunded' ? (
                        <div>
                          <label className="input-label text-xs">Refund Amount (৳)</label>
                          <input 
                            type="number" 
                            value={updateData.refundAmount}
                            onChange={(e) => setUpdateData({...updateData, refundAmount: Number(e.target.value)})}
                            className="input text-sm" 
                          />
                          <p className="text-xs text-gray-500 mt-1">Requested Method: <span className="text-white capitalize">{req.refundMethod}</span></p>
                        </div>
                      ) : null}

                      <div>
                        <label className="input-label text-xs">Admin Note (Visible to user)</label>
                        <textarea 
                          value={updateData.adminNote}
                          onChange={(e) => setUpdateData({...updateData, adminNote: e.target.value})}
                          className="input text-sm min-h-[80px]"
                          placeholder="E.g. Return approved, please ship back to..."
                        />
                      </div>

                      <button onClick={() => handleUpdate(req._id)} className="btn-primary w-full">
                        Save Changes
                      </button>
                    </div>
                  </div>
                  
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
