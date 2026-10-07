import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { CompleteProfile } from './pages/CompleteProfile';
import { Dashboard } from './pages/Dashboard';
import { CreateItem } from './pages/CreateItem';

import { ItemModeration } from './pages/admin/ItemModeration';
import { RecipientVerification } from './pages/admin/RecipientVerification';
import { MatchingDashboard } from './pages/admin/MatchingDashboard';
import { ReportsDashboard } from './pages/admin/ReportsDashboard';
import { AccountApprovals } from './pages/admin/AccountApprovals';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { BrowseItems } from './pages/BrowseItems';
import { ItemView } from './pages/ItemView';
import { AccountStatus } from './pages/AccountStatus';
import { UpdatePassword } from './pages/UpdatePassword';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();
  
  if (loading) return <div className="loader-container">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (profile && !profile.profile_completed && profile.role !== 'admin') return <Navigate to="/complete-profile" replace />;
  if (profile && profile.role !== 'admin' && profile.account_status !== 'approved') {
    return <Navigate to="/account-status" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    // Automatically redirect to update-password if they click a recovery link
    if (window.location.hash.includes('type=recovery')) {
      navigate('/update-password');
    }
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/update-password" element={<UpdatePassword />} />
      <Route path="/complete-profile" element={<CompleteProfile />} />
      <Route path="/account-status" element={<AccountStatus />} />
      <Route path="/items" element={<BrowseItems />} />
      <Route path="/item/:id" element={<ItemView />} />
      
      {/* Protected Routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/create-item" 
        element={
          <ProtectedRoute>
            <CreateItem />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/moderation" 
        element={
          <ProtectedRoute>
            <ItemModeration />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/verification" 
        element={
          <ProtectedRoute>
            <RecipientVerification />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/matching" 
        element={
          <ProtectedRoute>
            <MatchingDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/accounts" 
        element={
          <ProtectedRoute>
            <AccountApprovals />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/reports" 
        element={
          <ProtectedRoute>
            <ReportsDashboard />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const Navigation = () => {
  const { user, profile, signOut } = useAuth();

  const isContentAdmin = profile?.role === 'admin' && 
    (profile?.admin_role === 'super_admin' || profile?.admin_role === 'content_admin');

  const isVerificationAdmin = profile?.role === 'admin' && 
    (profile?.admin_role === 'super_admin' || profile?.admin_role === 'verification_admin');

  const isMatchingAdmin = profile?.role === 'admin' && 
    (profile?.admin_role === 'super_admin' || profile?.admin_role === 'matching_admin');

  const isSupportModerator = profile?.role === 'admin' && 
    (profile?.admin_role === 'super_admin' || profile?.admin_role === 'support_moderator' || profile?.admin_role === 'content_admin');

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">KAITHAANGU</Link>
      <div className="nav-links">
        <Link to="/items">Browse Items</Link>
        {user ? (
          <>
            {profile?.role === 'admin' ? (
              <Link to="/admin">Admin Panel</Link>
            ) : (
              <Link to="/dashboard">Dashboard</Link>
            )}
            {isContentAdmin && (
              <Link to="/admin/moderation" style={{ color: 'var(--danger)', fontWeight: 'bold' }}>
                Moderation
              </Link>
            )}
            {isVerificationAdmin && (
              <>
                <Link to="/admin/verification" style={{ color: 'var(--primary-blue)', fontWeight: 'bold' }}>
                  Verification
                </Link>
                <Link to="/admin/accounts" style={{ color: '#8b5cf6', fontWeight: 'bold' }}>
                  Accounts
                </Link>
              </>
            )}
            {isMatchingAdmin && (
              <Link to="/admin/matching" style={{ color: '#059669', fontWeight: 'bold' }}>
                Matching
              </Link>
            )}
            {isSupportModerator && (
              <Link to="/admin/reports" style={{ color: '#d97706', fontWeight: 'bold' }}>
                Reports
              </Link>
            )}
            {profile?.role === 'donor' && (
              <Link to="/create-item" className="btn btn-primary" style={{ padding: '0.4rem 1rem' }}>
                Give Item
              </Link>
            )}
            <button onClick={signOut} className="btn btn-secondary" style={{ padding: '0.4rem 1rem' }}>
              Sign Out
            </button>
          </>
        ) : (
          <Link to="/login" className="btn btn-primary" style={{ padding: '0.4rem 1rem' }}>Join to Give</Link>
        )}
      </div>
    </nav>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-wrapper">
          <Navigation />
          <main className="main-content">
            <AppRoutes />
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
