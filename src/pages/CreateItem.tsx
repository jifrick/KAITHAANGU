import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { processImage } from '../utils/imageProcessor';
import type { ProcessedImage } from '../utils/imageProcessor';
import { Brand } from '../components/common/Brand';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Textarea, Checkbox } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

const CATEGORIES = [
  'Books & Education', 'Clothes', 'Furniture', 'Electronics', 
  'Toys', 'Household Items', 'Medical Equipment', 'Baby & Kids', 
  'Appliances', 'Other'
];

const CONDITIONS = [
  { value: 'New', label: 'New', desc: 'പുതിയതോ ഉപയോഗിക്കാത്തതോ' },
  { value: 'Like New', label: 'Like New', desc: 'വളരെ കുറച്ച് ഉപയോഗിച്ച അവസ്ഥ' },
  { value: 'Good', label: 'Good', desc: 'നല്ല ഉപയോഗയോഗ്യമായ അവസ്ഥ' },
  { value: 'Usable', label: 'Usable', desc: 'ഉപയോഗിക്കാൻ കഴിയുന്ന അവസ്ഥ' }
];

export const CreateItem: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState(CONDITIONS[0].value);
  const [area, setArea] = useState('');
  
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Consents
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [consent3, setConsent3] = useState(false);
  const [consent4, setConsent4] = useState(false);
  const [consent5, setConsent5] = useState(false);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 5) {
      setError('പരമാവധി 5 ഫോട്ടോകൾ മാത്രമേ ചേർക്കാനാകൂ. (Maximum 5 images allowed)');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const processed = await Promise.all(files.map(processImage));
      setImages(prev => [...prev, ...processed]);
    } catch (err: any) {
      setError('ഫോട്ടോ പ്രോസസ്സ് ചെയ്യുന്നതിൽ തടസ്സം: ' + err.message);
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateDescription = (text: string) => {
    // Basic heuristics to reject numbers that look like phones/prices
    if (/(?:rs|rupees|\$|₹)\s*\d+/i.test(text)) return false; // price
    if (/\d{4,}/.test(text.replace(/[\s-()]/g, ''))) return false; // phone-like numbers
    if (text.includes('@')) return false; // email
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 3) {
      setError('സാധനത്തിന്റെ പേരിൽ കുറഞ്ഞത് 3 അക്ഷരങ്ങൾ ഉണ്ടായിരിക്കണം.');
      return;
    }

    if (description.trim().length < 20) {
      setError('സാധനത്തെക്കുറിച്ചുള്ള വിവരണം കുറഞ്ഞത് 20 അക്ഷരങ്ങൾ ഉണ്ടായിരിക്കണം.');
      return;
    }

    if (images.length === 0) {
      setError('കുറഞ്ഞത് ഒരു ഫോട്ടോയെങ്കിലും ചേർക്കുക. (At least 1 photo required)');
      return;
    }

    if (!area.trim()) {
      setError('ഏകദേശ സ്ഥലം/District നൽകുക.');
      return;
    }

    if (!validateDescription(description)) {
      setError('വിവരണത്തിൽ ഫോൺ നമ്പർ, വില (₹/Price), അല്ലെങ്കിൽ ഇമെയിൽ ചേർക്കാൻ അനുവാദമില്ല.');
      return;
    }

    if (!consent1 || !consent2 || !consent3 || !consent4 || !consent5) {
      setError('തുടരുന്നതിന് മുമ്പ് എല്ലാ സ്ഥിരീകരണ നിബന്ധനകളും അംഗീകരിക്കേണ്ടതുണ്ട്.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create Item Record
      const { data: itemData, error: itemError } = await supabase
        .from('items')
        .insert({
          donor_id: user!.id,
          title,
          category,
          description,
          condition,
          area,
          status: 'pending_moderation'
        })
        .select()
        .single();

      if (itemError) throw itemError;
      const itemId = itemData.id;

      // 2. Upload Images and Record Metadata
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const path = `items/${itemId}/webp/${Date.now()}-${i}.webp`;
        
        const { error: uploadError } = await supabase.storage
          .from('items')
          .upload(path, img.file, { contentType: 'image/webp' });

        if (uploadError) throw uploadError;

        await supabase.from('item_images').insert({
          item_id: itemId,
          storage_path: path,
          variant: 'webp',
          width: img.width,
          height: img.height,
          size_bytes: img.size_bytes
        });
      }

      // 3. Record Consents
      const consents = [
        { type: 'free_of_charge', text: "I confirm that I am giving this item completely free of charge." },
        { type: 'accurate_info', text: "I confirm that the information and photos I have provided are accurate to the best of my knowledge." },
        { type: 'public_display', text: "I understand that the item photos, item details, approximate location, and my display name may be displayed publicly on KAITHAANGU." },
        { type: 'private_contact', text: "I understand that my phone number, WhatsApp number, email address, and exact address will not be displayed publicly." },
        { type: 'contact_permission', text: "I understand that KAITHAANGU may contact me regarding this donation and may share the minimum necessary contact information with an approved recipient when required to complete an approved match." }
      ];

      const consentRecords = consents.map(c => ({
        user_id: user!.id,
        item_id: itemId,
        consent_type: c.type,
        consent_version: 'v1'
      }));

      const { error: consentError } = await supabase.from('consents').insert(consentRecords);
      if (consentError) throw consentError;

      // Success! Navigate to dashboard
      navigate('/dashboard', { state: { message: 'Item submitted successfully! It is pending moderation.' } });

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'സാധനം ഇപ്പോൾ സമർപ്പിക്കാൻ കഴിഞ്ഞില്ല. ദയവായി വീണ്ടും ശ്രമിക്കുക.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 120px)',
      background: 'var(--cloud-white)',
      padding: 'var(--space-8) var(--space-4)',
      fontFamily: 'var(--font-family)'
    }}>
      <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
        
        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'inline-block', marginBottom: 'var(--space-2)' }}>
            <Brand size="md" clickable={false} showTagline={false} />
          </div>
          
          <h1 style={{
            fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)',
            fontWeight: 800,
            color: 'var(--ink)',
            fontFamily: 'var(--font-malayalam)',
            marginBottom: 'var(--space-2)'
          }}>
            ഒരു സാധനം നൽകൂ. 💙
          </h1>

          <p style={{
            fontSize: 'var(--fs-body-lg)',
            color: 'var(--ink-secondary)',
            fontFamily: 'var(--font-malayalam)',
            maxWidth: '580px',
            margin: '0 auto 8px auto'
          }}>
            നിങ്ങൾക്ക് ഇനി ആവശ്യമില്ലാത്ത ഒരു നല്ല വസ്തു, അത് ആവശ്യമുള്ള മറ്റൊരാളുടെ കൈകളിലെത്തട്ടെ.
          </p>

          <Badge status="info" label="✨ കൈത്താങ്ങിൽ എല്ലാ സാധനങ്ങളും സൗജന്യമായാണ് നൽകുന്നത്" dot={false} />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-6)',
          alignItems: 'flex-start'
        }}>

          {/* Left / Main Column: Form Card */}
          <div style={{ gridColumn: 'span 2' }}>
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
                  marginBottom: 'var(--space-6)',
                  fontSize: 'var(--fs-body-sm)',
                  fontFamily: 'var(--font-malayalam)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '1rem' }}>⚠️</span>
                  <span style={{ flex: 1 }}>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

                {/* SECTION 01: ABOUT THE ITEM */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div style={{
                    fontSize: 'var(--fs-h4)',
                    fontWeight: 700,
                    color: 'var(--primary-blue)',
                    fontFamily: 'var(--font-malayalam)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>01</span>
                    <span>സാധനത്തെക്കുറിച്ച് (About the Item)</span>
                  </div>

                  {/* Title */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: 'var(--fs-label)', fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-malayalam)' }}>
                        സാധനത്തിന്റെ പേര് (Item Name)
                      </label>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>{title.length}/100</span>
                    </div>
                    <Input
                      type="text"
                      minLength={3}
                      maxLength={100}
                      required
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="ഉദാ. Study Table, Story Books, School Bag..."
                      helperText="3-100 അക്ഷരങ്ങൾ ഉപയോഗിച്ച് സാധനം വ്യക്തമാക്കുക."
                      style={{ fontFamily: 'var(--font-malayalam)' }}
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--fs-label)', fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-malayalam)' }}>
                      വിഭാഗം (Category)
                    </label>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                      gap: '8px'
                    }}>
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategory(cat)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-md)',
                            border: `1.5px solid ${category === cat ? 'var(--primary-blue)' : 'var(--soft-gray)'}`,
                            background: category === cat ? 'var(--soft-blue)' : 'var(--surface-white)',
                            color: category === cat ? 'var(--primary-blue)' : 'var(--ink)',
                            fontWeight: category === cat ? 700 : 500,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'var(--transition-fast)',
                            textAlign: 'center'
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Condition Cards */}
                  <div>
                    <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontSize: 'var(--fs-label)', fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-malayalam)' }}>
                      അവസ്ഥ (Condition)
                    </label>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: 'var(--space-3)'
                    }}>
                      {CONDITIONS.map(cond => (
                        <div
                          key={cond.value}
                          onClick={() => setCondition(cond.value)}
                          style={{
                            padding: 'var(--space-3)',
                            borderRadius: 'var(--radius-md)',
                            border: `2px solid ${condition === cond.value ? 'var(--primary-blue)' : 'var(--soft-gray)'}`,
                            background: condition === cond.value ? 'var(--soft-blue)' : 'var(--surface-white)',
                            cursor: 'pointer',
                            transition: 'var(--transition-fast)'
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink)' }}>{cond.label}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--ink-secondary)', fontFamily: 'var(--font-malayalam)', marginTop: '2px' }}>
                            {cond.desc}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: 'var(--fs-label)', fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-malayalam)' }}>
                        സാധനത്തെക്കുറിച്ച് കുറച്ച് പറയൂ (Description)
                      </label>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>{description.length}/1000</span>
                    </div>
                    <Textarea
                      minLength={20}
                      maxLength={1000}
                      required
                      rows={4}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="സാധനത്തിന്റെ ഉപയോഗം, വലിപ്പം, പ്രത്യേകതകൾ എന്നിവ വിവരിക്കുക. (കുറഞ്ഞത് 20 അക്ഷരങ്ങൾ)..."
                      helperText="🔒 വിവരണം മാത്രമായിരിക്കും പൊതുവായി കാണുക. ഫോൺ നമ്പർ, ഇമെയിൽ, വില എന്നിവ ചേർക്കരുത്."
                      style={{ fontFamily: 'var(--font-malayalam)' }}
                    />
                  </div>
                </div>

                {/* SECTION 02: PHOTOS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{
                    fontSize: 'var(--fs-h4)',
                    fontWeight: 700,
                    color: 'var(--primary-blue)',
                    fontFamily: 'var(--font-malayalam)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>02</span>
                    <span>ഫോട്ടോകൾ (Photos - 1 to 5)</span>
                  </div>

                  <div style={{
                    border: '2px dashed var(--soft-blue-border)',
                    background: 'var(--soft-blue)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-5)',
                    textAlign: 'center',
                    position: 'relative'
                  }}>
                    <input
                      type="file"
                      accept="image/jpeg, image/png, image/webp"
                      multiple
                      onChange={handleImageSelect}
                      disabled={isProcessing || images.length >= 5}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: images.length >= 5 ? 'not-allowed' : 'pointer'
                      }}
                    />
                    <div style={{ fontSize: '2rem', marginBottom: '4px' }}>📷</div>
                    <div style={{ fontWeight: 700, color: 'var(--primary-blue)', fontFamily: 'var(--font-malayalam)' }}>
                      {images.length >= 5 ? 'പരമാവധി 5 ഫോട്ടോകൾ ചേർത്തു' : 'ഫോട്ടോകൾ തിരഞ്ഞെടുക്കുക അല്ലെങ്കിൽ ഇങ്ങോട്ട് വലിച്ചിടുക'}
                    </div>
                    <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-muted)', marginTop: '4px', fontFamily: 'var(--font-malayalam)' }}>
                      JPG, PNG, WebP ഫോട്ടോകൾ ചേർക്കാം. വെളിച്ചമുള്ള യഥാർത്ഥ ഫോട്ടോകൾ സഹായകരമാണ്.
                    </div>
                  </div>

                  {isProcessing && (
                    <div style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--primary-blue)', fontFamily: 'var(--font-malayalam)' }}>
                      ⚡ ഫോട്ടോകൾ ഒപ്റ്റിമൈസ് ചെയ്യുന്നു...
                    </div>
                  )}

                  {/* Image Previews */}
                  {images.length > 0 && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                      gap: 'var(--space-3)',
                      marginTop: 'var(--space-2)'
                    }}>
                      {images.map((img, idx) => (
                        <div key={idx} style={{
                          position: 'relative',
                          height: '90px',
                          borderRadius: 'var(--radius-md)',
                          overflow: 'hidden',
                          border: '1px solid var(--soft-gray)'
                        }}>
                          <img src={img.previewUrl} alt={`Preview ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            title="Remove image"
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              background: 'rgba(0,0,0,0.6)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '22px',
                              height: '22px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem'
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SECTION 03: LOCATION */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{
                    fontSize: 'var(--fs-h4)',
                    fontWeight: 700,
                    color: 'var(--primary-blue)',
                    fontFamily: 'var(--font-malayalam)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>03</span>
                    <span>ഏകദേശ സ്ഥലം (Approximate Location)</span>
                  </div>

                  <Input
                    label="District / Locality"
                    type="text"
                    required
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    placeholder="ഉദാ. Kozhikode, Ernakulam, Kaloor..."
                    helperText="🔒 ഏകദേശ പ്രദേശം മാത്രം നൽകുക. വീട്ടുപേരോ കൃത്യമായ വിലാസമോ നൽകരുത്."
                    style={{ fontFamily: 'var(--font-malayalam)' }}
                  />
                </div>

                {/* SECTION 04: DONOR CONSENTS */}
                <div style={{
                  background: 'var(--cloud-white)',
                  border: '1px solid var(--soft-gray)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-5)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)'
                }}>
                  <div style={{
                    fontSize: 'var(--fs-h4)',
                    fontWeight: 700,
                    color: 'var(--ink)',
                    fontFamily: 'var(--font-malayalam)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>04</span>
                    <span>അവസാന സ്ഥിരീകരണം (Donor Consents)</span>
                  </div>

                  <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-muted)', fontFamily: 'var(--font-malayalam)', marginBottom: 'var(--space-2)' }}>
                    തുടരുന്നതിനായി താഴെ കാണുന്ന എല്ലാ വിവരങ്ങളും സ്ഥിരീകരിക്കേണ്ടതുണ്ട്:
                  </div>

                  <Checkbox
                    id="c1"
                    checked={consent1}
                    onChange={e => setConsent1(e.target.checked)}
                    label={<span style={{ fontFamily: 'var(--font-malayalam)', fontSize: 'var(--fs-body-sm)' }}>1. ഈ സാധനം പൂർണ്ണമായും സൗജന്യമായാണ് നൽകുന്നത് എന്ന് ഉറപ്പുനൽകുന്നു.</span>}
                  />

                  <Checkbox
                    id="c2"
                    checked={consent2}
                    onChange={e => setConsent2(e.target.checked)}
                    label={<span style={{ fontFamily: 'var(--font-malayalam)', fontSize: 'var(--fs-body-sm)' }}>2. നൽകിയിട്ടുള്ള വിവരങ്ങളും ഫോട്ടോകളും സത്യസന്ധവും കൃത്യവുമാണെന്ന് ഉറപ്പുനൽകുന്നു.</span>}
                  />

                  <Checkbox
                    id="c3"
                    checked={consent3}
                    onChange={e => setConsent3(e.target.checked)}
                    label={<span style={{ fontFamily: 'var(--font-malayalam)', fontSize: 'var(--fs-body-sm)' }}>3. ഫോട്ടോകളും വിവരങ്ങളും ഏകദേശ സ്ഥലവും കൈത്താങ്ങിൽ പൊതുവായി പ്രദർശിപ്പിക്കാം എന്ന് മനസ്സിലാക്കുന്നു.</span>}
                  />

                  <Checkbox
                    id="c4"
                    checked={consent4}
                    onChange={e => setConsent4(e.target.checked)}
                    label={<span style={{ fontFamily: 'var(--font-malayalam)', fontSize: 'var(--fs-body-sm)' }}>4. എന്റെ ഫോൺ നമ്പർ, വിലാസം, ഇമെയിൽ എന്നിവ പൊതുവായി പ്രദർശിപ്പിക്കില്ല എന്ന് അറിയാം.</span>}
                  />

                  <Checkbox
                    id="c5"
                    checked={consent5}
                    onChange={e => setConsent5(e.target.checked)}
                    label={<span style={{ fontFamily: 'var(--font-malayalam)', fontSize: 'var(--fs-body-sm)' }}>5. Match സ്ഥിരീകരിച്ച ശേഷം മാത്രം ആവശ്യമുള്ള ബന്ധപ്പെടൽ വിവരങ്ങൾ പങ്കിടാൻ സമ്മതിക്കുന്നു.</span>}
                  />
                </div>

                {/* Submit CTA */}
                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginTop: 'var(--space-2)' }}>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={isSubmitting || isProcessing}
                  >
                    {isSubmitting ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-malayalam)' }}>
                        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <circle cx="12" cy="12" r="10" strokeWidth="4" strokeDasharray="32" strokeDashoffset="10" />
                        </svg>
                        സമർപ്പിക്കുന്നു...
                      </span>
                    ) : (
                      <span style={{ fontFamily: 'var(--font-malayalam)', fontWeight: 600 }}>
                        സാധനം നൽകുക (Submit Item)
                      </span>
                    )}
                  </Button>
                </div>

              </form>
            </Card>
          </div>

          {/* Right Side: Community Privacy & Guidance Card */}
          <div>
            <Card style={{
              background: 'var(--soft-blue)',
              border: '1px solid var(--soft-blue-border)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-5)'
            }}>
              <div style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--ink)',
                fontFamily: 'var(--font-malayalam)',
                marginBottom: 'var(--space-3)'
              }}>
                💙 കൈത്താങ്ങ് കമ്മ്യൂണിറ്റി നയം
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
                fontSize: 'var(--fs-body-sm)',
                color: 'var(--ink-secondary)',
                fontFamily: 'var(--font-malayalam)',
                lineHeight: 1.5
              }}>
                <div>
                  <strong>🔒 സ്വകാര്യത:</strong> നിങ്ങളുടെ ഫോൺ നമ്പറോ വീട്ടുവിലാസമോ പൊതുവായി കാണിക്കില്ല.
                </div>
                <div>
                  <strong>🎁 സൗജന്യം:</strong> കൈത്താങ്ങിലെ എല്ലാ കൈമാറ്റങ്ങളും 100% സൗജന്യമാണ്.
                </div>
                <div>
                  <strong>🛡️ വെരിഫിക്കേഷൻ:</strong> ഓരോ ലിസ്റ്റിംഗും കൈത്താങ്ങ് അഡ്മിൻമാർ അവലോകനം ചെയ്ത ശേഷമാണ് പ്രസിദ്ധീകരിക്കുന്നത്.
                </div>
              </div>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
};

