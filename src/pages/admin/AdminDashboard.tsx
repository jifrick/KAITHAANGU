import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const { profile } = useAuth();

  if (profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const isContentAdmin = profile?.admin_role === 'super_admin' || profile?.admin_role === 'content_admin';
  const isVerificationAdmin = profile?.admin_role === 'super_admin' || profile?.admin_role === 'verification_admin';
  const isMatchingAdmin = profile?.admin_role === 'super_admin' || profile?.admin_role === 'matching_admin';
  const isSupportModerator = profile?.admin_role === 'super_admin' || profile?.admin_role === 'support_moderator' || profile?.admin_role === 'content_admin';

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Admin Control Panel</h1>
        <p style={{ color: 'var(--text-muted)' }}>Welcome to the KAITHAANGU administration hub.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        
        {isVerificationAdmin && (
          <Link to="/admin/accounts" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="dashboard-card" style={{ cursor: 'pointer', borderTop: '4px solid #8b5cf6', height: '100%' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#8b5cf6' }}>Accounts</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Review and approve new user signups before they access the platform.</p>
            </div>
          </Link>
        )}

        {isVerificationAdmin && (
          <Link to="/admin/verification" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="dashboard-card" style={{ cursor: 'pointer', borderTop: '4px solid var(--primary-blue)', height: '100%' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--primary-blue)' }}>Verification</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Review identity verification requests from users wanting to receive items.</p>
            </div>
          </Link>
        )}

        {isContentAdmin && (
          <Link to="/admin/moderation" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="dashboard-card" style={{ cursor: 'pointer', borderTop: '4px solid var(--danger)', height: '100%' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--danger)' }}>Item Moderation</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Review flagged items, approve draft listings, and ensure community standards.</p>
            </div>
          </Link>
        )}

        {isMatchingAdmin && (
          <Link to="/admin/matching" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="dashboard-card" style={{ cursor: 'pointer', borderTop: '4px solid #059669', height: '100%' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#059669' }}>Matching</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage connections between donors and recipients. Finalize handovers.</p>
            </div>
          </Link>
        )}

        {isSupportModerator && (
          <Link to="/admin/reports" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="dashboard-card" style={{ cursor: 'pointer', borderTop: '4px solid #d97706', height: '100%' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#d97706' }}>Reports</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Handle user reports regarding bad behavior, broken items, or disputes.</p>
            </div>
          </Link>
        )}
        
      </div>
    </div>
  );
};
