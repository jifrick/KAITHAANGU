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
import { AuditLogs } from './pages/admin/AuditLogs';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminLogin } from './pages/admin/AdminLogin';
import { BrowseItems } from './pages/BrowseItems';
import { ItemView } from './pages/ItemView';
import { AccountStatus } from './pages/AccountStatus';
import { UpdatePassword } from './pages/UpdatePassword';
import { Brand } from './components/common/Brand';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();
  
  if (loading) return <div className="loader-container">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  // Guard against race conditions where user is set but profile hasn't finished fetching
  if (!profile) return <div className="loader-container">Loading profile...</div>;

  // Admin users bypass normal user onboarding and go straight to admin dashboard
  if (profile.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (!profile.profile_completed) return <Navigate to="/complete-profile" replace />;
  if (profile.account_status !== 'approved') {
    return <Navigate to="/account-status" replace />;
  }
  
  return <>{children}</>;
};

const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();
  
  if (loading) return <div className="loader-container">Loading...</div>;
  if (!user) return <Navigate to="/admin" replace />;
  
  // Guard against race conditions where user is set but profile hasn't finished fetching
  if (!profile) return <div className="loader-container">Loading profile...</div>;

  if (profile.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
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
      
      {/* Admin Authentication Route */}
      <Route path="/admin" element={<AdminLogin />} />

      {/* Protected Admin Routes */}
      <Route 
        path="/admin/dashboard" 
        element={
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        } 
      />
      <Route 
        path="/admin/moderation" 
        element={
          <AdminProtectedRoute>
            <ItemModeration />
          </AdminProtectedRoute>
        } 
      />
      <Route 
        path="/admin/verification" 
        element={
          <AdminProtectedRoute>
            <RecipientVerification />
          </AdminProtectedRoute>
        } 
      />
      <Route 
        path="/admin/matching" 
        element={
          <AdminProtectedRoute>
            <MatchingDashboard />
          </AdminProtectedRoute>
        } 
      />
      <Route 
        path="/admin/accounts" 
        element={
          <AdminProtectedRoute>
            <AccountApprovals />
          </AdminProtectedRoute>
        } 
      />
      <Route 
        path="/admin/audit" 
        element={
          <AdminProtectedRoute>
            <AuditLogs />
          </AdminProtectedRoute>
        } 
      />
      <Route 
        path="/admin/reports" 
        element={
          <AdminProtectedRoute>
            <ReportsDashboard />
          </AdminProtectedRoute>
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
      <Brand size="sm" clickable={true} />
      <div className="nav-links">
        <Link to="/items">Browse Items</Link>
        {user ? (
          <>
            {profile?.role === 'admin' ? (
              <Link to="/admin/dashboard">Admin Panel</Link>
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
