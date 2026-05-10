import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductOrderModal from '../components/public/ProductOrderModal';
import PublicSiteFooter from '../components/public/PublicSiteFooter';

const NAV_LINKS = [
  { label: 'Home', href: '#' },
  { label: 'About Me', href: '#about-manon' },
  { label: 'White Magic', href: '#white-magic' },
  { label: 'Love Spell', href: '#love-spell' },
  { label: 'Money Spell', href: '#money-spell' },
  { label: 'Psychic Reading', href: '#psychic-reading' },
  { label: 'Contact', href: '#contact' },
];

const SECTION_BACKGROUND =
  'linear-gradient(160deg, rgb(253, 246, 232) 0%, rgb(250, 243, 235) 50%, rgb(253, 248, 242) 100%)';

const PRODUCT_CTA_STYLE = {
  border: '1px solid rgba(255,255,255,0.45)',
  color: '#fffaf0',
  background: 'linear-gradient(135deg, #d2ab56 0%, #a86f2f 100%)',
  padding: '0.95rem 2.35rem',
  minWidth: '220px',
  boxShadow: '0 16px 34px rgba(168,111,47,0.28), inset 0 1px 0 rgba(255,255,255,0.35)',
  letterSpacing: '0.05em',
};

const PSYCHIC_CTA_STYLE = {
  ...PRODUCT_CTA_STYLE,
  background: 'linear-gradient(135deg, #9f7bc9 0%, #5b3a86 100%)',
  boxShadow: '0 16px 34px rgba(91,58,134,0.28), inset 0 1px 0 rgba(255,255,255,0.32)',
};

const liftCta = (element, shadowColor) => {
  element.style.transform = 'translateY(-3px) scale(1.03)';
  element.style.boxShadow = `0 22px 42px ${shadowColor}, inset 0 1px 0 rgba(255,255,255,0.38)`;
};

const settleCta = (element, shadowColor) => {
  element.style.transform = 'translateY(0) scale(1)';
  element.style.boxShadow = `0 16px 34px ${shadowColor}, inset 0 1px 0 rgba(255,255,255,0.35)`;
};

const HomePage = () => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [orderProduct, setOrderProduct] = useState(null);
  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="min-h-screen antialiased" style={{ fontFamily: 'Manrope, sans-serif', color: '#1c1c19' }}>

      {/* ── Navbar ── */}
      <nav
        className="fixed top-0 z-50 w-full backdrop-blur-md"
        style={{ background: 'rgba(253, 248, 240, 0.95)', borderBottom: '1px solid rgba(212, 180, 131, 0.28)' }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-3">
          <a href="/" className="flex items-center">
            <img src="/logo.png" alt="Psychic Magic" className="h-12 w-auto" />
          </a>

          <div className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-sm font-medium tracking-wide transition-colors duration-200"
                style={{ color: '#3d2b1f' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#b8965a')}
                onMouseLeave={e => (e.currentTarget.style.color = '#3d2b1f')}
              >
                {label}
              </a>
            ))}
          </div>

          <button
            type="button"
            className="rounded-lg p-2 md:hidden"
            style={{ color: '#3d2b1f' }}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((o) => !o)}
          >
            <span className="material-symbols-outlined">{mobileOpen ? 'close' : 'menu'}</span>
          </button>
        </div>

        {mobileOpen ? (
          <div
            className="flex flex-col gap-4 px-8 py-5 md:hidden"
            style={{ background: '#fdf8f0', borderTop: '1px solid rgba(212,180,131,0.28)' }}
          >
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-sm font-medium"
                style={{ color: '#3d2b1f' }}
                onClick={closeMobile}
              >
                {label}
              </a>
            ))}
          </div>
        ) : null}
      </nav>

      <main>

        {/* ── Hero ── */}
        <section className="relative w-full overflow-hidden" style={{ minHeight: 'calc(100vh - 6rem)', background: SECTION_BACKGROUND }}>
          {/* Background image */}
          <div className="absolute inset-0">
            <img
              src="/herobg.png"
              alt=""
              className="h-full w-full object-cover object-center"
            />
          </div>

          {/* Content */}
          <div
            className="relative z-10 flex items-center px-8 py-16 lg:px-16"
            style={{ minHeight: 'inherit', maxWidth: '80rem', margin: '0 auto' }}
          >
            {/* Hero card */}
            <div
              className="relative max-w-[540px] rounded-3xl p-10 lg:p-12"
              style={{
                background: 'rgba(253, 248, 240, 0.58)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(212, 180, 131, 0.38)',
                boxShadow: '0 8px 40px rgba(180, 140, 80, 0.10)',
              }}
            >
              {/* Top ornament */}
              <div className="mb-7 flex items-center gap-3">
                <div
                  className="h-px w-16 flex-shrink-0"
                  style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.75))' }}
                />
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                  <path
                    d="M7.5 0L8.7 5.8L14 4.5L10 8L13.5 11.5L7.8 9.8L7.5 15L7.2 9.8L1.5 11.5L5 8L1 4.5L6.3 5.8L7.5 0Z"
                    fill="#c9a84c"
                  />
                </svg>
                <div
                  className="h-px w-16 flex-shrink-0"
                  style={{ background: 'linear-gradient(to left, transparent, rgba(201,168,76,0.75))' }}
                />
              </div>

              {/* Italic subtitle */}
              <p
                className="mb-5 text-sm italic"
                style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 500, color: '#8a7060', fontSize: '0.95rem' }}
              >
                Every session is personal, private, and guided with care.
              </p>

              {/* Main headline */}
              <h1
                style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontWeight: 600,
                  color: '#7a4f28',
                  lineHeight: 1.18,
                  fontSize: 'clamp(2.6rem, 4.5vw, 4rem)',
                  marginBottom: '1.25rem',
                  letterSpacing: '-0.01em',
                }}
              >
                Unlock the Magic
                <br />
                Within Your Life
              </h1>

              {/* Dot ornament */}
              <div className="mb-6 flex items-center gap-1.5">
                {[3, 4, 5, 4, 3].map((size, i) => (
                  <div
                    key={i}
                    className="rounded-full"
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      background: i === 2 ? '#c9a84c' : 'rgba(201,168,76,0.42)',
                    }}
                  />
                ))}
              </div>

              {/* Description */}
              <p
                className="mb-9 text-sm leading-relaxed"
                style={{ color: '#6b5040', maxWidth: '400px' }}
              >
                Discover gentle spiritual guidance, energy work, and intuitive readings designed to help you find clarity, love, abundance, and inner peace.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #d4b06a 0%, #b8965a 55%, #a07840 100%)' }}
                  onClick={() => navigate('/booking')}
                >
                  <span style={{ fontSize: '9px', opacity: 0.9 }}>✦</span>
                  Start Your Reading
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium transition-all duration-200"
                  style={{
                    border: '1.5px solid #c9a84c',
                    color: '#8a6b3d',
                    background: 'rgba(253,248,240,0.5)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,168,76,0.12)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(253,248,240,0.5)')}
                  onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <span style={{ fontSize: '9px', opacity: 0.9 }}>✦</span>
                  Explore Services
                </button>
              </div>
            </div>
          </div>

          {/* Bottom divider ornament */}
          <div className="absolute bottom-5 left-0 right-0 flex flex-col items-center gap-1">
            <div className="flex items-center gap-3 w-48">
              <div className="h-px flex-1" style={{ background: 'rgba(201,168,76,0.55)' }} />
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M7 0L8.1 5.4L13 4.2L9.3 7.5L12.5 11L7.2 9.1L7 14L6.8 9.1L1.5 11L4.7 7.5L1 4.2L5.9 5.4L7 0Z"
                  fill="#c9a84c"
                  fillOpacity="0.75"
                />
              </svg>
              <div className="h-px flex-1" style={{ background: 'rgba(201,168,76,0.55)' }} />
            </div>
          </div>
        </section>

        {/* ── About / Meet Manon ── */}
        <section
          id="about-manon"
          className="relative w-full overflow-hidden py-28 px-8"
          style={{ background: SECTION_BACKGROUND }}
        >
          {/* Radial glow */}
          <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse 55% 60% at 20% 50%, rgba(201,168,76,0.08) 0%, transparent 65%)' }} />

          {/* Corner sparkles */}
          {[
            { top: '5%',  left: '2%',  size: 11, op: 0.20 },
            { top: '90%', left: '3%',  size: 7,  op: 0.14 },
            { top: '8%',  left: '96%', size: 8,  op: 0.18 },
            { top: '88%', left: '95%', size: 9,  op: 0.16 },
            { top: '48%', left: '98%', size: 6,  op: 0.12 },
          ].map((s, i) => (
            <svg key={i} width={s.size} height={s.size} viewBox="0 0 10 10" className="absolute pointer-events-none" style={{ top: s.top, left: s.left, opacity: s.op }}>
              <path d="M5 0L5.8 4.2L10 5L5.8 5.8L5 10L4.2 5.8L0 5L4.2 4.2Z" fill="#c9a84c" />
            </svg>
          ))}

          <div className="relative z-10 mx-auto max-w-6xl">
            <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_1.6fr] lg:gap-24 items-center">

              {/* ── Left: Manon photo card ── */}
              <div className="flex justify-center lg:justify-end">
                <div
                  className="relative flex flex-col items-center text-center"
                  style={{
                    width: '300px',
                    borderRadius: '1.5rem',
                    background: 'rgba(253,248,240,0.75)',
                    border: '1px solid rgba(201,168,76,0.32)',
                    boxShadow: '0 12px 48px rgba(160,120,60,0.14)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Photo */}
                  <div className="w-full" style={{ height: '320px', overflow: 'hidden' }}>
                    <img
                      src="/me.png"
                      alt="Manon — Psychic Reader"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
                    />
                  </div>

                  {/* Subtle gold gradient overlay at bottom of photo */}
                  <div
                    className="absolute left-0 right-0"
                    style={{ top: '240px', height: '80px', background: 'linear-gradient(to bottom, transparent, rgba(253,248,240,0.95))' }}
                  />

                  {/* Text info */}
                  <div className="relative z-10 w-full px-6 pt-4 pb-6">
                    {/* Name */}
                    <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: '2rem', color: '#5c3d1e', lineHeight: 1.05, letterSpacing: '0.02em', marginBottom: '0.25rem' }}>
                      Manon
                    </h3>

                    {/* Title */}
                    <p style={{ fontSize: '0.68rem', color: '#b8965a', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '1.1rem' }}>
                      Psychic Reader &amp; Spiritual Guide
                    </p>

                    {/* Divider */}
                    <div className="mb-4 flex items-center gap-2 w-full">
                      <div className="h-px flex-1" style={{ background: 'rgba(201,168,76,0.4)' }} />
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M4 0L4.6 3.4L8 4L4.6 4.6L4 8L3.4 4.6L0 4L3.4 3.4Z" fill="#c9a84c" fillOpacity="0.7"/></svg>
                      <div className="h-px flex-1" style={{ background: 'rgba(201,168,76,0.4)' }} />
                    </div>

                    {/* Credentials */}
                    <div className="flex flex-col items-center gap-2 w-full">
                      {[
                        { icon: '✦', text: '20+ Years Experience' },
                        { icon: '☽', text: 'Based in New Zealand' },
                        { icon: '◎', text: 'Thousands of Clients Served' },
                      ].map(({ icon, text }) => (
                        <div key={text} className="flex items-center gap-2">
                          <span style={{ color: '#c9a84c', fontSize: '0.7rem' }}>{icon}</span>
                          <span style={{ fontSize: '0.73rem', color: '#7a5c3e' }}>{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Corner accent lines */}
                  {[
                    'top-3 left-3 origin-top-left',
                    'top-3 right-3 origin-top-right rotate-90',
                    'bottom-3 left-3 origin-bottom-left -rotate-90',
                    'bottom-3 right-3 origin-bottom-right rotate-180',
                  ].map((pos) => (
                    <svg key={pos} width="16" height="16" viewBox="0 0 16 16" fill="none" className={`absolute ${pos} pointer-events-none`}>
                      <path d="M1 15V1H15" stroke="#c9a84c" strokeWidth="1" strokeOpacity="0.45" fill="none" />
                    </svg>
                  ))}
                </div>
              </div>

              {/* ── Right: text ── */}
              <div>
                {/* Label */}
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="h-px w-6" style={{ background: 'rgba(201,168,76,0.6)' }} />
                  <span style={{ fontSize: '0.68rem', color: '#b8965a', letterSpacing: '0.2em', textTransform: 'uppercase' }}>About Me</span>
                  <div className="h-px w-6" style={{ background: 'rgba(201,168,76,0.6)' }} />
                </div>

                {/* Title */}
                <h2 className="mb-3" style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: 'clamp(2.4rem, 4.5vw, 3.8rem)', color: '#5c3d1e', lineHeight: 1.12, letterSpacing: '-0.01em' }}>
                  Meet Your Spiritual Guide
                </h2>

                {/* Subtitle */}
                <p className="mb-7" style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '1.1rem', color: '#8a6b3e', lineHeight: 1.55 }}>
                  20 Years of Psychic Reading Experience in New Zealand
                </p>

                {/* Paragraphs */}
                <div className="space-y-5" style={{ maxWidth: '560px' }}>
                  {[
                    'Behind Psychic Magic is an experienced New Zealand-based psychic reader with over 20 years of local spiritual guidance experience. Through accurate intuitive readings and compassionate energy work, I have supported thousands of clients in understanding their relationships, life direction, emotional challenges, and personal choices.',
                    'My approach is gentle, respectful, and deeply personal. Every reading and spell service is created with care, positive intention, and a sincere desire to help you find clarity, comfort, and confidence. Whether you are facing uncertainty in love, career, money, or personal growth, Psychic Magic offers a safe space for guidance without judgement.',
                    'Over the years, many clients have found peace, renewed hope, and meaningful direction through my guidance. Some came seeking answers about love, some needed emotional healing, and others wanted support during difficult life transitions. My goal is always to help you reconnect with your inner wisdom and move toward a happier, more balanced life.',
                  ].map((para, i) => (
                    <div key={i}>
                      {i > 0 && (
                        <div className="mb-5 flex items-center gap-2" style={{ maxWidth: '80px' }}>
                          <div className="h-px flex-1" style={{ background: 'rgba(201,168,76,0.38)' }} />
                          <svg width="6" height="6" viewBox="0 0 6 6" fill="none"><path d="M3 0L3.5 2.5L6 3L3.5 3.5L3 6L2.5 3.5L0 3L2.5 2.5Z" fill="#c9a84c" fillOpacity="0.6"/></svg>
                        </div>
                      )}
                      <p style={{ color: '#6b5040', fontSize: '0.9rem', lineHeight: 1.9 }}>{para}</p>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  type="button"
                  className="mt-9 flex items-center gap-2.5 rounded-full text-sm transition-all duration-200"
                  style={{ border: '1px solid rgba(201,168,76,0.5)', color: '#b8965a', background: 'transparent', padding: '0.65rem 1.75rem', letterSpacing: '0.04em' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(201,168,76,0.09)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => navigate('/booking')}
                >
                  <span style={{ fontSize: '9px', opacity: 0.8 }}>✦</span>
                  Begin Your Journey
                </button>
              </div>

            </div>
          </div>
        </section>

        {/* ── Intro ── */}
        <section
          className="relative w-full overflow-hidden py-24 px-8"
          style={{ background: SECTION_BACKGROUND }}
        >
          {/* Faint radial glow centre */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 70% 60% at 50% 30%, rgba(212,180,131,0.13) 0%, transparent 70%)',
            }}
          />

          <div className="relative z-10 mx-auto max-w-5xl text-center">

            {/* Top ornament */}
            <div className="mb-6 flex items-center justify-center gap-4">
              <div className="h-px w-20" style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.65))' }} />
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 0L9.2 6.3L15 5L10.6 8.8L14 13L8.3 10.6L8 16L7.7 10.6L2 13L5.4 8.8L1 5L6.8 6.3L8 0Z" fill="#c9a84c" fillOpacity="0.85" />
              </svg>
              <div className="h-px w-20" style={{ background: 'linear-gradient(to left, transparent, rgba(201,168,76,0.65))' }} />
            </div>

            {/* Headline */}
            <h2
              className="mb-6"
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontWeight: 600,
                fontSize: 'clamp(2rem, 4vw, 3.25rem)',
                color: '#5c3d1e',
                lineHeight: 1.2,
                letterSpacing: '-0.01em',
              }}
            >
              A Gentle Space for Spiritual Guidance
            </h2>

            {/* Body text */}
            <p
              className="mx-auto mb-16 leading-relaxed"
              style={{
                maxWidth: '620px',
                color: '#7a5c3e',
                fontSize: '0.95rem',
                lineHeight: 1.8,
              }}
            >
              Psychic Magic is a calm and mystical space for those seeking answers, emotional
              healing, and energetic support. Whether you are looking for love, protection,
              abundance, or personal clarity, our services are designed to guide you with
              compassion and intention.
            </p>

            {/* Cards */}
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {[
                {
                  img: '/intro1.png',
                  title: 'Clarity',
                  body: 'Receive intuitive insight when life feels uncertain.',
                },
                {
                  img: '/intro2.png',
                  title: 'Healing',
                  body: 'Release emotional blocks and invite peaceful energy.',
                },
                {
                  img: '/intro3.png',
                  title: 'Manifestation',
                  body: 'Align your intention with love, abundance, and positive change.',
                },
              ].map(({ img, title, body }) => (
                <div
                  key={title}
                  className="relative mx-auto"
                  style={{
                    width: '100%',
                    maxWidth: '260px',
                    filter: 'drop-shadow(0 6px 18px rgba(160,120,60,0.13))',
                    transition: 'transform 0.32s cubic-bezier(0.34,1.36,0.64,1), filter 0.32s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.05) translateY(-10px)';
                    e.currentTarget.style.filter = 'drop-shadow(0 28px 36px rgba(160,120,60,0.28))';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1) translateY(0)';
                    e.currentTarget.style.filter = 'drop-shadow(0 6px 18px rgba(160,120,60,0.13))';
                  }}
                >
                  {/* Full card image — frame is part of the artwork */}
                  <img
                    src={img}
                    alt={title}
                    className="w-full h-auto block"
                  />

                  {/* Text overlaid on the blank bottom area of the card image */}
                  <div
                    className="absolute left-0 right-0 flex flex-col items-center text-center px-7"
                    style={{ bottom: '11%' }}
                  >
                    <h3
                      className="mb-1.5"
                      style={{
                        fontFamily: 'Cormorant Garamond, serif',
                        fontWeight: 600,
                        fontSize: '1.6rem',
                        color: '#5c3d1e',
                        letterSpacing: '0.01em',
                      }}
                    >
                      {title}
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: '#8a6b3e', lineHeight: 1.65 }}>{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── White Magic ── */}
        <section
          id="white-magic"
          className="relative w-full overflow-hidden py-24 px-8"
          style={{ background: SECTION_BACKGROUND }}
        >
          {/* Scattered sparkles */}
          {[
            { top: '6%',  left: '3%',  size: 9,  op: 0.22 },
            { top: '15%', left: '50%', size: 6,  op: 0.16 },
            { top: '78%', left: '46%', size: 7,  op: 0.18 },
            { top: '88%', left: '6%',  size: 5,  op: 0.14 },
            { top: '25%', left: '95%', size: 10, op: 0.20 },
            { top: '62%', left: '92%', size: 6,  op: 0.15 },
          ].map((s, i) => (
            <svg key={i} width={s.size} height={s.size} viewBox="0 0 10 10"
              className="absolute pointer-events-none"
              style={{ top: s.top, left: s.left, opacity: s.op }}>
              <path d="M5 0L5.8 4.2L10 5L5.8 5.8L5 10L4.2 5.8L0 5L4.2 4.2Z" fill="#c9a84c" />
            </svg>
          ))}

          <div className="relative z-10 mx-auto max-w-6xl">
            <div className="grid grid-cols-1 items-stretch gap-12 lg:grid-cols-2 lg:gap-20">

              {/* ── Left: text ── */}
              <div>
                {/* Section label */}
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="h-px w-6" style={{ background: 'rgba(201,168,76,0.6)' }} />
                  <span style={{ fontSize: '0.68rem', color: '#b8965a', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'Manrope, sans-serif' }}>
                    Products
                  </span>
                  <div className="h-px w-6" style={{ background: 'rgba(201,168,76,0.6)' }} />
                </div>

                {/* Headline */}
                <h2
                  className="mb-2"
                  style={{
                    fontFamily: 'MonteCarlo, cursive',
                    fontWeight: 400,
                    fontSize: 'clamp(3.2rem, 6vw, 5.5rem)',
                    color: '#5c3d1e',
                    lineHeight: 1.06,
                    letterSpacing: '-0.01em',
                  }}
                >
                  White Magic
                </h2>

                {/* Subtitle */}
                <p className="mb-5" style={{ color: '#8a6b3e', fontSize: '0.875rem', lineHeight: 1.6 }}>
                  Positive energy work for protection, healing, and spiritual balance.
                </p>

                {/* Thin divider */}
                <div className="mb-5 w-12 h-px" style={{ background: 'rgba(201,168,76,0.45)' }} />

                {/* Description */}
                <p className="mb-7" style={{ color: '#6b5040', fontSize: '0.875rem', lineHeight: 1.9, maxWidth: '420px' }}>
                  White Magic focuses on gentle, positive spiritual energy. It is designed to help
                  clear negativity, restore emotional balance, and invite peaceful protection into
                  your life.
                </p>

                {/* Feature grid — icon circles */}
                <div className="mb-8 grid grid-cols-2 gap-x-6 gap-y-3" style={{ maxWidth: '360px' }}>
                  {[
                    { path: 'M8 1L9.2 6.6L14.5 5.5L10.8 9L13.5 13L8.3 10.8L8 16L7.7 10.8L2.5 13L5.2 9L1.5 5.5L6.8 6.6Z', label: 'Energy cleansing' },
                    { path: 'M8 2.5C5.5 2.5 3.5 4.5 3.5 7C3.5 10.5 8 14 8 14C8 14 12.5 10.5 12.5 7C12.5 4.5 10.5 2.5 8 2.5Z', label: 'Emotional healing' },
                    { path: 'M8 1L14 4V8C14 11.5 11.3 14.7 8 15.5C4.7 14.7 2 11.5 2 8V4L8 1Z', label: 'Spiritual protection' },
                    { path: 'M12 4C12 7.3 9.3 10 6 10C4.3 10 2.8 9.3 1.7 8.2C1.9 11.4 4.7 14 8 14C11.3 14 14 11.3 14 8C14 6.3 13.3 4.8 12.2 3.7C12.1 3.8 12 3.9 12 4Z', label: 'Peace and balance' },
                  ].map(({ path, label }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <div className="flex-shrink-0 flex items-center justify-center"
                        style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1px solid rgba(201,168,76,0.45)', background: 'rgba(201,168,76,0.07)' }}>
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                          <path d={path} fill="#c9a84c" />
                        </svg>
                      </div>
                      <span style={{ color: '#6b5040', fontSize: '0.8rem' }}>{label}</span>
                    </div>
                  ))}
                </div>

                {/* CTA button */}
                <button
                  type="button"
                  className="mb-8 inline-flex items-center justify-center gap-3 rounded-full text-base font-semibold transition-all duration-200"
                  style={PRODUCT_CTA_STYLE}
                  onMouseEnter={e => liftCta(e.currentTarget, 'rgba(168,111,47,0.38)')}
                  onMouseLeave={e => settleCta(e.currentTarget, 'rgba(168,111,47,0.28)')}
                  onClick={() => setOrderProduct('White Magic')}
                >
                  Order White Magic
                  <span style={{ fontSize: '1rem', opacity: 0.9 }}>→</span>
                </button>

                {/* Info box — white1.png as background */}
                <div
                  className="relative overflow-hidden"
                  style={{
                    maxWidth: '460px',
                    borderRadius: '0.75rem',
                    filter: 'drop-shadow(0 2px 8px rgba(160,120,60,0.10))',
                  }}
                >
                  <img
                    src="/white1.png"
                    alt=""
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                  {/* Text overlaid on the right portion, past the moon illustration */}
                  <div
                    className="absolute inset-0 flex items-center"
                    style={{ paddingLeft: '32%', paddingRight: '6%' }}
                  >
                    <p style={{ fontSize: '0.75rem', color: '#6b5040', lineHeight: 1.7 }}>
                      Cleanse negative energy, invite peace, and restore spiritual harmony through
                      gentle white magic practices.
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Right: card image ── */}
              <div className="flex flex-col justify-end">
              <div
                style={{
                  filter: 'drop-shadow(0 16px 48px rgba(160,120,60,0.20))',
                  transition: 'transform 0.4s cubic-bezier(0.34,1.2,0.64,1), filter 0.4s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-10px) rotate(1deg)';
                  e.currentTarget.style.filter = 'drop-shadow(0 32px 56px rgba(160,120,60,0.30))';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0) rotate(0deg)';
                  e.currentTarget.style.filter = 'drop-shadow(0 16px 48px rgba(160,120,60,0.20))';
                }}
              >
                <img
                  src="/white.png"
                  alt="White Magic"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── Love Spell ── */}
        <section
          id="love-spell"
          className="relative w-full overflow-hidden py-24 px-8"
          style={{ background: SECTION_BACKGROUND }}
        >
          {[
            { top: '10%', left: '4%',  size: 8,  op: 0.20 },
            { top: '22%', left: '51%', size: 6,  op: 0.15 },
            { top: '75%', left: '47%', size: 7,  op: 0.18 },
            { top: '82%', left: '7%',  size: 5,  op: 0.13 },
            { top: '28%', left: '94%', size: 9,  op: 0.19 },
            { top: '58%', left: '91%', size: 6,  op: 0.14 },
          ].map((s, i) => (
            <svg key={i} width={s.size} height={s.size} viewBox="0 0 10 10"
              className="absolute pointer-events-none"
              style={{ top: s.top, left: s.left, opacity: s.op }}>
              <path d="M5 0L5.8 4.2L10 5L5.8 5.8L5 10L4.2 5.8L0 5L4.2 4.2Z" fill="#c9a84c" />
            </svg>
          ))}

          <div className="relative z-10 mx-auto max-w-6xl">
            <div className="grid grid-cols-1 items-stretch gap-12 lg:grid-cols-2 lg:gap-20">

              {/* Left: text */}
              <div>
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="h-px w-6" style={{ background: 'rgba(201,168,76,0.6)' }} />
                  <span style={{ fontSize: '0.68rem', color: '#b8965a', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Products</span>
                  <div className="h-px w-6" style={{ background: 'rgba(201,168,76,0.6)' }} />
                </div>

                <h2 className="mb-2" style={{ fontFamily: 'MonteCarlo, cursive', fontWeight: 400, fontSize: 'clamp(3.2rem, 6vw, 5.5rem)', color: '#5c3d1e', lineHeight: 1.06, letterSpacing: '-0.01em' }}>
                  Love Spell
                </h2>

                <p className="mb-5" style={{ color: '#8a6b3e', fontSize: '0.875rem', lineHeight: 1.6 }}>
                  Open your heart to love, connection, and emotional harmony.
                </p>

                <div className="mb-5 w-12 h-px" style={{ background: 'rgba(201,168,76,0.45)' }} />

                <p className="mb-7" style={{ color: '#6b5040', fontSize: '0.875rem', lineHeight: 1.9, maxWidth: '420px' }}>
                  Our Love Spell service is created to support emotional connection, romantic attraction, and relationship healing. It helps you focus your intentions and invite loving energy into your life.
                </p>

                <div className="mb-8 grid grid-cols-2 gap-x-6 gap-y-3" style={{ maxWidth: '360px' }}>
                  {[
                    { path: 'M8 2.5C5.5 2.5 3.5 4.5 3.5 7C3.5 10.5 8 14 8 14C8 14 12.5 10.5 12.5 7C12.5 4.5 10.5 2.5 8 2.5Z', label: 'Attracting new love' },
                    { path: 'M8 1L9.2 6.6L14.5 5.5L10.8 9L13.5 13L8.3 10.8L8 16L7.7 10.8L2.5 13L5.2 9L1.5 5.5L6.8 6.6Z', label: 'Healing emotional distance' },
                    { path: 'M8 1.5C4.4 1.5 1.5 4.4 1.5 8C1.5 11.6 4.4 14.5 8 14.5C11.6 14.5 14.5 11.6 14.5 8C14.5 4.4 11.6 1.5 8 1.5ZM8 3.5C10.5 3.5 12.5 5.5 12.5 8C12.5 10.5 10.5 12.5 8 12.5C5.5 12.5 3.5 10.5 3.5 8C3.5 5.5 5.5 3.5 8 3.5Z', label: 'Strengthening romantic energy' },
                    { path: 'M12 4C12 7.3 9.3 10 6 10C4.3 10 2.8 9.3 1.7 8.2C1.9 11.4 4.7 14 8 14C11.3 14 14 11.3 14 8C14 6.3 13.3 4.8 12.2 3.7C12.1 3.8 12 3.9 12 4Z', label: 'Building self-love' },
                  ].map(({ path, label }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <div className="flex-shrink-0 flex items-center justify-center"
                        style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1px solid rgba(201,168,76,0.45)', background: 'rgba(201,168,76,0.07)' }}>
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                          <path d={path} fill="#c9a84c" />
                        </svg>
                      </div>
                      <span style={{ color: '#6b5040', fontSize: '0.8rem' }}>{label}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="mb-8 inline-flex items-center justify-center gap-3 rounded-full text-base font-semibold transition-all duration-200"
                  style={PRODUCT_CTA_STYLE}
                  onMouseEnter={e => liftCta(e.currentTarget, 'rgba(168,111,47,0.38)')}
                  onMouseLeave={e => settleCta(e.currentTarget, 'rgba(168,111,47,0.28)')}
                  onClick={() => setOrderProduct('Love Spell')}
                >
                  Order Love Spell
                  <span style={{ fontSize: '1rem', opacity: 0.9 }}>→</span>
                </button>

                <div className="relative overflow-hidden" style={{ maxWidth: '460px', borderRadius: '0.75rem', filter: 'drop-shadow(0 2px 8px rgba(160,120,60,0.10))' }}>
                  <img src="/love1.png" alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
                  <div className="absolute inset-0 flex items-center" style={{ paddingLeft: '32%', paddingRight: '6%' }}>
                    <p style={{ fontSize: '0.75rem', color: '#6b5040', lineHeight: 1.7 }}>
                      Invite romantic energy, emotional connection, and deeper harmony into your love life.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: card image */}
              <div className="flex flex-col justify-end">
              <div
                style={{ filter: 'drop-shadow(0 16px 48px rgba(160,120,60,0.20))', transition: 'transform 0.4s cubic-bezier(0.34,1.2,0.64,1), filter 0.4s ease' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-10px) rotate(1deg)'; e.currentTarget.style.filter = 'drop-shadow(0 32px 56px rgba(160,120,60,0.30))'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) rotate(0deg)'; e.currentTarget.style.filter = 'drop-shadow(0 16px 48px rgba(160,120,60,0.20))'; }}
              >
                <img src="/love.png" alt="Love Spell" style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── Money Spell ── */}
        <section
          id="money-spell"
          className="relative w-full overflow-hidden py-24 px-8"
          style={{ background: SECTION_BACKGROUND }}
        >
          {[
            { top: '7%',  left: '5%',  size: 9,  op: 0.22 },
            { top: '20%', left: '53%', size: 6,  op: 0.15 },
            { top: '70%', left: '49%', size: 8,  op: 0.18 },
            { top: '86%', left: '6%',  size: 5,  op: 0.13 },
            { top: '32%', left: '95%', size: 10, op: 0.20 },
            { top: '64%', left: '92%', size: 6,  op: 0.15 },
          ].map((s, i) => (
            <svg key={i} width={s.size} height={s.size} viewBox="0 0 10 10"
              className="absolute pointer-events-none"
              style={{ top: s.top, left: s.left, opacity: s.op }}>
              <path d="M5 0L5.8 4.2L10 5L5.8 5.8L5 10L4.2 5.8L0 5L4.2 4.2Z" fill="#c9a84c" />
            </svg>
          ))}

          <div className="relative z-10 mx-auto max-w-6xl">
            <div className="grid grid-cols-1 items-stretch gap-12 lg:grid-cols-2 lg:gap-20">

              {/* Left: text */}
              <div>
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="h-px w-6" style={{ background: 'rgba(201,168,76,0.6)' }} />
                  <span style={{ fontSize: '0.68rem', color: '#b8965a', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Products</span>
                  <div className="h-px w-6" style={{ background: 'rgba(201,168,76,0.6)' }} />
                </div>

                <h2 className="mb-2" style={{ fontFamily: 'MonteCarlo, cursive', fontWeight: 400, fontSize: 'clamp(3.2rem, 6vw, 5.5rem)', color: '#5c3d1e', lineHeight: 1.06, letterSpacing: '-0.01em' }}>
                  Money Spell
                </h2>

                <p className="mb-5" style={{ color: '#8a6b3e', fontSize: '0.875rem', lineHeight: 1.6 }}>
                  Align your energy with abundance, opportunity, and prosperity.
                </p>

                <div className="mb-5 w-12 h-px" style={{ background: 'rgba(201,168,76,0.45)' }} />

                <p className="mb-7" style={{ color: '#6b5040', fontSize: '0.875rem', lineHeight: 1.9, maxWidth: '420px' }}>
                  Money Spell is designed to support your abundance mindset and help clear energetic blocks around wealth. It focuses on attracting opportunities, confidence, and positive financial energy.
                </p>

                <div className="mb-8 grid grid-cols-2 gap-x-6 gap-y-3" style={{ maxWidth: '360px' }}>
                  {[
                    { path: 'M8 1L9.2 6.6L14.5 5.5L10.8 9L13.5 13L8.3 10.8L8 16L7.7 10.8L2.5 13L5.2 9L1.5 5.5L6.8 6.6Z', label: 'Abundance energy' },
                    { path: 'M3 8H13M3 5H13M3 11H9M2 2H14C14.6 2 15 2.4 15 3V13C15 13.6 14.6 14 14 14H2C1.4 14 1 13.6 1 13V3C1 2.4 1.4 2 2 2Z', label: 'Career opportunities' },
                    { path: 'M8 1.5C4.4 1.5 1.5 4.4 1.5 8C1.5 11.6 4.4 14.5 8 14.5C11.6 14.5 14.5 11.6 14.5 8C14.5 4.4 11.6 1.5 8 1.5ZM8 3.5C10.5 3.5 12.5 5.5 12.5 8C12.5 10.5 10.5 12.5 8 12.5C5.5 12.5 3.5 10.5 3.5 8C3.5 5.5 5.5 3.5 8 3.5Z', label: 'Money confidence' },
                    { path: 'M8 14L14 8L12 6L8 10L4 6L2 8L8 14ZM8 9L14 3L12 1L8 5L4 1L2 3L8 9Z', label: 'Removing prosperity blocks' },
                  ].map(({ path, label }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <div className="flex-shrink-0 flex items-center justify-center"
                        style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1px solid rgba(201,168,76,0.45)', background: 'rgba(201,168,76,0.07)' }}>
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                          <path d={path} fill="#c9a84c" />
                        </svg>
                      </div>
                      <span style={{ color: '#6b5040', fontSize: '0.8rem' }}>{label}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="mb-8 inline-flex items-center justify-center gap-3 rounded-full text-base font-semibold transition-all duration-200"
                  style={PRODUCT_CTA_STYLE}
                  onMouseEnter={e => liftCta(e.currentTarget, 'rgba(168,111,47,0.38)')}
                  onMouseLeave={e => settleCta(e.currentTarget, 'rgba(168,111,47,0.28)')}
                  onClick={() => setOrderProduct('Money Spell')}
                >
                  Order Money Spell
                  <span style={{ fontSize: '1rem', opacity: 0.9 }}>→</span>
                </button>

                <div className="relative overflow-hidden" style={{ maxWidth: '460px', borderRadius: '0.75rem', filter: 'drop-shadow(0 2px 8px rgba(160,120,60,0.10))' }}>
                  <img src="/money1.png" alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
                  <div className="absolute inset-0 flex items-center" style={{ paddingLeft: '32%', paddingRight: '6%' }}>
                    <p style={{ fontSize: '0.75rem', color: '#6b5040', lineHeight: 1.7 }}>
                      Clear financial blocks and invite opportunity, confidence, and prosperity into your life.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: card image */}
              <div className="flex flex-col justify-end">
              <div
                style={{ filter: 'drop-shadow(0 16px 48px rgba(160,120,60,0.20))', transition: 'transform 0.4s cubic-bezier(0.34,1.2,0.64,1), filter 0.4s ease' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-10px) rotate(1deg)'; e.currentTarget.style.filter = 'drop-shadow(0 32px 56px rgba(160,120,60,0.30))'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) rotate(0deg)'; e.currentTarget.style.filter = 'drop-shadow(0 16px 48px rgba(160,120,60,0.20))'; }}
              >
                <img src="/money.png" alt="Money Spell" style={{ width: '100%', height: 'auto', display: 'block' }} />
              </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── Psychic Reading ── */}
        <section
          id="psychic-reading"
          className="relative w-full overflow-hidden py-24 px-8"
          style={{ background: SECTION_BACKGROUND }}
        >
          {[
            { top: '8%',  left: '4%',  size: 9,  op: 0.20 },
            { top: '20%', left: '52%', size: 6,  op: 0.14 },
            { top: '74%', left: '48%', size: 8,  op: 0.17 },
            { top: '85%', left: '6%',  size: 5,  op: 0.12 },
            { top: '28%', left: '95%', size: 10, op: 0.18 },
            { top: '60%', left: '91%', size: 6,  op: 0.14 },
          ].map((s, i) => (
            <svg key={i} width={s.size} height={s.size} viewBox="0 0 10 10"
              className="absolute pointer-events-none"
              style={{ top: s.top, left: s.left, opacity: s.op }}>
              <path d="M5 0L5.8 4.2L10 5L5.8 5.8L5 10L4.2 5.8L0 5L4.2 4.2Z" fill="#8b6fae" />
            </svg>
          ))}

          <div className="relative z-10 mx-auto max-w-6xl">
            <div className="grid grid-cols-1 items-stretch gap-12 lg:grid-cols-2 lg:gap-20">

              {/* Left: text */}
              <div>
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="h-px w-6" style={{ background: 'rgba(139,111,174,0.55)' }} />
                  <span style={{ fontSize: '0.68rem', color: '#8b6fae', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Services</span>
                  <div className="h-px w-6" style={{ background: 'rgba(139,111,174,0.55)' }} />
                </div>

                <h2 className="mb-2" style={{ fontFamily: 'MonteCarlo, cursive', fontWeight: 400, fontSize: 'clamp(3.2rem, 6vw, 5.5rem)', color: '#3b2060', lineHeight: 1.06, letterSpacing: '-0.01em' }}>
                  Psychic Reading
                </h2>

                <p className="mb-5" style={{ color: '#6b5080', fontSize: '0.875rem', lineHeight: 1.6 }}>
                  Receive intuitive insight into love, career, life path, and personal questions.
                </p>

                <div className="mb-5 w-12 h-px" style={{ background: 'rgba(139,111,174,0.4)' }} />

                <p className="mb-7" style={{ color: '#5a4570', fontSize: '0.875rem', lineHeight: 1.9, maxWidth: '420px' }}>
                  A Psychic Reading offers personal intuitive guidance when you need clarity. Through spiritual insight and compassionate interpretation, we help you better understand your current situation and the energy surrounding your path.
                </p>

                {/* Feature grid — 5 items, 2 cols */}
                <div className="mb-8 grid grid-cols-2 gap-x-6 gap-y-3" style={{ maxWidth: '380px' }}>
                  {[
                    { path: 'M8 2.5C5.5 2.5 3.5 4.5 3.5 7C3.5 10.5 8 14 8 14C8 14 12.5 10.5 12.5 7C12.5 4.5 10.5 2.5 8 2.5Z', label: 'Love and relationships' },
                    { path: 'M8 1L9.2 6.6L14.5 5.5L10.8 9L13.5 13L8.3 10.8L8 16L7.7 10.8L2.5 13L5.2 9L1.5 5.5L6.8 6.6Z', label: 'Career direction' },
                    { path: 'M8 1.5C4.4 1.5 1.5 4.4 1.5 8C1.5 11.6 4.4 14.5 8 14.5C11.6 14.5 14.5 11.6 14.5 8C14.5 4.4 11.6 1.5 8 1.5ZM8 3.5C10.5 3.5 12.5 5.5 12.5 8C12.5 10.5 10.5 12.5 8 12.5C5.5 12.5 3.5 10.5 3.5 8C3.5 5.5 5.5 3.5 8 3.5Z', label: 'Life decisions' },
                    { path: 'M8 1L9.2 6.6L14.5 5.5L10.8 9L13.5 13L8.3 10.8L8 16L7.7 10.8L2.5 13L5.2 9L1.5 5.5L6.8 6.6Z', label: 'Spiritual guidance' },
                    { path: 'M8 4C8 4 4 6.5 4 9.5C4 11.4 5.8 13 8 13C10.2 13 12 11.4 12 9.5C12 6.5 8 4 8 4ZM8 11.5C6.9 11.5 6 10.6 6 9.5C6 9.5 6.5 10 8 10C9.5 10 10 9.5 10 9.5C10 10.6 9.1 11.5 8 11.5Z', label: 'Personal clarity' },
                  ].map(({ path, label }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <div className="flex-shrink-0 flex items-center justify-center"
                        style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1px solid rgba(139,111,174,0.4)', background: 'rgba(139,111,174,0.08)' }}>
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                          <path d={path} fill="#8b6fae" />
                        </svg>
                      </div>
                      <span style={{ color: '#5a4570', fontSize: '0.8rem' }}>{label}</span>
                    </div>
                  ))}
                </div>

                {/* CTA — navigates to booking */}
                <button
                  type="button"
                  className="mb-8 inline-flex items-center justify-center gap-3 rounded-full text-base font-semibold transition-all duration-200"
                  style={PSYCHIC_CTA_STYLE}
                  onMouseEnter={e => liftCta(e.currentTarget, 'rgba(91,58,134,0.38)')}
                  onMouseLeave={e => settleCta(e.currentTarget, 'rgba(91,58,134,0.28)')}
                  onClick={() => navigate('/booking')}
                >
                  Book Psychic Reading
                  <span style={{ fontSize: '1rem', opacity: 0.9 }}>→</span>
                </button>

                {/* Info box — read1.png is self-contained with text already in the image */}
                <div style={{ maxWidth: '460px', borderRadius: '0.75rem', overflow: 'hidden', filter: 'drop-shadow(0 2px 8px rgba(100,70,140,0.12))' }}>
                  <img src="/read1.png" alt="Psychic Reading — intuitive guidance" style={{ width: '100%', height: 'auto', display: 'block' }} />
                </div>
              </div>

              {/* Right: card image */}
              <div className="flex flex-col justify-end">
                <div
                  style={{ filter: 'drop-shadow(0 16px 48px rgba(80,50,120,0.22))', transition: 'transform 0.4s cubic-bezier(0.34,1.2,0.64,1), filter 0.4s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-10px) rotate(1deg)'; e.currentTarget.style.filter = 'drop-shadow(0 32px 56px rgba(80,50,120,0.35))'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) rotate(0deg)'; e.currentTarget.style.filter = 'drop-shadow(0 16px 48px rgba(80,50,120,0.22))'; }}
                >
                  <img src="/read.png" alt="Psychic Reading" style={{ width: '100%', height: 'auto', display: 'block' }} />
                </div>
              </div>

            </div>
          </div>
        </section>

      </main>

      <PublicSiteFooter />

      {orderProduct && (
        <ProductOrderModal productName={orderProduct} onClose={() => setOrderProduct(null)} />
      )}
    </div>
  );
};

export default HomePage;
