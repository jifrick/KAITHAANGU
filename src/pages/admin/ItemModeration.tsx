import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Item, ItemImage } from '../../types/database';
import { AdminLayout } from '../../components/common/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { CheckCircle2, XCircle, Package, MapPin, Tag, Image as ImageIcon, Calendar } from 'lucide-react';

type ItemWithImages = Item & { item_images: ItemImage[] };

export const ItemModeration: React.FC = () => {
  const { profile } = useAuth();
  const [items, setItems] = useState<ItemWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Status tab filter
  const [statusFilter, setStatusFilter] = useState<'pending_moderation' | 'published' | 'removed' | 'all'>('pending_moderation');
  
  // Action modal
  const [confirmModal, setConfirmModal] = useState<{ itemId: string; title: string; action: 'published' | 'removed' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Authorization check
  const isContentAdmin = profile?.role === 'admin' && 
    ['super_admin', 'content_admin'].includes(profile.admin_role || '');

  if (!isContentAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    fetchItems();
  }, [statusFilter]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('items')
        .select(`
          *,
          item_images (*)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error: fetchErr } = await query;
      if (fetchErr) throw fetchErr;

      setItems((data as ItemWithImages[]) || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'ഐറ്റങ്ങൾ ശേഖരിക്കുന്നതിൽ പിശക്.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!confirmModal) return;

    try {
      setIsSubmitting(true);
      const { itemId, action } = confirmModal;

      const { error: updateErr } = await supabase
        .from('items')
        .update({ status: action })
        .eq('id', itemId);

      if (updateErr) throw updateErr;

      // Audit log
      await supabase.from('audit_logs').insert({
        admin_id: profile!.id,
        action: action === 'published' ? 'published_item' : 'removed_item',
        target_type: 'item',
        target_id: itemId
      });

      // Update state
      if (statusFilter !== 'all') {
        setItems(prev => prev.filter(item => item.id !== itemId));
      } else {
        fetchItems();
      }

      setConfirmModal(null);
    } catch (err: any) {
      alert('പരാജയപ്പെട്ടു: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from('items').getPublicUrl(path);
    return data.publicUrl;
  };

  const getItemBadgeStatus = (st: string) => {
    if (st === 'published') return 'approved';
    if (st === 'removed') return 'rejected';
    return 'pending';
  };

  const getItemBadgeLabel = (st: string) => {
    if (st === 'published') return 'പ്രസിദ്ധീകരിച്ചത് (Published)';
    if (st === 'removed') return 'നീക്കം ചെയ്തത് (Removed)';
    return 'പരിശോധനയിൽ (Pending)';
  };

  return (
    <AdminLayout 
      title="വസ്തുക്കളുടെ പരിശോധന" 
      subtitle="Item Moderation — Review items submitted by donors before public listing"
    >
      {/* Status Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', background: '#F1F5F9', padding: '0.25rem', borderRadius: '12px', width: 'fit-content', marginBottom: '1.5rem' }}>
        {(['pending_moderation', 'published', 'removed', 'all'] as const).map((tab) => (
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
            {tab === 'pending_moderation' ? 'പെൻഡിംഗ്' : tab === 'published' ? 'പ്രസിദ്ധീകരിച്ചവ' : tab === 'removed' ? 'നീക്കം ചെയ്തവ' : 'എല്ലാം'}
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
            <Card key={i} style={{ padding: '1.5rem', minHeight: '160px', opacity: 0.6, background: '#F8FAFC' }}>
              <div style={{ background: '#E2E8F0', height: '24px', width: '40%', borderRadius: '4px', marginBottom: '1rem' }}></div>
              <div style={{ background: '#E2E8F0', height: '16px', width: '80%', borderRadius: '4px' }}></div>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <div style={{ background: 'var(--soft-blue)', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--primary-blue)' }}>
            <Package style={{ width: '28px', height: '28px' }} />
          </div>
          <h3 style={{ color: 'var(--ink)', margin: '0 0 0.5rem 0' }}>Review ചെയ്യാനുള്ള items ഒന്നുമില്ല</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
            {statusFilter === 'pending_moderation' ? 'പരിശോധിക്കാനുള്ള വസ്തുക്കളുടെ ലിസ്റ്റ് ശൂന്യമാണ്.' : 'ഈ കാറ്റഗറിയിൽ വിവരങ്ങൾ ഒന്നുമില്ല.'}
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {items.map(item => {
            const hasImages = item.item_images && item.item_images.length > 0;

            return (
              <Card key={item.id} style={{ padding: '1.5rem', border: '1px solid var(--soft-gray)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                  
                  {/* Left Column: Image Previews */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {hasImages ? (
                      <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0', aspectRatio: '4/3', backgroundColor: '#F8FAFC' }}>
                        <img 
                          src={getPublicUrl(item.item_images[0].storage_path)} 
                          alt={item.title} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      </div>
                    ) : (
                      <div style={{ aspectRatio: '4/3', backgroundColor: '#F1F5F9', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                        <ImageIcon style={{ width: '32px', height: '32px', marginBottom: '0.5rem' }} />
                        <span style={{ fontSize: '0.85rem' }}>ചിത്രം ലഭ്യമല്ല (No Image)</span>
                      </div>
                    )}

                    {/* Secondary Thumbnails */}
                    {hasImages && item.item_images.length > 1 && (
                      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                        {item.item_images.slice(1).map(img => (
                          <img 
                            key={img.id} 
                            src={getPublicUrl(img.storage_path)} 
                            alt="" 
                            style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #CBD5E1' }} 
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Item Information & Controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)' }}>{item.title}</h3>
                        <Badge 
                          status={getItemBadgeStatus(item.status)} 
                          label={getItemBadgeLabel(item.status)} 
                          dot={true} 
                        />
                      </div>

                      {/* Meta Pills */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#475569' }}>
                        <span style={{ background: 'var(--soft-blue)', color: 'var(--primary-blue)', padding: '0.25rem 0.6rem', borderRadius: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Tag style={{ width: '0.85rem', height: '0.85rem' }} /> {item.category}
                        </span>
                        <span style={{ background: '#F1F5F9', padding: '0.25rem 0.6rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Package style={{ width: '0.85rem', height: '0.85rem', color: '#64748B' }} /> അവസ്ഥ: <strong>{item.condition}</strong>
                        </span>
                        <span style={{ background: '#F1F5F9', padding: '0.25rem 0.6rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <MapPin style={{ width: '0.85rem', height: '0.85rem', color: 'var(--secondary-rose)' }} /> സ്ഥലം: <strong>{item.area}</strong>
                        </span>
                      </div>

                      {/* Description Block */}
                      <div style={{ backgroundColor: '#FAFBFC', padding: '1rem', borderRadius: '10px', border: '1px solid #EEF1F5', fontSize: '0.9rem', color: '#334155', lineHeight: '1.5', marginBottom: '1.25rem', whiteSpace: 'pre-wrap' }}>
                        {item.description}
                      </div>

                      <div style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.25rem' }}>
                        <Calendar style={{ width: '0.85rem', height: '0.85rem' }} /> സമർപ്പിച്ചത്: {new Date(item.created_at).toLocaleDateString('ml-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => setConfirmModal({ itemId: item.id, title: item.title, action: 'published' })}
                      >
                        <CheckCircle2 style={{ width: '1rem', height: '1rem', marginRight: '0.4rem' }} />
                        അംഗീകരിക്കുക & പ്രസിദ്ധീകരിക്കുക (Approve)
                      </Button>

                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => setConfirmModal({ itemId: item.id, title: item.title, action: 'removed' })}
                      >
                        <XCircle style={{ width: '1rem', height: '1rem', marginRight: '0.4rem' }} />
                        നിരസിക്കുക & നീക്കംചെയ്യുക (Reject & Remove)
                      </Button>
                    </div>
                  </div>

                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
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
              {confirmModal.action === 'published' ? 'വസ്തു പ്രസിദ്ധീകരിക്കുന്നു' : 'വസ്തു നീക്കം ചെയ്യുന്നു'}
            </h3>
            <p style={{ margin: '0 0 1.25rem 0', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              <strong>"{confirmModal.title}"</strong> എന്ന ഐറ്റം {confirmModal.action === 'published' ? 'പൊതുവായി കാണാവുന്ന രീതിയിൽ പ്രസിദ്ധീകരിക്കാൻ നിങ്ങൾക്ക് ഉറപ്പാണോ?' : 'നിരസിച്ച് നീക്കം ചെയ്യാൻ നിങ്ങൾക്ക് ഉറപ്പാണോ?'}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => setConfirmModal(null)}
                disabled={isSubmitting}
              >
                റദ്ദാക്കുക (Cancel)
              </Button>
              <Button 
                variant={confirmModal.action === 'published' ? 'primary' : 'danger'} 
                size="sm"
                onClick={handleUpdateStatus}
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

