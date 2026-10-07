import React, { useEffect, useState } from 'react';
// removed
import { supabase } from '../lib/supabase';
import type { Item, ItemImage } from '../types/database';
import { Link } from 'react-router-dom';

type ItemWithImages = Item & { item_images: ItemImage[] };

export const BrowseItems: React.FC = () => {
  // removed unused profile
  const [items, setItems] = useState<ItemWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering
  const [category, setCategory] = useState<string>('All');

  useEffect(() => {
    fetchPublishedItems();
  }, [category]);

  const fetchPublishedItems = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('items')
        .select(`
          *,
          item_images (*)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (category !== 'All') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      setItems(data as ItemWithImages[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPublicUrl = (path: string) => {
    return supabase.storage.from('items').getPublicUrl(path).data.publicUrl;
  };

  const CATEGORIES = ['All', 'Books & Education', 'Clothes', 'Furniture', 'Electronics', 'Toys', 'Household Items', 'Medical Equipment', 'Baby & Kids', 'Appliances', 'Other'];

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>Available Free Items</h2>
          <p className="subtitle" style={{ marginBottom: 0 }}>Browse items generously given by the community.</p>
        </div>
        <select 
          value={category} 
          onChange={(e) => setCategory(e.target.value)}
          style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--soft-gray)' }}
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loader-container">Loading items...</div>
      ) : items.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p>No items found in this category.</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {items.map(item => (
            <Link to={`/item/${item.id}`} key={item.id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'var(--transition)' }}>
              <div style={{ height: '200px', backgroundColor: 'var(--soft-gray)' }}>
                {item.item_images && item.item_images.length > 0 && (
                  <img 
                    src={getPublicUrl(item.item_images[0].storage_path)} 
                    alt={item.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                )}
              </div>
              <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--ink)' }}>{item.title}</h3>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ backgroundColor: 'var(--soft-blue)', color: 'var(--primary-blue)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    {item.category}
                  </span>
                  <span style={{ backgroundColor: 'var(--soft-gray)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    {item.condition}
                  </span>
                </div>
                <p style={{ color: 'var(--ink)', fontSize: '0.9rem', flex: 1 }}>
                  📍 {item.area}
                </p>
                <div style={{ marginTop: '1rem' }}>
                  <span className="btn btn-secondary" style={{ width: '100%', display: 'block', boxSizing: 'border-box' }}>
                    View Details
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
