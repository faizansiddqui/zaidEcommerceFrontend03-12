import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { userAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { Address, ProfileContextType } from './types';

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<Address | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  // Fetch profile from backend when authenticated
  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated) {
      setAddress(null);
      setAddresses([]);
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔵 Fetching user profile from backend...');
      const response = await userAPI.getProfile();
      console.log('🟢 Profile response:', response.data);

      if (response.data.status && response.data.data) {
        const userData = response.data.data;

        // Extract addresses from response
        if (userData.Addresses && userData.Addresses.length > 0) {
          const userAddresses = userData.Addresses;
          setAddresses(userAddresses);
          // Set first address as primary
          setAddress(userAddresses[0]);
          console.log('✅ Profile loaded with', userAddresses.length, 'address(es)');
        } else {
          console.log('ℹ️ No addresses found for user');
          setAddresses([]);
          setAddress(null);
        }
      } else {
        console.warn('⚠️ Unexpected profile response format:', response.data);
        setAddresses([]);
        setAddress(null);
      }
    } catch (error) {
      const err = error as { response?: { status?: number; data?: unknown }; code?: string; message?: string };
      console.error('❌ Error fetching profile:', error);
      console.error('❌ Error response data:', err.response?.data);

      // More specific error handling
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.error('❌ Authentication error - user may need to log in again');
      } else if (err.code === 'ERR_NETWORK') {
        console.error('❌ Network error - backend may be offline');
      }

      // Fallback to localStorage if backend fails
      const savedAddress = localStorage.getItem('userAddress');
      if (savedAddress) {
        try {
          const parsedAddress = JSON.parse(savedAddress);
          setAddress(parsedAddress);
          console.log('ℹ️ Loaded address from localStorage as fallback');
        } catch (e) {
          console.error('❌ Error parsing saved address:', e);
          localStorage.removeItem('userAddress');
        }
      }
    } finally {
      setIsLoading(false);
      console.log('🏁 fetchProfile completed');
    }
  }, [isAuthenticated]);

  // Fetch profile on mount and when authentication changes
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Save address to localStorage whenever it changes
  useEffect(() => {
    if (address) {
      localStorage.setItem('userAddress', JSON.stringify(address));
    } else {
      localStorage.removeItem('userAddress');
    }
  }, [address]);

  const saveAddress = async (newAddress: Address) => {
    setIsLoading(true);
    try {
      console.log('🔵 Creating new address...', newAddress);

      if (!newAddress.FullName || !newAddress.phone1 || !newAddress.address || !newAddress.city || !newAddress.state || !newAddress.pinCode) {
        throw new Error('All required fields must be filled');
      }

      const backendAddress = {
        FullName: newAddress.FullName.trim(),
        phoneNo: newAddress.phone1.trim(),
        alt_Phone: newAddress.phone2?.trim() || undefined,
        address: newAddress.address.trim(),
        city: newAddress.city.trim(),
        state: newAddress.state.trim(),
        pinCode: newAddress.pinCode.trim(),
        addressType: newAddress.addressType,
      };

      console.log('📤 Sending to backend:', backendAddress);
      const response = await userAPI.createAddress(backendAddress);
      console.log('✅ Address created successfully:', response.data);

      console.log('🔄 Refreshing profile after address creation...');
      await fetchProfile();
      console.log('✅ Profile refresh completed');
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { error?: string; msg?: string; message?: string }; status?: number };
        message?: string;
        code?: string;
      };

      console.error('❌ Error creating address:', error);
      console.error('❌ Backend error response:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);

      setAddress(newAddress);
      localStorage.setItem('userAddress', JSON.stringify(newAddress));

      const status = err.response?.status;

      let errorMessage = 'Failed to save address';
      if (status === 400) errorMessage = 'Invalid data. Please check all fields.';
      else if (status === 401 || status === 403) errorMessage = 'Session expired. Please log in again.';
      else if (status === 500) errorMessage = 'Phone number may already be registered. Please try a different number.';
      else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network')) errorMessage = 'Network error. Check your connection.';
      else if (err.message && !err.message.includes('Request failed')) errorMessage = err.message;

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateAddress = async (updatedAddress: Address) => {
    setIsLoading(true);
    try {
      if (updatedAddress.id) {
        console.log('🔵 Updating address...', updatedAddress);

        if (!updatedAddress.FullName || !updatedAddress.phone1 || !updatedAddress.address || !updatedAddress.city || !updatedAddress.state || !updatedAddress.pinCode) {
          throw new Error('All required fields must be filled');
        }

        const backendAddress = {
          FullName: updatedAddress.FullName.trim(),
          phoneNo: updatedAddress.phone1.trim(),
          alt_Phone: updatedAddress.phone2?.trim() || undefined,
          address: updatedAddress.address.trim(),
          city: updatedAddress.city.trim(),
          state: updatedAddress.state.trim(),
          pinCode: updatedAddress.pinCode.trim(),
          addressType: updatedAddress.addressType,
        };

        console.log('📤 Updating in backend:', backendAddress);
        await userAPI.updateAddress(updatedAddress.id, backendAddress);
        console.log('✅ Address updated successfully');
        console.log('🔄 Refreshing profile after address update...');
        await fetchProfile();
        console.log('✅ Profile refresh completed');
      } else {
        console.log('🔵 No ID found, creating new address instead...');
        await saveAddress(updatedAddress);
      }
    } catch (error: unknown) {
      console.error('❌ Error in updateAddress:', error);

      // If error came from saveAddress, just re-throw it
      if (error instanceof Error) {
        throw error;
      }

      const err = error as {
        response?: { data?: { error?: string; msg?: string; message?: string }; status?: number };
        message?: string;
        code?: string;
      };

      console.error('❌ Backend error response:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);

      setAddress(updatedAddress);
      localStorage.setItem('userAddress', JSON.stringify(updatedAddress));

      const status = err.response?.status;

      let errorMessage = 'Failed to update address';
      if (status === 400) errorMessage = 'Invalid data. Please check all fields.';
      else if (status === 401 || status === 403) errorMessage = 'Session expired. Please log in again.';
      else if (status === 404) errorMessage = 'Address not found.';
      else if (status === 500) errorMessage = 'Phone number may already be registered. Please try a different number.';
      else if (err.code === 'ERR_NETWORK') errorMessage = 'Network error. Check your connection.';
      else if (err.message && !err.message.includes('Request failed')) errorMessage = err.message;

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAddress = () => {
    setAddress(null);
    setAddresses([]);
    localStorage.removeItem('userAddress');
  };

  return (
    <ProfileContext.Provider
      value={{
        address,
        addresses,
        isLoading,
        saveAddress,
        updateAddress,
        clearAddress,
        fetchProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}


