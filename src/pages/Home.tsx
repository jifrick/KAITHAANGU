import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Typography } from '../components/common/Typography';
import { BrandIllustration } from '../components/common/Brand';
import type { Item, ItemImage } from '../types/database';

type ItemWithImages = Item & { item_images: ItemImage[] };

export const Home: React.FC = () => {
  const { user, profile } = useAuth();
  const [publishedItems, setPublishedItems] = useState<ItemWithImages[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  const giveItemRoute = user
    ? (profile?.role === 'donor' || profile?.role === 'both' ? '/create-item' : '/complete-profile')
    : '/login';

  useEffect(() => {
    fetchRecentPublishedItems();
  }, []);

  const fetchRecentPublishedItems = async () => {
    try {
      setLoadingItems(true);
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          item_images (*)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(6);

      if (!error && data) {
        setPublishedItems(data as ItemWithImages[]);
      }
    } catch (err) {
      console.error('Error fetching published items for homepage:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from('items').getPublicUrl(path);
    return data.publicUrl;
  };

  const categories = [
    { name: 'Books & Education', icon: '📚' },
    { name: 'Clothes', icon: '👕' },
    { name: 'Furniture', icon: '🪑' },
    { name: 'Electronics', icon: '💻' },
    { name: 'Toys', icon: '🧸' },
    { name: 'Household Items', icon: '🏠' },
    { name: 'Medical Equipment', icon: '🩺' },
    { name: 'Baby & Kids', icon: '🍼' },
    { name: 'Appliances', icon: '🔌' },
    { name: 'Other Useful Items', icon: '📦' },
  ];

  return (
    <div className="page-container" style={{ gap: 0 }}>

      {/* ====================================================================
          1. HERO SECTION
          ==================================================================== */}
      <section className="hero-section">
        <div>
          <div className="hero-eyebrow">
            <span style={{ fontSize: '1.1rem' }}>🤝</span> KAITHAANGU · COMMUNITY GIVING
          </div>

          <Typography as="h1" className="hero-title-ml" malayalam>
            “എനിക്ക് വേണ്ട,
            <br />
            നീ എടുത്തോ.”
          </Typography>

          <Typography className="hero-subtext-ml" malayalam>
            നിങ്ങൾക്ക് ഇനി ആവശ്യമില്ലാത്ത ഒരു നല്ല വസ്തു,
            അത് ആവശ്യമുള്ള മറ്റൊരാളുടെ കൈകളിലെത്തട്ടെ.
          </Typography>

          <Typography className="hero-subtext-en">
            Give what you don't need. Help someone who does. 100% Free. No selling, buying, or payments.
          </Typography>

          <div className="hero-actions">
            <Link to="/items">
              <Button variant="primary" size="lg">
                Browse Free Items
              </Button>
            </Link>
            <Link to={giveItemRoute}>
              <Button variant="secondary" size="lg">
                Give an Item
              </Button>
            </Link>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <BrandIllustration width="100%" />
        </div>
      </section>

      {/* ====================================================================
          2. TRUST / VALUE STRIP
          ==================================================================== */}
      <section className="trust-strip">
        <div className="trust-item">
          <div className="trust-icon">🎁</div>
          <div>
            <div className="trust-title">100% FREE</div>
            <p className="trust-desc">No buying. No selling. No payments or prices involved.</p>
          </div>
        </div>

        <div className="trust-item">
          <div className="trust-icon">🌱</div>
          <div>
            <div className="trust-title">COMMUNITY FIRST</div>
            <p className="trust-desc">Useful things reach people who genuinely need them.</p>
          </div>
        </div>

        <div className="trust-item">
          <div className="trust-icon">🛡️</div>
          <div>
            <div className="trust-title">SAFE & VERIFIED</div>
            <p className="trust-desc">User accounts and recipient verifications are reviewed for trust.</p>
          </div>
        </div>
      </section>

      {/* ====================================================================
          3. WHAT IS KAITHAANGU? SECTION
          ==================================================================== */}
      <section id="about" className="home-section">
        <div className="section-header">
          <Typography as="h2" className="section-title-ml" malayalam>
            കൈത്താങ്ങ് എന്താണ്?
          </Typography>
          <Typography className="subtitle">
            A modern community giving platform built around generosity, dignity, and mutual support.
          </Typography>
        </div>

        <Card style={{ padding: 'var(--space-8)', backgroundColor: 'var(--surface-white)' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <Typography malayalam style={{ fontSize: '1.2rem', lineHeight: 1.7, color: 'var(--ink)', marginBottom: 'var(--space-6)' }}>
              “നമ്മുടെ വീട്ടിൽ ഉപയോഗിക്കാതെ കിടക്കുന്ന പല സാധനങ്ങളും മറ്റൊരാൾക്ക് വളരെ ഉപകാരപ്പെടാം. കൈത്താങ്ങ് അത്തരം സാധനങ്ങൾ ആവശ്യമുള്ള ആളുകളിലേക്ക് സൗജന്യമായി എത്തിക്കാൻ സഹായിക്കുന്ന ഒരു community platform ആണ്.”
            </Typography>

            <div className="grid-responsive" style={{ marginTop: 'var(--space-8)' }}>
              <div style={{ textAlign: 'left', padding: 'var(--space-4)', backgroundColor: 'var(--soft-blue)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>🤝</div>
                <Typography as="h4" style={{ color: 'var(--primary-blue)', marginBottom: '4px' }}>100% സൗജന്യ പങ്കിടൽ</Typography>
                <Typography variant="body-sm" color="secondary">
                  No prices, no fees, and no commercial transactions. Everything is shared freely.
                </Typography>
              </div>

              <div style={{ textAlign: 'left', padding: 'var(--space-4)', backgroundColor: 'var(--soft-rose)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>🛡️</div>
                <Typography as="h4" style={{ color: 'var(--secondary-rose-hover)', marginBottom: '4px' }}>അന്തസ്സും വിശ്വസ്തതയും</Typography>
                <Typography variant="body-sm" color="secondary">
                  Personal details and applicant verification reasons remain strictly private and reviewed by admins.
                </Typography>
              </div>

              <div style={{ textAlign: 'left', padding: 'var(--space-4)', backgroundColor: 'var(--soft-gray)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 'var(--space-2)' }}>🏡</div>
                <Typography as="h4" style={{ color: 'var(--ink)', marginBottom: '4px' }}>പ്രദേശിക സഹായം</Typography>
                <Typography variant="body-sm" color="secondary">
                  Connect donors and recipients within your local area across Kerala.
                </Typography>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* ====================================================================
          4. HOW IT WORKS SECTION
          ==================================================================== */}
      <section id="how-it-works" className="home-section">
        <div className="section-header">
          <Typography as="h2" className="section-title-ml" malayalam>
            എങ്ങനെ പ്രവർത്തിക്കുന്നു?
          </Typography>
          <Typography className="subtitle">
            4 simple steps to give or receive useful items in the community.
          </Typography>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <span className="step-number">01 — GIVE</span>
            <span className="step-title">വസ്തു പങ്കിടുക</span>
            <p className="step-desc">
              നിങ്ങൾക്ക് ഇനി ആവശ്യമില്ലാത്ത ഒരു ഉപയോഗപ്രദമായ വസ്തു പങ്കിടുക.
            </p>
          </div>

          <div className="step-card">
            <span className="step-number">02 — FIND</span>
            <span className="step-title">സാധനങ്ങൾ കണ്ടെത്താം</span>
            <p className="step-desc">
              ആവശ്യമുള്ളവർക്ക് ലഭ്യമായ സാധനങ്ങൾ കണ്ടെത്താം.
            </p>
          </div>

          <div className="step-card">
            <span className="step-number">03 — CONNECT</span>
            <span className="step-title">Connection ഉണ്ടാകും</span>
            <p className="step-desc">
              അനുയോജ്യമായ request review ചെയ്ത ശേഷം connection ഉണ്ടാകും.
            </p>
          </div>

          <div className="step-card">
            <span className="step-number">04 — HAND OVER</span>
            <span className="step-title">കൈമാറുക</span>
            <p className="step-desc">
              വസ്തു ആവശ്യമായ വ്യക്തിയുടെ കൈകളിലെത്തിക്കുക.
            </p>
          </div>
        </div>
      </section>

      {/* ====================================================================
          5. WHAT CAN YOU GIVE? CATEGORY SHOWCASE
          ==================================================================== */}
      <section className="home-section">
        <div className="section-header">
          <Typography as="h2" className="section-title-ml" malayalam>
            നിങ്ങൾക്ക് എന്തൊക്കെ നൽകാം?
          </Typography>
          <Typography className="subtitle">
            Examples of useful items you can share with people who need them.
          </Typography>
        </div>

        <div className="category-grid">
          {categories.map((cat, idx) => (
            <div key={idx} className="category-card">
              <span className="category-icon">{cat.icon}</span>
              <span className="category-name">{cat.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ====================================================================
          6. CURATED PUBLISHED ITEMS SECTION
          ==================================================================== */}
      <section className="home-section">
        <div className="section-header">
          <Typography as="h2" className="section-title-ml" malayalam>
            അടുത്തിടെ പങ്കുവെച്ചവ
          </Typography>
          <Typography className="subtitle">
            Browse items available for free in the community right now.
          </Typography>
        </div>

        {loadingItems ? (
          <div className="loader-container">
            <div className="loader-spinner" />
            <span>Loading community items...</span>
          </div>
        ) : publishedItems.length > 0 ? (
          <>
            <div className="grid-responsive" style={{ marginBottom: 'var(--space-8)' }}>
              {publishedItems.map(item => {
                const imageUrl = item.item_images && item.item_images.length > 0
                  ? getPublicUrl(item.item_images[0].storage_path)
                  : null;

                return (
                  <div key={item.id} className="item-card">
                    {imageUrl ? (
                      <img src={imageUrl} alt={item.title} className="item-card-image" />
                    ) : (
                      <div className="item-card-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-muted)' }}>
                        No Image Available
                      </div>
                    )}
                    <div className="item-card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                        <Typography as="h3" style={{ fontSize: '1.05rem', margin: 0 }}>
                          {item.title}
                        </Typography>
                        <Badge status="published" label="FREE" dot={false} />
                      </div>

                      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
                        <Badge status="info" label={item.category} dot={false} />
                        <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-muted)', background: 'var(--soft-gray)', padding: '2px 8px', borderRadius: 'var(--radius-pill)' }}>
                          {item.condition}
                        </span>
                        {item.area && (
                          <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--ink-secondary)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            📍 {item.area}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ textAlign: 'center' }}>
              <Link to="/items">
                <Button variant="primary" size="md">
                  എല്ലാ സാധനങ്ങളും കാണുക (Browse All Items)
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <Card style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>🌱</div>
            <Typography malayalam style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-blue)', marginBottom: 'var(--space-2)' }}>
              “ഇപ്പോൾ പുതിയ സാധനങ്ങൾ ലഭ്യമാകാനായി കാത്തിരിക്കുകയാണ്.”
            </Typography>
            <Typography malayalam style={{ color: 'var(--ink-secondary)', marginBottom: 'var(--space-6)' }}>
              നിങ്ങളുടെ വീട്ടിൽ ആവശ്യമില്ലാത്ത എന്തെങ്കിലും ഉണ്ടോ?
            </Typography>
            <Link to={giveItemRoute}>
              <Button variant="primary" size="md">
                ഒരു സാധനം നൽകൂ (Give an Item)
              </Button>
            </Link>
          </Card>
        )}
      </section>

      {/* ====================================================================
          7. COMMUNITY MESSAGE SECTION
          ==================================================================== */}
      <section className="community-banner">
        <Typography malayalam style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)', fontWeight: 800, color: 'var(--primary-blue)', marginBottom: 'var(--space-3)' }}>
          “നിങ്ങൾക്ക് വേണ്ടാത്തത്,
          <br />
          മറ്റൊരാൾക്ക് ആവശ്യമാകാം.”
        </Typography>

        <Typography malayalam style={{ fontSize: '1.15rem', color: 'var(--ink-secondary)', maxWidth: '600px', margin: '0 auto' }}>
          ഒരു ചെറിയ പങ്കിടൽ പോലും ഒരാളുടെ ദിവസത്തിൽ വലിയ മാറ്റമാകാം.
        </Typography>
      </section>

      {/* ====================================================================
          8. FINAL CALL TO ACTION SECTION
          ==================================================================== */}
      <section className="cta-box" style={{ marginBottom: 'var(--space-12)' }}>
        <Typography malayalam style={{ fontSize: 'clamp(1.35rem, 3vw, 1.85rem)', fontWeight: 700, color: 'var(--ink)', marginBottom: 'var(--space-2)' }}>
          നിങ്ങളുടെ വീട്ടിൽ ഉപയോഗിക്കാതെ കിടക്കുന്ന എന്തെങ്കിലും ഉണ്ടോ?
        </Typography>

        <Typography malayalam style={{ fontSize: '1.1rem', color: 'var(--ink-muted)', marginBottom: 'var(--space-8)' }}>
          അത് മറ്റൊരാൾക്ക് ആവശ്യമുള്ളതായിരിക്കാം.
        </Typography>

        <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to={giveItemRoute}>
            <Button variant="primary" size="lg">
              Give an Item
            </Button>
          </Link>
          <Link to="/items">
            <Button variant="secondary" size="lg">
              Browse Free Items
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
};
