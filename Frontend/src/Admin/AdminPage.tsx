import { useState } from 'react';
import AuthGuard from './components/Admin/AuthGuard';
import AdminPageHeader from './components/Admin/AdminPageHeader';
import AdminTabs from './components/Admin/AdminTabs';
import ProductUploadForm from './components/Product/ProductUploadForm';
import ProductsList from './components/Product/ProductsList';
import OrdersList from './components/Order/OrdersList';

interface AdminPageProps {
    onBack?: () => void;
}

export default function AdminPage({ onBack }: AdminPageProps) {
    const [activeTab, setActiveTab] = useState<'upload' | 'products' | 'orders'>('upload');

    return (
        <AuthGuard>
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <AdminPageHeader onBack={onBack} />
                    <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />

                    <div className="mt-6">
                        {activeTab === 'upload' && <ProductUploadForm />}
                        {activeTab === 'products' && <ProductsList />}
                        {activeTab === 'orders' && <OrdersList />}
                    </div>
                </div>
            </div>
        </AuthGuard>
    );
}
