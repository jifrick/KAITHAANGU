import React from 'react';
import { Link } from 'react-router-dom';
import { Brand } from './Brand';
import { useAuth } from '../../context/AuthContext';

export const Footer: React.FC = () => {
  const { user, profile } = useAuth();
  const currentYear = new Date().getFullYear();

  const giveItemRoute = user 
    ? (profile?.role === 'donor' || profile?.role === 'both' ? '/create-item' : '/complete-profile')
    : '/login';

  return (
    <footer className="site-footer">
      <div className="footer-container">
        
        {/* Brand Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Brand size="md" showTagline={true} clickable={true} />
          <p style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-secondary)', lineHeight: 1.6, maxWidth: '380px', margin: 0 }}>
            KAITHAANGU (കൈത്താങ്ങ്) is a community giving platform where people give useful items they no longer need to people who genuinely need them. Everything is 100% free.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ fontSize: 'var(--fs-body)', fontWeight: 700, color: 'var(--ink)', marginBottom: 'var(--space-3)' }}>
            Quick Navigation
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--fs-body-sm)' }}>
            <Link to="/items" style={{ color: 'var(--ink-secondary)' }}>Browse Free Items</Link>
            <a href="/#how-it-works" style={{ color: 'var(--ink-secondary)' }}>How It Works</a>
            <a href="/#about" style={{ color: 'var(--ink-secondary)' }}>About KAITHAANGU</a>
            <Link to={giveItemRoute} style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>Give an Item</Link>
          </div>
        </div>

        {/* Community & Safety */}
        <div>
          <h4 style={{ fontSize: 'var(--fs-body)', fontWeight: 700, color: 'var(--ink)', marginBottom: 'var(--space-3)' }}>
            Community & Trust
          </h4>
          <p style={{ fontSize: 'var(--fs-body-sm)', color: 'var(--ink-secondary)', lineHeight: 1.5, margin: 0 }}>
            Strictly NO buying, NO selling, and NO payments. Built to foster generosity, dignity, and mutual support across Kerala.
          </p>
        </div>

      </div>

      <div className="footer-bottom">
        <span>© {currentYear} KAITHAANGU (കൈത്താങ്ങ്) — All Rights Reserved.</span>
        <span>Made with ❤️ for the community.</span>
      </div>
    </footer>
  );
};
