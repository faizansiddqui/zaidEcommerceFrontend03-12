import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import AddressForm from '../components/AddressForm';
import { ArrowLeft, Mail, Phone, MapPin, Home, X, Building, Plus, Edit, User, Package, Heart, Settings } from 'lucide-react';
import { useNavigation } from "../utils/navigation";
import { getUsernameFromEmail } from '../utils/userUtils';

interface Address {
    id: number;
    FullName: string;
    phone1: string;
    phone2: string | null;
    country: string;
    state: string;
    city: string;
    pinCode: string;
    address: string;
    addressType: string;
    createdAt: string;
    updatedAt: string;
    user_id: string;
}

export default function ProfilePage({ onBack }: { onBack?: () => void }) {
    const { go } = useNavigation();
    const { user, isAuthenticated, logout } = useAuth();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);
    const [activeTab, setActiveTab] = useState('profile');

    // FIX: Prevent background scrolling when modal is open
    useEffect(() => {
        if (showAddressForm) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showAddressForm]);

    useEffect(() => {
        const fetchAddresses = async () => {
            if (!isAuthenticated) return;
            try {
                setLoading(true);
                setError(null);
                const response = await userAPI.getAddresses();
                if (response.data.status && Array.isArray(response.data.data)) {
                    setAddresses(response.data.data);
                } else {
                    setAddresses([]);
                }
            } catch (err: unknown) {
                console.error('Failed to fetch addresses:', err);
                if (typeof err === 'object' && err !== null && 'response' in err) {
                    const axiosError = err as { response?: { status?: number } };
                    if (axiosError.response?.status === 403) {
                        setError('Authentication required. Please log in again.');
                        setTimeout(() => go('/log'), 2000);
                    } else {
                        setError('Failed to load addresses. Please try again later.');
                    }
                } else {
                    setError('Failed to load addresses. Please try again later.');
                }
                setAddresses([]);
            } finally {
                setLoading(false);
            }
        };
        fetchAddresses();
    }, [isAuthenticated]);

    const loadAddresses = async () => {
        if (!isAuthenticated) return;
        try {
            setLoading(true);
            setError(null);
            const response = await userAPI.getAddresses();
            if (response.data.status && Array.isArray(response.data.data)) {
                setAddresses(response.data.data);
            } else {
                setAddresses([]);
            }
        } catch (err: unknown) {
            setError('Failed to load addresses. Please try again later.');
            setAddresses([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddressSubmit = () => {
        setShowAddressForm(false);
        setEditingAddress(null);
        loadAddresses();
    };

    const handleAddressCancel = () => {
        setShowAddressForm(false);
        setEditingAddress(null);
    };

    const handleBack = () => {
        if (onBack) onBack();
        else go('/');
    };

    const handleLoginClick = () => {
        localStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
        go('/log');
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h2>
                    <p className="text-gray-600 mb-6">You need to be logged in to view your profile.</p>
                    <button onClick={handleLoginClick} className="w-full bg-amber-700 hover:bg-amber-800 text-white py-3 rounded-lg font-semibold transition-colors">
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
                <button onClick={handleBack} className="flex items-center gap-2 text-gray-600 hover:text-amber-700 transition-colors mb-8">
                    <ArrowLeft size={20} />
                    <span className="font-medium">Back</span>
                </button>

                <div className="flex flex-col lg:flex-row gap-8 flex-grow">
                    <div className="lg:w-1/4 hidden lg:block">
                        <div className="bg-white rounded-2xl p-6 sticky top-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-gray-200 border-2 border-dashed rounded-full w-12 h-12 flex items-center justify-center">
                                    <User size={20} className="text-gray-500" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-900">{getUsernameFromEmail(user?.email)}</h2>
                                    <p className="text-sm text-gray-500 truncate max-w-[150px]">{user?.email}</p>
                                </div>
                            </div>
                            <nav className="space-y-1">
                                {['profile', 'orders', 'wishlist', 'settings'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors capitalize ${activeTab === tab ? 'bg-amber-50 text-amber-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                                    >
                                        {tab === 'profile' && <User size={20} />}
                                        {tab === 'orders' && <Package size={20} />}
                                        {tab === 'wishlist' && <Heart size={20} />}
                                        {tab === 'settings' && <Settings size={20} />}
                                        {tab}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    <div className="lg:w-3/4 flex-grow">
                        {activeTab === 'profile' && (
                            <>
                                <div className="bg-white rounded-2xl overflow-hidden mb-8">
                                    <div className="px-6 py-8 flex flex-col items-center">
                                        <div className="bg-gray-200 border-2 border-dashed rounded-full w-20 h-20 flex items-center justify-center mb-4">
                                            <User size={32} className="text-gray-500" />
                                        </div>
                                        <h1 className="text-2xl font-bold text-gray-900 mb-2">{getUsernameFromEmail(user?.email)}</h1>
                                        <div className="flex items-center gap-2">
                                            <Mail size={16} className="text-gray-500" />
                                            <span className="text-gray-700">{user?.email}</span>
                                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div> Verified
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-bold text-gray-900">Addresses</h2>
                                        <button onClick={() => { setEditingAddress(null); setShowAddressForm(true); }} className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors bg-amber-600 hover:bg-amber-700 text-white">
                                            <Plus size={16} /> Add Address
                                        </button>
                                    </div>

                                    {loading ? (
                                        <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div></div>
                                    ) : (
                                        <div className="space-y-4">
                                            {addresses.map((address) => (
                                                <div key={address.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-all">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <h3 className="font-semibold text-gray-900">{address.FullName}</h3>
                                                                {address.addressType === 'home' ? <Home size={16} className="text-amber-600" /> : <Building size={16} className="text-amber-600" />}
                                                                <span className="bg-amber-50 text-amber-700 text-xs px-2 py-1 rounded-full capitalize">{address.addressType}</span>
                                                            </div>
                                                            <div className="space-y-2 text-gray-600 text-sm">
                                                                <p className="flex items-start gap-2"><MapPin size={16} className="flex-shrink-0 mt-0.5 text-gray-400" /> {address.address}, {address.city}, {address.state}, {address.country} - {address.pinCode}</p>
                                                                <p className="flex items-center gap-2"><Phone size={16} className="flex-shrink-0 text-gray-400" /> {address.phone1} {address.phone2 && `/ ${address.phone2}`}</p>
                                                            </div>
                                                        </div>
                                                        <button onClick={() => { setEditingAddress(address); setShowAddressForm(true); }} className="text-amber-600 hover:text-amber-700 font-medium text-sm flex items-center gap-1 p-2 rounded-lg hover:bg-amber-50 transition-colors">
                                                            <Edit size={16} /> Edit
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
                            <button onClick={logout} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold transition-colors">Logout</button>
                        </div>
                    </div>
                </div>
            </div>

            {showAddressForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Dark Background Backdrop */}
                    <div className="fixed inset-0 bg-black/50" onClick={handleAddressCancel} />

                    {/* Modal Content - Yahan scrolling fix kiya hai */}
                    <div className="relative bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden"
                        style={{ maxHeight: '90vh' }}>

                        {/* Header stays at the top */}
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-white sticky top-0">
                            <h2 className="text-lg font-bold text-gray-800 uppercase">
                                {editingAddress ? 'Edit Address' : 'Add New Address'}
                            </h2>
                            <button onClick={handleAddressCancel} className="text-gray-400 hover:text-black">
                                <X size={20} />
                            </button>
                        </div>

                        {/* FORM BODY - This part scrolls */}
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            <AddressForm
                                address={editingAddress || undefined}
                                onSubmit={handleAddressSubmit}
                                onCancel={handleAddressCancel}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Navigation Tabs for Mobile */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
                <div className="grid grid-cols-4 gap-1">
                    {['profile', 'orders', 'wishlist', 'settings'].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`flex flex-col items-center justify-center py-2 px-1 ${activeTab === tab ? 'text-amber-700 bg-amber-50' : 'text-gray-600'}`}>
                            {tab === 'profile' && <User size={20} />}
                            {tab === 'orders' && <Package size={20} />}
                            {tab === 'wishlist' && <Heart size={20} />}
                            {tab === 'settings' && <Settings size={20} />}
                            <span className="text-[10px] mt-1 capitalize">{tab}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="lg:hidden h-16"></div>
        </div>
    );
}