import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Brand, BrandIllustration } from '../components/common/Brand';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const Login: React.FC = () => {
  const { user, profile } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (user && profile) {
    if (profile.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  const handleGoogleLogin = async () => {
    try {
      setError(null);
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
        setMessage('നിങ്ങളുടെ ഇമെയിൽ വിലാസത്തിലേക്ക് കൺഫർമേഷൻ ലിങ്ക് അയച്ചിട്ടുണ്ട്. ദയവായി ഇമെയിൽ പരിശോധിക്കുക.');
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

  const getFriendlyError = (rawError: string | null) => {
    if (!rawError) return null;
    const lower = rawError.toLowerCase();
    if (lower.includes('invalid login credentials') || lower.includes('invalid_grant')) {
      return 'ഇമെയിൽ അല്ലെങ്കിൽ പാസ്‌വേഡ് ശരിയല്ല. (Invalid login credentials)';
    }
    if (lower.includes('user already registered') || lower.includes('already exists')) {
      return 'ഈ ഇമെയിൽ വിലാസത്തിൽ ഇതിനകം അക്കൗണ്ട് ഉണ്ട്. ലോഗിൻ ചെയ്യുക.';
    }
    if (lower.includes('password should be at least')) {
      return 'പാസ്‌വേഡിൽ കുറഞ്ഞത് 6 അക്ഷരങ്ങൾ ഉണ്ടായിരിക്കണം.';
    }
    if (lower.includes('rate limit') || lower.includes('too many requests')) {
      return 'കൂടുതൽ ശ്രമങ്ങൾ നടന്നു. ദയവായി അല്പം കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കുക.';
    }
    return rawError;
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 120px)',
      background: 'var(--cloud-white)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-8) var(--space-4)',
      fontFamily: 'var(--font-family)'
    }}>
      <div style={{
        maxWidth: '1040px',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 'var(--space-8)',
        alignItems: 'center'
      }}>
        {/* Left Side: Brand Experience */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-5)',
          paddingRight: 'var(--space-4)'
        }}>
          <div>
            <Brand size="lg" clickable={true} showTagline={true} />
          </div>

          <div style={{ marginTop: 'var(--space-4)' }}>
            <h1 style={{
              fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)',
              fontWeight: 800,
              color: 'var(--ink)',
              fontFamily: 'var(--font-malayalam)',
              lineHeight: 1.25,
              marginBottom: 'var(--space-3)'
            }}>
              കൈത്താങ്ങിലേക്ക് സ്വാഗതം.
            </h1>
            <p style={{
              fontSize: 'var(--fs-body-lg)',
              color: 'var(--ink-secondary)',
              fontFamily: 'var(--font-malayalam)',
              lineHeight: 1.6,
              maxWidth: '480px',
              margin: 0
            }}>
              നിങ്ങൾക്ക് ആവശ്യമുള്ളത് കണ്ടെത്താനും, നിങ്ങൾക്ക് ഇനി ആവശ്യമില്ലാത്തത് മറ്റൊരാൾക്ക് നൽകാനും ഇവിടെ ചേരൂ.
            </p>
          </div>

          <div style={{
            background: 'var(--soft-blue)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-5)',
            border: '1px solid var(--soft-blue-border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            marginTop: 'var(--space-2)'
          }}>
            <BrandIllustration style={{ maxHeight: '200px', width: 'auto' }} />
            <div style={{
              marginTop: 'var(--space-4)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: 'var(--fs-body-sm)',
              color: 'var(--primary-blue)',
              fontWeight: 600,
              fontFamily: 'var(--font-malayalam)'
            }}>
              <span>🛡️</span>
              <span>നിങ്ങളുടെ വ്യക്തിഗത വിവരങ്ങൾ സുരക്ഷിതമായി കൈകാര്യം ചെയ്യുന്നു</span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card */}
        <div style={{ maxWidth: '460px', width: '100%', justifySelf: 'center' }}>
          <Card style={{
            boxShadow: 'var(--shadow-lg)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--soft-gray)',
            background: 'var(--surface-white)',
            padding: 'var(--space-6)'
          }}>
            {/* Header */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <h2 style={{
                fontSize: '1.625rem',
                fontWeight: 700,
                color: 'var(--ink)',
                marginBottom: 'var(--space-2)',
                fontFamily: 'var(--font-malayalam)'
              }}>
                {isSignUp ? 'പുതിയ അക്കൗണ്ട് സൃഷ്ടിക്കുക' : 'പ്രവേശിക്കുക'}
              </h2>
              <p style={{
                fontSize: 'var(--fs-body)',
                color: 'var(--ink-muted)',
                margin: 0,
                fontFamily: 'var(--font-malayalam)'
              }}>
                {isSignUp 
                  ? 'സൗജന്യമായി സാധനങ്ങൾ നൽകാനും സ്വീകരിക്കാനും ചേരൂ.' 
                  : 'തുടരാനായി നിങ്ങളുടെ അക്കൗണ്ടിലേക്ക് ലോഗിൻ ചെയ്യുക.'}
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div style={{
                background: 'var(--error-bg)',
                border: '1px solid var(--error-border)',
                color: 'var(--error-text)',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-5)',
                fontSize: 'var(--fs-body-sm)',
                fontFamily: 'var(--font-malayalam)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <span style={{ fontSize: '1rem', lineHeight: 1 }}>⚠️</span>
                <span style={{ flex: 1 }}>{getFriendlyError(error)}</span>
              </div>
            )}

            {/* Success Message Alert */}
            {message && (
              <div style={{
                background: 'var(--success-bg)',
                border: '1px solid var(--success-border)',
                color: 'var(--success-text)',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-5)',
                fontSize: 'var(--fs-body-sm)',
                fontFamily: 'var(--font-malayalam)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <span style={{ fontSize: '1rem', lineHeight: 1 }}>✅</span>
                <span style={{ flex: 1 }}>{message}</span>
              </div>
            )}

            {/* Google OAuth Option */}
            <Button 
              type="button"
              onClick={handleGoogleLogin} 
              variant="outline"
              size="lg"
              fullWidth
              style={{
                marginBottom: 'var(--space-5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                borderColor: 'var(--soft-gray)',
                color: 'var(--ink)',
                fontWeight: 600,
                fontSize: '0.95rem'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
                <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
                <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
                <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </Button>

            {/* Divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 'var(--space-5)',
              gap: 'var(--space-3)'
            }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--soft-gray)' }} />
              <span style={{
                fontSize: 'var(--fs-caption)',
                color: 'var(--ink-muted)',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-malayalam)'
              }}>
                അല്ലെങ്കിൽ ഇമെയിൽ വഴി
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--soft-gray)' }} />
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {/* Email Field */}
              <div className="form-group">
                <label style={{
                  display: 'block',
                  marginBottom: 'var(--space-1)',
                  fontSize: 'var(--fs-label)',
                  fontWeight: 600,
                  color: 'var(--ink)',
                  fontFamily: 'var(--font-malayalam)'
                }}>
                  ഇമെയിൽ വിലാസം (Email Address)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: 'var(--space-3) var(--space-4)',
                      paddingLeft: '38px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--soft-gray)',
                      fontSize: 'var(--fs-body)',
                      color: 'var(--ink)',
                      background: 'var(--cloud-white)',
                      outline: 'none',
                      transition: 'var(--transition-fast)'
                    }}
                  />
                  <span style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '1rem',
                    color: 'var(--ink-muted)'
                  }}>
                    ✉️
                  </span>
                </div>
              </div>

              {/* Password Field */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
                  <label style={{
                    fontSize: 'var(--fs-label)',
                    fontWeight: 600,
                    color: 'var(--ink)',
                    fontFamily: 'var(--font-malayalam)'
                  }}>
                    പാസ്‌വേഡ് (Password)
                  </label>
                </div>
                
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
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
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {isSignUp && (
                  <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-muted)', marginTop: '4px' }}>
                    കുറഞ്ഞത് 6 അക്ഷരങ്ങൾ ഉണ്ടായിരിക്കണം
                  </div>
                )}
              </div>

              {/* Submit CTA */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={loading}
                style={{ marginTop: 'var(--space-2)' }}
              >
                {loading ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-malayalam)' }}>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10" strokeWidth="4" strokeDasharray="32" strokeDashoffset="10" />
                    </svg>
                    {isSignUp ? 'അക്കൗണ്ട് സൃഷ്ടിക്കുന്നു...' : 'പ്രവേശിക്കുന്നു...'}
                  </span>
                ) : (
                  <span style={{ fontFamily: 'var(--font-malayalam)', fontWeight: 600 }}>
                    {isSignUp ? 'അക്കൗണ്ട് സൃഷ്ടിക്കുക' : 'പ്രവേശിക്കുക'}
                  </span>
                )}
              </Button>
            </form>

            {/* Footer Switcher */}
            <div style={{
              marginTop: 'var(--space-6)',
              paddingTop: 'var(--space-5)',
              borderTop: '1px solid var(--soft-gray)',
              textAlign: 'center',
              fontSize: 'var(--fs-body-sm)',
              fontFamily: 'var(--font-malayalam)',
              color: 'var(--ink-secondary)'
            }}>
              {isSignUp ? (
                <span>
                  ഇതിനകം അക്കൗണ്ട് ഉണ്ടോ?{' '}
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(false); setError(null); setMessage(null); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary-blue)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline'
                    }}
                  >
                    ലോഗിൻ ചെയ്യുക
                  </button>
                </span>
              ) : (
                <span>
                  അക്കൗണ്ട് ഇല്ലേ?{' '}
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(true); setError(null); setMessage(null); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary-blue)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline'
                    }}
                  >
                    പുതിയ അക്കൗണ്ട് തുടങ്ങൂ
                  </button>
                </span>
              )}
            </div>
          </Card>

          {/* Privacy Note Footer */}
          <div style={{
            marginTop: 'var(--space-4)',
            textAlign: 'center',
            fontSize: 'var(--fs-caption)',
            color: 'var(--ink-muted)',
            fontFamily: 'var(--font-malayalam)'
          }}>
            കൈത്താങ്ങ് സ്വകാര്യതാ വിവരങ്ങൾ സുരക്ഷിതമായി സൂക്ഷിക്കുന്നു.
          </div>
        </div>
      </div>
    </div>
  );
};

