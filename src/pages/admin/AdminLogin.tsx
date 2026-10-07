import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Already logged in as admin → go to dashboard
  if (user && profile?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Already logged in as normal user → go to their dashboard
  if (user && profile && profile.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (signInError) {
      setError('Invalid email or password.');
      setLoading(false);
      return;
    }

    // Verify this account actually has admin role
    // Use the access_token from the sign-in response directly so RLS auth.uid() is correct
    if (data.user && data.session) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role, admin_role, account_status')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        await supabase.auth.signOut();
        setError('Could not verify admin privileges. Please try again.');
        setLoading(false);
        return;
      }

      if (!profileData || profileData.role !== 'admin') {
        await supabase.auth.signOut();
        setError('Access denied. This account does not have admin privileges.');
        setLoading(false);
        return;
      }

      // Valid admin — navigate to dashboard
      navigate('/admin/dashboard');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0f172a'
    }}>
      <div style={{
        maxWidth: '420px',
        width: '100%',
        padding: '2.5rem',
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        borderTop: '4px solid #ef4444',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
      }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '1.5rem',
            color: '#f1f5f9',
            letterSpacing: '2px',
            fontWeight: 800,
            margin: 0
          }}>
            KAITHAANGU <span style={{ color: '#ef4444' }}>ADMIN</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Secure Portal — Authorised Access Only
          </p>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#450a0a',
            color: '#fca5a5',
            borderRadius: '6px',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            border: '1px solid #ef4444'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#94a3b8',
              marginBottom: '0.5rem',
              letterSpacing: '1px'
            }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              autoComplete="email"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #334155',
                backgroundColor: '#0f172a',
                color: '#f1f5f9',
                fontSize: '0.95rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#94a3b8',
              marginBottom: '0.5rem',
              letterSpacing: '1px'
            }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #334155',
                backgroundColor: '#0f172a',
                color: '#f1f5f9',
                fontSize: '0.95rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.875rem',
              backgroundColor: loading ? '#7f1d1d' : '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '1px',
              marginTop: '0.25rem',
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? 'VERIFYING...' : 'LOGIN'}
          </button>
        </form>

      </div>
    </div>
  );
};
