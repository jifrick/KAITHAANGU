import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { AdminLayout } from '../../components/common/AdminLayout';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { ShieldCheck, Search, User } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');

  const isSuperAdmin = profile?.role === 'admin' && profile?.admin_role === 'super_admin';

  useEffect(() => {
    if (!isSuperAdmin) return;
    loadLogs();
  }, [isSuperAdmin]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchErr } = await supabase
        .from('audit_logs')
        .select('*, profiles:admin_id(name)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchErr) throw fetchErr;
      setLogs((data as AuditLog[]) || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'ഓഡിറ്റ് ലോഗുകൾ ശേഖരിക്കുന്നതിൽ പിശക്.');
    } finally {
      setLoading(false);
    }
  };

  if (!isSuperAdmin) return <Navigate to="/admin" replace />;

  const filteredLogs = logs.filter(log => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.profiles?.name?.toLowerCase().includes(q) ||
      log.target_type.toLowerCase().includes(q) ||
      log.target_id?.toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout 
      title="സിസ്റ്റം ഓഡിറ്റ് ലോഗുകൾ" 
      subtitle="System Audit Logs — Immutable record of critical administrative actions"
    >
      {/* Search Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ minWidth: '280px', position: 'relative', width: '100%', maxWidth: '400px' }}>
          <Input 
            placeholder="Action, Admin name, Target ID വഴി തിരയുക..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.5rem' }}
          />
          <Search style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', width: '1.1rem', height: '1.1rem', color: '#94A3B8' }} />
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          ആകെ ലോഗുകൾ: <strong>{filteredLogs.length}</strong>
        </div>
      </div>

      {error && (
        <div style={{ background: 'var(--soft-rose)', color: 'var(--danger)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <Card style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          ഓഡിറ്റ് ലോഗുകൾ ലോഡ് ചെയ്യുന്നു...
        </Card>
      ) : filteredLogs.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <ShieldCheck style={{ width: '40px', height: '40px', color: '#94A3B8', margin: '0 auto 1rem' }} />
          <h3 style={{ color: 'var(--ink)', margin: '0 0 0.5rem 0' }}>ഓഡിറ്റ് ലോഗുകൾ ഒന്നുമില്ല</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
            അഡ്മിനിസ്ട്രേറ്റീവ് പ്രവർത്തനങ്ങളുടെ ചരിത്രം ഇവിടെ രേഖപ്പെടുത്തപ്പെടും.
          </p>
        </Card>
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--soft-gray)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: 'var(--ink)' }}>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>തീയതി / സമയം</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>അഡ്മിൻ (Admin)</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>പ്രവർത്തനം (Action)</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Target Type</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Target ID</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>വിശദാംശങ്ങൾ (Metadata)</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.15s ease' }}>
                    <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {new Date(log.created_at).toLocaleString('ml-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--ink)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <User style={{ width: '0.85rem', height: '0.85rem', color: 'var(--primary-blue)' }} />
                        {log.profiles?.name || log.admin_id}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ 
                        background: 'var(--soft-blue)', 
                        color: 'var(--primary-blue)', 
                        padding: '0.2rem 0.55rem', 
                        borderRadius: '6px', 
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        fontFamily: 'monospace'
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textTransform: 'capitalize', color: '#475569' }}>
                      {log.target_type}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontSize: '0.78rem', color: '#64748B' }}>
                      {log.target_id || 'N/A'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {log.metadata ? (
                        <pre style={{ margin: 0, fontSize: '0.75rem', background: '#F1F5F9', padding: '0.4rem 0.6rem', borderRadius: '6px', color: '#334155', maxWidth: '240px', overflowX: 'auto' }}>
                          {JSON.stringify(log.metadata)}
                        </pre>
                      ) : (
                        <span style={{ color: '#CBD5E1', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </AdminLayout>
  );
};

