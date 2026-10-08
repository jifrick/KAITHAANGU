import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export const Dashboard: React.FC = () => {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'matches' | 'items' | 'requests'>('matches');
  
  const [items, setItems] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!profile) return <Navigate to="/complete-profile" replace />;
  if (!profile.profile_completed) return <Navigate to="/complete-profile" replace />;

  useEffect(() => {
    fetchDashboardData();
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const role = profile.role;

      // 1. Fetch Items for Donor or Both
      if (role === 'donor' || role === 'both') {
        const { data: myItems, error: itemsError } = await supabase
          .from('items')
          .select('*, item_images(*)')
          .eq('donor_id', profile.id)
          .order('created_at', { ascending: false });

        if (itemsError) throw itemsError;
        if (myItems) setItems(myItems);
      } 

      // 2. Fetch Requests for Recipient or Both
      if (role === 'recipient' || role === 'both') {
        const { data: myRequests, error: reqError } = await supabase
          .from('item_requests')
          .select('*, item:items(*, item_images(*))')
          .eq('recipient_id', profile.id)
          .order('created_at', { ascending: false });

        if (reqError) throw reqError;
        if (myRequests) setRequests(myRequests);
      }

      // 3. Fetch Matches
      if (role === 'donor') {
        const { data: myMatches, error: matchError } = await supabase
          .from('matches')
          .select('*, item:items(*, item_images(*)), recipient:profiles!matches_recipient_id_fkey(*)')
          .eq('donor_id', profile.id)
          .order('created_at', { ascending: false });

        if (matchError) throw matchError;
        if (myMatches) setMatches(myMatches);
      } else if (role === 'recipient') {
        const { data: myMatches, error: matchError } = await supabase
          .from('matches')
          .select('*, item:items(*, item_images(*)), donor:profiles!matches_donor_id_fkey(*)')
          .eq('recipient_id', profile.id)
          .order('created_at', { ascending: false });

        if (matchError) throw matchError;
        if (myMatches) setMatches(myMatches);
      } else if (role === 'both') {
        const { data: donorMatches } = await supabase
          .from('matches')
          .select('*, item:items(*, item_images(*)), recipient:profiles!matches_recipient_id_fkey(*)')
          .eq('donor_id', profile.id);

        const { data: recipMatches } = await supabase
          .from('matches')
          .select('*, item:items(*, item_images(*)), donor:profiles!matches_donor_id_fkey(*)')
          .eq('recipient_id', profile.id);

        const combined = [...(donorMatches || []), ...(recipMatches || [])];
        setMatches(combined);
      }
      
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError('Dashboard വിവരങ്ങൾ ഇപ്പോൾ ലോഡ് ചെയ്യാൻ കഴിഞ്ഞില്ല.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMatchStatus = async (matchId: string, newStatus: string, itemId: string) => {
    try {
      const { error: updateErr } = await supabase.from('matches').update({ status: newStatus }).eq('id', matchId);
      if (updateErr) throw updateErr;

      if (newStatus === 'completed') {
        await supabase.from('items').update({ status: 'completed' }).eq('id', itemId);
      }
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Match status update failed.');
    }
  };

  const isDonor = profile.role === 'donor' || profile.role === 'both';
  const isRecipient = profile.role === 'recipient' || profile.role === 'both';
  const completedMatchesCount = matches.filter(m => m.status === 'completed').length;

  const getItemImage = (item: any) => {
    if (item?.item_images && item.item_images.length > 0) {
      const path = item.item_images[0].storage_path;
      if (path.startsWith('http')) return path;
      return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/item-images/${path}`;
    }
    return null;
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 120px)',
      background: 'var(--cloud-white)',
      padding: 'var(--space-8) var(--space-4)',
      fontFamily: 'var(--font-family)'
    }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>

        {/* 1. Header & Greeting */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)'
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              marginBottom: '4px'
            }}>
              <h1 style={{
                fontSize: 'clamp(1.5rem, 3vw, 2.1rem)',
                fontWeight: 800,
                color: 'var(--ink)',
                fontFamily: 'var(--font-malayalam)',
                margin: 0
              }}>
                നമസ്കാരം, {profile.name || 'അംഗമേ'} 👋
              </h1>
              <Badge status="approved" label="✓ Approved User" />
            </div>

            <p style={{
              fontSize: 'var(--fs-body)',
              color: 'var(--ink-secondary)',
              fontFamily: 'var(--font-malayalam)',
              margin: 0
            }}>
              കൈത്താങ്ങിലേക്ക് സ്വാഗതം. നിങ്ങളുടെ കമ്മ്യൂണിറ്റി പ്രവർത്തനങ്ങൾ താഴെ കാണാം.
            </p>
          </div>

          <Button variant="ghost" size="sm" onClick={signOut} style={{ color: 'var(--ink-muted)' }}>
            Sign Out
          </Button>
        </div>

        {/* 2. Contextual Next Step / Quick Actions Banner */}
        <Card style={{
          background: 'var(--soft-blue)',
          border: '1px solid var(--soft-blue-border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-5) var(--space-6)',
          marginBottom: 'var(--space-6)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-4)'
          }}>
            <div>
              <div style={{
                fontSize: 'var(--fs-h4)',
                fontWeight: 700,
                color: 'var(--primary-blue)',
                fontFamily: 'var(--font-malayalam)',
                marginBottom: '4px'
              }}>
                {isDonor && isRecipient 
                  ? 'സാധനങ്ങൾ നൽകാനും ആവശ്യമുള്ളവ സ്വീകരിക്കാനും കൈത്താങ്ങ് ഉപയോഗിക്കൂ.' 
                  : isDonor 
                  ? 'നിങ്ങളുടെ കൈവശമുള്ള ഉപയോഗപ്രദമായ ഒരു സാധനം മറ്റൊരാൾക്ക് പങ്കിടൂ.' 
                  : 'കൈത്താങ്ങിൽ ലഭ്യമായ സൗജന്യ സാധനങ്ങൾ കണ്ടെത്തൂ.'}
              </div>
              <div style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-secondary)', fontFamily: 'var(--font-malayalam)' }}>
                നല്ലൊരെണ്ണം നൽകുന്നതിലൂടെ ഒരാളുടെ ജീവിതത്തിൽ മാറ്റമുണ്ടാക്കാം.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              {isDonor && (
                <Link to="/create-item" style={{ textDecoration: 'none' }}>
                  <Button variant="primary" size="md" style={{ fontFamily: 'var(--font-malayalam)' }}>
                    🎁 ഒരു സാധനം നൽകൂ
                  </Button>
                </Link>
              )}

              {isRecipient && (
                <Link to="/items" style={{ textDecoration: 'none' }}>
                  <Button variant={isDonor ? 'outline' : 'primary'} size="md" style={{ fontFamily: 'var(--font-malayalam)' }}>
                    🔍 സാധനങ്ങൾ കണ്ടെത്തൂ
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </Card>

        {/* 3. Overview Stat Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)'
        }}>
          {isDonor && (
            <Card style={{ padding: 'var(--space-4) var(--space-5)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                ഞാൻ നൽകിയ സാധനങ്ങൾ
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-blue)', marginTop: '4px' }}>
                {items.length}
              </div>
            </Card>
          )}

          {isRecipient && (
            <Card style={{ padding: 'var(--space-4) var(--space-5)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                എന്റെ അഭ്യർത്ഥനകൾ
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--secondary-rose)', marginTop: '4px' }}>
                {requests.length}
              </div>
            </Card>
          )}

          <Card style={{ padding: 'var(--space-4) var(--space-5)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              സജീവ Matches
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--ink)', marginTop: '4px' }}>
              {matches.length}
            </div>
          </Card>

          <Card style={{ padding: 'var(--space-4) var(--space-5)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              പൂർത്തിയായ കൈമാറ്റങ്ങൾ
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success-main)', marginTop: '4px' }}>
              {completedMatchesCount}
            </div>
          </Card>
        </div>

        {/* 4. Tabs Navigation */}
        <div style={{
          display: 'flex',
          gap: 'var(--space-2)',
          borderBottom: '2px solid var(--soft-gray)',
          marginBottom: 'var(--space-6)'
        }}>
          <button
            onClick={() => setActiveTab('matches')}
            style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'matches' ? '3px solid var(--primary-blue)' : '3px solid transparent',
              color: activeTab === 'matches' ? 'var(--primary-blue)' : 'var(--ink-muted)',
              fontWeight: 700,
              fontSize: 'var(--fs-body)',
              fontFamily: 'var(--font-malayalam)',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
          >
            എന്റെ Matches ({matches.length})
          </button>

          {isDonor && (
            <button
              onClick={() => setActiveTab('items')}
              style={{
                padding: 'var(--space-3) var(--space-4)',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'items' ? '3px solid var(--primary-blue)' : '3px solid transparent',
                color: activeTab === 'items' ? 'var(--primary-blue)' : 'var(--ink-muted)',
                fontWeight: 700,
                fontSize: 'var(--fs-body)',
                fontFamily: 'var(--font-malayalam)',
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
            >
              ഞാൻ നൽകിയ സാധനങ്ങൾ ({items.length})
            </button>
          )}

          {isRecipient && (
            <button
              onClick={() => setActiveTab('requests')}
              style={{
                padding: 'var(--space-3) var(--space-4)',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'requests' ? '3px solid var(--primary-blue)' : '3px solid transparent',
                color: activeTab === 'requests' ? 'var(--primary-blue)' : 'var(--ink-muted)',
                fontWeight: 700,
                fontSize: 'var(--fs-body)',
                fontFamily: 'var(--font-malayalam)',
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
            >
              എന്റെ അഭ്യർത്ഥനകൾ ({requests.length})
            </button>
          )}
        </div>

        {/* 5. Error State */}
        {error && (
          <div style={{
            background: 'var(--error-bg)',
            border: '1px solid var(--error-border)',
            color: 'var(--error-text)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-6)',
            fontFamily: 'var(--font-malayalam)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>⚠️ {error}</span>
            <Button size="sm" variant="outline" onClick={fetchDashboardData}>വീണ്ടും ശ്രമിക്കുക</Button>
          </div>
        )}

        {/* 6. Loading State (Skeleton) */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
            {[1, 2, 3].map(i => (
              <Card key={i} style={{ height: '160px', opacity: 0.6, background: 'var(--soft-gray)', borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : (
          <div>
            {/* TABS CONTENT 1: MATCHES */}
            {activeTab === 'matches' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {matches.length === 0 ? (
                  <Card style={{ padding: 'var(--space-8)', textAlign: 'center', borderRadius: 'var(--radius-xl)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>🤝</div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-malayalam)', marginBottom: '4px' }}>
                      നിങ്ങൾക്ക് ഇതുവരെ Matches ഒന്നുമില്ല
                    </h3>
                    <p style={{ color: 'var(--ink-muted)', fontSize: 'var(--fs-body-sm)', fontFamily: 'var(--font-malayalam)', margin: 0 }}>
                      സാധനങ്ങൾ നൽകുകയോ അഭ്യർത്ഥിക്കുകയോ ചെയ്യുമ്പോൾ match സ്ഥിരീകരിക്കപ്പെട്ടാൽ ഇവിടെ കാണാം.
                    </p>
                  </Card>
                ) : (
                  matches.map(m => (
                    <Card key={m.id} style={{
                      border: '2px solid var(--soft-blue-border)',
                      borderRadius: 'var(--radius-xl)',
                      padding: 'var(--space-5)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--primary-blue)', fontWeight: 700, textTransform: 'uppercase' }}>
                            {m.item?.category || 'Item Match'}
                          </div>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)', margin: '4px 0 0 0' }}>
                            {m.item?.title || 'Unknown Item'}
                          </h3>
                        </div>

                        <Badge status={m.status} label={m.status.toUpperCase()} />
                      </div>

                      {/* Connection Details Card */}
                      <div style={{
                        background: 'var(--soft-blue)',
                        padding: 'var(--space-4) var(--space-5)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--soft-blue-border)',
                        marginTop: 'var(--space-4)'
                      }}>
                        <div style={{ fontSize: 'var(--fs-label)', fontWeight: 700, color: 'var(--ink)', marginBottom: 'var(--space-2)', fontFamily: 'var(--font-malayalam)' }}>
                          📞 കൈമാറ്റത്തിനുള്ള ബന്ധപ്പെടൽ വിവരങ്ങൾ:
                        </div>

                        {profile.role === 'donor' || m.donor_id === profile.id ? (
                          <div>
                            <p style={{ margin: '4px 0', fontSize: 'var(--fs-body-sm)', color: 'var(--ink)' }}>
                              <strong>സ്വീകർത്താവ് (Recipient Name):</strong> {m.recipient?.name || 'Authorized Recipient'}
                            </p>
                            <p style={{ margin: '4px 0', fontSize: 'var(--fs-body-sm)', color: 'var(--ink)' }}>
                              <strong>ഫോൺ നമ്പർ:</strong> {m.recipient?.phone || 'Private Contact'}
                            </p>
                            <p style={{ color: 'var(--ink-muted)', fontSize: '0.8rem', marginTop: 'var(--space-2)', fontFamily: 'var(--font-malayalam)' }}>
                              ദയവായി സ്വീകർത്താവുമായി ഫോണിൽ ബന്ധപ്പെട്ട് സാധനം കൈമാറാനുള്ള സ്ഥലം തീരുമാനിക്കുക.
                            </p>
                            
                            {m.status !== 'completed' && (
                              <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                                <Button size="sm" variant="primary" onClick={() => handleUpdateMatchStatus(m.id, 'handed_over', m.item.id)}>
                                  Mark as Handed Over
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleUpdateMatchStatus(m.id, 'completed', m.item.id)}>
                                  Complete Match
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p style={{ margin: '4px 0', fontSize: 'var(--fs-body-sm)', color: 'var(--ink)' }}>
                              <strong>നൽകുന്നയാൾ (Donor Name):</strong> {m.donor?.name || 'Community Donor'}
                            </p>
                            <p style={{ margin: '4px 0', fontSize: 'var(--fs-body-sm)', color: 'var(--ink)' }}>
                              <strong>ഫോൺ നമ്പർ:</strong> {m.donor?.phone || 'Private Contact'}
                            </p>
                            <p style={{ margin: '4px 0', fontSize: 'var(--fs-body-sm)', color: 'var(--ink)' }}>
                              <strong>ഏകദേശ സ്ഥലം:</strong> {m.donor?.address || 'Private Location'}
                            </p>
                            <p style={{ color: 'var(--ink-muted)', fontSize: '0.8rem', marginTop: 'var(--space-2)', fontFamily: 'var(--font-malayalam)' }}>
                              ദയവായി ദാതാവുമായി ബന്ധപ്പെട്ട് സാധനം സ്വീകരിക്കാനുള്ള സമയം കൈക്കൊള്ളുക.
                            </p>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* TABS CONTENT 2: DONOR ITEMS */}
            {activeTab === 'items' && isDonor && (
              <div>
                {items.length === 0 ? (
                  <Card style={{ padding: 'var(--space-8)', textAlign: 'center', borderRadius: 'var(--radius-xl)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>🎁</div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-malayalam)', marginBottom: '4px' }}>
                      നിങ്ങൾ ഇതുവരെ ഒരു സാധനവും നൽകിയിട്ടില്ല
                    </h3>
                    <p style={{ color: 'var(--ink-muted)', fontSize: 'var(--fs-body-sm)', fontFamily: 'var(--font-malayalam)', marginBottom: 'var(--space-4)' }}>
                      നിങ്ങൾക്ക് ആവശ്യമില്ലാത്ത ഒരു നല്ല വസ്തു മറ്റൊരാൾക്ക് ഉപകാരപ്പെടാം.
                    </p>
                    <Link to="/create-item" style={{ textDecoration: 'none' }}>
                      <Button variant="primary" size="md" style={{ fontFamily: 'var(--font-malayalam)' }}>
                        ഒരു സാധനം നൽകൂ
                      </Button>
                    </Link>
                  </Card>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
                    {items.map(item => {
                      const imgUrl = getItemImage(item);
                      return (
                        <Card key={item.id} style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                          <div style={{ height: '160px', background: 'var(--soft-gray)', position: 'relative' }}>
                            {imgUrl ? (
                              <img src={imgUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-muted)' }}>
                                📷 No Image
                              </div>
                            )}
                            <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                              <Badge status={item.status} label={item.status} />
                            </div>
                          </div>

                          <div style={{ padding: 'var(--space-4)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-muted)', fontWeight: 600 }}>{item.category}</div>
                              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink)', margin: '2px 0 8px 0' }}>{item.title}</h4>
                            </div>

                            <Link to={`/item/${item.id}`} style={{ textDecoration: 'none', marginTop: 'var(--space-3)' }}>
                              <Button variant="outline" size="sm" fullWidth style={{ fontFamily: 'var(--font-malayalam)' }}>
                                ലിസ്റ്റിംഗ് കാണുക
                              </Button>
                            </Link>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TABS CONTENT 3: RECIPIENT REQUESTS */}
            {activeTab === 'requests' && isRecipient && (
              <div>
                {requests.length === 0 ? (
                  <Card style={{ padding: 'var(--space-8)', textAlign: 'center', borderRadius: 'var(--radius-xl)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>🔍</div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-malayalam)', marginBottom: '4px' }}>
                      നിങ്ങൾ ഇതുവരെ ഒരു സാധനവും അഭ്യർത്ഥിച്ചിട്ടില്ല
                    </h3>
                    <p style={{ color: 'var(--ink-muted)', fontSize: 'var(--fs-body-sm)', fontFamily: 'var(--font-malayalam)', marginBottom: 'var(--space-4)' }}>
                      നിങ്ങൾക്ക് ആവശ്യമുള്ളത് കണ്ടെത്താൻ തുടങ്ങാം.
                    </p>
                    <Link to="/items" style={{ textDecoration: 'none' }}>
                      <Button variant="primary" size="md" style={{ fontFamily: 'var(--font-malayalam)' }}>
                        സാധനങ്ങൾ കണ്ടെത്തൂ
                      </Button>
                    </Link>
                  </Card>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
                    {requests.map(req => {
                      const imgUrl = getItemImage(req.item);
                      return (
                        <Card key={req.id} style={{ borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                          <div style={{ height: '160px', background: 'var(--soft-gray)', position: 'relative' }}>
                            {imgUrl ? (
                              <img src={imgUrl} alt={req.item?.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-muted)' }}>
                                📷 No Image
                              </div>
                            )}
                            <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                              <Badge status={req.status} label={req.status} />
                            </div>
                          </div>

                          <div style={{ padding: 'var(--space-4)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-muted)', fontWeight: 600 }}>
                                Requested on {new Date(req.created_at).toLocaleDateString()}
                              </div>
                              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink)', margin: '2px 0 8px 0' }}>
                                {req.item?.title || 'Requested Item'}
                              </h4>
                            </div>

                            {req.item?.id && (
                              <Link to={`/item/${req.item.id}`} style={{ textDecoration: 'none', marginTop: 'var(--space-3)' }}>
                                <Button variant="outline" size="sm" fullWidth style={{ fontFamily: 'var(--font-malayalam)' }}>
                                  സാധനത്തിന്റെ വിവരങ്ങൾ കാണുക
                                </Button>
                              </Link>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

