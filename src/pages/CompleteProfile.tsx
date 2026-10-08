import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

import type { UserRole } from '../types/database';
import { Brand } from '../components/common/Brand';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea, Checkbox } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

export const CompleteProfile: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [role, setRole] = useState<UserRole>('donor');
  
  // Recipient specific
  const [applicantReason, setApplicantReason] = useState('');
  
  // Consents
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [consent3, setConsent3] = useState(false);
  const [consent4, setConsent4] = useState(false);
  const [consent5, setConsent5] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return <Navigate to="/login" replace />;
  if (profile?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (profile?.profile_completed) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('പൂർണ്ണ പേര് നൽകുക. (Please enter your full name)');
      return;
    }

    if (!phone.trim()) {
      setError('ശരിയായ ഫോൺ നമ്പർ നൽകുക. (Please enter a valid phone number)');
      return;
    }

    if (!address.trim()) {
      setError('പൂർണ്ണ വിലാസം നൽകുക. (Please enter your full address)');
      return;
    }

    if (role === 'recipient' || role === 'both') {
      if (!applicantReason || applicantReason.trim().length < 10) {
        setError('സഹായം ആവശ്യമുള്ളതിന്റെ കാരണം ചുരുക്കത്തിൽ വ്യക്തമാക്കുക (കുറഞ്ഞത് 10 അക്ഷരങ്ങൾ).');
        return;
      }
      if (!consent1 || !consent2 || !consent3 || !consent4 || !consent5) {
        setError('തുടരുന്നതിന് എല്ലാ verification വ്യവസ്ഥകളും അംഗീകരിക്കേണ്ടതുണ്ട്.');
        return;
      }
    }

    setLoading(true);

    try {
      const { error: profileError } = await supabase.from('profiles').update({
        name,
        phone,
        address,
        role,
        profile_completed: true
      }).eq('id', user.id);

      if (profileError) throw profileError;
      
      if (role === 'recipient' || role === 'both') {
        // Create recipient verification record
        const { error: verifyError } = await supabase.from('recipient_verifications').insert({
          user_id: user.id,
          status: 'pending',
          applicant_reason: applicantReason
        });
        if (verifyError) throw verifyError;

        // Record Consents
        const consents = [
          { type: 'accurate_info', text: "I confirm that the information I have provided is accurate to the best of my knowledge." },
          { type: 'eligibility_use', text: "I understand that KAITHAANGU will use this information only to verify my eligibility to receive donated items." },
          { type: 'privacy_guarantee', text: "I understand that my personal information will not be publicly displayed." },
          { type: 'admin_review', text: "I understand that authorized KAITHAANGU administrators may review my information." },
          { type: 'false_info_penalty', text: "I understand that providing false information may result in rejection or suspension." }
        ];

        const consentRecords = consents.map(c => ({
          user_id: user.id,
          consent_type: c.type,
          consent_version: 'v1'
        }));

        const { error: consentError } = await supabase.from('consents').insert(consentRecords);
        if (consentError) throw consentError;
      }

      await refreshProfile();
      navigate('/account-status');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Profile ഇപ്പോൾ save ചെയ്യാൻ കഴിഞ്ഞില്ല. ദയവായി വീണ്ടും ശ്രമിക്കുക.');
    } finally {
      setLoading(false);
    }
  };

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
        {/* Onboarding Brand Header */}
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
            കൈത്താങ്ങിലേക്ക് സ്വാഗതം. 💙
          </h1>

          <p style={{
            fontSize: 'var(--fs-body-lg)',
            color: 'var(--ink-secondary)',
            fontFamily: 'var(--font-malayalam)',
            maxWidth: '560px',
            margin: '0 auto'
          }}>
            നിങ്ങളെക്കുറിച്ച് കുറച്ച് കാര്യങ്ങൾ അറിയട്ടെ. നിങ്ങളുടെ വിവരങ്ങൾ ശരിയായി നൽകുന്നത് കൈത്താങ്ങിലെ അംഗത്വവും സുരക്ഷിതമായ community experience-ഉം ഉറപ്പാക്കാൻ സഹായിക്കും.
          </p>
        </div>

        {/* Visual Progress Steps Bar */}
        <div style={{
          background: 'var(--surface-white)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4) var(--space-5)',
          border: '1px solid var(--soft-gray)',
          boxShadow: 'var(--shadow-subtle)',
          marginBottom: 'var(--space-6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-2)'
        }}>
          {/* Step 1 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '999px',
              background: 'var(--primary-blue)',
              color: 'white',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              1
            </div>
            <div>
              <div style={{ fontSize: 'var(--fs-body-sm)', fontWeight: 700, color: 'var(--primary-blue)' }}>Profile</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>വിവരങ്ങൾ നൽകുക</div>
            </div>
          </div>

          <div style={{ color: 'var(--ink-muted)', fontSize: '0.9rem' }}>→</div>

          {/* Step 2 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.7 }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '999px',
              background: 'var(--soft-gray)',
              color: 'var(--ink-muted)',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              2
            </div>
            <div>
              <div style={{ fontSize: 'var(--fs-body-sm)', fontWeight: 600, color: 'var(--ink)' }}>Admin Review</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>പരിശോധന</div>
            </div>
          </div>

          <div style={{ color: 'var(--ink-muted)', fontSize: '0.9rem' }}>→</div>

          {/* Step 3 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.7 }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '999px',
              background: 'var(--soft-gray)',
              color: 'var(--ink-muted)',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              3
            </div>
            <div>
              <div style={{ fontSize: 'var(--fs-body-sm)', fontWeight: 600, color: 'var(--ink)' }}>Access</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>ഉപയോഗിച്ചു തുടങ്ങാം</div>
            </div>
          </div>
        </div>

        {/* Profile Card Form */}
        <Card style={{
          boxShadow: 'var(--shadow-lg)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--soft-gray)',
          background: 'var(--surface-white)',
          padding: 'clamp(1.5rem, 4vw, 2.25rem)'
        }}>
          {/* Error Alert */}
          {error && (
            <div style={{
              background: 'var(--error-bg)',
              border: '1px solid var(--error-border)',
              color: 'var(--error-text)',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--space-5)',
              fontSize: 'var(--fs-body-sm)',
              fontFamily: 'var(--font-malayalam)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px'
            }}>
              <span style={{ fontSize: '1rem', lineHeight: 1 }}>⚠️</span>
              <span style={{ flex: 1 }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            
            {/* Full Name */}
            <div>
              <Input
                label="പൂർണ്ണ പേര് (Full Name)"
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="उदा. Muhammed Ramesh"
                helperText="നിങ്ങളെ community-യിൽ തിരിച്ചറിയാൻ ഉപയോഗിക്കുന്ന പേര്."
                style={{ fontFamily: 'var(--font-malayalam)' }}
              />
            </div>

            {/* Phone Number */}
            <div>
              <Input
                label="ഫോൺ നമ്പർ (Phone Number)"
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                helperText="🔒 ഈ നമ്പർ പൊതുവായി പ്രദർശിപ്പിക്കില്ല."
                style={{ fontFamily: 'var(--font-malayalam)' }}
              />
            </div>

            {/* Full Address */}
            <div>
              <Textarea
                label="പൂർണ്ണ വിലാസം (Full Address)"
                required
                rows={3}
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="നിങ്ങളുടെ യഥാർത്ഥ വിലാസം നൽകുക."
                helperText="🔒 നിങ്ങളുടെ യഥാർത്ഥ വിലാസം സ്വകാര്യമായിരിക്കും. പൊതുവായി പ്രദർശിപ്പിക്കില്ല."
                style={{ fontFamily: 'var(--font-malayalam)' }}
              />
            </div>

            {/* Intent Selection Cards */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: 'var(--space-2)',
                fontSize: 'var(--fs-label)',
                fontWeight: 700,
                color: 'var(--ink)',
                fontFamily: 'var(--font-malayalam)'
              }}>
                കൈത്താങ്ങിൽ നിങ്ങളുടെ പ്രധാന ഉദ്ദേശ്യം (I want to...)
              </label>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--space-3)'
              }}>
                {/* Option 1: Donor */}
                <div
                  onClick={() => setRole('donor')}
                  style={{
                    border: `2px solid ${role === 'donor' ? 'var(--primary-blue)' : 'var(--soft-gray)'}`,
                    background: role === 'donor' ? 'var(--soft-blue)' : 'var(--surface-white)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-4)',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Badge status="info" label="🎁 Donor" dot={false} />
                    <input
                      type="radio"
                      name="intent"
                      checked={role === 'donor'}
                      onChange={() => setRole('donor')}
                      style={{ accentColor: 'var(--primary-blue)', width: '18px', height: '18px' }}
                    />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ink)', fontFamily: 'var(--font-malayalam)' }}>
                    നൽകാൻ ആഗ്രഹിക്കുന്നു
                  </div>
                  <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-secondary)', fontFamily: 'var(--font-malayalam)', lineHeight: 1.4 }}>
                    “എനിക്ക് ആവശ്യമില്ലാത്ത സാധനങ്ങൾ മറ്റുള്ളവർക്ക് നൽകാൻ ആഗ്രഹിക്കുന്നു.”
                  </div>
                </div>

                {/* Option 2: Recipient */}
                <div
                  onClick={() => setRole('recipient')}
                  style={{
                    border: `2px solid ${role === 'recipient' ? 'var(--primary-blue)' : 'var(--soft-gray)'}`,
                    background: role === 'recipient' ? 'var(--soft-blue)' : 'var(--surface-white)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-4)',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Badge status="rose" label="🤝 Recipient" dot={false} />
                    <input
                      type="radio"
                      name="intent"
                      checked={role === 'recipient'}
                      onChange={() => setRole('recipient')}
                      style={{ accentColor: 'var(--primary-blue)', width: '18px', height: '18px' }}
                    />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ink)', fontFamily: 'var(--font-malayalam)' }}>
                    സ്വീകരിക്കാൻ ആഗ്രഹിക്കുന്നു
                  </div>
                  <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-secondary)', fontFamily: 'var(--font-malayalam)', lineHeight: 1.4 }}>
                    “എനിക്ക് ആവശ്യമുള്ള സാധനങ്ങൾ കണ്ടെത്താൻ ആഗ്രഹിക്കുന്നു.”
                  </div>
                </div>

                {/* Option 3: Both */}
                <div
                  onClick={() => setRole('both')}
                  style={{
                    border: `2px solid ${role === 'both' ? 'var(--primary-blue)' : 'var(--soft-gray)'}`,
                    background: role === 'both' ? 'var(--soft-blue)' : 'var(--surface-white)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-4)',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Badge status="info" label="✨ Both" dot={false} />
                    <input
                      type="radio"
                      name="intent"
                      checked={role === 'both'}
                      onChange={() => setRole('both')}
                      style={{ accentColor: 'var(--primary-blue)', width: '18px', height: '18px' }}
                    />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--ink)', fontFamily: 'var(--font-malayalam)' }}>
                    രണ്ടും ആഗ്രഹിക്കുന്നു
                  </div>
                  <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-secondary)', fontFamily: 'var(--font-malayalam)', lineHeight: 1.4 }}>
                    “നൽകാനും ആവശ്യമുള്ള സാധനങ്ങൾ സ്വീകരിക്കാനും ആഗ്രഹിക്കുന്നു.”
                  </div>
                </div>
              </div>
            </div>

            {/* Recipient Verification Details Box */}
            {(role === 'recipient' || role === 'both') && (
              <div style={{
                background: 'var(--soft-blue)',
                border: '1px solid var(--soft-blue-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-5)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-4)'
              }}>
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: 'var(--fs-h4)',
                    fontWeight: 700,
                    color: 'var(--ink)',
                    fontFamily: 'var(--font-malayalam)'
                  }}>
                    <span>🛡️</span>
                    <span>അധിക വെരിഫിക്കേഷൻ വിവരങ്ങൾ (Verification Details)</span>
                  </div>
                  <p style={{
                    fontSize: 'var(--fs-body-sm)',
                    color: 'var(--ink-secondary)',
                    fontFamily: 'var(--font-malayalam)',
                    marginTop: '4px',
                    margin: 0
                  }}>
                    Recipient ആയി സാധനങ്ങൾ അഭ്യർത്ഥിക്കുന്നതിന് അധിക verification ആവശ്യമാണ്. നിങ്ങളുടെ വിവരങ്ങൾ സുരക്ഷിതമായി അഡ്മിൻമാർ മാത്രം പരിശോധിക്കും.
                  </p>
                </div>

                <Textarea
                  label="എന്തുകൊണ്ടാണ് സഹായം ആവശ്യമുള്ളത്?"
                  required
                  rows={3}
                  minLength={10}
                  value={applicantReason}
                  onChange={e => setApplicantReason(e.target.value)}
                  placeholder="നിങ്ങളുടെ സാഹചര്യം ചുരുക്കത്തിൽ വ്യക്തമാക്കുക (കുറഞ്ഞത് 10 അക്ഷരങ്ങൾ)..."
                  helperText="സഹായം അർഹരായവർക്ക് ലഭിക്കുന്നുണ്ടെന്ന് ഉറപ്പുവരുത്താൻ ഇത് സഹായിക്കും."
                  style={{ fontFamily: 'var(--font-malayalam)', background: 'white' }}
                />

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                  marginTop: 'var(--space-2)'
                }}>
                  <div style={{ fontSize: 'var(--fs-label)', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-malayalam)' }}>
                    അംഗീകരണ നിബന്ധനകൾ:
                  </div>

                  <Checkbox
                    id="rc1"
                    checked={consent1}
                    onChange={e => setConsent1(e.target.checked)}
                    label={<span style={{ fontFamily: 'var(--font-malayalam)', fontSize: 'var(--fs-body-sm)' }}>1. നല്കിയ വിവരങ്ങൾ സത്യസന്ധവും കൃത്യവുമാണെന്ന് ഉറപ്പുനൽകുന്നു.</span>}
                  />

                  <Checkbox
                    id="rc2"
                    checked={consent2}
                    onChange={e => setConsent2(e.target.checked)}
                    label={<span style={{ fontFamily: 'var(--font-malayalam)', fontSize: 'var(--fs-body-sm)' }}>2. നൽകുന്ന സാധനങ്ങൾ സ്വീകരിക്കുന്നതിനുള്ള യോഗ്യത പരിശോധിക്കാൻ മാത്രമാണ് ഈ വിവരങ്ങൾ ഉപയോഗിക്കുന്നത് എന്ന് മനസ്സിലാക്കുന്നു.</span>}
                  />

                  <Checkbox
                    id="rc3"
                    checked={consent3}
                    onChange={e => setConsent3(e.target.checked)}
                    label={<span style={{ fontFamily: 'var(--font-malayalam)', fontSize: 'var(--fs-body-sm)' }}>3. എന്റെ വ്യക്തിഗത വിവരങ്ങൾ പൊതുവായി പ്രദർശിപ്പിക്കില്ല എന്ന് മനസ്സിലാക്കുന്നു.</span>}
                  />

                  <Checkbox
                    id="rc4"
                    checked={consent4}
                    onChange={e => setConsent4(e.target.checked)}
                    label={<span style={{ fontFamily: 'var(--font-malayalam)', fontSize: 'var(--fs-body-sm)' }}>4. അംഗീകൃത കൈത്താങ്ങ് അഡ്മിൻമാർക്ക് വിവരങ്ങൾ പരിശോധിക്കാം എന്ന് സമ്മതിക്കുന്നു.</span>}
                  />

                  <Checkbox
                    id="rc5"
                    checked={consent5}
                    onChange={e => setConsent5(e.target.checked)}
                    label={<span style={{ fontFamily: 'var(--font-malayalam)', fontSize: 'var(--fs-body-sm)' }}>5. തെറ്റായ വിവരങ്ങൾ നൽകിയാൽ അക്കൗണ്ട് റദ്ദാക്കപ്പെട്ടേക്കാം എന്ന് അറിയാം.</span>}
                  />
                </div>
              </div>
            )}

            {/* Admin Approval Note */}
            <div style={{
              background: 'var(--cloud-white)',
              border: '1px solid var(--soft-gray)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3) var(--space-4)',
              fontSize: 'var(--fs-body-sm)',
              color: 'var(--ink-secondary)',
              fontFamily: 'var(--font-malayalam)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>ℹ️</span>
              <span>Profile പൂർത്തിയാക്കിയ ശേഷം നിങ്ങളുടെ account admin review-ലേക്ക് പോകും.</span>
            </div>

            {/* Submit CTA */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={loading}
              style={{ marginTop: 'var(--space-2)' }}
            >
              {loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-malayalam)' }}>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="4" strokeDasharray="32" strokeDashoffset="10" />
                  </svg>
                  സേവ് ചെയ്യുന്നു...
                </span>
              ) : (
                <span style={{ fontFamily: 'var(--font-malayalam)', fontWeight: 600 }}>
                  {(role === 'recipient' || role === 'both') ? 'Profile പൂർത്തിയാക്കുക & Verification സമർപ്പിക്കുക' : 'Profile പൂർത്തിയാക്കുക'}
                </span>
              )}
            </Button>

          </form>
        </Card>
      </div>
    </div>
  );
};

