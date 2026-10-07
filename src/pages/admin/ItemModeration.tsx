import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Item, ItemImage } from '../../types/database';

type ItemWithImages = Item & { item_images: ItemImage[] };

export const ItemModeration: React.FC = () => {
  const { profile } = useAuth();
  const [items, setItems] = useState<ItemWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if authorized
  if (!profile || profile.role !== 'admin' || !['super_admin', 'content_admin'].includes(profile.admin_role || '')) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    fetchPendingItems();
  }, []);

  const fetchPendingItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          item_images (*)
        `)
        .eq('status', 'pending_moderation')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data as ItemWithImages[]);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (itemId: string, newStatus: 'published' | 'removed') => {
    try {
      const { error } = await supabase
        .from('items')
        .update({ status: newStatus })
        .eq('id', itemId);

      if (error) throw error;
      
      // Update local state to remove the processed item
      setItems(items.filter(item => item.id !== itemId));
    } catch (err: any) {
      alert('Failed to update item: ' + err.message);
    }
  };

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from('items').getPublicUrl(path);
    return data.publicUrl;
  };

  if (loading) return <div className="loader-container">Loading pending items...</div>;

  return (
    <div className="page-container">
      <h2>Item Moderation Dashboard</h2>
      <p className="subtitle">Review items submitted by donors before they appear publicly.</p>
      
      {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</div>}

      {items.length === 0 ? (
        <div className="card">
          <p>No items pending moderation.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {items.map(item => (
            <div key={item.id} className="card" style={{ display: 'flex', gap: '2rem' }}>
              <div style={{ flex: '1', minWidth: '200px' }}>
                {item.item_images && item.item_images.length > 0 ? (
                  <img 
                    src={getPublicUrl(item.item_images[0].storage_path)} 
                    alt={item.title} 
                    style={{ width: '100%', borderRadius: '8px', objectFit: 'cover', aspectRatio: '4/3' }} 
                  />
                ) : (
                  <div style={{ width: '100%', aspectRatio: '4/3', backgroundColor: 'var(--soft-gray)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    No Image
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', overflowX: 'auto' }}>
                  {item.item_images?.slice(1).map(img => (
                    <img 
                      key={img.id} 
                      src={getPublicUrl(img.storage_path)} 
                      alt="" 
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} 
                    />
                  ))}
                </div>
              </div>
              
              <div style={{ flex: '2' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>{item.title}</h3>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  <span><strong>Category:</strong> {item.category}</span>
                  <span><strong>Condition:</strong> {item.condition}</span>
                  <span><strong>Area:</strong> {item.area}</span>
                </div>
                <p style={{ backgroundColor: 'var(--soft-gray)', padding: '1rem', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>
                  {item.description}
                </p>
                
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => handleUpdateStatus(item.id, 'published')}
                  >
                    Approve & Publish
                  </button>
                  <button 
                    className="btn btn-danger" 
                    onClick={() => {
                      if (window.confirm('Are you sure you want to reject and remove this item?')) {
                        handleUpdateStatus(item.id, 'removed');
                      }
                    }}
                  >
                    Reject & Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
