import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { AdminLayout } from '../../components/common/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

export const AdminDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [counts, setCounts] = useState({
    pendingAccounts: 0,
    pendingVerifications: 0,
    pendingItems: 0,
    openReports: 0,
    activeMatches: 0
  });
  const [loading, setLoading] = useState(true);

  if (profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const role = profile.admin_role || 'admin';
  const isSuperAdmin = role === 'super_admin';
  const isContentAdmin = isSuperAdmin || role === 'content_admin';
  const isVerificationAdmin = isSuperAdmin || role === 'verification_admin';
  const isMatchingAdmin = isSuperAdmin || role === 'matching_admin';
  const isSupportModerator = isSuperAdmin || role === 'support_moderator' || role === 'content_admin';

  useEffect(() => {
    fetchMetrics();
  }, [profile]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);

      const [accRes, verRes, itemRes, repRes, matchRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('account_status', 'pending'),
        supabase.from('recipient_verifications').select('user_id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('items').select('id', { count: 'exact', head: true }).eq('status', 'pending_moderation'),
        supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('matches').select('id', { count: 'exact', head: true }).not('status', 'eq', 'completed')
      ]);

      setCounts({
        pendingAccounts: accRes.count || 0,
        pendingVerifications: verRes.count || 0,
        pendingItems: itemRes.count || 0,
        openReports: repRes.count || 0,
        activeMatches: matchRes.count || 0
      });
    } catch (err) {
      console.error('Error fetching admin metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalPendingAttention = (isVerificationAdmin ? counts.pendingAccounts + counts.pendingVerifications : 0) +
    (isContentAdmin ? counts.pendingItems : 0) +
    (isSupportModerator ? counts.openReports : 0);

  return (
    <AdminLayout
      title="Admin Control Hub"
      subtitle="KAITHAANGU പ്ലാറ്റ്‌ഫോമിന്റെ അവലോകനവും അഡ്മിൻ മോഡറേഷൻ മൊഡ്യൂളുകളും."
      actions={
        <Button size="sm" variant="outline" onClick={fetchMetrics} disabled={loading}>
          🔄 Refresh Data
        </Button>
      }
    >
      {/* Configuration warning if no sub-role assigned */}
      {!isContentAdmin && !isVerificationAdmin && !isMatchingAdmin && !isSupportModerator && (
        <Card style={{ background: 'var(--error-bg)', border: '1px solid var(--error-border)', color: 'var(--error-text)', marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 4px 0' }}>Configuration Required</h2>
          <p style={{ margin: 0, fontSize: 'var(--fs-body-sm)' }}>
            Your admin account is configured, but no sub-role permissions have been assigned. Please contact a Super Admin.
          </p>
        </Card>
      )}

      {/* Needs Attention Summary Alert */}
      <Card style={{
        background: totalPendingAttention > 0 ? 'var(--soft-blue)' : 'var(--success-bg)',
        border: `1px solid ${totalPendingAttention > 0 ? 'var(--soft-blue-border)' : 'var(--success-border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4) var(--space-5)',
        marginBottom: 'var(--space-6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.4rem' }}>{totalPendingAttention > 0 ? '🔔' : '✅'}</span>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '1rem' }}>
              {totalPendingAttention > 0 
                ? `${totalPendingAttention} വിഷയങ്ങൾ നിങ്ങളുടെ അടിയന്തര ശ്രദ്ധ കാത്തിരിക്കുന്നു`
                : 'എല്ലാ വിഷയങ്ങളും review ചെയ്തു കഴിഞ്ഞു (All pending tasks cleared)'}
            </div>
            <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-secondary)' }}>
              സ്വാഭാവിക പരിശോധനകൾ പൂർത്തിയാക്കി പ്ലാറ്റ്‌ഫോം സുരക്ഷിതമായി നിലനിർത്തുക.
            </div>
          </div>
        </div>

        {totalPendingAttention > 0 && (
          <Badge status="pending" label={`${totalPendingAttention} Pending`} />
        )}
      </Card>

      {/* Grid of Admin Control Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'var(--space-5)'
      }}>
        
        {/* Card 1: Account Approvals */}
        {isVerificationAdmin && (
          <Link to="/admin/accounts" style={{ textDecoration: 'none' }}>
            <Card interactive style={{ borderTop: '4px solid #8b5cf6', height: '100%', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>👥 User Account Approvals</h3>
                {counts.pendingAccounts > 0 ? (
                  <Badge status="pending" label={`${counts.pendingAccounts} Pending`} />
                ) : (
                  <Badge status="approved" label="Cleared" />
                )}
              </div>
              <p style={{ color: 'var(--ink-secondary)', fontSize: 'var(--fs-body-sm)', margin: 0, lineHeight: 1.5 }}>
                പുതിയ യൂസർമാരുടെ പ്രൊഫൈൽ സമർപ്പണങ്ങൾ പരിശോധിച്ച് പ്ലാറ്റ്‌ഫോം ആക്സസ് അനുമതി നൽകുക.
              </p>
            </Card>
          </Link>
        )}

        {/* Card 2: Recipient Verification */}
        {isVerificationAdmin && (
          <Link to="/admin/verification" style={{ textDecoration: 'none' }}>
            <Card interactive style={{ borderTop: '4px solid var(--primary-blue)', height: '100%', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>🤝 Recipient Verification</h3>
                {counts.pendingVerifications > 0 ? (
                  <Badge status="pending" label={`${counts.pendingVerifications} Pending`} />
                ) : (
                  <Badge status="approved" label="Cleared" />
                )}
              </div>
              <p style={{ color: 'var(--ink-secondary)', fontSize: 'var(--fs-body-sm)', margin: 0, lineHeight: 1.5 }}>
                സാധനങ്ങൾ സ്വീകരിക്കുന്നതിനായുള്ള റെസിപിയന്റ് യോഗ്യതാ അപേക്ഷകളും കാരണങ്ങളും അവലോകനം ചെയ്യുക.
              </p>
            </Card>
          </Link>
        )}

        {/* Card 3: Item Moderation */}
        {isContentAdmin && (
          <Link to="/admin/moderation" style={{ textDecoration: 'none' }}>
            <Card interactive style={{ borderTop: '4px solid var(--danger)', height: '100%', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>🎁 Item Moderation</h3>
                {counts.pendingItems > 0 ? (
                  <Badge status="pending" label={`${counts.pendingItems} Pending`} />
                ) : (
                  <Badge status="approved" label="Cleared" />
                )}
              </div>
              <p style={{ color: 'var(--ink-secondary)', fontSize: 'var(--fs-body-sm)', margin: 0, lineHeight: 1.5 }}>
                ദാതാക്കൾ നൽകിയ പുതിയ സാധനങ്ങൾ, ഫോട്ടോകൾ, വിവരണങ്ങൾ എന്നിവ പരിശോധിച്ച് പ്രസിദ്ധീകരിക്കുക.
              </p>
            </Card>
          </Link>
        )}

        {/* Card 4: Matching */}
        {isMatchingAdmin && (
          <Link to="/admin/matching" style={{ textDecoration: 'none' }}>
            <Card interactive style={{ borderTop: '4px solid #059669', height: '100%', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>⚡ Requests & Matching</h3>
                <Badge status="info" label={`${counts.activeMatches} Active`} />
              </div>
              <p style={{ color: 'var(--ink-secondary)', fontSize: 'var(--fs-body-sm)', margin: 0, lineHeight: 1.5 }}>
                അഭ്യർത്ഥനകളും ദാതാക്കളുടെ ലിസ്റ്റിംഗുകളും ഒത്തുനോക്കി Match സ്ഥിരീകരിച്ച് കൈമാറ്റം പൂർത്തിയാക്കുക.
              </p>
            </Card>
          </Link>
        )}

        {/* Card 5: Reports */}
        {isSupportModerator && (
          <Link to="/admin/reports" style={{ textDecoration: 'none' }}>
            <Card interactive style={{ borderTop: '4px solid #d97706', height: '100%', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>🚩 Reports & Support</h3>
                {counts.openReports > 0 ? (
                  <Badge status="rejected" label={`${counts.openReports} Open`} />
                ) : (
                  <Badge status="approved" label="Cleared" />
                )}
              </div>
              <p style={{ color: 'var(--ink-secondary)', fontSize: 'var(--fs-body-sm)', margin: 0, lineHeight: 1.5 }}>
                യൂസർമാർ സമർപ്പിച്ച സംശയാസ്പദമായ റിപ്പോർട്ടുകളും തർക്കങ്ങളും പരിശോധിക്കുക.
              </p>
            </Card>
          </Link>
        )}

        {/* Card 6: Audit Logs */}
        {isSuperAdmin && (
          <Link to="/admin/audit" style={{ textDecoration: 'none' }}>
            <Card interactive style={{ borderTop: '4px solid #475569', height: '100%', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>📋 Audit Logs</h3>
                <Badge status="info" label="Super Admin" />
              </div>
              <p style={{ color: 'var(--ink-secondary)', fontSize: 'var(--fs-body-sm)', margin: 0, lineHeight: 1.5 }}>
                അഡ്മിനിസ്ട്രേറ്റീവ് മാറ്റങ്ങളുടെയും പ്രവർത്തനങ്ങളുടെയും സുരക്ഷിത ചരിത്രം പരിശോധിക്കുക.
              </p>
            </Card>
          </Link>
        )}

      </div>
    </AdminLayout>
  );
};

