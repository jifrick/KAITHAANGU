import React from 'react';

export const Home: React.FC = () => {
  return (
    <div className="page-container">
      <header className="hero">
        <h1>KAITHAANGU</h1>
        <h2>എനിക്ക് വേണ്ട, നീ എടുത്തോ.</h2>
        <p className="subtitle">I don't need it → someone else may need it.</p>
        <div className="actions">
          <a href="/items" className="btn btn-primary">Browse Free Items</a>
          <a href="/login" className="btn btn-secondary">Join to Give</a>
        </div>
      </header>
    </div>
  );
};
