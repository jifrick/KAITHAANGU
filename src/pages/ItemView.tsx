import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Typography } from '../components/common/Typography';
import { Textarea, Select } from '../components/ui/Input';
import type { Item, ItemImage, Profile } from '../types/database';

type ItemDetail = Item & { 
  item_images: ItemImage[];
  donor: Profile;
};

const getCategoryIcon = (catName: string) => {
  switch (catName) {
    case 'Books & Education': return '📚';
    case 'Clothes': return '👕';
    case 'Furniture': return '🪑';
    case 'Electronics': return '💻';
    case 'Toys': return '🧸';
    case 'Household Items': return '🏠';
    case 'Medical Equipment': return '🩺';
    case 'Baby & Kids': return '🍼';
    case 'Appliances': return '🔌';
    default: return '📦';
  }
};

const getConditionExplanation = (cond: string) => {
  switch (cond) {
    case 'New': return 'പുതിയതോ ഉപയോഗിക്കാത്തതോ ആയത്';
    case 'Like New': return 'വളരെ കുറച്ച് ഉപയോഗിച്ച അവസ്ഥ';
    case 'Good': return 'നല്ല ഉപയോഗയോഗ്യമായ അവസ്ഥ';
    case 'Usable': return 'ഉപയോഗിക്കാൻ കഴിയുന്ന അവസ്ഥ';
    default: return 'ഉപയോഗയോഗ്യമായ അവസ്ഥ';
  }
};

export const ItemView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { profile, user } = useAuth();
  
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Request & Verification Statuses
  const [isRecipientApproved, setIsRecipientApproved] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  
  const [requestReason, setRequestReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Reporting Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  useEffect(() => {
    fetchItemDetails();
    if (user && profile?.role === 'recipient') {
      checkRecipientStatus();
    }
  }, [id, user, profile]);

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          item_images (*),
          donor:profiles!items_donor_id_fkey (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setItem(data as any);
    } catch (err: any) {
      console.error('Error fetching item details:', err);
      setError('ഈ സാധനം കണ്ടെത്താനായില്ല. സാധനം നീക്കം ചെയ്തതാകാം, അല്ലെങ്കിൽ ഇപ്പോൾ ലഭ്യമല്ല.');
    } finally {
      setLoading(false);
    }
  };

  const checkRecipientStatus = async () => {
    try {
      // Check if recipient is approved
      const { data: verification } = await supabase
        .from('recipient_verifications')
        .select('status')
        .eq('user_id', user!.id)
        .single();
        
      if (verification?.status === 'approved') {
        setIsRecipientApproved(true);
      }

      // Check if recipient has already requested this item
      const { data: existingRequest } = await supabase
        .from('item_requests')
        .select('id')
        .eq('item_id', id)
        .eq('recipient_id', user!.id)
        .single();
        
      if (existingRequest) {
        setHasRequested(true);
      }
    } catch (err) {
      console.error('Error checking recipient status:', err);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestReason || requestReason.trim().length < 10) {
      alert('ദയവായി കുറഞ്ഞത് 10 അക്ഷരങ്ങളുള്ള കാരണം രേഖപ്പെടുത്തുക. (Please provide a valid reason - minimum 10 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('item_requests')
        .insert({
          item_id: item!.id,
          recipient_id: user!.id,
          reason: requestReason.trim(),
          status: 'pending'
        });

      if (error) throw error;
      setHasRequested(true);
    } catch (err: any) {
      alert(err.message || 'Failed to submit request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason) return;
    
    setReportSubmitting(true);
    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user?.id || null,
          target_type: 'item',
          target_id: item!.id,
          reason: reportReason,
          status: 'open'
        });

      if (error) throw error;
      alert('റിപ്പോർട്ട് വിജയകരമായി സമർപ്പിച്ചു. ഞങ്ങളുടെ അഡ്മിൻ ടീം ഇത് പരിശോധിക്കും. (Report submitted successfully.)');
      setShowReportModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to submit report.');
    } finally {
      setReportSubmitting(false);
    }
  };

  const getPublicUrl = (path: string) => {
    return supabase.storage.from('items').getPublicUrl(path).data.publicUrl;
  };

  /* ========================================================================
     LOADING SKELETON STATE
     ======================================================================== */
  if (loading) {
    return (
      <div className="page-container">
        <div className="item-detail-layout">
          <div>
            <div className="skeleton-image" style={{ height: '360px', borderRadius: 'var(--radius-lg)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="skeleton-text" style={{ width: '40%', height: '24px' }} />
            <div className="skeleton-text" style={{ width: '85%', height: '32px' }} />
            <div className="skeleton-text" style={{ width: '60%', height: '20px' }} />
            <div className="skeleton-text" style={{ width: '100%', height: '120px', marginTop: 'var(--space-4)' }} />
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================================
     ERROR / NOT FOUND STATE
     ======================================================================== */
  if (error || !item) {
    return (
      <div className="page-container">
        <Card style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>🌱</div>
          <Typography malayalam style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--primary-blue)', marginBottom: 'var(--space-2)' }}>
            ഈ സാധനം കണ്ടെത്താനായില്ല.
          </Typography>
          <Typography malayalam style={{ color: 'var(--ink-secondary)', maxWidth: '520px', margin: '0 auto var(--space-6) auto', lineHeight: 1.6 }}>
            സാധനം നീക്കം ചെയ്തതാകാം, അല്ലെങ്കിൽ ഇപ്പോൾ ലഭ്യമല്ല. മറ്റ് സാധനങ്ങൾ തിരയാൻ താഴെയുള്ള ബട്ടൺ ക്ലിക്ക് ചെയ്യുക.
          </Typography>
          <Link to="/items">
            <Button variant="primary" size="lg">
              സാധനങ്ങൾ കാണുക (Browse Free Items)
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const hasImages = item.item_images && item.item_images.length > 0;
  const currentImageUrl = hasImages ? getPublicUrl(item.item_images[selectedImageIndex]?.storage_path || item.item_images[0].storage_path) : null;
  const catIcon = getCategoryIcon(item.category);

  return (
    <div className="page-container">
      
      {/* Breadcrumb Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--fs-body-sm)', color: 'var(--ink-muted)' }}>
        <Link to="/items" style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>← Back to Browse Items</Link>
        <span>/</span>
        <span>{item.category}</span>
      </div>

      <div className="item-detail-layout">

        {/* ==================================================================
            LEFT COLUMN: IMAGE GALLERY
            ================================================================== */}
        <div>
          <div className="gallery-primary-container">
            {currentImageUrl ? (
              <img src={currentImageUrl} alt={item.title} className="gallery-primary-img" />
            ) : (
              <div 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  backgroundColor: 'var(--soft-blue)',
                  color: 'var(--primary-blue)',
                  gap: 'var(--space-3)'
                }}
              >
                <span style={{ fontSize: '4rem' }}>{catIcon}</span>
                <span style={{ fontSize: 'var(--fs-body-sm)', fontWeight: 700, letterSpacing: '0.05em' }}>
                  KAITHAANGU COMMUNITY GIVING
                </span>
              </div>
            )}

            {/* Photo Counter Pill */}
            {hasImages && item.item_images.length > 1 && (
              <span 
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  backgroundColor: 'rgba(23, 32, 51, 0.75)',
                  color: '#ffffff',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: 'var(--fs-caption)',
                  fontWeight: 600
                }}
              >
                Photo {selectedImageIndex + 1} of {item.item_images.length}
              </span>
            )}
          </div>

          {/* Thumbnail Strip */}
          {hasImages && item.item_images.length > 1 && (
            <div className="gallery-thumbnails">
              {item.item_images.map((img, idx) => (
                <img
                  key={img.id}
                  src={getPublicUrl(img.storage_path)}
                  alt={`Thumbnail ${idx + 1}`}
                  className={`gallery-thumb ${selectedImageIndex === idx ? 'active' : ''}`}
                  onClick={() => setSelectedImageIndex(idx)}
                />
              ))}
            </div>
          )}

          {/* Privacy & Safety Note Box */}
          <div 
            style={{ 
              marginTop: 'var(--space-6)', 
              padding: 'var(--space-4)', 
              backgroundColor: 'var(--soft-blue)', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--soft-blue-border)',
              display: 'flex',
              gap: 'var(--space-3)',
              alignItems: 'flex-start'
            }}
          >
            <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>🔒</span>
            <Typography variant="body-sm" color="secondary" malayalam style={{ margin: 0 }}>
              സ്വകാര്യതയും സുരക്ഷയും മുൻനിർത്തി കൃത്യമായ വിലാസവും ഫോൺ നമ്പറും Match സ്ഥിരീകരിച്ച ശേഷം മാത്രം പങ്കിടും.
            </Typography>
          </div>
        </div>

        {/* ==================================================================
            RIGHT COLUMN: ITEM INFORMATION & REQUEST ACTION
            ================================================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          
          {/* Header Badges & Report Link */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <Badge status="info" label={item.category} dot={false} />
                <span 
                  style={{
                    backgroundColor: 'var(--soft-rose)',
                    color: 'var(--secondary-rose-active)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: 'var(--fs-caption)',
                    fontWeight: 700,
                    border: '1px solid var(--soft-rose-border)'
                  }}
                >
                  🎁 സൗജന്യമായി നൽകുന്നു (100% FREE)
                </span>
              </div>

              <button 
                onClick={() => setShowReportModal(true)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--ink-muted)', 
                  cursor: 'pointer', 
                  textDecoration: 'underline', 
                  fontSize: 'var(--fs-caption)',
                  fontWeight: 600
                }}
              >
                🚩 Report Item
              </button>
            </div>

            {/* Title */}
            <Typography as="h1" style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', margin: '0 0 var(--space-3) 0', lineHeight: 1.25 }}>
              {item.title}
            </Typography>

            {/* Condition & Location Tags */}
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
              <span 
                style={{
                  backgroundColor: 'var(--soft-gray)',
                  color: 'var(--ink)',
                  padding: '0.3rem 0.8rem',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: 'var(--fs-body-sm)',
                  fontWeight: 600
                }}
              >
                Condition: {item.condition} ({getConditionExplanation(item.condition)})
              </span>

              {item.area && (
                <span style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-secondary)', fontWeight: 600 }}>
                  📍 {item.area} (ഏകദേശ സ്ഥലം)
                </span>
              )}
            </div>
          </div>

          {/* Description Section */}
          <div style={{ padding: 'var(--space-5)', backgroundColor: 'var(--surface-white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
            <Typography as="h3" malayalam style={{ fontSize: 'var(--fs-h4)', marginBottom: 'var(--space-3)', color: 'var(--ink)' }}>
              ഇതിനെക്കുറിച്ച് (About this item)
            </Typography>
            <Typography style={{ whiteSpace: 'pre-wrap', color: 'var(--ink-secondary)', margin: 0, lineHeight: 1.6 }}>
              {item.description}
            </Typography>
          </div>

          {/* Donor & Location Card */}
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
              gap: 'var(--space-4)', 
              backgroundColor: 'var(--cloud-white)', 
              padding: 'var(--space-4) var(--space-5)', 
              borderRadius: 'var(--radius-md)', 
              border: '1px solid var(--border-subtle)' 
            }}
          >
            <div>
              <Typography variant="caption" color="muted" style={{ display: 'block', marginBottom: '2px' }}>GIVEN BY</Typography>
              <Typography variant="body" style={{ fontWeight: 700, margin: 0 }}>
                {item.donor?.name || 'Community Donor'}
              </Typography>
            </div>

            <div>
              <Typography variant="caption" color="muted" style={{ display: 'block', marginBottom: '2px' }}>APPROXIMATE LOCATION</Typography>
              <Typography variant="body" style={{ fontWeight: 700, margin: 0 }}>
                📍 {item.area || 'Kerala'}
              </Typography>
            </div>
          </div>

          {/* ==================================================================
              REQUEST ACTION BOX & AUTHENTICATION STATES
              ================================================================== */}
          <Card style={{ border: '2px solid var(--soft-blue-border)', backgroundColor: 'var(--surface-white)' }}>
            
            {/* State 1: Item Not Published / Available */}
            {item.status !== 'published' ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-3)' }}>
                <Typography malayalam style={{ margin: 0, color: 'var(--ink-muted)', fontWeight: 600 }}>
                  ഈ സാധനം ഇപ്പോൾ ലഭ്യമായിട്ടില്ല (This item is no longer available).
                </Typography>
              </div>

            /* State 2: Anonymous User */
            ) : !user ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-3)' }}>
                <Typography malayalam style={{ marginBottom: 'var(--space-4)', fontWeight: 600, color: 'var(--ink)' }}>
                  ഈ സാധനം അഭ്യർത്ഥിക്കാൻ പ്രവേശിക്കുക. (Sign in as a recipient to request items.)
                </Typography>
                <Link to="/login">
                  <Button variant="primary" size="lg" fullWidth>
                    Sign in to Request
                  </Button>
                </Link>
              </div>

            /* State 3: Logged in as Donor */
            ) : profile?.role === 'donor' ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-3)' }}>
                <Typography malayalam style={{ margin: 0, color: 'var(--ink-muted)', fontWeight: 600 }}>
                  നിങ്ങൾ Donor അക്കൗണ്ടിലാണ് ഉള്ളത്. Recipient അക്കൗണ്ടുകൾക്ക് മാത്രമേ സാധനങ്ങൾ അഭ്യർത്ഥിക്കാൻ സാധിക്കൂ.
                </Typography>
              </div>

            /* State 4: Logged in as Admin */
            ) : profile?.role === 'admin' ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-3)' }}>
                <Typography malayalam style={{ margin: 0, color: 'var(--ink-muted)', fontWeight: 600 }}>
                  നിങ്ങൾ Admin അക്കൗണ്ടിലാണ് ഉള്ളത്. Admin അക്കൗണ്ടുകൾക്ക് സാധനങ്ങൾ അഭ്യർത്ഥിക്കാൻ സാധിക്കില്ല.
                </Typography>
              </div>

            /* State 5: Already Requested */
            ) : hasRequested ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-4)', backgroundColor: 'var(--success-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--success-border)' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>✓</div>
                <Typography malayalam style={{ color: 'var(--success-text)', fontWeight: 700, margin: 0 }}>
                  നിങ്ങൾ ഈ സാധനത്തിനായി അഭ്യർത്ഥന നൽകിയിട്ടുണ്ട്. അഡ്മിൻ റിവ്യൂവിന് ശേഷം നിങ്ങളെ അറിയിക്കും.
                </Typography>
              </div>

            /* State 6: Pending Verification Recipient */
            ) : !isRecipientApproved ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-4)', backgroundColor: 'var(--warning-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--warning-border)' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>⏳</div>
                <Typography malayalam style={{ color: 'var(--warning-text)', fontWeight: 700, margin: 0 }}>
                  നിങ്ങളുടെ അക്കൗണ്ട് അഡ്മിൻ പരിശോധനയിലാണ്. വരിഫിക്കേഷൻ പൂർത്തിയായ ശേഷം അഭ്യർത്ഥിക്കാം.
                </Typography>
              </div>

            /* State 7: Eligible Approved Recipient Form */
            ) : (
              <form onSubmit={handleRequestSubmit}>
                <Typography as="h3" malayalam style={{ fontSize: 'var(--fs-h3)', marginTop: 0, marginBottom: 'var(--space-2)', color: 'var(--primary-blue)' }}>
                  ഈ സാധനം അഭ്യർത്ഥിക്കുക (Request this item)
                </Typography>
                
                <Typography variant="body-sm" color="secondary" malayalam style={{ marginBottom: 'var(--space-4)' }}>
                  നിങ്ങൾക്ക് ഈ സാധനം എന്തുകൊണ്ട് ആവശ്യമാണെന്ന് വ്യക്തമാക്കുക. അഡ്മിൻ ടീം ഇത് പരിശോധിച്ച് അർഹരായവർക്ക് മുൻഗണന നൽകും.
                </Typography>

                <Textarea
                  value={requestReason}
                  onChange={e => setRequestReason(e.target.value)}
                  placeholder="ഉദാഹരണത്തിന്: എനിക്ക് മകളുടെ പഠനാവശ്യത്തിനായി ഒരു മേശ ആവശ്യമുണ്ട്."
                  required
                  minLength={10}
                  helperText="കുറഞ്ഞത് 10 അക്ഷരങ്ങൾ രേഖപ്പെടുത്തുക."
                />

                <Button 
                  type="submit" 
                  variant="primary" 
                  size="lg" 
                  fullWidth 
                  loading={isSubmitting}
                  style={{ marginTop: 'var(--space-4)' }}
                >
                  {isSubmitting ? 'Submitting...' : 'അഭ്യർത്ഥന സമർപ്പിക്കുക (Submit Request)'}
                </Button>
              </form>
            )}
          </Card>

          {/* ==================================================================
              HOW REQUESTING WORKS WORKFLOW BOX
              ================================================================== */}
          <div style={{ padding: 'var(--space-5)', backgroundColor: 'var(--surface-white)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
            <Typography as="h4" malayalam style={{ fontSize: 'var(--fs-body)', fontWeight: 700, marginBottom: 'var(--space-3)' }}>
              അഭ്യർത്ഥിച്ചാൽ എന്ത് സംഭവിക്കും?
            </Typography>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--space-3)' }}>
              <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-secondary)' }}>
                <strong style={{ color: 'var(--primary-blue)', display: 'block', marginBottom: '2px' }}>01. അഭ്യർത്ഥിക്കുക</strong>
                കാരണം വ്യക്തമാക്കി request സമർപ്പിക്കുക.
              </div>

              <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-secondary)' }}>
                <strong style={{ color: 'var(--primary-blue)', display: 'block', marginBottom: '2px' }}>02. Review</strong>
                അഡ്മിൻ ടീം ആവശ്യം പരിശോധിച്ച് അവലോകനം ചെയ്യും.
              </div>

              <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-secondary)' }}>
                <strong style={{ color: 'var(--primary-blue)', display: 'block', marginBottom: '2px' }}>03. Connect</strong>
                Match ഉറപ്പാക്കിയാൽ വിവരങ്ങൾ പങ്കിടും.
              </div>

              <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-secondary)' }}>
                <strong style={{ color: 'var(--primary-blue)', display: 'block', marginBottom: '2px' }}>04. Hand Over</strong>
                നേരിട്ട് വസ്തു കൈമാറാം.
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ====================================================================
          REPORT ITEM MODAL
          ==================================================================== */}
      {showReportModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <Typography as="h3" style={{ marginTop: 0, marginBottom: 'var(--space-2)' }}>
              Report this Item
            </Typography>

            <Typography variant="body-sm" color="muted" style={{ marginBottom: 'var(--space-4)' }}>
              Help us keep KAITHAANGU safe and free from commercial sales or fraud.
            </Typography>

            <form onSubmit={handleReportSubmit}>
              <Select
                label="Reason for reporting"
                required
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
              >
                <option value="" disabled>Select a reason...</option>
                <option value="Asking for money">Asking for money (Not Free)</option>
                <option value="Fake item">Fake item</option>
                <option value="Misleading description">Misleading description</option>
                <option value="Fraud">Fraud</option>
                <option value="Spam">Spam</option>
                <option value="Harassment">Harassment</option>
                <option value="Suspicious account">Suspicious account</option>
                <option value="Other">Other</option>
              </Select>

              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="md" 
                  fullWidth 
                  onClick={() => setShowReportModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="danger" 
                  size="md" 
                  fullWidth 
                  loading={reportSubmitting}
                >
                  {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
