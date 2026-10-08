import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Typography } from '../components/common/Typography';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import type { Item, ItemImage } from '../types/database';

type ItemWithImages = Item & { item_images: ItemImage[] };

const CATEGORIES = [
  'All',
  'Books & Education',
  'Clothes',
  'Furniture',
  'Electronics',
  'Toys',
  'Household Items',
  'Medical Equipment',
  'Baby & Kids',
  'Appliances',
  'Other'
];

const CONDITIONS = [
  'All',
  'New',
  'Like New',
  'Good',
  'Usable'
];

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

const getPublicUrl = (path: string) => {
  return supabase.storage.from('items').getPublicUrl(path).data.publicUrl;
};

export const BrowseItems: React.FC = () => {
  const { user, profile } = useAuth();
  const [allItems, setAllItems] = useState<ItemWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<string>('All');
  const [condition, setCondition] = useState<string>('All');
  const [selectedArea, setSelectedArea] = useState<string>('All');
  
  // Mobile drawer state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const giveItemRoute = user
    ? (profile?.role === 'donor' || profile?.role === 'both' ? '/create-item' : '/complete-profile')
    : '/login';

  useEffect(() => {
    fetchPublishedItems();
  }, []);

  const fetchPublishedItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          item_images (*)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllItems((data as ItemWithImages[]) || []);
    } catch (err: any) {
      console.error('Error loading items:', err);
      setError('സാധനങ്ങൾ ഇപ്പോൾ ലോഡ് ചെയ്യാൻ കഴിഞ്ഞില്ല. ദയവായി വീണ്ടും ശ്രമിക്കുക.');
    } finally {
      setLoading(false);
    }
  };

  // Distinct Areas extracted from fetched published items
  const availableAreas = useMemo(() => {
    const areasSet = new Set<string>();
    allItems.forEach(item => {
      if (item.area && item.area.trim()) {
        areasSet.add(item.area.trim());
      }
    });
    return ['All', ...Array.from(areasSet)];
  }, [allItems]);

  // Client-side filtering for fast interactive search & multi-field filtering
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      // Category filter
      if (category !== 'All' && item.category !== category) return false;
      
      // Condition filter
      if (condition !== 'All' && item.condition !== condition) return false;
      
      // Area filter
      if (selectedArea !== 'All' && item.area !== selectedArea) return false;

      // Text Search Query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title?.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query);
        const matchesCat = item.category?.toLowerCase().includes(query);
        const matchesArea = item.area?.toLowerCase().includes(query);

        if (!matchesTitle && !matchesDesc && !matchesCat && !matchesArea) {
          return false;
        }
      }

      return true;
    });
  }, [allItems, category, condition, selectedArea, searchQuery]);

  const hasActiveFilters = category !== 'All' || condition !== 'All' || selectedArea !== 'All' || searchQuery.trim() !== '';

  const clearAllFilters = () => {
    setCategory('All');
    setCondition('All');
    setSelectedArea('All');
    setSearchQuery('');
  };

  return (
    <div className="page-container">

      {/* 1. PAGE HEADER */}
      <div style={{ marginBottom: 'var(--space-2)' }}>
        <span 
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: 'var(--soft-blue)',
            color: 'var(--primary-blue)',
            fontSize: 'var(--fs-caption)',
            fontWeight: 700,
            border: '1px solid var(--soft-blue-border)',
            marginBottom: 'var(--space-3)'
          }}
        >
          🎁 എല്ലാം സൗജന്യം · കമ്മ്യൂണിറ്റിയിൽ നിന്ന് കമ്മ്യൂണിറ്റിയിലേക്ക്
        </span>

        <Typography as="h1" malayalam style={{ fontSize: 'var(--fs-h1)', color: 'var(--primary-blue)', marginBottom: 'var(--space-2)' }}>
          നിങ്ങൾക്ക് ആവശ്യമുള്ളത് കണ്ടെത്തൂ.
        </Typography>

        <Typography malayalam style={{ color: 'var(--ink-secondary)', fontSize: 'var(--fs-body-lg)', margin: 0 }}>
          മറ്റൊരാൾക്ക് ഇനി ആവശ്യമില്ലാത്ത, നിങ്ങൾക്ക് ഉപകാരപ്പെടാവുന്ന സാധനങ്ങൾ കണ്ടെത്താം.
        </Typography>
      </div>

      {/* 2. SEARCH & FILTER BAR */}
      <div className="filter-bar">
        <div style={{ display: 'flex', gap: 'var(--space-3)', width: '100%' }}>
          <div style={{ flex: 1 }}>
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="സാധനം തിരയൂ... (ഉദാ: Books, Chair, Toys, Laptop)"
              icon={<span>🔍</span>}
              style={{ marginBottom: 0 }}
            />
          </div>

          <div className="mobile-filter-btn-wrapper">
            <Button 
              variant="outline"
              size="md"
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              icon={<span>⚙️</span>}
            >
              Filter {hasActiveFilters && '•'}
            </Button>
          </div>
        </div>

        {/* Desktop Filter Controls */}
        <div className="filter-controls-desktop">
          <select 
            className="filter-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            {CATEGORIES.filter(c => c !== 'All').map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select 
            className="filter-select"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
          >
            <option value="All">All Conditions</option>
            {CONDITIONS.filter(c => c !== 'All').map(cond => (
              <option key={cond} value={cond}>{cond}</option>
            ))}
          </select>

          {availableAreas.length > 1 && (
            <select 
              className="filter-select"
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
            >
              <option value="All">All Locations / Areas</option>
              {availableAreas.filter(a => a !== 'All').map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          )}

          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAllFilters}
              style={{ color: 'var(--secondary-rose)', fontWeight: 600 }}
            >
              Clear Filters ✕
            </Button>
          )}
        </div>

        {/* Mobile Filter Drawer */}
        {mobileFiltersOpen && (
          <div className="filter-drawer-mobile">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--fs-caption)', fontWeight: 700, color: 'var(--ink-secondary)', marginBottom: '4px' }}>
                  CATEGORY
                </label>
                <select 
                  className="filter-select"
                  style={{ width: '100%' }}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.filter(c => c !== 'All').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 'var(--fs-caption)', fontWeight: 700, color: 'var(--ink-secondary)', marginBottom: '4px' }}>
                  CONDITION
                </label>
                <select 
                  className="filter-select"
                  style={{ width: '100%' }}
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                >
                  <option value="All">All Conditions</option>
                  {CONDITIONS.filter(c => c !== 'All').map(cond => (
                    <option key={cond} value={cond}>{cond}</option>
                  ))}
                </select>
              </div>

              {availableAreas.length > 1 && (
                <div>
                  <label style={{ display: 'block', fontSize: 'var(--fs-caption)', fontWeight: 700, color: 'var(--ink-secondary)', marginBottom: '4px' }}>
                    LOCATION / AREA
                  </label>
                  <select 
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                  >
                    <option value="All">All Locations / Areas</option>
                    {availableAreas.filter(a => a !== 'All').map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                <Button variant="primary" size="sm" fullWidth onClick={() => setMobileFiltersOpen(false)}>
                  Apply Filters
                </Button>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" fullWidth onClick={clearAllFilters}>
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. ACTIVE FILTER CHIPS */}
      {hasActiveFilters && (
        <div className="active-filter-chips">
          <span style={{ fontSize: 'var(--fs-body-sm)', fontWeight: 600, color: 'var(--ink-secondary)' }}>
            Active Filters:
          </span>

          {searchQuery.trim() !== '' && (
            <span className="chip">
              Search: "{searchQuery}"
              <span className="chip-remove" onClick={() => setSearchQuery('')}>✕</span>
            </span>
          )}

          {category !== 'All' && (
            <span className="chip">
              Category: {category}
              <span className="chip-remove" onClick={() => setCategory('All')}>✕</span>
            </span>
          )}

          {condition !== 'All' && (
            <span className="chip">
              Condition: {condition}
              <span className="chip-remove" onClick={() => setCondition('All')}>✕</span>
            </span>
          )}

          {selectedArea !== 'All' && (
            <span className="chip">
              Area: {selectedArea}
              <span className="chip-remove" onClick={() => setSelectedArea('All')}>✕</span>
            </span>
          )}

          <Button variant="ghost" size="sm" onClick={clearAllFilters} style={{ padding: '0 8px', fontSize: 'var(--fs-caption)' }}>
            Clear All
          </Button>
        </div>
      )}

      {/* Results Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <Typography as="h2" malayalam style={{ fontSize: 'var(--fs-h2)', margin: 0 }}>
          ലഭ്യമായ സാധനങ്ങൾ ({filteredItems.length})
        </Typography>

        <Typography variant="caption" color="muted">
          100% Free Sharing
        </Typography>
      </div>

      {/* 4. ITEM GRID & STATES */}
      {error ? (
        <Card style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>⚠️</div>
          <Typography malayalam style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--error-text)', marginBottom: 'var(--space-2)' }}>
            {error}
          </Typography>
          <Button variant="primary" size="md" onClick={fetchPublishedItems} style={{ marginTop: 'var(--space-4)' }}>
            വീണ്ടും ശ്രമിക്കുക (Try Again)
          </Button>
        </Card>
      ) : loading ? (
        <div className="grid-responsive">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="skeleton-card">
              <div className="skeleton-image" />
              <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div className="skeleton-text" style={{ width: '70%', height: '20px' }} />
                <div className="skeleton-text" style={{ width: '40%' }} />
                <div className="skeleton-text" style={{ width: '50%' }} />
                <div className="skeleton-text" style={{ width: '100%', height: '38px', marginTop: 'var(--space-2)' }} />
              </div>
            </div>
          ))}
        </div>
      ) : allItems.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>🌱</div>
          <Typography malayalam style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--primary-blue)', marginBottom: 'var(--space-2)' }}>
            ഇപ്പോൾ ഇവിടെ സാധനങ്ങളൊന്നുമില്ല.
          </Typography>
          <Typography malayalam style={{ color: 'var(--ink-secondary)', maxWidth: '520px', margin: '0 auto var(--space-6) auto', lineHeight: 1.6 }}>
            പുതിയ സാധനങ്ങൾ ആരെങ്കിലും പങ്കിടുമ്പോൾ ഇവിടെ കാണാം. നിങ്ങളുടെ വീട്ടിൽ ആവശ്യമില്ലാത്ത എന്തെങ്കിലും ഉണ്ടോ?
          </Typography>
          <Link to={giveItemRoute}>
            <Button variant="primary" size="lg">
              ഒരു സാധനം നൽകൂ (Give an Item)
            </Button>
          </Link>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>🔍</div>
          <Typography malayalam style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 'var(--space-2)' }}>
            ഈ തിരഞ്ഞെടുപ്പിൽ സാധനങ്ങളൊന്നും കണ്ടെത്താനായില്ല.
          </Typography>
          <Typography malayalam style={{ color: 'var(--ink-muted)', marginBottom: 'var(--space-6)' }}>
            നിങ്ങൾ നൽകിയ ഫിൽട്ടറുകൾക്കോ തിരച്ചിലിനോ അനുയോജ്യമായ സാധനങ്ങൾ ലഭ്യമല്ല.
          </Typography>
          <Button variant="outline" size="md" onClick={clearAllFilters}>
            Filters Clear ചെയ്യുക (Clear All Filters)
          </Button>
        </Card>
      ) : (
        <div className="grid-responsive">
          {filteredItems.map(item => {
            const hasImage = item.item_images && item.item_images.length > 0;
            const imageUrl = hasImage ? getPublicUrl(item.item_images[0].storage_path) : null;
            const catIcon = getCategoryIcon(item.category);

            return (
              <Link key={item.id} to={`/item/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="item-card">
                  {imageUrl ? (
                    <img src={imageUrl} alt={item.title} className="item-card-image" />
                  ) : (
                    <div 
                      className="item-card-image" 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        backgroundColor: 'var(--soft-blue)',
                        color: 'var(--primary-blue)',
                        gap: '8px'
                      }}
                    >
                      <span style={{ fontSize: '2.5rem' }}>{catIcon}</span>
                      <span style={{ fontSize: 'var(--fs-caption)', fontWeight: 700, letterSpacing: '0.05em' }}>
                        KAITHAANGU
                      </span>
                    </div>
                  )}

                  <div className="item-card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                      <Typography as="h3" style={{ fontSize: '1.05rem', margin: 0, lineHeight: 1.35 }}>
                        {item.title}
                      </Typography>
                      <Badge status="published" label="FREE" dot={false} />
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-2)' }}>
                      <Badge status="info" label={item.category} dot={false} />
                      <span 
                        style={{ 
                          fontSize: 'var(--fs-caption)', 
                          color: 'var(--ink-secondary)', 
                          background: 'var(--soft-gray)', 
                          padding: '2px 8px', 
                          borderRadius: 'var(--radius-pill)',
                          fontWeight: 500
                        }}
                      >
                        {item.condition}
                      </span>
                    </div>

                    {item.area && (
                      <Typography variant="body-sm" color="muted" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: 'var(--space-2)' }}>
                        📍 {item.area}
                      </Typography>
                    )}

                    <div style={{ marginTop: 'auto', paddingTop: 'var(--space-4)' }}>
                      <Button variant="secondary" size="sm" fullWidth style={{ pointerEvents: 'none' }}>
                        കൂടുതൽ കാണുക (View Details)
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

    </div>
  );
};
