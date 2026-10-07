import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';

interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  metadata: any;
  created_at: string;
  profiles: {
    name: string;
  };
}

export const AuditLogs: React.FC = () => {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSuperAdmin = profile?.role === 'admin' && profile?.admin_role === 'super_admin';

  useEffect(() => {
    if (!isSuperAdmin) return;
    loadLogs();
  }, [isSuperAdmin]);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, profiles:admin_id(name)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      setError(error.message);
    } else if (data) {
      setLogs(data as AuditLog[]);
    }
    setLoading(false);
  };

  if (!isSuperAdmin) return <Navigate to="/admin" replace />;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>System Audit Logs</h1>
        <p style={{ color: 'var(--text-muted)' }}>Immutable record of critical administrative actions.</p>
      </div>

      {error && <div style={{ padding: '1rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

      {loading ? (
        <div className="loader-container">Loading audit logs...</div>
      ) : (
        <div className="dashboard-card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-light)' }}>
                <th style={{ padding: '1rem' }}>Timestamp</th>
                <th style={{ padding: '1rem' }}>Admin</th>
                <th style={{ padding: '1rem' }}>Action</th>
                <th style={{ padding: '1rem' }}>Target Type</th>
                <th style={{ padding: '1rem' }}>Target ID</th>
                <th style={{ padding: '1rem' }}>Metadata</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>{new Date(log.created_at).toLocaleString()}</td>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{log.profiles?.name || log.admin_id}</td>
                  <td style={{ padding: '1rem', color: 'var(--primary-blue)', fontWeight: 'bold' }}>{log.action.toUpperCase()}</td>
                  <td style={{ padding: '1rem' }}>{log.target_type}</td>
                  <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>{log.target_id || 'N/A'}</td>
                  <td style={{ padding: '1rem' }}>
                    <pre style={{ margin: 0, fontSize: '0.75rem', background: '#f3f4f6', padding: '0.5rem', borderRadius: '4px' }}>
                      {log.metadata ? JSON.stringify(log.metadata, null, 2) : '{}'}
                    </pre>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No audit logs found.
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
