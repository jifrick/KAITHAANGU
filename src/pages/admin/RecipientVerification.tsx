import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Profile, RecipientVerification as VerificationType } from '../../types/database';

type VerificationWithProfile = VerificationType & { 
  profile: Profile;
};

export const RecipientVerification: React.FC = () => {
  const { profile } = useAuth();
  const [verifications, setVerifications] = useState<VerificationWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if authorized
  const isVerificationAdmin = profile?.role === 'admin' && 
    ['super_admin', 'verification_admin'].includes(profile.admin_role || '');

  if (!isVerificationAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const fetchPendingVerifications = async () => {
    try {
      setLoading(true);
      // We need to join recipient_verifications with profiles
      const { data, error } = await supabase
        .from('recipient_verifications')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('status', 'pending')
        .order('submitted_at', { ascending: true });

      if (error) throw error;
      setVerifications(data as any);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    const notes = window.prompt(`Enter optional admin notes for marking as ${newStatus.toUpperCase()}:`);
    
    if (notes === null) return; // Cancelled

    try {
      const { error } = await supabase
        .from('recipient_verifications')
        .update({ 
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          admin_notes: notes || null
        })
        .eq('user_id', userId);

      if (error) throw error;
      
      // Update local state
      setVerifications(verifications.filter(v => v.user_id !== userId));

      // Audit Logging
      await supabase.from('audit_logs').insert({
        admin_id: profile!.id,
        action: `updated_verification_status_to_${newStatus}`,
        target_type: 'user',
        target_id: userId,
        metadata: { notes }
      });

    } catch (err: any) {
      alert('Failed to update verification: ' + err.message);
    }
  };

  if (loading) return <div className="loader-container">Loading pending verifications...</div>;

  return (
    <div className="page-container">
      <h2>Recipient Verification Dashboard</h2>
      <p className="subtitle">Review recipient applications to verify genuine need.</p>
      
      {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}

      {verifications.length === 0 ? (
        <div className="card">
          <p>No recipients pending verification.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {verifications.map(v => (
            <div key={v.user_id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {v.profile.name} 
                    <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', background: 'var(--soft-blue)', color: 'var(--primary-blue)', borderRadius: '12px' }}>
                      Pending
                    </span>
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    Submitted: {new Date(v.submitted_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Contact Information</strong>
                  <div style={{ background: 'var(--cloud-white)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--soft-gray)' }}>
                    <div><strong>Phone:</strong> {v.profile.phone}</div>
                    <div style={{ marginTop: '0.5rem' }}><strong>Address:</strong><br/>{v.profile.address}</div>
                  </div>
                </div>

                <div>
                  <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Reason for Assistance</strong>
                  <div style={{ background: 'var(--soft-rose)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--soft-gray)', height: '100%' }}>
                    {v.applicant_reason || <em style={{color: 'var(--text-muted)'}}>No reason provided (legacy entry)</em>}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--soft-gray)', paddingTop: '1.5rem' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                  onClick={() => handleUpdateStatus(v.user_id, 'approved')}
                >
                  Approve
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: 1, borderColor: '#f59e0b', color: '#b45309' }}
                  onClick={() => handleUpdateStatus(v.user_id, 'more_info_needed')}
                >
                  Request More Info
                </button>
                <button 
                  className="btn btn-danger" 
                  style={{ flex: 1 }}
                  onClick={() => {
                    if (window.confirm('Are you sure you want to reject this applicant?')) {
                      handleUpdateStatus(v.user_id, 'rejected');
                    }
                  }}
                >
                  Reject
                </button>
                <button 
                  className="btn btn-danger" 
                  style={{ flex: 1, backgroundColor: '#b91c1c' }}
                  onClick={() => {
                    if (window.confirm('Are you sure you want to SUSPEND this user? This is a severe action.')) {
                      handleUpdateStatus(v.user_id, 'suspended');
                    }
                  }}
                >
                  Suspend User
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
