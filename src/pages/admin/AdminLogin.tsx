import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Brand } from '../../components/common/Brand';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';

export const AdminLogin: React.FC = () => {
  const [adminIdInput, setAdminIdInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

    const inputClean = adminIdInput.trim().toLowerCase();

    // Map dedicated Admin ID to the registered Super Admin email
    let targetEmail = inputClean;
    if (inputClean === 'kaithaangu-admin') {
      targetEmail = 'jifri.chakkalan@gmail.com';
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password,
    });

    if (signInError) {
      setError('Invalid Admin ID / Email or password.');
      setLoading(false);
      return;
    }

    // Verify this account actually has admin role in database
    if (data.user && data.session) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role, admin_role, account_status')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error during admin login:', profileError);
        await supabase.auth.signOut();
        setError('Could not verify admin privileges. Please check database permissions.');
        setLoading(false);
        return;
      }

      if (!profileData || profileData.role !== 'admin') {
        await supabase.auth.signOut();
        setError('Access denied. This account does not have admin privileges.');
        setLoading(false);
        return;
      }

      // Valid admin — navigate directly to admin dashboard
      navigate('/admin/dashboard');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--cloud-white)',
      padding: 'var(--space-6) var(--space-4)',
      fontFamily: 'var(--font-family)'
    }}>
      <div style={{ maxWidth: '440px', width: '100%' }}>
        <Card style={{
          boxShadow: 'var(--shadow-lg)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--soft-gray)',
          background: 'var(--surface-white)',
          padding: 'clamp(1.5rem, 4vw, 2.5rem)',
          borderTop: '4px solid var(--primary-blue)'
        }}>

          <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            <div style={{ display: 'inline-block', marginBottom: 'var(--space-3)' }}>
              <Brand size="md" clickable={false} showTagline={false} />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-2)' }}>
              <Badge status="rose" label="🛡️ Administration Portal" dot={false} />
            </div>

            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: 'var(--ink)',
              margin: '0 0 4px 0'
            }}>
              KAITHAANGU Admin
            </h1>
            <p style={{ color: 'var(--ink-muted)', fontSize: 'var(--fs-body-sm)', margin: 0 }}>
              Authorized Portal — Verified Admins Only
            </p>
          </div>

          {error && (
            <div style={{
              background: 'var(--error-bg)',
              border: '1px solid var(--error-border)',
              color: 'var(--error-text)',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-5)',
              fontSize: 'var(--fs-body-sm)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px'
            }}>
              <span>⚠️</span>
              <span style={{ flex: 1 }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <Input
                label="ADMIN ID OR EMAIL"
                type="text"
                value={adminIdInput}
                onChange={(e) => setAdminIdInput(e.target.value)}
                placeholder="kaithaangu-admin"
                required
                autoComplete="username"
                style={{ fontFamily: 'var(--font-english)' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: 'var(--fs-label)', fontWeight: 600, color: 'var(--ink)' }}>
                  PASSWORD
                </label>
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    padding: 'var(--space-3) var(--space-4)',
                    paddingRight: '44px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--soft-gray)',
                    fontSize: 'var(--fs-body)',
                    color: 'var(--ink)',
                    background: 'var(--cloud-white)',
                    outline: 'none',
                    transition: 'var(--transition-fast)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '6px 8px',
                    fontSize: '1.1rem',
                    color: 'var(--ink-muted)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={loading}
              style={{ marginTop: 'var(--space-2)' }}
            >
              {loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="4" strokeDasharray="32" strokeDashoffset="10" />
                  </svg>
                  VERIFYING...
                </span>
              ) : (
                'SIGN IN TO ADMIN PORTAL'
              )}
            </Button>
          </form>

        </Card>
      </div>
    </div>
  );
};

