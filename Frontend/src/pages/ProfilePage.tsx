import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { User, Mail, Phone, MapPin, Save, Edit2, ArrowLeft } from 'lucide-react';

interface ProfilePageProps {
  onBack?: () => void;
}

export default function ProfilePage({ onBack }: ProfilePageProps) {
  const { user } = useAuth();
  const { address, updateAddress } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ phone1?: string; phone2?: string }>({});
  const [formData, setFormData] = useState({
    FullName: '',
    phone1: '',
    phone2: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    addressType: 'home' as 'home' | 'work',
  });

  useEffect(() => {
    if (address) {
      setFormData({
        FullName: address.FullName || '',
        phone1: address.phone1 || '',
        phone2: address.phone2 || '',
        address: address.address || '',
        city: address.city || '',
        state: address.state || '',
        pinCode: address.pinCode || '',
        addressType: address.addressType || 'home',
      });
    }
  }, [address]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    setFieldErrors({});

    if (!user) {
      setErrorMessage('⚠️ You must be logged in to save your profile.');
      setIsSaving(false);
      return;
    }

    const validations = [
      { check: !formData.FullName || !formData.phone1 || !formData.address || !formData.city || !formData.state || !formData.pinCode, msg: '⚠️ Please fill in all required fields.' },
      { check: formData.phone1.length !== 10 || !/^\d{10}$/.test(formData.phone1), msg: '⚠️ Primary phone must be exactly 10 digits (numbers only).' },
      { check: formData.phone2 && (formData.phone2.length !== 10 || !/^\d{10}$/.test(formData.phone2)), msg: '⚠️ Alternative phone must be exactly 10 digits (numbers only).' },
      { check: formData.pinCode.length !== 6 || !/^\d{6}$/.test(formData.pinCode), msg: '⚠️ Pin code must be exactly 6 digits.' },
      { check: formData.address.length < 8, msg: '⚠️ Address must be at least 8 characters.' },
    ];

    for (const validation of validations) {
      if (validation.check) {
        setErrorMessage(validation.msg);
        setIsSaving(false);
        return;
      }
    }

    try {
      const addressData = {
        id: address?.id,
        FullName: formData.FullName,
        phone1: formData.phone1,
        phone2: formData.phone2,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pinCode: formData.pinCode,
        addressType: formData.addressType,
      };
      console.log('💾 Attempting to save address:', addressData);
      await updateAddress(addressData);
      setIsEditing(false);
      setSuccessMessage('✅ Profile saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to save profile. Please try again.';

      // Check if error is about duplicate/existing phone numbers
      if (errorMsg.toLowerCase().includes('exist') ||
        errorMsg.toLowerCase().includes('duplicate') ||
        errorMsg.toLowerCase().includes('already') ||
        errorMsg.toLowerCase().includes('registered')) {
        setFieldErrors({ phone1: 'This number is already registered' });
        setErrorMessage('❌ Phone number already exists. Please use a different number.');
      } else {
        setErrorMessage('❌ ' + errorMsg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.location.hash = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-amber-700 transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back</span>
        </button>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
              >
                <Edit2 size={18} />
                Edit
              </button>
            )}
          </div>

          <div className="space-y-6">
            {errorMessage && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded">
                <p className="text-sm font-medium">{errorMessage}</p>
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded">
                <p className="text-sm font-medium">{successMessage}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <User size={16} />
                  Full Name
                </label>
                <input
                  type="text"
                  name="FullName"
                  value={formData.FullName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Mail size={16} />
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Phone size={16} />
                  Primary Phone
                </label>
                <input
                  type="tel"
                  name="phone1"
                  value={formData.phone1}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="10 digits (e.g., 9876543210)"
                  maxLength={10}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none disabled:bg-gray-100 ${fieldErrors.phone1 ? 'border-red-500' : 'border-gray-300'}`}
                />
                {fieldErrors.phone1 ? (
                  <p className="text-xs text-red-600 mt-1 font-medium">⚠️ {fieldErrors.phone1}</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">Must be exactly 10 digits</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Phone size={16} />
                  Alternative Phone (Optional)
                </label>
                <input
                  type="tel"
                  name="phone2"
                  value={formData.phone2}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="10 digits (e.g., 9876543210)"
                  maxLength={10}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none disabled:bg-gray-100 ${fieldErrors.phone2 ? 'border-red-500' : 'border-gray-300'}`}
                />
                {fieldErrors.phone2 ? (
                  <p className="text-xs text-red-600 mt-1 font-medium">⚠️ {fieldErrors.phone2}</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">Optional: exactly 10 digits if provided</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <MapPin size={16} />
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 8 characters required</p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  Pin Code
                </label>
                <input
                  type="text"
                  name="pinCode"
                  value={formData.pinCode}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="6 digits (e.g., 110001)"
                  maxLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">Must be exactly 6 digits</p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  Address Type
                </label>
                <select
                  name="addressType"
                  value={formData.addressType}
                  onChange={(e) => setFormData((prev) => ({ ...prev, addressType: e.target.value as 'home' | 'work' }))}
                  disabled={!isEditing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-700 focus:border-amber-700 outline-none disabled:bg-gray-100"
                >
                  <option value="home">Home</option>
                  <option value="work">Work</option>
                </select>
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  <Save size={18} />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    if (address) {
                      setFormData({
                        FullName: address.FullName || '',
                        phone1: address.phone1 || '',
                        phone2: address.phone2 || '',
                        address: address.address || '',
                        city: address.city || '',
                        state: address.state || '',
                        pinCode: address.pinCode || '',
                        addressType: address.addressType || 'home',
                      });
                    }
                  }}
                  className="px-6 py-2 border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}