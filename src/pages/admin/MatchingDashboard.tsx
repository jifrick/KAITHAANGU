import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { AdminLayout } from '../../components/common/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { GitMerge, Package, MapPin, Users, HeartHandshake, CheckCircle2, ShieldCheck, ArrowRight, Calendar, AlertCircle } from 'lucide-react';

export const MatchingDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [itemsWithRequests, setItemsWithRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [itemRequests, setItemRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Match confirmation modal state
  const [matchModal, setMatchModal] = useState<{
    requestId: string;
    recipientId: string;
    recipientName: string;
    itemId: string;
    donorId: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check authorization
  const isMatchingAdmin = profile?.role === 'admin' && 
    ['super_admin', 'matching_admin'].includes(profile.admin_role || '');

  if (!isMatchingAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    fetchItemsWithRequests();
  }, []);

  const fetchItemsWithRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchErr } = await supabase
        .from('items')
        .select(`
          *,
          item_images (*),
          item_requests (id, status)
        `)
        .eq('status', 'published');

      if (fetchErr) throw fetchErr;
      
      // Filter items that have at least one pending request
      const filtered = (data || []).filter(item => 
        item.item_requests && item.item_requests.some((r: any) => r.status === 'pending')
      );
      
      setItemsWithRequests(filtered);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'ഡാറ്റ ശേഖരിക്കുന്നതിൽ പിശക്.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequestsForItem = async (itemId: string) => {
    try {
      setSelectedItemId(itemId);
      setRequestsLoading(true);
      
      const { data, error: fetchErr } = await supabase
        .from('item_requests')
        .select(`
          *,
          recipient:profiles!item_requests_recipient_id_fkey (*),
          verification:recipient_verifications!item_requests_recipient_id_fkey (*)
        `)
        .eq('item_id', itemId)
        .eq('status', 'pending');

      if (fetchErr) throw fetchErr;
      setItemRequests(data || []);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleCreateMatch = async () => {
    if (!matchModal) return;

    try {
      setIsSubmitting(true);
      const { requestId, recipientId, itemId, donorId } = matchModal;

      // 1. Create the Match record
      const { error: matchError } = await supabase
        .from('matches')
        .insert({
          item_id: itemId,
          donor_id: donorId,
          recipient_id: recipientId,
          status: 'pending_consent'
        });
        
      if (matchError) throw matchError;

      // 2. Update Item Status to 'matched'
      await supabase.from('items').update({ status: 'matched' }).eq('id', itemId);

      // 3. Update Request Statuses
      await supabase.from('item_requests').update({ status: 'approved' }).eq('id', requestId);
      await supabase.from('item_requests')
        .update({ status: 'rejected' })
        .eq('item_id', itemId)
        .neq('id', requestId);

      // 4. Audit Log
      await supabase.from('audit_logs').insert({
        admin_id: profile!.id,
        action: 'created_match',
        target_type: 'item',
        target_id: itemId,
        metadata: { recipient_id: recipientId, request_id: requestId }
      });

      // Reset local state & refresh
      setMatchModal(null);
      setSelectedItemId(null);
      fetchItemsWithRequests();
      
    } catch (err: any) {
      alert('മാച്ച് സൃഷ്ടിക്കുന്നതിൽ പിശക്: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedItemObj = itemsWithRequests.find(i => i.id === selectedItemId);

  return (
    <AdminLayout 
      title="മാച്ചിംഗ് ഡാഷ്‌ബോർഡ്" 
      subtitle="Requests & Matching — Connect requests with available items based on genuine need"
    >
      {/* Workflow Step Banner */}
      <Card style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', background: '#FAFBFC', border: '1px solid #EEF1F5' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Package style={{ width: '1rem', height: '1rem' }} /> 1. വസ്തുക്കൾ (Item)
          </span>
          <ArrowRight style={{ width: '0.9rem', height: '0.9rem', color: '#94A3B8' }} />
          <span style={{ color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Users style={{ width: '1rem', height: '1rem' }} /> 2. അപേക്ഷകൾ (Requests)
          </span>
          <ArrowRight style={{ width: '0.9rem', height: '0.9rem', color: '#94A3B8' }} />
          <span style={{ color: 'var(--secondary-rose)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <ShieldCheck style={{ width: '1rem', height: '1rem' }} /> 3. സ്വീകർത്താവിനെ തിരഞ്ഞെടുക്കുക
          </span>
          <ArrowRight style={{ width: '0.9rem', height: '0.9rem', color: '#94A3B8' }} />
          <span style={{ color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <HeartHandshake style={{ width: '1rem', height: '1rem' }} /> 4. മാച്ച് സ്ഥിരീകരിക്കൽ
          </span>
        </div>
      </Card>

      {error && (
        <div style={{ background: 'var(--soft-rose)', color: 'var(--danger)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
          <Card style={{ height: '300px', opacity: 0.6, background: '#F8FAFC' }}></Card>
          <Card style={{ height: '300px', opacity: 0.6, background: '#F8FAFC' }}></Card>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          
          {/* Left Column: Items Needing Matches */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--ink)', fontWeight: 700 }}>
                മാച്ച് ആവശ്യമുള്ളവ ({itemsWithRequests.length})
              </h3>
            </div>

            {itemsWithRequests.length === 0 ? (
              <Card style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <CheckCircle2 style={{ width: '36px', height: '36px', color: 'var(--primary-blue)', margin: '0 auto 0.75rem' }} />
                <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--ink)' }}>അപേക്ഷകൾ കാത്തിരിക്കുന്നവ ഒന്നുമില്ല</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>എല്ലാ അപേക്ഷകളും പ്രോസസ്സ് ചെയ്ത് കഴിഞ്ഞു.</p>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {itemsWithRequests.map(item => {
                  const pendingCount = item.item_requests.filter((r: any) => r.status === 'pending').length;
                  const isSelected = selectedItemId === item.id;

                  return (
                    <Card 
                      key={item.id}
                      interactive={true}
                      onClick={() => fetchRequestsForItem(item.id)}
                      style={{ 
                        padding: '1.15rem', 
                        cursor: 'pointer',
                        border: isSelected ? '2px solid var(--primary-blue)' : '1px solid var(--soft-gray)',
                        background: isSelected ? 'var(--soft-blue)' : '#FFFFFF',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink)' }}>{item.title}</h4>
                        <span style={{ backgroundColor: 'var(--primary-blue)', color: '#FFFFFF', padding: '0.2rem 0.55rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {pendingCount} അപേക്ഷകൾ
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                          <MapPin style={{ width: '0.85rem', height: '0.85rem', color: 'var(--secondary-rose)' }} /> {item.area}
                        </span>
                        <span>•</span>
                        <span>{item.category}</span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Applicants Review */}
          <div>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--ink)', fontWeight: 700 }}>
              അപേക്ഷകരുടെ വിവരങ്ങൾ {selectedItemObj ? `— (${selectedItemObj.title})` : ''}
            </h3>

            {!selectedItemId ? (
              <Card style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
                <GitMerge style={{ width: '40px', height: '40px', color: '#94A3B8', margin: '0 auto 1rem' }} />
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--ink)' }}>ഐറ്റം തിരഞ്ഞെടുക്കുക</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  ഇടതുവശത്തുനിന്ന് ഒരു ഐറ്റം ക്ലിക്ക് ചെയ്ത് അപേക്ഷകരുടെ വിശദാംശങ്ങൾ പരിശോധിക്കുക.
                </p>
              </Card>
            ) : requestsLoading ? (
              <Card style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>അപേക്ഷകരുടെ ഡാറ്റ ലോഡ് ചെയ്യുന്നു...</p>
              </Card>
            ) : itemRequests.length === 0 ? (
              <Card style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>ലഭ്യമായ പെൻഡിംഗ് അപേക്ഷകൾ ഒന്നുമില്ല.</p>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {itemRequests.map(req => (
                  <Card key={req.id} style={{ padding: '1.35rem', border: '1px solid var(--soft-gray)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div>
                        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)' }}>
                          {req.recipient?.name || 'അജ്ഞാത സ്വീകർത്താവ്'}
                        </h4>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Calendar style={{ width: '0.8rem', height: '0.8rem' }} />
                          അപേക്ഷിച്ചത്: {new Date(req.created_at).toLocaleDateString('ml-IN')}
                        </div>
                      </div>

                      <Button 
                        variant="primary"
                        size="sm"
                        onClick={() => setMatchModal({
                          requestId: req.id,
                          recipientId: req.recipient_id,
                          recipientName: req.recipient?.name || 'User',
                          itemId: selectedItemId,
                          donorId: selectedItemObj?.donor_id
                        })}
                      >
                        <HeartHandshake style={{ width: '1rem', height: '1rem', marginRight: '0.4rem' }} />
                        Match ചെയ്യുക
                      </Button>
                    </div>

                    {/* Applicant Request Reason */}
                    <div style={{ background: 'var(--soft-rose)', padding: '0.9rem 1rem', borderRadius: '10px', marginBottom: '1rem', border: '1px solid #FCECEF' }}>
                      <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--ink)', marginBottom: '0.35rem' }}>
                        അപേക്ഷിച്ചതിന്റെ കാരണം (Reason):
                      </strong>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: '1.5' }}>
                        {req.reason}
                      </p>
                    </div>

                    {/* Admin Private Verification Context */}
                    <div style={{ background: '#F8FAFC', padding: '0.9rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                        <ShieldCheck style={{ width: '0.85rem', height: '0.85rem', color: 'var(--primary-blue)' }} /> Admin Context (കാരണം & കുറിപ്പുകൾ):
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: '1.5' }}>
                        <div><strong>ആദ്യ Verification ആവശ്യം:</strong> {req.verification?.applicant_reason || 'ലഭ്യമല്ല'}</div>
                        {req.verification?.admin_notes && (
                          <div style={{ marginTop: '0.25rem' }}><strong>Admin Notes:</strong> {req.verification.admin_notes}</div>
                        )}
                      </div>
                    </div>

                  </Card>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Match Confirmation Modal */}
      {matchModal && (
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
          <Card style={{ maxWidth: '460px', width: '100%', padding: '1.75rem', background: '#FFFFFF', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--ink)', fontSize: '1.25rem' }}>
              മാച്ചിംഗ് സ്ഥിരീകരിക്കുന്നു
            </h3>
            <p style={{ margin: '0 0 1.25rem 0', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              <strong>"{matchModal.recipientName}"</strong> എന്ന സ്വീകർത്താവിനെ ഈ വസ്തുവമായി മാച്ച് ചെയ്യാൻ നിങ്ങൾക്ക് ഉറപ്പാണോ? മറ്റ് അപേക്ഷകൾ നിരസിക്കപ്പെടും.
            </p>

            <div style={{ background: 'var(--soft-blue)', padding: '0.85rem 1rem', borderRadius: '10px', marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--primary-blue)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <AlertCircle style={{ width: '1rem', height: '1rem', flexShrink: 0, marginTop: '0.1rem' }} />
              <span>തുടർന്ന് Donor-നും Recipient-നും ഫോൺ വിവരങ്ങൾ കൈമാറാൻ അനുമതി ഉണ്ടാകും.</span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <Button 
                variant="secondary"
                size="sm"
                onClick={() => setMatchModal(null)}
                disabled={isSubmitting}
              >
                റദ്ദാക്കുക (Cancel)
              </Button>
              <Button 
                variant="primary"
                size="sm"
                onClick={handleCreateMatch}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'മാച്ച് ചെയ്യുന്നു...' : 'ഉറപ്പാക്കുക (Confirm Match)'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
};

