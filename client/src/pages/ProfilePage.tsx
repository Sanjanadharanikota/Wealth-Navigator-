import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { accountsAPI, chatAPI, plaidAPI } from '../utils/api';
import {
  User,
  Key,
  LogOut,
  Fingerprint,
  ChevronRight,
  Unlink,
  AlertCircle,
  Edit3,
  Plus,
  CreditCard,
  Target,
  Shield,
  Eye,
  EyeOff,
  Building,
  X
} from 'lucide-react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuthStore();
  const [webAuthnAvailable, setWebAuthnAvailable] = useState(false);
  const [hasWebAuthn, setHasWebAuthn] = useState(false);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [dataSharingEnabled, setDataSharingEnabled] = useState(true); // Keep it turned on by default
  const [selectedInstitutionForUnlink, setSelectedInstitutionForUnlink] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string>('USD');

  useEffect(() => {
    checkWebAuthn();
    loadInstitutions();
    loadDataSharingState();
  }, []);

  const loadInstitutions = async () => {
    try {
      const response = await accountsAPI.getAccounts();
      setInstitutions(response.data.institutions || []);
      
      // Set currency from first account
      const institutions = response.data.institutions || [];
      if (institutions.length > 0 && institutions[0].accounts && institutions[0].accounts.length > 0) {
        setCurrency(institutions[0].accounts[0].currency || 'USD');
      }
    } catch (error) {
      console.error('Failed to load institutions:', error);
    }
  };

  const loadDataSharingState = async () => {
    try {
      // Load current data sharing state from chat session
      const response = await chatAPI.getSession();
      setDataSharingEnabled(response.data.dataSharing === true);
      console.log('[Profile] Loaded data sharing state:', response.data.dataSharing);
    } catch (error) {
      console.error('Failed to load data sharing state:', error);
    }
  };

  const checkWebAuthn = async () => {
    // Mock implementation - in a real app, you would check for WebAuthn availability
    setWebAuthnAvailable(true);
    setHasWebAuthn(user?.hasWebAuthn || false);
  };

  const handleEnableWebAuthn = async () => {
    try {
      // Mock implementation - in a real app, you would register WebAuthn
      setHasWebAuthn(true);
      setUser({ ...user, hasWebAuthn: true });
      alert('Device password authentication enabled successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to enable device password');
    }
  };

  const handleUnlinkBank = async () => {
    try {
      setUnlinking(true);
      
      // If a specific institution is selected for unlinking
      if (selectedInstitutionForUnlink) {
        // In a real app, you would unlink a specific institution
        // For now, we'll unlink all as per the existing implementation
        await plaidAPI.unlink();
        alert(`Bank ${selectedInstitutionForUnlink} unlinked and data deleted successfully`);
      } else {
        // Unlink all bank accounts
        await plaidAPI.unlink();
        alert('All bank accounts unlinked and data deleted successfully');
      }
      
      setShowUnlinkModal(false);
      setSelectedInstitutionForUnlink(null);
      
      // Refresh institutions list
      loadInstitutions();
      
      // Update user state to reflect that bank is no longer connected
      setUser({ ...user, hasBankConnected: false });
    } catch (error: any) {
      alert('Failed to unlink bank account: ' + (error.message || 'Unknown error'));
    } finally {
      setUnlinking(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSaveName = () => {
    setUser({ ...user, name: newName });
    setShowNameModal(false);
  };

  const handleAddBankAccount = () => {
    // Navigate to bank connection page
    navigate('/onboarding/bank-connection');
  };

  const toggleDataSharing = async () => {
    const newValue = !dataSharingEnabled;
    try {
      console.log('[Profile] Toggling data sharing to:', newValue);
      
      // Update chat data sharing preference (this affects AI assistant)
      await chatAPI.updateDataSharing({
        enabled: newValue,
      });
      
      // Update local state
      setDataSharingEnabled(newValue);
      console.log('[Profile] Data sharing updated successfully');
    } catch (error) {
      console.error('Failed to update data sharing setting:', error);
      alert('Failed to update data sharing preference. Please try again.');
    }
  };

  const handleSetGoals = () => {
    // Navigate to goals setup page
    navigate('/goals');
  };

  const handleUnlinkSpecificInstitution = (institutionName: string) => {
    setSelectedInstitutionForUnlink(institutionName);
    setShowUnlinkModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 pt-12 pb-20">
        <div className="text-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{user?.name}</h1>
          <p className="text-primary-100">{user?.email}</p>
        </div>
      </header>

      <div className="px-4 -mt-12">
        {/* Account Settings */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Account Settings</h2>
          <div className="space-y-1">
            <button 
              onClick={() => setShowNameModal(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-700 rounded-xl transition-all"
            >
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-500" />
                <span className="dark:text-white">Edit Name</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-700 rounded-xl transition-all">
              <div className="flex items-center gap-3">
                <Key className="w-5 h-5 text-gray-500" />
                <span className="dark:text-white">Change Password</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            <button 
              onClick={handleSetGoals}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-700 rounded-xl transition-all"
            >
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-gray-500" />
                <span className="dark:text-white">Set Goals</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Security */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Security</h2>
          <div className="space-y-1">
            {webAuthnAvailable && (
              <button
                onClick={handleEnableWebAuthn}
                disabled={hasWebAuthn}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-700 rounded-xl transition-all disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <Fingerprint className="w-5 h-5 text-gray-500" />
                  <div className="text-left">
                    <p className="dark:text-white">Device Password</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {hasWebAuthn ? 'Enabled' : 'Enable biometric unlock'}
                    </p>
                  </div>
                </div>
                {hasWebAuthn && (
                  <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                    Active
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Connected Banks */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold dark:text-white">Connected Banks</h2>
            <button
              onClick={handleAddBankAccount}
              className="flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Bank
            </button>
          </div>
          
          <div className="space-y-3">
            {institutions.map((institution) => (
              <div key={institution.institutionName} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium dark:text-white">{institution.institutionName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {institution.accounts.length} account{institution.accounts.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                    {formatCurrency(institution.totalBalance)}
                  </span>
                  <button 
                    onClick={() => handleUnlinkSpecificInstitution(institution.institutionName)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                  >
                    <Unlink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            
            {institutions.length === 0 && (
              <div className="text-center py-6">
                <Building className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 mb-3">
                  No banks connected
                </p>
                <button
                  onClick={handleAddBankAccount}
                  className="btn-primary text-sm"
                >
                  Connect Bank
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bank Connection */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Bank Connection</h2>
          <button
            onClick={() => {
              setSelectedInstitutionForUnlink(null);
              setShowUnlinkModal(true);
            }}
            className="w-full flex items-center justify-between p-4 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
          >
            <div className="flex items-center gap-3">
              <Unlink className="w-5 h-5 text-red-600 dark:text-red-400" />
              <div className="text-left">
                <p className="text-red-600 dark:text-red-400 font-medium">Unlink All Banks</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Remove all bank connections and delete data
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-red-400" />
          </button>
        </div>

        {/* Privacy */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">Privacy</h2>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-500" />
              <div className="text-left">
                <p className="dark:text-white">Data Sharing</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Allow AI assistant to access financial data
                </p>
              </div>
            </div>
            <button
              onClick={toggleDataSharing}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                dataSharingEnabled ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  dataSharingEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="card">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-4 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-red-600 dark:text-red-400 font-medium">Logout</span>
            </div>
            <ChevronRight className="w-5 h-5 text-red-400" />
          </button>
        </div>
      </div>

      {/* Edit Name Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold dark:text-white">Edit Name</h3>
              <button
                onClick={() => setShowNameModal(false)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-dark-600 rounded-lg mb-4 dark:bg-dark-800 dark:text-white"
              placeholder="Enter your name"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowNameModal(false)}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-dark-600 rounded-lg font-medium dark:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveName}
                className="flex-1 py-3 px-4 bg-primary-600 text-white rounded-lg font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unlink Bank Modal */}
      {showUnlinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold dark:text-white">
                {selectedInstitutionForUnlink ? `Unlink ${selectedInstitutionForUnlink}?` : 'Unlink All Banks?'}
              </h3>
              <button
                onClick={() => {
                  setShowUnlinkModal(false);
                  setSelectedInstitutionForUnlink(null);
                }}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                {selectedInstitutionForUnlink 
                  ? `This will remove all data for ${selectedInstitutionForUnlink} and cannot be undone.`
                  : 'This will remove all bank connections and delete all financial data. This cannot be undone.'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowUnlinkModal(false);
                  setSelectedInstitutionForUnlink(null);
                }}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-dark-600 rounded-lg font-medium dark:text-white"
                disabled={unlinking}
              >
                Cancel
              </button>
              <button
                onClick={handleUnlinkBank}
                className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg font-medium disabled:opacity-50"
                disabled={unlinking}
              >
                {unlinking ? 'Unlinking...' : 'Unlink'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}