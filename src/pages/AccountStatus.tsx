import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Brand } from '../components/common/Brand';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import type { RecipientVerification } from '../types/database';

export const AccountStatus: React.FC = () => {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const [verification, setVerification] = useState<RecipientVerification | null>(null);
  const [verifLoading, setVerifLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user && (profile?.role === 'recipient' || profile?.role === 'both')) {
      fetchVerification();
    }
  }, [user, profile?.role]);

  const fetchVerification = async () => {
    if (!user) return;
    try {
      setVerifLoading(true);
      const { data, error } = await supabase
        .from('recipient_verifications')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setVerification(data);
      }
    } catch (err) {
      console.error('Error fetching recipient verification:', err);
    } finally {
      setVerifLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshProfile();
      if (profile?.role === 'recipient' || profile?.role === 'both') {
        await fetchVerification();
      }
    } catch (err) {
      console.error('Error refreshing status:', err);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 120px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--cloud-white)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-3)',
          color: 'var(--ink-muted)'
        }}>
          <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary-blue)">
            <circle cx="12" cy="12" r="10" strokeWidth="4" strokeDasharray="32" strokeDashoffset="10" />
          </svg>
          <span style={{ fontFamily: 'var(--font-malayalam)' }}>വിവരങ്ങൾ പരിശോധിക്കുന്നു...</span>
        </div>
      </div>
    );
  }

  if (!user || !profile) return <Navigate to="/login" replace />;

  if (profile.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const accountStatus = profile.account_status;

  return (
    <div style={{
      minHeight: 'calc(100vh - 120px)',
      background: 'var(--cloud-white)',
      padding: 'var(--space-8) var(--space-4)',
      fontFamily: 'var(--font-family)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start'
    }}>
      <div style={{ maxWidth: '720px', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'inline-block', marginBottom: 'var(--space-3)' }}>
            <Brand size="md" clickable={false} showTagline={false} />
          </div>
          
          <h1 style={{
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 800,
            color: 'var(--ink)',
            fontFamily: 'var(--font-malayalam)',
            marginBottom: 'var(--space-2)'
          }}>
            അക്കൗണ്ട് വിവരങ്ങൾ (Account Status)
          </h1>

          <p style={{
            fontSize: 'var(--fs-body)',
            color: 'var(--ink-secondary)',
            fontFamily: 'var(--font-malayalam)',
            maxWidth: '520px',
            margin: '0 auto'
          }}>
            നിങ്ങളുടെ കൈത്താങ്ങ് അക്കൗണ്ട് അവസ്ഥ താഴെ കാണാം.
          </p>
        </div>

        {/* Primary Status Card */}
        <Card style={{
          boxShadow: 'var(--shadow-lg)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--soft-gray)',
          background: 'var(--surface-white)',
          padding: 'clamp(1.5rem, 4vw, 2.25rem)',
          marginBottom: 'var(--space-5)'
        }}>
          {/* PENDING STATE */}
          {accountStatus === 'pending' && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 'var(--space-3)',
                marginBottom: 'var(--space-4)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '2rem' }}>⏳</span>
                  <div>
                    <h2 style={{
                      fontSize: '1.35rem',
                      fontWeight: 700,
                      color: 'var(--ink)',
                      margin: 0,
                      fontFamily: 'var(--font-malayalam)'
                    }}>
                      നിങ്ങളുടെ account പരിശോധനയിലാണ്.
                    </h2>
                    <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-muted)', marginTop: '2px' }}>
                      Admin Review Pending
                    </div>
                  </div>
                </div>

                <Badge status="pending" label="⏳ Admin പരിശോധനയിൽ" />
              </div>

              <p style={{
                fontSize: 'var(--fs-body)',
                color: 'var(--ink-secondary)',
                fontFamily: 'var(--font-malayalam)',
                lineHeight: 1.6,
                marginBottom: 'var(--space-6)'
              }}>
                നിങ്ങളുടെ profile ലഭിച്ചു. ഞങ്ങളുടെ admin team വിവരങ്ങൾ പരിശോധിച്ചുകൊണ്ടിരിക്കുകയാണ്. പരിശോധന പൂർത്തിയായാൽ കൈത്താങ്ങ് പ്ലാറ്റ്‌ഫോം പൂർണ്ണമായി ഉപയോഗിക്കാം.
              </p>

              {/* 3-Stage Visual Journey */}
              <div style={{
                background: 'var(--soft-blue)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4) var(--space-5)',
                border: '1px solid var(--soft-blue-border)',
                marginBottom: 'var(--space-6)'
              }}>
                <div style={{
                  fontSize: 'var(--fs-label)',
                  fontWeight: 700,
                  color: 'var(--primary-blue)',
                  fontFamily: 'var(--font-malayalam)',
                  marginBottom: 'var(--space-3)'
                }}>
                  നിങ്ങളുടെ Onboarding ഘട്ടങ്ങൾ:
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: 'var(--space-3)'
                }}>
                  {/* Step 1: Complete Profile */}
                  <div style={{
                    background: 'white',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--soft-blue-border)'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--success-main)', fontWeight: 700 }}>✓ Step 01</div>
                    <div style={{ fontSize: 'var(--fs-body-sm)', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-malayalam)' }}>
                      Profile നൽകി
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>പൂർത്തിയായി</div>
                  </div>

                  {/* Step 2: Admin Review */}
                  <div style={{
                    background: 'white',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    border: '2px solid var(--primary-blue)'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary-blue)', fontWeight: 700 }}>⏳ Step 02</div>
                    <div style={{ fontSize: 'var(--fs-body-sm)', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-malayalam)' }}>
                      Admin Review
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary-blue)', fontWeight: 600 }}>നടന്നുകൊണ്ടിരിക്കുന്നു</div>
                  </div>

                  {/* Step 3: Platform Access */}
                  <div style={{
                    background: 'var(--cloud-white)',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--soft-gray)',
                    opacity: 0.75
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontWeight: 700 }}>🔒 Step 03</div>
                    <div style={{ fontSize: 'var(--fs-body-sm)', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-malayalam)' }}>
                      Platform Access
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>കാത്തിരിക്കുന്നു</div>
                  </div>
                </div>
              </div>

              {/* What Happens Next */}
              <div style={{
                background: 'var(--cloud-white)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4) var(--space-5)',
                border: '1px solid var(--soft-gray)',
                marginBottom: 'var(--space-5)'
              }}>
                <h3 style={{
                  fontSize: 'var(--fs-h4)',
                  fontWeight: 700,
                  color: 'var(--ink)',
                  marginBottom: 'var(--space-3)',
                  fontFamily: 'var(--font-malayalam)'
                }}>
                  ഇനി എന്താണ് സംഭവിക്കുക?
                </h3>

                <ul style={{
                  margin: 0,
                  paddingLeft: 'var(--space-5)',
                  fontSize: 'var(--fs-body-sm)',
                  color: 'var(--ink-secondary)',
                  fontFamily: 'var(--font-malayalam)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)'
                }}>
                  <li>1. നിങ്ങളുടെ profile വിവരങ്ങൾ കൈത്താങ്ങ് അഡ്മിൻമാർ പരിശോധിക്കും.</li>
                  <li>2. Account approval തീരുമാനം എടുക്കും.</li>
                  <li>3. Approve ചെയ്യപ്പെട്ടാൽ നിങ്ങൾക്ക് പ്ലാറ്റ്‌ഫോമിൽ പ്രവേശിക്കാം.</li>
                </ul>
              </div>

              {/* Manual Safe Status Refresh */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleManualRefresh}
                  disabled={refreshing}
                  style={{ fontFamily: 'var(--font-malayalam)' }}
                >
                  {refreshing ? 'പരിശോധിക്കുന്നു...' : '🔄 Status വീണ്ടും പരിശോധിക്കുക'}
                </Button>
              </div>
            </div>
          )}

          {/* APPROVED STATE */}
          {accountStatus === 'approved' && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 'var(--space-3)',
                marginBottom: 'var(--space-4)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '2.2rem' }}>🎉</span>
                  <div>
                    <h2 style={{
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      color: 'var(--ink)',
                      margin: 0,
                      fontFamily: 'var(--font-malayalam)'
                    }}>
                      നിങ്ങളുടെ account approved ആയി!
                    </h2>
                    <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--success-main)', fontWeight: 600 }}>
                      Account Approved & Active
                    </div>
                  </div>
                </div>

                <Badge status="approved" label="✓ Approved" />
              </div>

              <p style={{
                fontSize: 'var(--fs-body)',
                color: 'var(--ink-secondary)',
                fontFamily: 'var(--font-malayalam)',
                lineHeight: 1.6,
                marginBottom: 'var(--space-6)'
              }}>
                കൈത്താങ്ങിലെ community-യിലേക്ക് സ്വാഗതം. ഇനി നിങ്ങൾക്ക് സാധനങ്ങൾ നൽകാനും കൈത്താങ്ങിന്റെ സേവനങ്ങൾ ഉപയോഗിക്കാനും സാധിക്കും.
              </p>

              <div style={{
                display: 'flex',
                gap: 'var(--space-3)',
                flexWrap: 'wrap',
                justifyContent: 'flex-start'
              }}>
                <Link to="/dashboard" style={{ textDecoration: 'none' }}>
                  <Button variant="primary" size="lg" style={{ fontFamily: 'var(--font-malayalam)' }}>
                    Dashboard-ലേക്ക് പോകുക
                  </Button>
                </Link>

                <Link to="/items" style={{ textDecoration: 'none' }}>
                  <Button variant="outline" size="lg" style={{ fontFamily: 'var(--font-malayalam)' }}>
                    സാധനങ്ങൾ കാണുക
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* REJECTED STATE */}
          {accountStatus === 'rejected' && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 'var(--space-3)',
                marginBottom: 'var(--space-4)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '2rem' }}>⚠️</span>
                  <div>
                    <h2 style={{
                      fontSize: '1.35rem',
                      fontWeight: 700,
                      color: 'var(--ink)',
                      margin: 0,
                      fontFamily: 'var(--font-malayalam)'
                    }}>
                      നിങ്ങളുടെ account ഇപ്പോൾ approve ചെയ്യാനായില്ല.
                    </h2>
                    <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--error-main)', fontWeight: 600 }}>
                      Account Not Approved
                    </div>
                  </div>
                </div>

                <Badge status="rejected" label="❌ Rejected" />
              </div>

              <p style={{
                fontSize: 'var(--fs-body)',
                color: 'var(--ink-secondary)',
                fontFamily: 'var(--font-malayalam)',
                lineHeight: 1.6,
                marginBottom: 'var(--space-5)'
              }}>
                നിങ്ങളുടെ വിവരങ്ങൾ വീണ്ടും പരിശോധിക്കേണ്ടതുണ്ടാകാം. കൂടുതൽ വിവരങ്ങൾക്ക് കൈത്താങ്ങ് support/admin team-നെ ബന്ധപ്പെടുക.
              </p>
            </div>
          )}

          {/* SUSPENDED STATE */}
          {accountStatus === 'suspended' && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 'var(--space-3)',
                marginBottom: 'var(--space-4)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '2rem' }}>🔒</span>
                  <div>
                    <h2 style={{
                      fontSize: '1.35rem',
                      fontWeight: 700,
                      color: 'var(--ink)',
                      margin: 0,
                      fontFamily: 'var(--font-malayalam)'
                    }}>
                      നിങ്ങളുടെ account താൽക്കാലികമായി പരിമിതപ്പെടുത്തിയിരിക്കുന്നു.
                    </h2>
                    <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--error-main)', fontWeight: 600 }}>
                      Account Suspended
                    </div>
                  </div>
                </div>

                <Badge status="suspended" label="⚠️ Suspended" />
              </div>

              <p style={{
                fontSize: 'var(--fs-body)',
                color: 'var(--ink-secondary)',
                fontFamily: 'var(--font-malayalam)',
                lineHeight: 1.6,
                marginBottom: 'var(--space-5)'
              }}>
                ഇതേക്കുറിച്ച് അന്വേഷിക്കുന്നതിനും വിവരങ്ങൾ സ്ഥിരീകരിക്കുന്നതിനും ദയവായി കൈത്താങ്ങ് support team-നെ ബന്ധപ്പെടുക.
              </p>
            </div>
          )}
        </Card>

        {/* SECONDARY CARD: RECIPIENT VERIFICATION STATUS (If Recipient or Both) */}
        {(profile.role === 'recipient' || profile.role === 'both') && (
          <Card style={{
            boxShadow: 'var(--shadow-md)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--soft-blue-border)',
            background: 'var(--soft-blue)',
            padding: 'var(--space-5)',
            marginBottom: 'var(--space-5)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25rem' }}>🤝</span>
                <h3 style={{
                  fontSize: 'var(--fs-h4)',
                  fontWeight: 700,
                  color: 'var(--ink)',
                  margin: 0,
                  fontFamily: 'var(--font-malayalam)'
                }}>
                  Recipient Verification Status
                </h3>
              </div>

              {verifLoading ? (
                <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-muted)' }}>പരിശോധിക്കുന്നു...</span>
              ) : verification?.status === 'approved' ? (
                <Badge status="approved" label="✓ Recipient Verified" />
              ) : verification?.status === 'rejected' ? (
                <Badge status="rejected" label="❌ Verification Info Needed" />
              ) : (
                <Badge status="pending" label="⏳ Verification പരിശോധനയിൽ" />
              )}
            </div>

            <p style={{
              fontSize: 'var(--fs-body-sm)',
              color: 'var(--ink-secondary)',
              fontFamily: 'var(--font-malayalam)',
              lineHeight: 1.5,
              margin: 0
            }}>
              {verification?.status === 'approved' ? (
                'Recipient verification പൂർത്തിയായി. ഇനി നിങ്ങൾക്ക് ആവശ്യമായ സാധനങ്ങൾ അഭ്യർത്ഥിക്കാം.'
              ) : verification?.status === 'rejected' ? (
                'നിങ്ങളുടെ recipient verification വിവരങ്ങളിൽ കൂടുതൽ വ്യക്തത ആവശ്യമുണ്ട്. Support team-നെ ബന്ധപ്പെടുക.'
              ) : (
                'സാധനങ്ങൾ അഭ്യർത്ഥിക്കുന്നതിന് നിങ്ങളുടെ recipient verification പൂർത്തിയാകണം. നിങ്ങളുടെ verification അപേക്ഷ admin പരിശോധിക്കുകയാണ്.'
              )}
            </p>
          </Card>
        )}

        {/* DONOR-ONLY CARD */}
        {profile.role === 'donor' && (
          <Card style={{
            boxShadow: 'var(--shadow-subtle)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--soft-gray)',
            background: 'var(--surface-white)',
            padding: 'var(--space-5)',
            marginBottom: 'var(--space-5)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-3)'
            }}>
              <div>
                <h3 style={{
                  fontSize: 'var(--fs-h4)',
                  fontWeight: 700,
                  color: 'var(--ink)',
                  marginBottom: '4px',
                  fontFamily: 'var(--font-malayalam)'
                }}>
                  🎁 നിങ്ങൾ Donor ആയി രജിസ്റ്റർ ചെയ്തിരിക്കുന്നു
                </h3>
                <p style={{
                  fontSize: 'var(--fs-body-sm)',
                  color: 'var(--ink-secondary)',
                  fontFamily: 'var(--font-malayalam)',
                  margin: 0
                }}>
                  നിങ്ങൾക്ക് ആവശ്യമില്ലാത്ത ഉപയോഗപ്രദമായ സാധനങ്ങൾ community-യിൽ പങ്കിടാം.
                </p>
              </div>

              {accountStatus === 'approved' && (
                <Link to="/create-item" style={{ textDecoration: 'none' }}>
                  <Button variant="secondary" size="md" style={{ fontFamily: 'var(--font-malayalam)' }}>
                    ഒരു സാധനം നൽകൂ
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        )}

        {/* Footer Sign Out */}
        <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
          <Button
            variant="ghost"
            size="md"
            onClick={signOut}
            style={{ color: 'var(--ink-muted)', fontFamily: 'var(--font-malayalam)' }}
          >
            Sign Out (ലോഗ് ഔട്ട് ചെയ്യുക)
          </Button>
        </div>
      </div>
    </div>
  );
};

