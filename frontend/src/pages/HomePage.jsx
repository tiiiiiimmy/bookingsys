import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const products = [
  {
    className: 'product-one',
    title: 'White Magic',
    image: '/product1.png',
    description:
      'Harness the purest energy for clarity and protection. Harness the purest energy for clarity and protection. Harness the purest energy for clarity and protection.',
  },
  {
    className: 'product-two',
    title: 'Love spell',
    image: '/product2.png',
    description:
      'Remove the pressure around love and release yourself from the patterns keeping the connection distant. Open the path for real warmth and repair.',
  },
  {
    className: 'product-three',
    title: 'Money spell',
    image: '/product3.png',
    description:
      'Harness the purest energy for clarity and protection. Harness the purest energy for clarity and protection. Harness the purest energy for clarity and protection.',
  },
];

const readings = [
  { minutes: '10', price: '80 USD' },
  { minutes: '20', price: '180 USD' },
  { minutes: '60', price: '280 USD' },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [scale, setScale] = useState(() => (typeof window === 'undefined' ? 1 : Math.min(1, window.innerWidth / 1920)));

  useEffect(() => {
    const updateScale = () => setScale(Math.min(1, window.innerWidth / 1920));

    updateScale();
    window.addEventListener('resize', updateScale);

    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const bookCall = () => {
    const query = phone.trim() ? `?phone=${encodeURIComponent(phone.trim())}` : '';
    navigate(`/booking${query}`);
  };

  const scrollToDesignY = (designY) => {
    window.scrollTo({ top: designY * scale, behavior: 'smooth' });
  };

  return (
    <div className="psychic-page" style={{ height: `${6000 * scale}px` }}>
      <header className="psychic-header" style={{ '--page-scale': scale }}>
        <button type="button" className="brand-mark" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img alt="" src="/title-star.png" />
          <span>Psychic Magic</span>
        </button>
        <nav className="top-nav">
          <button type="button" onClick={() => scrollToDesignY(1769)}>
            Our products
          </button>
          <button type="button" onClick={() => scrollToDesignY(3929)}>
            Our services
          </button>
          <button type="button" onClick={() => scrollToDesignY(4970)}>
            About us
          </button>
        </nav>
      </header>
      <div className="psychic-scale" style={{ transform: `scale(${scale})` }}>
        <main className="psychic-canvas">
          <div className="crystal crystal-a" />
          <div className="crystal crystal-b" />
          <div className="crystal crystal-c" />
          <div className="crystal crystal-d" />

          <section className="hero-section">
            <h1>Psychic Magic</h1>
            <img alt="Psychic Magic altar with candles, crystals, tarot cards, and a crystal ball" src="/img1.png" />
          </section>

          <section id="products" className="products-section">
            <h2>Our Products</h2>
            {products.map((product) => (
              <article key={product.title} className={`product-block ${product.className}`}>
                <div className="product-gradient" />
                <img alt="" className="product-image" src={product.image} />
                <h3>{product.title}</h3>
                <p>{product.description}</p>
                <button type="button" onClick={bookCall}>
                  $99
                </button>
              </article>
            ))}
          </section>

          <section id="services" className="services-section">
            <h2>Our Services</h2>
            <img alt="Psychic reading table with phone, crystal ball, cards, and candles" className="services-image" src="/services.png" />
            <div className="services-copy">
              <h3>Psychic Reading</h3>
              <div className="reading-options">
                {readings.map((reading) => (
                  <button type="button" className="reading-option" key={reading.minutes} onClick={bookCall}>
                    <span>
                      {reading.minutes}
                      <small>mins</small>
                    </span>
                    <strong>{reading.price}</strong>
                  </button>
                ))}
              </div>
              <p>All sessions are delivered via international phone call or online meeting.</p>
              <form
                className="booking-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  bookCall();
                }}
              >
                <label htmlFor="phone">Phone number</label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="Input ph number there"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
                <button type="submit">Book a call</button>
              </form>
            </div>
          </section>

          <section id="about" className="about-section">
            <img alt="" className="about-art" src="/aboutus.png" />
            <p className="reader-label">Psychic Reader</p>
            <p className="reader-name">Ivy</p>
            <button type="button" className="about-cta" onClick={bookCall}>
              Book a call
            </button>

            <div className="about-card about-card-left">
              <h3>27+ years of professional psychic practice</h3>
              <ul>
                <li>Specialties: Twin Flames, Love & Relationships, Family Matters, Career Guidance, Energy Readings</li>
                <li>Unique Gifts: Clairaudience, Clairvoyance, Spiritual Guidance</li>
              </ul>
            </div>

            <div className="about-card about-card-right">
              <h3>Over 5,000 readings completed</h3>
              <ul>
                <li>
                  Clients describe Kay as a gift from the Universe and praise her ability to bring peace, direction, and
                  empowerment.
                </li>
                <li>
                  Whether you are seeking guidance in relationships, career, or personal growth, Kay's readings are renowned
                  for being accurate, uplifting, and transformational.
                </li>
              </ul>
            </div>

            <h2>
              About
              <span>Us</span>
            </h2>
          </section>
        </main>
      </div>
    </div>
  );
};

export default HomePage;
