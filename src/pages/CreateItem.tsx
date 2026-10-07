import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { processImage } from '../utils/imageProcessor';
import type { ProcessedImage } from '../utils/imageProcessor';

const CATEGORIES = [
  'Books & Education', 'Clothes', 'Furniture', 'Electronics', 
  'Toys', 'Household Items', 'Medical Equipment', 'Baby & Kids', 
  'Appliances', 'Other'
];

const CONDITIONS = ['New', 'Like New', 'Good', 'Usable'];

export const CreateItem: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState(CONDITIONS[0]);
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
      setError('Maximum 5 images allowed');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const processed = await Promise.all(files.map(processImage));
      setImages(prev => [...prev, ...processed]);
    } catch (err: any) {
      setError('Failed to process one or more images: ' + err.message);
    } finally {
      setIsProcessing(false);
      // Reset input
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

    if (images.length === 0) {
      setError('At least one photo is required');
      return;
    }

    if (!validateDescription(description)) {
      setError('Description cannot contain prices, phone numbers, or email addresses.');
      return;
    }

    if (!consent1 || !consent2 || !consent3 || !consent4 || !consent5) {
      setError('You must agree to all terms before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create Item Record (Draft state initially to handle image uploads)
      const { data: itemData, error: itemError } = await supabase
        .from('items')
        .insert({
          donor_id: user!.id,
          title,
          category,
          description,
          condition,
          area,
          status: 'pending_moderation' // Submit directly for moderation per PRD flow
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
      setError(err.message || 'An error occurred while submitting your item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="card" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <h2>Give an Item</h2>
        <p className="subtitle">Thank you for sharing with the community. Remember, all items must be completely free.</p>

        {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', padding: '1rem', background: 'var(--soft-rose)', borderRadius: '8px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          
          <div className="form-group">
            <label>Item Name (3-100 characters)</label>
            <input type="text" minLength={3} maxLength={100} required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Wooden Study Table" />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
            <div className="form-group" style={{ flex: 1 }}>
              <label>Condition</label>
              <select value={condition} onChange={e => setCondition(e.target.value)}>
                {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Approximate Location (District / Locality)</label>
            <input type="text" required value={area} onChange={e => setArea(e.target.value)} placeholder="e.g., Ernakulam, Kaloor" />
            <small style={{ color: 'var(--text-muted)' }}>Do not enter your exact home address here.</small>
          </div>

          <div className="form-group">
            <label>Description (20-1000 characters)</label>
            <textarea 
              minLength={20} 
              maxLength={1000} 
              required 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the item, its history, any defects, etc. Do NOT include phone numbers or prices."
            />
          </div>

          <div className="form-group">
            <label>Photos (1 to 5 images)</label>
            <input 
              type="file" 
              accept="image/jpeg, image/png, image/webp" 
              multiple 
              onChange={handleImageSelect}
              disabled={isProcessing || images.length >= 5}
            />
            {isProcessing && <p style={{ color: 'var(--primary-blue)' }}>Processing images...</p>}
            
            <div className="image-preview-grid">
              {images.map((img, idx) => (
                <div key={idx} className="image-preview-item">
                  <img src={img.previewUrl} alt={`Preview ${idx + 1}`} />
                  <button type="button" onClick={() => removeImage(idx)} title="Remove">✕</button>
                </div>
              ))}
            </div>
          </div>

          <hr style={{ margin: '2rem 0', borderColor: 'var(--soft-gray)' }} />
          <h3>Donor Consent</h3>
          
          <div className="checkbox-group">
            <input type="checkbox" id="c1" checked={consent1} onChange={e => setConsent1(e.target.checked)} />
            <label htmlFor="c1">I confirm that I am giving this item completely free of charge.</label>
          </div>
          
          <div className="checkbox-group">
            <input type="checkbox" id="c2" checked={consent2} onChange={e => setConsent2(e.target.checked)} />
            <label htmlFor="c2">I confirm that the information and photos I have provided are accurate to the best of my knowledge.</label>
          </div>
          
          <div className="checkbox-group">
            <input type="checkbox" id="c3" checked={consent3} onChange={e => setConsent3(e.target.checked)} />
            <label htmlFor="c3">I understand that the item photos, item details, approximate location, and my display name may be displayed publicly on KAITHAANGU.</label>
          </div>

          <div className="checkbox-group">
            <input type="checkbox" id="c4" checked={consent4} onChange={e => setConsent4(e.target.checked)} />
            <label htmlFor="c4">I understand that my phone number, WhatsApp number, email address, and exact address will not be displayed publicly.</label>
          </div>

          <div className="checkbox-group">
            <input type="checkbox" id="c5" checked={consent5} onChange={e => setConsent5(e.target.checked)} />
            <label htmlFor="c5">I understand that KAITHAANGU may contact me regarding this donation and may share the minimum necessary contact information with an approved recipient when required to complete an approved match.</label>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '1.5rem', width: '100%' }} disabled={isSubmitting || isProcessing}>
            {isSubmitting ? 'Submitting...' : 'Submit Item for Moderation'}
          </button>
        </form>
      </div>
    </div>
  );
};
