import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const Login: React.FC = () => {
  const { user } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/dashboard' }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + '/dashboard'
          }
        });
        if (error) throw error;
        setMessage('Check your email for the confirmation link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '400px', width: '100%' }}>
        <h2>{isSignUp ? 'Create an Account' : 'Welcome to KAITHAANGU'}</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          {isSignUp ? 'Sign up to give or request free items.' : 'Sign in to continue giving or receiving free items.'}
        </p>

        {error && <div style={{ color: '#b91c1c', background: '#fee2e2', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
        {message && <div style={{ color: '#059669', background: '#d1fae5', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{message}</div>}

        <button onClick={handleGoogleLogin} className="btn" style={{ width: '100%', marginBottom: '1.5rem', border: '1px solid var(--soft-gray)', background: 'white', color: 'var(--ink)' }}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '18px', marginRight: '8px', verticalAlign: 'middle' }} />
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--soft-gray)' }}></div>
          <span style={{ padding: '0 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>OR CONTINUE WITH EMAIL</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--soft-gray)' }}></div>
        </div>

        <form onSubmit={handleEmailAuth}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: 'var(--ink)' }}>Email Address</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--soft-gray)', boxSizing: 'border-box' }}
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.9rem', color: 'var(--ink)' }}>Password</label>
            <input 
              type="password" 
              required 
              minLength={6}
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--soft-gray)', boxSizing: 'border-box' }}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
          {isSignUp ? (
            <p style={{ margin: 0 }}>Already have an account? <button onClick={() => {setIsSignUp(false); setError(null); setMessage(null);}} style={{ background: 'none', border: 'none', color: 'var(--primary-blue)', cursor: 'pointer', padding: 0, fontWeight: 'bold' }}>Sign In</button></p>
          ) : (
            <p style={{ margin: 0 }}>Don't have an account? <button onClick={() => {setIsSignUp(true); setError(null); setMessage(null);}} style={{ background: 'none', border: 'none', color: 'var(--primary-blue)', cursor: 'pointer', padding: 0, fontWeight: 'bold' }}>Sign Up</button></p>
          )}
        </div>
      </div>
    </div>
  );
};
