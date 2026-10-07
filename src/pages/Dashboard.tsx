import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const Dashboard: React.FC = () => {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'items' | 'requests' | 'matches'>('matches');
  
  const [items, setItems] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  if (!profile) return <Navigate to="/complete-profile" replace />;
  if (!profile.profile_completed) return <Navigate to="/complete-profile" replace />;

  useEffect(() => {
    fetchDashboardData();
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      if (profile.role === 'donor') {
        const { data: myItems } = await supabase.from('items').select('*').eq('donor_id', profile.id).order('created_at', { ascending: false });
        if (myItems) setItems(myItems);
        
        const { data: myMatches } = await supabase.from('matches').select('*, item:items(*), recipient:profiles!matches_recipient_id_fkey(*)').eq('donor_id', profile.id);
        if (myMatches) setMatches(myMatches);
      } 
      else if (profile.role === 'recipient') {
        const { data: myRequests } = await supabase.from('item_requests').select('*, item:items(*)').eq('recipient_id', profile.id).order('created_at', { ascending: false });
        if (myRequests) setRequests(myRequests);
        
        const { data: myMatches } = await supabase.from('matches').select('*, item:items(*), donor:profiles!matches_donor_id_fkey(*)').eq('recipient_id', profile.id);
        if (myMatches) setMatches(myMatches);
      }
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMatchStatus = async (matchId: string, newStatus: string, itemId: string) => {
    try {
      await supabase.from('matches').update({ status: newStatus }).eq('id', matchId);
      if (newStatus === 'completed') {
        await supabase.from('items').update({ status: 'completed' }).eq('id', itemId);
      }
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>Welcome, {profile.name}</h2>
          <p style={{ color: 'var(--text-muted)' }}>Role: <strong style={{ textTransform: 'capitalize' }}>{profile.role}</strong></p>
        </div>
        <button className="btn btn-secondary" onClick={signOut}>Sign Out</button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--soft-gray)' }}>
        <button 
          onClick={() => setActiveTab('matches')} 
          style={{ background: 'none', border: 'none', padding: '1rem', cursor: 'pointer', fontWeight: 'bold', color: activeTab === 'matches' ? 'var(--primary-blue)' : 'var(--text-muted)', borderBottom: activeTab === 'matches' ? '2px solid var(--primary-blue)' : 'none' }}
        >
          My Matches
        </button>
        {profile.role === 'donor' && (
          <button 
            onClick={() => setActiveTab('items')} 
            style={{ background: 'none', border: 'none', padding: '1rem', cursor: 'pointer', fontWeight: 'bold', color: activeTab === 'items' ? 'var(--primary-blue)' : 'var(--text-muted)', borderBottom: activeTab === 'items' ? '2px solid var(--primary-blue)' : 'none' }}
          >
            My Listed Items
          </button>
        )}
        {profile.role === 'recipient' && (
          <button 
            onClick={() => setActiveTab('requests')} 
            style={{ background: 'none', border: 'none', padding: '1rem', cursor: 'pointer', fontWeight: 'bold', color: activeTab === 'requests' ? 'var(--primary-blue)' : 'var(--text-muted)', borderBottom: activeTab === 'requests' ? '2px solid var(--primary-blue)' : 'none' }}
          >
            My Requests
          </button>
        )}
      </div>

      {loading ? (
        <div className="loader-container">Loading...</div>
      ) : (
        <div>
          {/* Matches Tab */}
          {activeTab === 'matches' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {matches.length === 0 ? (
                <div className="card"><p>You don't have any active matches yet.</p></div>
              ) : (
                matches.map(m => (
                  <div key={m.id} className="card" style={{ border: '2px solid var(--soft-blue)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ margin: '0 0 0.5rem 0' }}>{m.item.title}</h3>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: m.status === 'completed' ? '#ecfdf5' : 'var(--soft-blue)', color: m.status === 'completed' ? '#059669' : 'var(--primary-blue)' }}>
                        {m.status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ background: 'var(--cloud-white)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--soft-gray)', marginTop: '1rem' }}>
                      <h4 style={{ margin: '0 0 0.5rem 0' }}>Connection Details</h4>
                      {profile.role === 'donor' ? (
                        <>
                          <p><strong>Recipient Name:</strong> {m.recipient.name}</p>
                          <p><strong>Phone:</strong> {m.recipient.phone}</p>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Please contact the recipient to arrange the handover.</p>
                          
                          {m.status !== 'completed' && (
                            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                              <button className="btn btn-primary" onClick={() => handleUpdateMatchStatus(m.id, 'handed_over', m.item.id)}>Mark as Handed Over</button>
                              <button className="btn btn-secondary" onClick={() => handleUpdateMatchStatus(m.id, 'completed', m.item.id)}>Complete Match</button>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <p><strong>Donor Name:</strong> {m.donor.name}</p>
                          <p><strong>Phone:</strong> {m.donor.phone}</p>
                          <p><strong>Address/Location:</strong> {m.donor.address}</p>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Please contact the donor to collect the item. Thank them for their generosity!</p>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Donor Items Tab */}
          {activeTab === 'items' && profile.role === 'donor' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {items.length === 0 ? (
                <div className="card"><p>You haven't listed any items yet.</p> <Link to="/create-item" className="btn btn-primary" style={{ marginTop: '1rem' }}>Give an Item</Link></div>
              ) : (
                items.map(item => (
                  <div key={item.id} className="card">
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{item.title}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>Status: <strong>{item.status}</strong></p>
                    <Link to={`/item/${item.id}`} className="btn btn-secondary" style={{ width: '100%' }}>View Listing</Link>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Recipient Requests Tab */}
          {activeTab === 'requests' && profile.role === 'recipient' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {requests.length === 0 ? (
                <div className="card"><p>You haven't requested any items yet.</p> <Link to="/items" className="btn btn-primary" style={{ marginTop: '1rem' }}>Browse Items</Link></div>
              ) : (
                requests.map(req => (
                  <div key={req.id} className="card">
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{req.item.title}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>Status: <strong>{req.status}</strong></p>
                    <Link to={`/item/${req.item.id}`} className="btn btn-secondary" style={{ width: '100%' }}>View Listing</Link>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
