import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';

export const AccountStatus: React.FC = () => {
  const { user, profile, loading, signOut } = useAuth();

  if (loading) return <div className="loader-container">Loading...</div>;
  if (!user || !profile) return <Navigate to="/login" replace />;

  if (profile.account_status === 'approved' || profile.role === 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const renderStatusContent = () => {
    switch (profile.account_status) {
      case 'pending':
        return (
          <>
            <h2>Your account is under review</h2>
            <p>Thanks for joining KAITHAANGU.</p>
            <p>Your profile has been submitted for admin approval.</p>
            <p>Once approved, you'll be able to access KAITHAANGU and start giving or requesting items.</p>
          </>
        );
      case 'rejected':
        return (
          <>
            <h2>Account Not Approved</h2>
            <p>Your account could not be approved at this time.</p>
            <p>Please contact KAITHAANGU support for more information.</p>
          </>
        );
      case 'suspended':
        return (
          <>
            <h2>Account Suspended</h2>
            <p>Your account has been temporarily suspended.</p>
            <p>If you believe this is a mistake, please contact support.</p>
          </>
        );
      default:
        return <p>Unknown account status.</p>;
    }
  };

  return (
    <div className="auth-container" style={{ textAlign: 'center' }}>
      <div className="auth-card">
        {renderStatusContent()}
        <button onClick={signOut} className="btn btn-secondary" style={{ marginTop: '2rem' }}>
          Sign Out
        </button>
      </div>
    </div>
  );
};
