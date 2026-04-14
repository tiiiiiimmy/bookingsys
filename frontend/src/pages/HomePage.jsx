import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PublicLanguageSwitcher from '../components/public/PublicLanguageSwitcher';
import PublicSiteFooter from '../components/public/PublicSiteFooter';
import {
  HOME_COPY,
  HOME_LOAD_ERROR,
  getLocalizedServiceContent,
} from '../content/publicSiteContent';
import usePublicLanguage from '../hooks/usePublicLanguage';
import bookingService from '../services/bookingService';

const HERO_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCKvSEVv-tPV6Gy0jzB-Tb-HAdxL6yfyWgJwcKde-4WiPWoKAuCLTgIz4B1OUNRhdwb8wqUom_SpwX-0IPYewEEtkjuC6JXQgAzDSGAbtTlflnx7hWKZ1mysrmoJxlqssWV4xN6NXmT9HAfzFzCgzeDOqVD8r-baaOAbRBuAdn6_do9FpQHlxv9cu4EzJ-watX8elzpbQ6ezHqIaml9ZhUwZzJCz7a6kvAY7nmPMm5o76jbK4ZrkTOy_aTGKWHrOKh5HczFufEPRRw';

const SERVICE_CARD_MEDIA = [
  {
    src: 'https://images.pexels.com/photos/31234759/pexels-photo-31234759.jpeg',
    alt: 'Deep tissue massage',
  },
  {
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEYJItm7tPPn3OdSbFvhjyde2sm7-IPKSchteeuxiAIFNsrWwIO5Fcs6gzw4sw37iyT9SGy_4ub21oW0soIBkGkM9Dg0GA0hGIe9WOcXga4JCgpuemdMZjY2SYfocHBb9m7o60-kUcx9ejwaXp1b0eljdaOvuBXCDUM2kXN00LzN20VzEePAB5_g07jC7slTwIP_b6QmOD2XImckwqvAz9TUiBSPMkUiZcCUAdp6-aeVK7KNI7YcJktjFfpmfxfZR_8p1DdtQoUco',
    alt: 'Aromatherapy massage',
  },
  {
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBzbDIC3ubii-VBSSqTmxfGjUEE9_rUWUY7xVUx04liqpmiRpljspYvE8-i1OyGk2hj0Cn4pGKxOFX9zF3yQO4XmzhRVU7xqtwitjx5u1zV9v60R9JPBKMnR6NWoUBVzs2g6GQysNQgwz94tNCKql6Sg6o_D_60zw08T5ptkDUwj2wn7kNuelBOri687lrL4RuhM1H9CL0m8DtXm7JJsYz-lo8lHha7mmezG08jAELjzraYY_mEtPTcEbse_W0i1DpaX-XvIa67V68',
    alt: 'Hot stone therapy',
  },
  {
    src: 'https://images.pexels.com/photos/6628596/pexels-photo-6628596.jpeg',
    alt: 'Head and shoulder massage',
  },
];

const CTA_BG_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBt1Yvg1jMpbaGTQjkt8-e7DOrIZUuCrJsPaEkV18lZAMnt_LRYpGFdOvBCThM2-cEnKfZp10HomL_p8kJzGOON9y_vno9Ol9q-8eqf27DzayM6LR1B3SyBGvGMLW0-54K0o-h1Kk6ESZms5j3OteE8jKYbXkiSEHo4KgpcZMncaX1_hMI1vFIeo6Xj8jlE92As_EMG82SQU08QXDKls5K8qqFByXDpkM6RKiyX02WN5K-0xXQ99X8DrJeTdTbjNv-hcSLP1IfAXs4';

const getDurationMinutes = (service) => {
  if (Number(service?.duration_minutes) > 0) {
    return Number(service.duration_minutes);
  }

  if (Number(service?.durationMinutes) > 0) {
    return Number(service.durationMinutes);
  }

  return 30;
};

const HomePage = () => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { language, setLanguage, t, formatMoney } = usePublicLanguage(HOME_COPY);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        const response = await bookingService.getServiceTypes();
        setServices(response.data || []);
      } catch (err) {
        setError(err.response?.data?.error?.message || HOME_LOAD_ERROR);
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  const closeMobile = () => setMobileOpen(false);

  const navLinkClass =
    'text-stone-600 font-medium hover:text-orange-700 transition-all duration-300 font-sans tracking-wider text-sm';

  const getLocalizedService = (service) => {
    return getLocalizedServiceContent(service, language, t.services.defaultDescription);
  };

  const renderLanguageSwitcher = () => (
    <PublicLanguageSwitcher language={language} setLanguage={setLanguage} />
  );

  const displayedError = error && error !== HOME_LOAD_ERROR ? error : t.errors.loadServices;

  return (
    <div className="min-h-screen bg-background font-body text-on-surface antialiased selection:bg-primary-fixed selection:text-on-primary-fixed">
      <nav className="fixed top-0 z-50 w-full border-b border-outline/30 bg-stone-50/80 backdrop-blur-xl dark:bg-stone-900/80">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-8 py-4">
          <div className="font-headline text-xl font-bold text-orange-900 dark:text-orange-100">
            {t.brand}
          </div>
          <div className="hidden items-center space-x-6 md:flex">
            <a className={navLinkClass} href="#services">
              {t.nav.services}
            </a>
            <a className={navLinkClass} href="#process">
              {t.nav.process}
            </a>
            <a className={navLinkClass} href="#about">
              {t.nav.about}
            </a>
            {renderLanguageSwitcher()}
            <button
              type="button"
              className="scale-95 rounded-full bg-primary px-6 py-2.5 font-sans text-sm tracking-wider text-on-primary transition-all duration-200 ease-in-out hover:bg-primary-container"
              onClick={() => navigate('/booking')}
            >
              {t.nav.bookNow}
            </button>
          </div>
          <div className="md:hidden">
            <button
              type="button"
              className="rounded-lg p-2 text-on-surface"
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? t.nav.closeMenu : t.nav.openMenu}
              onClick={() => setMobileOpen((open) => !open)}
            >
              <span className="material-symbols-outlined">{mobileOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>
        {mobileOpen ? (
          <div className="flex flex-col gap-3 border-t border-outline/30 bg-stone-50/95 px-8 py-4 dark:bg-stone-900/95 md:hidden">
            <div className="mb-1">{renderLanguageSwitcher()}</div>
            <a className={navLinkClass} href="#services" onClick={closeMobile}>
              {t.nav.services}
            </a>
            <a className={navLinkClass} href="#process" onClick={closeMobile}>
              {t.nav.process}
            </a>
            <a className={navLinkClass} href="#about" onClick={closeMobile}>
              {t.nav.about}
            </a>
            <button
              type="button"
              className="w-full rounded-full bg-primary py-3 font-sans text-sm tracking-wider text-on-primary"
              onClick={() => {
                closeMobile();
                navigate('/booking');
              }}
            >
              {t.nav.bookNow}
            </button>
          </div>
        ) : null}
      </nav>

      <main className="pt-24">
        <section className="relative mx-auto flex min-h-[921px] max-w-7xl items-center overflow-hidden px-8">
          <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div className="z-10">
              <h1 className="mb-4 font-headline text-5xl leading-tight text-on-surface md:text-7xl">
                {t.hero.title}
                <br />
                <span className="mt-2 block text-primary">{t.hero.subtitle}</span>
              </h1>
              <p className="mb-10 max-w-lg font-body text-xl leading-relaxed text-on-surface-variant md:text-2xl">
                {t.hero.description}
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  className="rounded-full bg-primary px-8 py-4 font-semibold tracking-wide text-on-primary transition-all hover:-translate-y-1 hover:shadow-xl"
                  onClick={() => navigate('/booking')}
                >
                  {t.hero.bookNow}
                </button>
                <button
                  type="button"
                  className="rounded-full bg-surface-container-highest px-8 py-4 font-semibold tracking-wide text-secondary transition-all hover:bg-surface-container-high"
                  onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  {t.hero.explore}
                </button>
              </div>
            </div>
            <div className="group relative">
              <div className="absolute -inset-4 rounded-3xl bg-primary-fixed opacity-20 blur-3xl transition-opacity group-hover:opacity-30" />
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-outline/70 shadow-[0_12px_28px_rgba(82,68,62,0.08)]">
                <img alt={t.hero.heroAlt} className="h-full w-full object-cover" src={HERO_IMG} />
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="bg-surface-container-low py-24">
          <div className="mx-auto max-w-7xl px-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center rounded-3xl border border-outline/70 bg-surface-container-lowest p-10 text-center shadow-[0_10px_24px_rgba(82,68,62,0.05)]">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed">
                  <span className="material-symbols-outlined text-3xl text-primary">spa</span>
                </div>
                <h3 className="mb-3 font-headline text-xl">{t.about.title1}</h3>
                <p className="font-body text-sm leading-relaxed text-on-surface-variant">{t.about.desc1}</p>
              </div>
              <div className="flex flex-col items-center rounded-3xl border border-outline/70 bg-surface-container-lowest p-10 text-center shadow-[0_10px_24px_rgba(82,68,62,0.05)]">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed">
                  <span className="material-symbols-outlined text-3xl text-primary">filter_vintage</span>
                </div>
                <h3 className="mb-3 font-headline text-xl">{t.about.title2}</h3>
                <p className="font-body text-sm leading-relaxed text-on-surface-variant">{t.about.desc2}</p>
              </div>
              <div className="flex flex-col items-center rounded-3xl border border-outline/70 bg-surface-container-lowest p-10 text-center shadow-[0_10px_24px_rgba(82,68,62,0.05)]">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed">
                  <span className="material-symbols-outlined text-3xl text-primary">lock</span>
                </div>
                <h3 className="mb-3 font-headline text-xl">{t.about.title3}</h3>
                <p className="font-body text-sm leading-relaxed text-on-surface-variant">{t.about.desc3}</p>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="mx-auto max-w-7xl px-8 py-32">
          <div className="mb-20 text-center">
            <h2 className="mb-4 font-headline text-4xl md:text-5xl">{t.services.heading}</h2>
            <div className="mx-auto h-1 w-24 rounded-full bg-primary" />
          </div>

          {error ? (
            <div className="rounded-2xl bg-error-container p-6 text-center text-on-error-container">{displayedError}</div>
          ) : null}

          {loading ? (
            <p className="text-center font-body text-on-surface-variant">{t.services.loading}</p>
          ) : services.length === 0 ? (
            <div className="rounded-[2rem] border border-outline/70 bg-surface-container-lowest p-12 text-center shadow-[0_10px_24px_rgba(82,68,62,0.05)]">
              <p className="mb-6 text-on-surface-variant">{t.services.empty}</p>
              <button
                type="button"
                className="rounded-full bg-primary px-8 py-3 font-semibold text-on-primary"
                onClick={() => navigate('/booking')}
              >
                {t.services.goBooking}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {services.map((service, index) => {
                const media = SERVICE_CARD_MEDIA[index % SERVICE_CARD_MEDIA.length];
                const localizedService = getLocalizedService(service);
                const duration = getDurationMinutes(service);

                return (
                  <div
                    key={service.id}
                    className="group overflow-hidden rounded-[2rem] border border-outline/70 bg-surface-container-lowest transition-all duration-500 hover:border-outline"
                  >
                    <div className="h-48 overflow-hidden">
                      <img
                        alt={media.alt}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        src={media.src}
                      />
                    </div>
                    <div className="p-8">
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-headline text-xl text-on-surface">{localizedService.title}</h4>
                          <span className="font-label text-xs uppercase tracking-widest text-tertiary">
                            {localizedService.subtitle}
                          </span>
                        </div>
                        <span className="text-xl font-bold text-primary">
                          {formatMoney(service.price, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <p className="mb-6 text-sm leading-relaxed text-on-surface-variant">
                        {localizedService.description}
                      </p>
                      <div className="mb-8 flex items-center font-label text-xs text-on-surface-variant">
                        <span className="material-symbols-outlined mr-2 text-sm">schedule</span>
                        {language === 'en' ? `${duration} ${t.services.durationLabel}` : `${duration} ${t.services.durationLabel}`}
                      </div>
                      <button
                        type="button"
                        className="w-full rounded-full bg-surface-container py-3 font-bold text-secondary transition-colors hover:bg-primary hover:text-on-primary"
                        onClick={() => navigate(`/booking?serviceType=${service.id}`)}
                      >
                        {t.services.bookNow}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section id="process" className="relative overflow-hidden bg-surface-container py-32">
          <div className="relative z-10 mx-auto max-w-7xl px-8">
            <div className="mb-24 text-center">
              <h2 className="mb-4 font-headline text-4xl md:text-5xl">{t.process.heading}</h2>
              <p className="font-body text-on-surface-variant">{t.process.subheading}</p>
            </div>
            <div className="relative">
              <div className="absolute top-1/2 left-0 hidden h-[0.5px] w-full -translate-y-1/2 bg-tertiary/30 md:block" />
              <div className="relative grid grid-cols-1 gap-12 md:grid-cols-4">
                {t.process.steps.map((step, index) => (
                  <div key={step.title} className={`group flex flex-col items-center ${index % 2 === 1 ? 'md:mt-24' : ''}`}>
                    <div className="relative z-20 flex h-16 w-16 items-center justify-center rounded-full bg-secondary-fixed-dim shadow-lg transition-transform group-hover:scale-110">
                      <span className="text-xl font-bold text-on-secondary-fixed">{index + 1}</span>
                    </div>
                    <div className="mt-8 text-center">
                      <h4 className="mb-1 font-headline text-lg">{step.title}</h4>
                      <p className="mb-3 text-center font-label text-xs tracking-wider text-tertiary uppercase">
                        {step.subtitle}
                      </p>
                      <p className="px-4 text-sm text-on-surface-variant">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-20 text-center">
              <p className="inline-flex items-center rounded-full bg-secondary-fixed/30 px-6 py-3 text-sm font-medium text-secondary">
                <span className="material-symbols-outlined mr-2 text-sm">info</span>
                {t.process.paymentHint}
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-8 py-24 text-center">
          <h3 className="mb-8 font-headline text-3xl">{t.payment.heading}</h3>
          <div className="mb-12 flex flex-wrap items-center justify-center gap-12 opacity-70">
            <div className="flex items-center text-on-surface-variant">
              <span className="material-symbols-outlined mr-2">credit_card</span>
              <span className="font-label text-sm tracking-widest">VISA / MASTER / AMEX</span>
            </div>
            <div className="flex items-center text-on-surface-variant">
              <span className="material-symbols-outlined mr-2">account_balance</span>
              <span className="font-label text-sm tracking-widest">STRIPE GATEWAY</span>
            </div>
            <div className="flex items-center text-on-surface-variant">
              <span className="material-symbols-outlined mr-2">verified_user</span>
              <span className="font-label text-sm tracking-widest">PCI COMPLIANT</span>
            </div>
          </div>
          <p className="mx-auto max-w-2xl leading-relaxed text-on-surface-variant">{t.payment.description}</p>
        </section>

        <section className="bg-stone-100 py-24">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-8 md:grid-cols-2">
            <div className="space-y-8">
              <h2 className="mb-6 font-headline text-3xl">{t.info.heading}</h2>
              <div className="flex items-start">
                <span className="material-symbols-outlined mr-4 mt-1 text-primary">calendar_today</span>
                <div>
                  <p className="font-bold text-on-surface">{t.info.hoursTitle}</p>
                  <p className="text-on-surface-variant">{t.info.hoursLine1}</p>
                  <p className="text-on-surface-variant">{t.info.hoursLine2}</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="material-symbols-outlined mr-4 mt-1 text-primary">location_on</span>
                <div>
                  <p className="font-bold text-on-surface">{t.info.locationTitle}</p>
                  <p className="text-on-surface-variant">{t.info.locationLine1}</p>
                  <p className="text-on-surface-variant">{t.info.locationLine2}</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-outline/70 bg-surface-container-lowest p-8">
              <h2 className="mb-6 font-headline text-2xl">{t.info.policiesTitle}</h2>
              <ul className="space-y-6 text-sm text-on-surface-variant">
                {t.info.policies.map((policy, index) => (
                  <li key={policy.label} className="flex items-start">
                    <span className="material-symbols-outlined mr-3 text-primary-container">
                      {index === 0 ? 'update' : index === 1 ? 'assignment_return' : 'priority_high'}
                    </span>
                    <span>
                      <strong>{policy.label}</strong> {policy.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="relative py-40">
          <div className="absolute inset-0 z-0">
            <img alt="" className="h-full w-full object-cover opacity-10" src={CTA_BG_IMG} />
          </div>
          <div className="relative z-10 mx-auto max-w-4xl px-8 text-center">
            <h2 className="mb-8 font-headline text-5xl text-on-surface md:text-6xl">{t.cta.title}</h2>
            <p className="mb-12 font-body text-2xl uppercase tracking-wide text-secondary">{t.cta.subtitle}</p>
            <button
              type="button"
              className="rounded-full bg-primary px-12 py-5 text-lg font-bold text-on-primary shadow-2xl transition-all hover:-translate-y-1 hover:bg-primary-container active:scale-95"
              onClick={() => navigate('/booking')}
            >
              {t.cta.button}
            </button>
          </div>
        </section>
      </main>

      <PublicSiteFooter brand={t.brand} footer={t.footer} />
    </div>
  );
};

export default HomePage;
