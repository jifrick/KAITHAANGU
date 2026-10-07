import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';

export const ReportsDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isSupportModerator = profile?.role === 'admin' && 
    ['super_admin', 'support_moderator', 'content_admin'].includes(profile.admin_role || '');

  if (!isSupportModerator) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:profiles!reports_reporter_id_fkey(name, phone)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (reportId: string, action: string) => {
    try {
      // 1. Update report status
      await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId);
      
      // 2. Audit log
      await supabase.from('audit_logs').insert({
        admin_id: profile!.id,
        action: `resolved_report_${action}`,
        target_type: 'report',
        target_id: reportId
      });

      setReports(reports.filter(r => r.id !== reportId));
    } catch (err: any) {
      alert('Failed to resolve report: ' + err.message);
    }
  };

  const handleRemoveItem = async (reportId: string, itemId: string) => {
    if (!window.confirm('Are you sure you want to completely remove this item?')) return;
    try {
      await supabase.from('items').update({ status: 'removed' }).eq('id', itemId);
      await handleResolve(reportId, 'item_removed');
      alert('Item has been removed and report resolved.');
    } catch (err: any) {
      alert('Failed to remove item: ' + err.message);
    }
  };

  if (loading) return <div className="loader-container">Loading reports...</div>;

  return (
    <div className="page-container">
      <h2>Reports Dashboard</h2>
      <p className="subtitle">Review community reports of abuse, fraud, or policy violations.</p>
      
      {reports.length === 0 ? (
        <div className="card">No open reports.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reports.map(report => (
            <div key={report.id} className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--danger)' }}>{report.reason}</h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Reported on {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>
                {report.target_type === 'item' && (
                  <Link to={`/item/${report.target_id}`} target="_blank" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                    View Item
                  </Link>
                )}
              </div>
              
              <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--soft-gray)', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}><strong>Target Type:</strong> {report.target_type}</p>
                <p style={{ margin: '0 0 0.5rem 0' }}><strong>Target ID:</strong> {report.target_id}</p>
                <p style={{ margin: 0 }}><strong>Reporter:</strong> {report.reporter?.name || 'Anonymous'}</p>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                {report.target_type === 'item' && (
                  <button className="btn btn-danger" onClick={() => handleRemoveItem(report.id, report.target_id)}>
                    Remove Item
                  </button>
                )}
                <button className="btn btn-secondary" onClick={() => handleResolve(report.id, 'dismissed')}>
                  Dismiss (No Action)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
