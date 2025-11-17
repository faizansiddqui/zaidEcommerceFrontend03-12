export interface Address {
    id?: number;
    FullName: string;
    phone1: string;
    phone2?: string;
    address: string;
    city: string;
    state: string;
    pinCode: string;
    addressType: 'home' | 'work';
    // Legacy fields for backwards compatibility
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    zipCode?: string;
    country?: string;
}

export interface ProfileContextType {
    address: Address | null;
    addresses: Address[];
    isLoading: boolean;
    saveAddress: (address: Address) => Promise<void>;
    updateAddress: (address: Address) => Promise<void>;
    clearAddress: () => void;
    fetchProfile: () => Promise<void>;
}
