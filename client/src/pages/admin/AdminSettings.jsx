import { useState, useEffect } from 'react';
import { FiSave, FiSettings, FiStar, FiFileText } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    storeName: '',
    megaCoin: { earnRate: 10, redeemRate: 10, maxRedeemPerOrder: 500, isEnabled: true },
    returnPolicy: { windowDays: 7, globalConditions: '' },
    shippingPolicy: '',
    warrantyPolicy: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // Create a specific admin endpoint to get full settings
      // Assuming a generic GET /settings exists on the backend, or we get it through an admin route
      const res = await api.get('/settings'); 
      if (res.data.settings) {
        setSettings(res.data.settings);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', settings);
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Store Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Configure global store preferences and policies.</p>
      </div>

      <div className="flex gap-4 mb-6 border-b border-dark-border">
        {[
          { id: 'general', label: 'General', icon: FiSettings },
          { id: 'megacoin', label: 'MegaCoin', icon: FiStar },
          { id: 'policies', label: 'Policies', icon: FiFileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon /> {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="card p-6">
        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div>
              <label className="input-label">Store Name</label>
              <input 
                type="text" 
                value={settings.storeName}
                onChange={(e) => setSettings({...settings, storeName: e.target.value})}
                className="input max-w-md" 
                required 
              />
            </div>
            {/* Can add more general settings here like contact email, phone, social links */}
          </div>
        )}

        {/* MegaCoin Tab */}
        {activeTab === 'megacoin' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-dark-surface border border-dark-border rounded-xl">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.megaCoin.isEnabled}
                  onChange={(e) => setSettings({...settings, megaCoin: {...settings.megaCoin, isEnabled: e.target.checked}})}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-warning"></div>
              </label>
              <span className="text-sm font-medium text-white">Enable MegaCoin System</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="input-label">Earn Rate (৳ to 1 Coin)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">৳</span>
                  <input 
                    type="number" 
                    min="1"
                    value={settings.megaCoin.earnRate}
                    onChange={(e) => setSettings({...settings, megaCoin: {...settings.megaCoin, earnRate: Number(e.target.value)}})}
                    className="input pl-8" 
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">E.g. 10 = Spend ৳10 to earn 1 Coin</p>
              </div>

              <div>
                <label className="input-label">Redeem Rate (Coins to ৳1)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🪙</span>
                  <input 
                    type="number" 
                    min="1"
                    value={settings.megaCoin.redeemRate}
                    onChange={(e) => setSettings({...settings, megaCoin: {...settings.megaCoin, redeemRate: Number(e.target.value)}})}
                    className="input pl-8" 
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">E.g. 10 = 10 Coins gives ৳1 discount</p>
              </div>

              <div>
                <label className="input-label">Max Redeem Per Order (Coins)</label>
                <input 
                  type="number" 
                  min="0"
                  value={settings.megaCoin.maxRedeemPerOrder}
                  onChange={(e) => setSettings({...settings, megaCoin: {...settings.megaCoin, maxRedeemPerOrder: Number(e.target.value)}})}
                  className="input" 
                />
              </div>
            </div>

            <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl">
              <h4 className="text-sm font-semibold text-primary mb-2">Configuration Preview</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Customer spends ৳1,000 → Earns <strong className="text-white">{Math.floor(1000 / (settings.megaCoin.earnRate || 1))} Coins</strong></li>
                <li>• Customer redeems 100 Coins → Gets <strong className="text-white">৳{(100 / (settings.megaCoin.redeemRate || 1)).toFixed(2)} discount</strong></li>
              </ul>
            </div>
          </div>
        )}

        {/* Policies Tab */}
        {activeTab === 'policies' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-white mb-4">Return Policy</h3>
              <div className="space-y-4">
                <div>
                  <label className="input-label">Global Return Window (Days)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={settings.returnPolicy.windowDays}
                    onChange={(e) => setSettings({...settings, returnPolicy: {...settings.returnPolicy, windowDays: Number(e.target.value)}})}
                    className="input max-w-[200px]" 
                  />
                </div>
                <div>
                  <label className="input-label">Global Return Conditions</label>
                  <textarea 
                    value={settings.returnPolicy.globalConditions}
                    onChange={(e) => setSettings({...settings, returnPolicy: {...settings.returnPolicy, globalConditions: e.target.value}})}
                    className="input min-h-[100px]" 
                    placeholder="e.g. Items must be unopened and in original packaging..."
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-dark-border">
              <label className="input-label">Shipping Policy</label>
              <textarea 
                value={settings.shippingPolicy}
                onChange={(e) => setSettings({...settings, shippingPolicy: e.target.value})}
                className="input min-h-[100px]" 
              />
            </div>

            <div className="pt-6 border-t border-dark-border">
              <label className="input-label">Warranty Policy (General Terms)</label>
              <textarea 
                value={settings.warrantyPolicy}
                onChange={(e) => setSettings({...settings, warrantyPolicy: e.target.value})}
                className="input min-h-[100px]" 
              />
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-dark-border flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiSave />}
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
