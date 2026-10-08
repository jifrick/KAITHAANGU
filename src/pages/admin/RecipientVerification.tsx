import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Profile, RecipientVerification as VerificationType } from '../../types/database';
import { AdminLayout } from '../../components/common/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { CheckCircle2, XCircle, AlertTriangle, ShieldAlert, Search, MessageSquare, Phone, MapPin, Calendar } from 'lucide-react';

type VerificationWithProfile = VerificationType & { 
  profile: Profile;
};

export const RecipientVerification: React.FC = () => {
  const { profile } = useAuth();
  const [verifications, setVerifications] = useState<VerificationWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering & search
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Decision Modal State
  const [activeItem, setActiveItem] = useState<{ userId: string; targetStatus: string; userName: string } | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check authorization
  const isVerificationAdmin = profile?.role === 'admin' && 
    ['super_admin', 'verification_admin'].includes(profile.admin_role || '');

  if (!isVerificationAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    fetchVerifications();
  }, [statusFilter]);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('recipient_verifications')
        .select(`
          *,
          profile:profiles(*)
        `)
        .order('submitted_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;

      setVerifications((data as any) || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'അപേക്ഷകൾ വീണ്ടെടുക്കാൻ കഴിഞ്ഞില്ല.');
    } finally {
      setLoading(false);
    }
  };

  const openDecisionModal = (userId: string, targetStatus: string, userName: string) => {
    setActiveItem({ userId, targetStatus, userName });
    setAdminNotes('');
  };

  const handleConfirmAction = async () => {
    if (!activeItem) return;

    try {
      setIsSubmitting(true);
      const { userId, targetStatus } = activeItem;

      const { error: updateErr } = await supabase
        .from('recipient_verifications')
        .update({ 
          status: targetStatus,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes.trim() || null
        })
        .eq('user_id', userId);

      if (updateErr) throw updateErr;

      // Log in audit table
      await supabase.from('audit_logs').insert({
        admin_id: profile!.id,
        action: `updated_verification_status_to_${targetStatus}`,
        target_type: 'user',
        target_id: userId,
        metadata: { notes: adminNotes.trim() || null }
      });

      // Update local state list
      if (statusFilter !== 'all') {
        setVerifications(prev => prev.filter(v => v.user_id !== userId));
      } else {
        fetchVerifications();
      }

      setActiveItem(null);
    } catch (err: any) {
      alert('സ്ഥിരീകരണം അപ്‌ഡേറ്റ് ചെയ്യുന്നതിൽ പരാജയപ്പെട്ടു: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredVerifications = verifications.filter(v => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.profile?.name?.toLowerCase().includes(q) ||
      v.profile?.phone?.toLowerCase().includes(q) ||
      v.profile?.address?.toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout 
      title="സ്വീകർത്താവ് സ്ഥിരീകരണം" 
      subtitle="Recipient Verification — Review applications to verify genuine community need"
    >
      {/* Search & Filter Header */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Status Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', background: '#F1F5F9', padding: '0.25rem', borderRadius: '12px' }}>
          {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              style={{
                padding: '0.4rem 0.9rem',
                borderRadius: '8px',
                border: 'none',
                background: statusFilter === tab ? '#FFFFFF' : 'transparent',
                color: statusFilter === tab ? 'var(--ink)' : 'var(--text-muted)',
                fontWeight: statusFilter === tab ? 600 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: statusFilter === tab ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                textTransform: 'capitalize',
                transition: 'all 0.2s ease'
              }}
            >
              {tab === 'pending' ? 'പെൻഡിംഗ് (Pending)' : tab === 'approved' ? 'സ്ഥിരീകരിച്ചത് (Approved)' : tab === 'rejected' ? 'നിരസിച്ചത് (Rejected)' : 'എല്ലാം (All)'}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div style={{ minWidth: '280px', position: 'relative' }}>
          <Input 
            placeholder="പേര്, ഫോൺ വഴി തിരയുക..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.5rem' }}
          />
          <Search style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', width: '1.1rem', height: '1.1rem', color: '#94A3B8' }} />
        </div>
      </div>

      {error && (
        <div style={{ background: 'var(--soft-rose)', color: 'var(--danger)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle style={{ width: '1.2rem', height: '1.2rem' }} />
          <span>{error}</span>
        </div>
      )}

      {/* Main List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map(i => (
            <Card key={i} style={{ padding: '1.5rem', minHeight: '140px', background: '#F8FAFC', opacity: 0.7 }}>
              <div style={{ background: '#E2E8F0', height: '24px', width: '30%', borderRadius: '4px', marginBottom: '1rem' }}></div>
              <div style={{ background: '#E2E8F0', height: '16px', width: '60%', borderRadius: '4px' }}></div>
            </Card>
          ))}
        </div>
      ) : filteredVerifications.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <div style={{ background: 'var(--soft-blue)', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--primary-blue)' }}>
            <CheckCircle2 style={{ width: '28px', height: '28px' }} />
          </div>
          <h3 style={{ color: 'var(--ink)', margin: '0 0 0.5rem 0' }}>ശ്രദ്ധിക്കപ്പെടേണ്ട അപേക്ഷകൾ ഒന്നുമില്ല</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
            {statusFilter === 'pending' ? 'Review ചെയ്യാനുള്ള അപേക്ഷകളെല്ലാം പൂർത്തിയായി.' : 'ഈ ഫിൽട്ടറിൽ വിവരങ്ങൾ ഒന്നുമില്ല.'}
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredVerifications.map(v => {
            return (
              <Card key={v.user_id} style={{ padding: '1.5rem', border: '1px solid var(--soft-gray)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)' }}>{v.profile?.name || 'അജ്ഞാത ഉപയോക്താവ്'}</h3>
                      <Badge 
                        status={v.status === 'approved' ? 'approved' : v.status === 'rejected' ? 'rejected' : 'pending'} 
                        label={v.status === 'approved' ? 'സ്ഥിരീകരിച്ചത്' : v.status === 'rejected' ? 'നിരസിച്ചത്' : 'പെൻഡിംഗ്'} 
                        dot={true}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <Calendar style={{ width: '0.9rem', height: '0.9rem' }} />
                      <span>സമർപ്പിച്ചത്: {new Date(v.submitted_at).toLocaleDateString('ml-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {v.admin_notes && (
                    <div style={{ fontSize: '0.85rem', color: '#64748B', background: '#F8FAFC', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid #E2E8F0', maxWidth: '300px' }}>
                      <strong>Admin Notes:</strong> {v.admin_notes}
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                  {/* Contact details */}
                  <div style={{ background: '#FAFBFC', padding: '1rem', borderRadius: '12px', border: '1px solid #EEF1F5' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Phone style={{ width: '0.9rem', height: '0.9rem', color: 'var(--primary-blue)' }} /> ബന്ധപ്പെടേണ്ട വിവരങ്ങൾ
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--ink)', lineHeight: '1.6' }}>
                      <div><strong>ഫോൺ:</strong> {v.profile?.phone || 'ലഭ്യമല്ല'}</div>
                      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.4rem' }}>
                        <MapPin style={{ width: '1rem', height: '1rem', color: 'var(--secondary-rose)', flexShrink: 0, marginTop: '0.2rem' }} />
                        <span><strong>വിലാസം:</strong><br/>{v.profile?.address || 'ലഭ്യമല്ല'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Applicant reason */}
                  <div style={{ background: 'var(--soft-rose)', padding: '1rem', borderRadius: '12px', border: '1px solid #FCECEF' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MessageSquare style={{ width: '0.9rem', height: '0.9rem', color: 'var(--secondary-rose)' }} /> സഹായം ആവശ്യമുള്ളതിന്റെ കാരണം
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                      {v.applicant_reason || <em style={{ color: 'var(--text-muted)' }}>വിശദീകരണം നൽകിയിട്ടില്ല.</em>}
                    </p>
                  </div>
                </div>

                {/* Actions Bar */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', borderTop: '1px solid #F1F5F9', paddingTop: '1.25rem' }}>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => openDecisionModal(v.user_id, 'approved', v.profile?.name || 'User')}
                  >
                    <CheckCircle2 style={{ width: '1rem', height: '1rem', marginRight: '0.4rem' }} />
                    അംഗീകരിക്കുക (Approve)
                  </Button>

                  <Button 
                    variant="secondary"
                    size="sm"
                    onClick={() => openDecisionModal(v.user_id, 'more_info_needed', v.profile?.name || 'User')}
                  >
                    വിവരങ്ങൾ കൂടുതൽ വേണം (Request Info)
                  </Button>

                  <Button 
                    variant="danger" 
                    size="sm"
                    onClick={() => openDecisionModal(v.user_id, 'rejected', v.profile?.name || 'User')}
                  >
                    <XCircle style={{ width: '1rem', height: '1rem', marginRight: '0.4rem' }} />
                    നിരസിക്കുക (Reject)
                  </Button>

                  <Button 
                    variant="danger"
                    size="sm"
                    style={{ marginLeft: 'auto', backgroundColor: '#991B1B' }}
                    onClick={() => openDecisionModal(v.user_id, 'suspended', v.profile?.name || 'User')}
                  >
                    <ShieldAlert style={{ width: '1rem', height: '1rem', marginRight: '0.4rem' }} />
                    സസ്‌പെൻഡ് ചെയ്യുക (Suspend)
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Decision Modal Dialog */}
      {activeItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <Card style={{ maxWidth: '480px', width: '100%', padding: '1.75rem', background: '#FFFFFF', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--ink)', fontSize: '1.25rem' }}>
              {activeItem.targetStatus === 'approved' ? 'അപേക്ഷ അംഗീകരിക്കുന്നു' : activeItem.targetStatus === 'rejected' ? 'അപേക്ഷ നിരസിക്കുന്നു' : activeItem.targetStatus === 'suspended' ? 'ഉപയോക്താവിനെ സസ്‌പെൻഡ് ചെയ്യുന്നു' : 'കൂടുതൽ വിവരങ്ങൾ ആവശ്യപ്പെടുന്നു'}
            </h3>
            <p style={{ margin: '0 0 1.25rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <strong>{activeItem.userName}</strong> എന്ന ഉപയോക്താവിന്റെ അപേക്ഷയിന്മേൽ തുടരുക.
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '0.4rem' }}>
                Admin Notes (ഓപ്ഷണൽ കുറിപ്പുകൾ)
              </label>
              <textarea
                rows={3}
                placeholder="ഈ തീരുമാനത്തിന് പിന്നിലെ കാരണം രേഖപ്പെടുത്തുക..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  fontFamily: 'inherit',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <Button 
                variant="secondary"
                size="sm"
                onClick={() => setActiveItem(null)}
                disabled={isSubmitting}
              >
                റദ്ദാക്കുക (Cancel)
              </Button>
              <Button 
                variant={activeItem.targetStatus === 'approved' ? 'primary' : 'danger'}
                size="sm"
                onClick={handleConfirmAction}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'പ്രോസസ്സ് ചെയ്യുന്നു...' : 'ഉറപ്പാക്കുക (Confirm)'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
};

