import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { State } from 'state-country';
import { getLocationFromPinCode } from '../utils/geonamesApi';

interface Address {
    id?: number;
    FullName: string;
    phone1: string;
    phone2: string | null;
    country: string;
    state: string;
    city: string;
    pinCode: string;
    address: string;
    addressType: string;
}

interface AddressFormProps {
    address?: Address;
    onSubmit: (address: Address) => void;
    onCancel: () => void;
}

export default function AddressForm({ address, onSubmit, onCancel }: AddressFormProps) {
    const { user } = useAuth();
    const [formData, setFormData] = useState<Address>({
        FullName: address?.FullName || '',
        phone1: address?.phone1 || '',
        phone2: address?.phone2 || '',
        country: address?.country || '',
        state: address?.state || '',
        city: address?.city || '',
        pinCode: address?.pinCode || '',
        address: address?.address || '',
        addressType: address?.addressType || 'home',
    });

    const [availableStates, setAvailableStates] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (formData.country) {
            import('state-country').then((module) => {
                const states = module.default.getAllStatesInCountry(formData.country);
                setAvailableStates(states.map((state: State) => state.name));
            }).catch(() => setAvailableStates([]));
        }
    }, [formData.country]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'pinCode' && value.length >= 5) {
            handlePinCodeChange(value);
        }
    };

    const handlePinCodeChange = async (pinCode: string) => {
        try {
            const data = await getLocationFromPinCode(pinCode);
            if (data) {
                setFormData(prev => ({
                    ...prev,
                    country: data.country || prev.country,
                    state: data.state || prev.state,
                    city: data.city || prev.city
                }));
            }
        } catch (err) { console.error(err); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const userId = user?.id || JSON.parse(localStorage.getItem('user') || '{}').id;
            if (address?.id) {
                await userAPI.updateAddress(address.id, { ...formData, address_id: address.id });
            } else {
                await userAPI.createAddress({ ...formData, phoneNo: formData.phone1, alt_Phone: formData.phone2, decode_user: userId });
            }
            onSubmit(formData);
        } catch (err) {
            alert("Error saving address");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name *</label>
                    <input type="text" name="FullName" value={formData.FullName} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-amber-600" />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone 1 *</label>
                    <input type="tel" name="phone1" value={formData.phone1} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-amber-600" />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone 2 (Alt)</label>
                    <input type="tel" name="phone2" value={formData.phone2 || ''} onChange={handleChange} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-amber-600" />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Street Address *</label>
                    <textarea name="address" value={formData.address} onChange={handleChange} required rows={2} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-amber-600" />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">PIN Code *</label>
                    <input type="text" name="pinCode" value={formData.pinCode} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-amber-600" />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">City *</label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-amber-600" />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">State *</label>
                    <select name="state" value={formData.state} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md text-sm bg-white outline-none focus:ring-1 focus:ring-amber-600">
                        <option value="">Select State</option>
                        {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Country *</label>
                    <input type="text" name="country" value={formData.country} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-amber-600" />
                </div>
            </div>

            <div className="flex gap-4 py-2 border-t mt-4">
                <button type="button" onClick={onCancel} className="flex-1 py-2 border rounded-md text-sm font-semibold hover:bg-gray-50">CANCEL</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-amber-600 text-white rounded-md text-sm font-semibold hover:bg-amber-700 disabled:opacity-50">
                    {isSubmitting ? 'SAVING...' : 'SAVE'}
                </button>
            </div>
        </form>
    );
}