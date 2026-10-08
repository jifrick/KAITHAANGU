import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { AdminLayout } from '../../components/common/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Input';
import type { Profile, AccountStatus } from '../../types/database';

export const AccountApprovals: React.FC = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Verification admins and Super admins can access
  const isAuthorized = profile?.role === 'admin' && 
    (profile?.admin_role === 'super_admin' || profile?.admin_role === 'verification_admin');

  useEffect(() => {
    if (!isAuthorized) return;
    loadUsers();
  }, [isAuthorized, statusFilter, roleFilter]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    let query = supabase.from('profiles').select('*').neq('role', 'admin').order('created_at', { ascending: false });
    
    if (statusFilter !== 'all') query = query.eq('account_status', statusFilter);
    if (roleFilter !== 'all') query = query.eq('role', roleFilter);

    const { data, error } = await query;

    if (error) {
      setError(error.message);
    } else if (data) {
      setUsers(data as Profile[]);
    }
    setLoading(false);
  };

  const handleStatusChange = async (userId: string, newStatus: AccountStatus) => {
    const confirmMsg = `Are you sure you want to change this user status to ${newStatus.toUpperCase()}?`;
    if (!window.confirm(confirmMsg)) return;

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

  const filteredUsers = users.filter(u => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.phone && u.phone.toLowerCase().includes(q)) ||
      (u.address && u.address.toLowerCase().includes(q))
    );
  });

  return (
    <AdminLayout
      title="User Account Approvals"
      subtitle="കൈത്താങ് പ്ലാറ്റ്‌ഫോമിൽ പുതിയതായി രജിസ്റ്റർ ചെയ്ത യൂസർമാരുടെ പ്രൊഫൈലുകളും അവസ്ഥകളും അവലോകനം ചെയ്യുക."
      actions={
        <Button size="sm" variant="outline" onClick={loadUsers} disabled={loading}>
          🔄 Refresh
        </Button>
      }
    >
      {/* Error Banner */}
      {error && (
        <Card style={{ background: 'var(--error-bg)', border: '1px solid var(--error-border)', color: 'var(--error-text)', marginBottom: 'var(--space-5)' }}>
          ⚠️ {error}
        </Card>
      )}

      {/* Filter and Search Bar */}
      <Card style={{ padding: 'var(--space-4) var(--space-5)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-6)' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
          alignItems: 'end'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: 'var(--fs-label)', fontWeight: 600, color: 'var(--ink)' }}>
              Search Users
            </label>
            <Input
              type="text"
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ padding: '8px 12px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: 'var(--fs-label)', fontWeight: 600, color: 'var(--ink)' }}>
              Account Status
            </label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'pending', label: 'Pending Approval (പരിശോധനയിൽ)' },
                { value: 'approved', label: 'Approved (അംഗീകരിച്ചത്)' },
                { value: 'suspended', label: 'Suspended (സസ്പെൻഡ് ചെയ്തത്)' },
                { value: 'rejected', label: 'Rejected (നിരസിച്ചത്)' }
              ]}
              style={{ padding: '8px 12px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: 'var(--fs-label)', fontWeight: 600, color: 'var(--ink)' }}>
              Intent (Role)
            </label>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Roles' },
                { value: 'donor', label: 'Donor (നൽകുന്നയാൾ)' },
                { value: 'recipient', label: 'Recipient (സ്വീകർത്താവ്)' },
                { value: 'both', label: 'Both (രണ്ടും)' }
              ]}
              style={{ padding: '8px 12px' }}
            />
          </div>
        </div>
      </Card>

      {/* Table / List Container */}
      {loading ? (
        <Card style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--ink-muted)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary-blue)">
              <circle cx="12" cy="12" r="10" strokeWidth="4" strokeDasharray="32" strokeDashoffset="10" />
            </svg>
            <span>യൂസർ പ്രൊഫൈലുകൾ ലോഡ് ചെയ്യുന്നു...</span>
          </div>
        </Card>
      ) : (
        <Card style={{
          boxShadow: 'var(--shadow-md)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--soft-gray)',
          overflow: 'hidden',
          padding: 0
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--fs-body-sm)' }}>
              <thead>
                <tr style={{ background: 'var(--soft-blue)', borderBottom: '1px solid var(--soft-blue-border)', color: 'var(--ink)' }}>
                  <th style={{ padding: 'var(--space-4)' }}>User Details</th>
                  <th style={{ padding: 'var(--space-4)' }}>Phone / Address</th>
                  <th style={{ padding: 'var(--space-4)' }}>Intent</th>
                  <th style={{ padding: 'var(--space-4)' }}>Joined Date</th>
                  <th style={{ padding: 'var(--space-4)' }}>Status</th>
                  <th style={{ padding: 'var(--space-4)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: 'var(--space-4)' }}>
                      <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '0.95rem' }}>{u.name || 'Anonymous User'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>ID: {u.id.substring(0, 8)}...</div>
                    </td>

                    <td style={{ padding: 'var(--space-4)', color: 'var(--ink-secondary)' }}>
                      <div>📞 {u.phone || 'N/A'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: '2px', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        📍 {u.address || 'Location not specified'}
                      </div>
                    </td>

                    <td style={{ padding: 'var(--space-4)' }}>
                      <Badge 
                        status={u.role === 'donor' ? 'info' : u.role === 'recipient' ? 'rose' : 'pending'} 
                        label={u.role.toUpperCase()} 
                      />
                    </td>

                    <td style={{ padding: 'var(--space-4)', color: 'var(--ink-muted)' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>

                    <td style={{ padding: 'var(--space-4)' }}>
                      <Badge status={u.account_status} label={u.account_status.toUpperCase()} />
                    </td>

                    <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'flex-end' }}>
                        {u.account_status === 'pending' && (
                          <>
                            <Button size="sm" variant="primary" onClick={() => handleStatusChange(u.id, 'approved')}>
                              Approve
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => handleStatusChange(u.id, 'rejected')}>
                              Reject
                            </Button>
                          </>
                        )}
                        {u.account_status === 'approved' && (
                          <Button size="sm" variant="outline" onClick={() => handleStatusChange(u.id, 'suspended')} style={{ color: 'var(--warning-main)', borderColor: 'var(--warning-border)' }}>
                            Suspend
                          </Button>
                        )}
                        {(u.account_status === 'suspended' || u.account_status === 'rejected') && (
                          <Button size="sm" variant="primary" onClick={() => handleStatusChange(u.id, 'approved')}>
                            Re-Approve
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--ink-muted)' }}>
                      നിർദ്ദേശിച്ച വ്യവസ്ഥകൾക്കനുസരിച്ചുള്ള യൂസർമാർ ആരുമില്ല. (No users found)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </AdminLayout>
  );
};

