import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import type { Profile, AccountStatus } from '../../types/database';

export const AccountApprovals: React.FC = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Verification admins and Super admins can access
  const isAuthorized = profile?.role === 'admin' && 
    (profile?.admin_role === 'super_admin' || profile?.admin_role === 'verification_admin');

  useEffect(() => {
    if (!isAuthorized) return;
    loadUsers();
  }, [isAuthorized]);

  const loadUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('role', 'admin')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data as Profile[]);
    }
    setLoading(false);
  };

  const handleStatusChange = async (userId: string, newStatus: AccountStatus) => {
    const { error } = await supabase
      .from('profiles')
      .update({ account_status: newStatus })
      .eq('id', userId);

    if (!error) {
      // Create Audit Log
      await supabase.from('audit_logs').insert({
        admin_id: profile!.id,
        action: `account_${newStatus}`,
        target_type: 'user',
        target_id: userId,
        metadata: { previous_status: users.find(u => u.id === userId)?.account_status }
      });
      loadUsers();
    } else {
      alert('Failed to update status: ' + error.message);
    }
  };

  if (!isAuthorized) return <Navigate to="/dashboard" replace />;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Account Approvals</h1>
      </div>
      
      {loading ? (
        <div className="loader-container">Loading accounts...</div>
      ) : (
        <div className="dashboard-card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem' }}>Name</th>
                <th style={{ padding: '1rem' }}>Phone</th>
                <th style={{ padding: '1rem' }}>Intent (Role)</th>
                <th style={{ padding: '1rem' }}>Joined</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>{u.name || 'Anonymous'}</td>
                  <td style={{ padding: '1rem' }}>{u.phone || 'N/A'}</td>
                  <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{u.role}</td>
                  <td style={{ padding: '1rem' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      fontSize: '0.85rem',
                      backgroundColor: 
                        u.account_status === 'approved' ? '#d1fae5' : 
                        u.account_status === 'pending' ? '#fef3c7' : 
                        u.account_status === 'rejected' ? '#fee2e2' : '#f3f4f6',
                      color: 
                        u.account_status === 'approved' ? '#065f46' : 
                        u.account_status === 'pending' ? '#92400e' : 
                        u.account_status === 'rejected' ? '#991b1b' : '#374151'
                    }}>
                      {u.account_status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                    {u.account_status === 'pending' && (
                      <>
                        <button onClick={() => handleStatusChange(u.id, 'approved')} className="btn" style={{ backgroundColor: '#10b981', color: 'white', padding: '0.3rem 0.6rem', fontSize: '0.9rem' }}>Approve</button>
                        <button onClick={() => handleStatusChange(u.id, 'rejected')} className="btn" style={{ backgroundColor: 'var(--danger)', color: 'white', padding: '0.3rem 0.6rem', fontSize: '0.9rem' }}>Reject</button>
                      </>
                    )}
                    {u.account_status === 'approved' && (
                      <button onClick={() => handleStatusChange(u.id, 'suspended')} className="btn" style={{ backgroundColor: '#f59e0b', color: 'white', padding: '0.3rem 0.6rem', fontSize: '0.9rem' }}>Suspend</button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
