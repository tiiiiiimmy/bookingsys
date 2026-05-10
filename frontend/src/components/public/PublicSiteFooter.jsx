import React from 'react';

const PublicSiteFooter = () => {
  return (
    <footer className="bg-stone-100">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-8 py-16 md:grid-cols-4">
        <div className="md:col-span-1">
          <h2 className="mb-6 font-headline text-lg text-orange-900">Psychic Magic</h2>
          <p className="font-sans text-sm leading-relaxed tracking-wide text-stone-500">
            © 2024 Psychic Magic.
            <br />
            All rights reserved.
          </p>
        </div>
        <div className="space-y-4">
          <p className="font-sans text-sm tracking-wide text-stone-500">
            Hours: Thu &amp; Sun 9AM–5PM
          </p>
          <p className="font-sans text-sm tracking-wide text-stone-500">
            Payments: Stripe &amp; Cards
          </p>
        </div>
        <div className="space-y-4">
          <a
            className="block font-sans text-sm tracking-wide text-stone-500 opacity-80 transition-opacity hover:opacity-100"
            href="#"
          >
            Contact
          </a>
          <a
            className="block font-sans text-sm tracking-wide text-stone-500 opacity-80 transition-opacity hover:opacity-100"
            href="#"
          >
            Refund Policy
          </a>
        </div>
        <div className="flex space-x-6">
          <a className="text-stone-400 hover:text-orange-900" href="#" aria-label="Website">
            <span className="material-symbols-outlined">public</span>
          </a>
          <a className="text-stone-400 hover:text-orange-900" href="#" aria-label="Email">
            <span className="material-symbols-outlined">mail</span>
          </a>
          <a className="text-stone-400 hover:text-orange-900" href="#" aria-label="Chat">
            <span className="material-symbols-outlined">chat_bubble</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default PublicSiteFooter;
