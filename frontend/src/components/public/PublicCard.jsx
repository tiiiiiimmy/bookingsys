import React from 'react';

const PublicCard = ({ title, eyebrow, children, className = '' }) => {
  return (
    <section className={`rounded-[2rem] border border-outline/80 bg-surface-container-lowest p-6 shadow-[0_10px_24px_rgba(82,68,62,0.05)] ${className}`}>
      {eyebrow ? (
        <p className="mb-3 font-label text-xs uppercase tracking-[0.25em] text-tertiary">{eyebrow}</p>
      ) : null}
      {title ? <h2 className="mb-4 font-headline text-2xl text-on-surface">{title}</h2> : null}
      {children}
    </section>
  );
};

export default PublicCard;
