import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
// removed unused import

export const MatchingDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [itemsWithRequests, setItemsWithRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [itemRequests, setItemRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Check if authorized
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
      // Fetch published items that have pending requests
      // Due to supabase RPC limits without custom views, we'll do this in two steps or a join
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          item_images (*),
          item_requests (id, status)
        `)
        .eq('status', 'published');

      if (error) throw error;
      
      // Filter items that have at least one pending request
      const filtered = data.filter(item => 
        item.item_requests && item.item_requests.some((r: any) => r.status === 'pending')
      );
      
      setItemsWithRequests(filtered);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequestsForItem = async (itemId: string) => {
    try {
      setSelectedItemId(itemId);
      setRequestsLoading(true);
      
      const { data, error } = await supabase
        .from('item_requests')
        .select(`
          *,
          recipient:profiles!item_requests_recipient_id_fkey (*),
          verification:recipient_verifications!item_requests_recipient_id_fkey (*)
        `)
        .eq('item_id', itemId)
        .eq('status', 'pending');

      if (error) throw error;
      setItemRequests(data);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleCreateMatch = async (requestId: string, recipientId: string, itemId: string, donorId: string) => {
    if (!window.confirm('Are you sure you want to match this recipient to the item? Other requests will be rejected.')) return;

    try {
      // 1. Create the Match record
      const { error: matchError } = await supabase
        .from('matches')
        .insert({
          item_id: itemId,
          donor_id: donorId,
          recipient_id: recipientId,
          status: 'pending_consent' // Or 'confirmed' depending on whether we need donor confirmation
        });
        
      if (matchError) throw matchError;

      // 2. Update Item Status
      await supabase.from('items').update({ status: 'matched' }).eq('id', itemId);

      // 3. Update Request Statuses
      // Approve the selected one
      await supabase.from('item_requests').update({ status: 'approved' }).eq('id', requestId);
      
      // Reject others
      await supabase.from('item_requests')
        .update({ status: 'rejected' })
        .eq('item_id', itemId)
        .neq('id', requestId);

      alert('Match created successfully! The donor and recipient can now see limited contact details.');
      
      // Refresh list
      setSelectedItemId(null);
      fetchItemsWithRequests();
      
    } catch (err: any) {
      alert('Failed to create match: ' + err.message);
    }
  };

  if (loading) return <div className="loader-container">Loading requests...</div>;

  return (
    <div className="page-container">
      <h2>Matching Dashboard</h2>
      <p className="subtitle">Review item requests and manually match the most suitable recipient.</p>
      
      {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        
        {/* Left Column: Items with pending requests */}
        <div style={{ flex: '1', minWidth: '300px' }}>
          <h3>Items Needing Matches ({itemsWithRequests.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {itemsWithRequests.length === 0 ? (
              <div className="card"><p>No items have pending requests.</p></div>
            ) : (
              itemsWithRequests.map(item => {
                const pendingCount = item.item_requests.filter((r: any) => r.status === 'pending').length;
                return (
                  <div 
                    key={item.id} 
                    className="card" 
                    style={{ 
                      cursor: 'pointer', 
                      border: selectedItemId === item.id ? '2px solid var(--primary-blue)' : '1px solid var(--soft-gray)',
                      padding: '1rem'
                    }}
                    onClick={() => fetchRequestsForItem(item.id)}
                  >
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{item.title}</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>📍 {item.area}</span>
                      <span style={{ backgroundColor: 'var(--soft-blue)', color: 'var(--primary-blue)', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        {pendingCount} Request{pendingCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Applicants for selected item */}
        <div style={{ flex: '1.5', minWidth: '400px' }}>
          <h3>Applicant Review</h3>
          
          {!selectedItemId ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              Select an item from the left to review applicants.
            </div>
          ) : requestsLoading ? (
            <div className="card" style={{ textAlign: 'center' }}>Loading applicants...</div>
          ) : itemRequests.length === 0 ? (
            <div className="card" style={{ textAlign: 'center' }}>No pending applicants found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {itemRequests.map(req => (
                <div key={req.id} className="card" style={{ border: '1px solid var(--soft-gray)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0' }}>{req.recipient.name}</h4>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Requested: {new Date(req.created_at).toLocaleDateString()}</p>
                    </div>
                    <button 
                      className="btn btn-primary"
                      onClick={() => {
                        const item = itemsWithRequests.find(i => i.id === selectedItemId);
                        handleCreateMatch(req.id, req.recipient_id, selectedItemId, item.donor_id);
                      }}
                    >
                      Create Match
                    </button>
                  </div>
                  
                  <div style={{ background: 'var(--soft-rose)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                    <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Reason for Request:</strong>
                    <p style={{ margin: 0, fontSize: '0.95rem' }}>{req.reason}</p>
                  </div>

                  <div style={{ background: 'var(--soft-gray)', padding: '1rem', borderRadius: '8px' }}>
                    <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Admin Verification Context (Private):</strong>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#4b5563' }}>
                      <em>Original Verification Reason:</em> {req.verification?.applicant_reason || 'N/A'}<br/><br/>
                      <em>Admin Notes:</em> {req.verification?.admin_notes || 'None'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
