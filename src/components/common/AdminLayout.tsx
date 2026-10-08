import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, Link, useLocation } from 'react-router-dom';
import { Brand } from './Brand';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title,
  subtitle,
  actions
}) => {
  const { user, profile, loading, signOut } = useAuth();
  const location = useLocation();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--cloud-white)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--ink-muted)' }}>
          <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary-blue)">
            <circle cx="12" cy="12" r="10" strokeWidth="4" strokeDasharray="32" strokeDashoffset="10" />
          </svg>
          <span style={{ fontFamily: 'var(--font-malayalam)' }}>Admin പ്രവേശനം അവലോകനം ചെയ്യുന്നു...</span>
        </div>
      </div>
    );
  }

  if (!user || !profile || profile.role !== 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const role = profile.admin_role || 'admin';
  const isSuperAdmin = role === 'super_admin';
  const isVerificationAdmin = isSuperAdmin || role === 'verification_admin';
  const isContentAdmin = isSuperAdmin || role === 'content_admin';
  const isMatchingAdmin = isSuperAdmin || role === 'matching_admin';
  const isSupportModerator = isSuperAdmin || role === 'support_moderator' || role === 'content_admin';

  const formatRoleTitle = (r: string) => {
    switch (r) {
      case 'super_admin': return 'Super Admin';
      case 'verification_admin': return 'Verification Admin';
      case 'content_admin': return 'Content Admin';
      case 'matching_admin': return 'Matching Admin';
      case 'support_moderator': return 'Support Moderator';
      default: return 'Administrator';
    }
  };

  const navLinks = [
    { label: '📊 Dashboard', path: '/admin/dashboard', show: true },
    { label: '👥 Account Approvals', path: '/admin/accounts', show: isVerificationAdmin },
    { label: '🤝 Recipient Verification', path: '/admin/verification', show: isVerificationAdmin },
    { label: '🎁 Item Moderation', path: '/admin/moderation', show: isContentAdmin },
    { label: '⚡ Requests & Matching', path: '/admin/matching', show: isMatchingAdmin },
    { label: '🚩 Reports', path: '/admin/reports', show: isSupportModerator },
    { label: '📋 Audit Logs', path: '/admin/audit', show: isSuperAdmin }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--cloud-white)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-family)'
    }}>
      {/* Top Header Bar */}
      <header style={{
        background: 'var(--surface-white)',
        borderBottom: '1px solid var(--soft-gray)',
        padding: 'var(--space-3) var(--space-6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 40
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <Brand size="sm" clickable={false} showTagline={false} />
          <Badge status="rose" label={`🛡️ ${formatRoleTitle(role)}`} dot={false} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {/* Mobile drawer button */}
          <button
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            aria-label="Toggle navigation drawer"
            style={{
              display: window.innerWidth < 768 ? 'block' : 'none',
              background: 'none',
              border: '1px solid var(--soft-gray)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 12px',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            {mobileDrawerOpen ? '✕' : '☰ Menu'}
          </button>

          <Button variant="ghost" size="sm" onClick={signOut} style={{ color: 'var(--ink-muted)' }}>
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Admin Body Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(240px, 260px) 1fr',
        flex: 1
      }}>
        {/* Sidebar Navigation */}
        <aside style={{
          background: 'var(--surface-white)',
          borderRight: '1px solid var(--soft-gray)',
          padding: 'var(--space-5) var(--space-4)',
          display: window.innerWidth < 768 ? (mobileDrawerOpen ? 'block' : 'none') : 'block',
          position: window.innerWidth < 768 ? 'fixed' : 'relative',
          top: window.innerWidth < 768 ? '57px' : 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 35
        }}>
          <div style={{
            fontSize: 'var(--fs-caption)',
            fontWeight: 700,
            color: 'var(--ink-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 'var(--space-3)',
            paddingLeft: 'var(--space-3)'
          }}>
            Admin Controls
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navLinks.filter(n => n.show).map(n => {
              const isActive = location.pathname === n.path;
              return (
                <Link
                  key={n.path}
                  to={n.path}
                  onClick={() => setMobileDrawerOpen(false)}
                  style={{
                    display: 'block',
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    background: isActive ? 'var(--soft-blue)' : 'transparent',
                    color: isActive ? 'var(--primary-blue)' : 'var(--ink)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: 'var(--fs-body-sm)',
                    textDecoration: 'none',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main style={{
          padding: 'clamp(1.25rem, 3vw, 2rem)',
          gridColumn: window.innerWidth < 768 ? '1 / -1' : '2 / 3'
        }}>
          {/* Header Title Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-6)'
          }}>
            <div>
              <h1 style={{
                fontSize: 'clamp(1.4rem, 2.5vw, 1.875rem)',
                fontWeight: 800,
                color: 'var(--ink)',
                margin: 0
              }}>
                {title}
              </h1>
              {subtitle && (
                <p style={{
                  fontSize: 'var(--fs-body)',
                  color: 'var(--ink-secondary)',
                  margin: '4px 0 0 0'
                }}>
                  {subtitle}
                </p>
              )}
            </div>

            {actions && (
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {actions}
              </div>
            )}
          </div>

          {/* Child Content */}
          {children}
        </main>
      </div>
    </div>
  );
};
