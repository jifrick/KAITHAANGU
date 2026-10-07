import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Item, ItemImage, Profile } from '../types/database';

type ItemDetail = Item & { 
  item_images: ItemImage[];
  donor: Profile;
};

export const ItemView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { profile, user } = useAuth();
  
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isRecipientApproved, setIsRecipientApproved] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  
  const [requestReason, setRequestReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Reporting
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  useEffect(() => {
    fetchItemDetails();
    if (user && profile?.role === 'recipient') {
      checkRecipientStatus();
    }
  }, [id, user, profile]);

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          item_images (*),
          donor:profiles!items_donor_id_fkey (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setItem(data as any);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkRecipientStatus = async () => {
    try {
      // Check if recipient is approved
      const { data: verification } = await supabase
        .from('recipient_verifications')
        .select('status')
        .eq('user_id', user!.id)
        .single();
        
      if (verification?.status === 'approved') {
        setIsRecipientApproved(true);
      }

      // Check if already requested
      const { data: existingRequest } = await supabase
        .from('item_requests')
        .select('id')
        .eq('item_id', id)
        .eq('recipient_id', user!.id)
        .single();
        
      if (existingRequest) {
        setHasRequested(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestReason || requestReason.length < 10) {
      alert('Please provide a valid reason (minimum 10 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('item_requests')
        .insert({
          item_id: item!.id,
          recipient_id: user!.id,
          reason: requestReason,
          status: 'pending'
        });

      if (error) throw error;
      setHasRequested(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason) return;
    
    setReportSubmitting(true);
    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user?.id || null, // allow anonymous if needed, or enforce user
          target_type: 'item',
          target_id: item!.id,
          reason: reportReason,
          status: 'open'
        });

      if (error) throw error;
      alert('Report submitted successfully. Our team will review it.');
      setShowReportModal(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setReportSubmitting(false);
    }
  };

  const getPublicUrl = (path: string) => {
    return supabase.storage.from('items').getPublicUrl(path).data.publicUrl;
  };

  if (loading) return <div className="loader-container">Loading item details...</div>;
  if (error || !item) return <div className="page-container"><div className="card">Item not found.</div></div>;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        
        {/* Images Column */}
        <div style={{ flex: '1', minWidth: '300px' }}>
          {item.item_images && item.item_images.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <img 
                src={getPublicUrl(item.item_images[0].storage_path)} 
                alt={item.title} 
                style={{ width: '100%', borderRadius: '12px', objectFit: 'cover' }} 
              />
              <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
                {item.item_images.slice(1).map(img => (
                  <img 
                    key={img.id} 
                    src={getPublicUrl(img.storage_path)} 
                    alt="" 
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} 
                  />
                ))}
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', aspectRatio: '1', backgroundColor: 'var(--soft-gray)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              No Images
            </div>
          )}
        </div>

        {/* Details Column */}
        <div style={{ flex: '1.5', minWidth: '300px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{item.title}</h1>
            <button 
              onClick={() => setShowReportModal(true)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.9rem' }}
            >
              Report Item
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <span style={{ backgroundColor: 'var(--soft-blue)', color: 'var(--primary-blue)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: '600' }}>
              {item.category}
            </span>
            <span style={{ backgroundColor: 'var(--soft-gray)', color: 'var(--ink)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: '600' }}>
              Condition: {item.condition}
            </span>
            <span style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: '600' }}>
              FREE
            </span>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--soft-gray)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Description</h3>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#4b5563' }}>
              {item.description}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem', background: 'var(--cloud-white)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--soft-gray)' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Given by</p>
              <p style={{ fontWeight: '600', margin: 0 }}>{item.donor?.name || 'Community Donor'}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Approximate Location</p>
              <p style={{ fontWeight: '600', margin: 0 }}>📍 {item.area}</p>
            </div>
          </div>

          {/* Action Box */}
          <div className="card" style={{ border: '2px solid var(--soft-blue)' }}>
            {item.status !== 'published' ? (
              <p style={{ margin: 0, textAlign: 'center', color: 'var(--text-muted)' }}>This item is no longer available.</p>
            ) : !user ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ marginBottom: '1rem' }}>You must be signed in as an approved recipient to request items.</p>
                <Link to="/login" className="btn btn-primary">Sign in to Request</Link>
              </div>
            ) : profile?.role === 'donor' ? (
              <p style={{ margin: 0, textAlign: 'center', color: 'var(--text-muted)' }}>You are logged in as a Donor. Only Recipients can request items.</p>
            ) : profile?.role === 'admin' ? (
              <p style={{ margin: 0, textAlign: 'center', color: 'var(--text-muted)' }}>You are logged in as an Admin. Admins cannot request items.</p>
            ) : hasRequested ? (
              <div style={{ textAlign: 'center', color: '#059669', fontWeight: '600' }}>
                ✓ You have successfully requested this item. An admin will review your request.
              </div>
            ) : !isRecipientApproved ? (
              <div style={{ textAlign: 'center', color: '#b45309', fontWeight: '600' }}>
                Your account is pending verification. You can request items once approved by an admin.
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit}>
                <h3 style={{ marginTop: 0 }}>Request this Item</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Please explain briefly why you need this item. This will be reviewed by matching admins to ensure fairness.</p>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <textarea 
                    value={requestReason} 
                    onChange={e => setRequestReason(e.target.value)} 
                    placeholder="E.g., I recently moved and need a study table for my daughter."
                    required 
                    minLength={10}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
            <h3 style={{ marginTop: 0 }}>Report this Item</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Help us keep KAITHAANGU safe and free.</p>
            <form onSubmit={handleReportSubmit}>
              <div className="form-group">
                <label>Reason for reporting</label>
                <select required value={reportReason} onChange={e => setReportReason(e.target.value)}>
                  <option value="" disabled>Select a reason...</option>
                  <option value="Asking for money">Asking for money (Not Free)</option>
                  <option value="Fake item">Fake item</option>
                  <option value="Misleading description">Misleading description</option>
                  <option value="Fraud">Fraud</option>
                  <option value="Spam">Spam</option>
                  <option value="Harassment">Harassment</option>
                  <option value="Suspicious account">Suspicious account</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowReportModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-danger" style={{ flex: 1 }} disabled={reportSubmitting}>
                  {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
