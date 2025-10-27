import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { PublicMarketplace } from './components/marketplace/PublicMarketplace';
import { EnhancedUserDashboard } from './components/dashboard/EnhancedUserDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    if (showAuth) {
      return <AuthPage />;
    }
    return <PublicMarketplace onAuthRequired={() => setShowAuth(true)} />;
  }

  if (profile?.role === 'admin') {
    return <AdminDashboard />;
  }

  if (profile?.status === 'suspended') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Account Suspended</h2>
          <p className="text-gray-600 mb-6">
            Your account has been suspended. Please contact an administrator for more information.
          </p>
        </div>
      </div>
    );
  }

  return <EnhancedUserDashboard />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
