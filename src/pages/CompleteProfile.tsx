import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

import type { UserRole } from '../types/database';

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

    if (role === 'recipient' || role === 'both') {
      if (!applicantReason || applicantReason.length < 10) {
        setError('Please provide a valid reason for requiring assistance (minimum 10 characters).');
        return;
      }
      if (!consent1 || !consent2 || !consent3 || !consent4 || !consent5) {
        setError('You must agree to all verification terms.');
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
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card wide">
        <h2>Complete Your Profile</h2>
        <p>We need a few more details before you can access KAITHAANGU.</p>
        
        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', padding: '1rem', background: 'var(--soft-rose)', borderRadius: '8px' }}>{error}</div>}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Full Address</label>
            <textarea required value={address} onChange={e => setAddress(e.target.value)} placeholder="Please enter your exact address. This is strictly private."></textarea>
          </div>
          <div className="form-group">
            <label>I want to...</label>
            <select value={role} onChange={e => setRole(e.target.value as UserRole)}>
              <option value="donor">Give away items for free</option>
              <option value="recipient">Request free items</option>
              <option value="both">Both give and request items</option>
            </select>
          </div>

          {(role === 'recipient' || role === 'both') && (
            <div style={{ backgroundColor: 'var(--soft-gray)', padding: '1.5rem', borderRadius: '8px', marginTop: '1.5rem' }}>
              <h3>Verification Details</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                To maintain a fair community, we need to verify requests. Your information is strictly private and only visible to authorized verification admins.
              </p>
              <div className="form-group">
                <label>Why do you need assistance?</label>
                <textarea 
                  required 
                  minLength={10}
                  value={applicantReason} 
                  onChange={e => setApplicantReason(e.target.value)}
                  placeholder="Briefly explain your situation to help admins verify your need."
                ></textarea>
              </div>

              <div className="checkbox-group">
                <input type="checkbox" id="rc1" checked={consent1} onChange={e => setConsent1(e.target.checked)} />
                <label htmlFor="rc1">I confirm that the information I have provided is accurate to the best of my knowledge.</label>
              </div>
              <div className="checkbox-group">
                <input type="checkbox" id="rc2" checked={consent2} onChange={e => setConsent2(e.target.checked)} />
                <label htmlFor="rc2">I understand that KAITHAANGU will use this information only to verify my eligibility to receive donated items.</label>
              </div>
              <div className="checkbox-group">
                <input type="checkbox" id="rc3" checked={consent3} onChange={e => setConsent3(e.target.checked)} />
                <label htmlFor="rc3">I understand that my personal information will not be publicly displayed.</label>
              </div>
              <div className="checkbox-group">
                <input type="checkbox" id="rc4" checked={consent4} onChange={e => setConsent4(e.target.checked)} />
                <label htmlFor="rc4">I understand that authorized KAITHAANGU administrators may review my information.</label>
              </div>
              <div className="checkbox-group">
                <input type="checkbox" id="rc5" checked={consent5} onChange={e => setConsent5(e.target.checked)} />
                <label htmlFor="rc5">I understand that providing false information may result in rejection or suspension.</label>
              </div>
            </div>
          )}
          
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }} disabled={loading}>
            {loading ? 'Saving...' : ((role === 'recipient' || role === 'both') ? 'Submit for Verification' : 'Complete Profile')}
          </button>
        </form>
      </div>
    </div>
  );
};
