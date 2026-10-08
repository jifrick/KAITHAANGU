import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { AdminLayout } from '../../components/common/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { AlertTriangle, CheckCircle2, ExternalLink, Calendar, Trash2, FileX } from 'lucide-react';

export const ReportsDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status Filter
  const [statusFilter, setStatusFilter] = useState<'open' | 'resolved' | 'all'>('open');

  // Action Confirmation Modal
  const [modalAction, setModalAction] = useState<{
    reportId: string;
    actionType: 'remove_item' | 'dismiss';
    targetId?: string;
    reason: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSupportModerator = profile?.role === 'admin' && 
    ['super_admin', 'support_moderator', 'content_admin'].includes(profile.admin_role || '');

  if (!isSupportModerator) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('reports')
        .select(`
          *,
          reporter:profiles!reports_reporter_id_fkey(name, phone)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;

      setReports(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'പരാതികൾ ശേഖരിക്കുന്നതിൽ പിശക്.');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAction = async () => {
    if (!modalAction) return;

    try {
      setIsSubmitting(true);
      const { reportId, actionType, targetId } = modalAction;

      if (actionType === 'remove_item' && targetId) {
        // Remove item
        await supabase.from('items').update({ status: 'removed' }).eq('id', targetId);
      }

      // Mark report as resolved
      const { error: updateErr } = await supabase
        .from('reports')
        .update({ status: 'resolved' })
        .eq('id', reportId);

      if (updateErr) throw updateErr;

      // Audit Log
      await supabase.from('audit_logs').insert({
        admin_id: profile!.id,
        action: `resolved_report_${actionType}`,
        target_type: 'report',
        target_id: reportId,
        metadata: { action_type: actionType, target_id: targetId }
      });

      // Update state
      if (statusFilter !== 'all') {
        setReports(prev => prev.filter(r => r.id !== reportId));
      } else {
        fetchReports();
      }

      setModalAction(null);
    } catch (err: any) {
      alert('പരാതി തീർപ്പാക്കുന്നതിൽ പരാജയപ്പെട്ടു: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout 
      title="പരാതികളുടെ പരിഹാരം" 
      subtitle="Reports & Community Moderation — Review user reports of abuse, fraud, or policy violations"
    >
      {/* Status Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', background: '#F1F5F9', padding: '0.25rem', borderRadius: '12px', width: 'fit-content', marginBottom: '1.5rem' }}>
        {(['open', 'resolved', 'all'] as const).map((tab) => (
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
              transition: 'all 0.2s ease'
            }}
          >
            {tab === 'open' ? 'തുറന്നവ (Open)' : tab === 'resolved' ? 'തീർപ്പാക്കിയവ (Resolved)' : 'എല്ലാം (All)'}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: 'var(--soft-rose)', color: 'var(--danger)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2].map(i => (
            <Card key={i} style={{ padding: '1.5rem', minHeight: '140px', opacity: 0.6, background: '#F8FAFC' }}></Card>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <div style={{ background: 'var(--soft-blue)', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--primary-blue)' }}>
            <CheckCircle2 style={{ width: '28px', height: '28px' }} />
          </div>
          <h3 style={{ color: 'var(--ink)', margin: '0 0 0.5rem 0' }}>പരാതികൾ ഒന്നുമില്ല</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
            {statusFilter === 'open' ? 'പരിശോധനയിലുള്ള പരാതികൾ ഒന്നുമില്ല.' : 'ഈ ഫിൽട്ടറിൽ വിവരങ്ങൾ ഒന്നുമില്ല.'}
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {reports.map(report => {
            const isOpen = report.status === 'open';

            return (
              <Card 
                key={report.id} 
                style={{ 
                  padding: '1.5rem', 
                  borderLeft: isOpen ? '4px solid var(--danger)' : '4px solid var(--success)',
                  borderTop: '1px solid var(--soft-gray)',
                  borderRight: '1px solid var(--soft-gray)',
                  borderBottom: '1px solid var(--soft-gray)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <AlertTriangle style={{ width: '1.2rem', height: '1.2rem', color: 'var(--danger)' }} />
                      <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--danger)', fontWeight: 700 }}>
                        {report.reason}
                      </h3>
                      <Badge 
                        status={isOpen ? 'pending' : 'approved'}
                        label={isOpen ? 'Open' : 'Resolved'}
                        dot={true}
                      />
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar style={{ width: '0.85rem', height: '0.85rem' }} />
                      റിപ്പോർട്ട് ചെയ്ത തീയതി: {new Date(report.created_at).toLocaleDateString('ml-IN')}
                    </div>
                  </div>

                  {report.target_type === 'item' && (
                    <Link 
                      to={`/item/${report.target_id}`} 
                      target="_blank" 
                      style={{ textDecoration: 'none' }}
                    >
                      <Button variant="secondary" size="sm">
                        <ExternalLink style={{ width: '0.9rem', height: '0.9rem', marginRight: '0.3rem' }} />
                        വസ്തു കാണുക (View Item)
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Report Target & Reporter Meta */}
                <div style={{ background: '#FAFBFC', padding: '1rem', borderRadius: '10px', border: '1px solid #EEF1F5', fontSize: '0.88rem', color: 'var(--ink)', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    <div><strong>വിഭാഗം (Target Type):</strong> <span style={{ textTransform: 'capitalize', color: 'var(--primary-blue)' }}>{report.target_type}</span></div>
                    <div><strong>Target ID:</strong> <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748B' }}>{report.target_id}</span></div>
                    <div><strong>റിപ്പോർട്ട് ചെയ്തയാൾ:</strong> {report.reporter?.name || 'അജ്ഞാത ഉപയോക്താവ്'}</div>
                  </div>
                </div>

                {/* Actions */}
                {isOpen && (
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
                    {report.target_type === 'item' && (
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => setModalAction({
                          reportId: report.id,
                          actionType: 'remove_item',
                          targetId: report.target_id,
                          reason: report.reason
                        })}
                      >
                        <Trash2 style={{ width: '1rem', height: '1rem', marginRight: '0.4rem' }} />
                        വസ്തു നീക്കം ചെയ്യുക (Remove Item)
                      </Button>
                    )}

                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => setModalAction({
                        reportId: report.id,
                        actionType: 'dismiss',
                        reason: report.reason
                      })}
                    >
                      <FileX style={{ width: '1rem', height: '1rem', marginRight: '0.4rem' }} />
                      നടപടിയില്ലാതെ തള്ളുക (Dismiss)
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {modalAction && (
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
          <Card style={{ maxWidth: '440px', width: '100%', padding: '1.75rem', background: '#FFFFFF', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--ink)', fontSize: '1.2rem' }}>
              {modalAction.actionType === 'remove_item' ? 'വസ്തു നീക്കം ചെയ്ത് പരാതി പരിഹരിക്കുന്നു' : 'പരാതി തള്ളുന്നു'}
            </h3>
            <p style={{ margin: '0 0 1.25rem 0', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              <strong>"{modalAction.reason}"</strong> എന്ന പരാതിയിന്മേൽ {modalAction.actionType === 'remove_item' ? 'വസ്തു നീക്കം ചെയ്ത് റിപ്പോർട്ട് Resolved ആയി അടയാളപ്പെടുത്താൻ നിങ്ങൾക്ക് ഉറപ്പാണോ?' : 'തുടർ നടപടികളില്ലാതെ ഈ റിപ്പോർട്ട് Dismiss ചെയ്യാൻ നിങ്ങൾക്ക് ഉറപ്പാണോ?'}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => setModalAction(null)}
                disabled={isSubmitting}
              >
                റദ്ദാക്കുക (Cancel)
              </Button>
              <Button 
                variant={modalAction.actionType === 'remove_item' ? 'danger' : 'primary'} 
                size="sm"
                onClick={handleResolveAction}
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

