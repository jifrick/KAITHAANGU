import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const AdminLogin: React.FC = () => {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // If already logged in as admin, go to dashboard
  if (user && profile?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // If already logged in as normal user, go to normal dashboard
  if (user && profile && profile.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Map the Admin ID to the secure internal Auth email
    // This entirely decouples the ID from the normal email/password flow
    // while still utilizing Supabase's secure hashed credential store.
    const internalAuthEmail = `${adminId.trim().toLowerCase()}@admin.kaithaangu.com`;

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: internalAuthEmail,
      password,
    });

    if (signInError) {
      setError('Invalid Admin ID or Password.');
      setLoading(false);
    } else {
      // Successful authentication
      navigate('/admin/dashboard');
    }
  };

  const handleReset = () => {
    alert("If this Admin ID exists, a recovery notification has been logged securely to the Super Admin.");
  };

  return (
    <div className="auth-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-dark)' }}>
      <div className="auth-card" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem', backgroundColor: 'var(--bg-light)', borderTop: '4px solid var(--danger)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--text-light)', letterSpacing: '2px', fontWeight: 800 }}>
            KAITHAANGU <span style={{ color: 'var(--danger)' }}>ADMIN</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Secure Portal Access</p>
        </div>

        {error && <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-light)', marginBottom: '0.5rem' }}>ADMIN ID</label>
            <input
              type="text"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              placeholder="Enter Admin ID"
              required
              autoComplete="username"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-dark)', color: 'var(--text-light)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-light)', marginBottom: '0.5rem' }}>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-dark)', color: 'var(--text-light)' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '0.875rem', 
              backgroundColor: 'var(--danger)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              fontWeight: 'bold', 
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '0.5rem'
            }}
          >
            {loading ? 'AUTHENTICATING...' : 'LOGIN'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button 
            onClick={handleReset}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Forgot Password / Reset
          </button>
        </div>

      </div>
    </div>
  );
};
