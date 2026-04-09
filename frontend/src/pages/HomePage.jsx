import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bookingService from '../services/bookingService';

const valueProps = [
  {
    titleZh: '专业手法放松',
    titleEn: 'Targeted Relief',
    description: '从肩颈到腿部，围绕紧绷与疲劳感做更专注的舒缓体验。',
  },
  {
    titleZh: '安静疗愈环境',
    titleEn: 'Quiet Spa Mood',
    description: '暖色调空间与平静节奏，让身心在预约前就先进入放松状态。',
  },
  {
    titleZh: '安全在线支付',
    titleEn: 'Secure Checkout',
    description: '预约前完成在线支付，流程清晰、确认及时，减少沟通等待。',
  },
];

const bookingSteps = [
  {
    step: '01',
    titleZh: '选择按摩项目',
    titleEn: 'Choose a treatment',
    description: '浏览项目、功效、时长与价格，选定最适合你的放松方式。',
  },
  {
    step: '02',
    titleZh: '选择预约时间',
    titleEn: 'Pick a time',
    description: '进入预约页后查看本周空档，按时长选择可完整预约的时间段。',
  },
  {
    step: '03',
    titleZh: '填写联系信息',
    titleEn: 'Add your details',
    description: '填写姓名、邮箱、电话与备注，帮助我们为你的到店体验做准备。',
  },
  {
    step: '04',
    titleZh: '在线支付确认',
    titleEn: 'Pay to confirm',
    description: '支付成功后预约才会正式确认，确认页可查看状态与后续信息。',
  },
];

const paymentPoints = [
  '通过 Stripe 安全完成在线支付，流程加密且结算清晰。',
  '支持常见银行卡，以及设备可用时显示的快捷支付方式。',
  '支付成功后预约正式确认，减少时段占用与反复沟通。',
];

const policyPoints = [
  '营业时间固定为周四与周日，9:00 AM - 5:00 PM。',
  '预约需先支付，付款成功后系统才会确认时段。',
  '如需调整时间，可通过预约管理链接提交改期申请。',
  '退款由管理员根据实际情况进行人工审核与处理。',
];

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

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
  const servicesRef = useRef(null);
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
        setError(err.response?.data?.error?.message || '无法加载按摩项目');
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  const scrollToServices = () => {
    servicesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const startingPriceLabel = services.length > 0
    ? formatMoney(Math.min(...services.map((service) => Number(service.price || 0))))
    : '$45.00';

  return (
    <div className="home-page landing-page">
      <header className="landing-hero">
        <div className="landing-shell landing-nav">
          <div className="landing-brand">
            <span className="landing-brand-mark">MS</span>
            <div>
              <p>暖愈按摩</p>
              <span>Massage Studio</span>
            </div>
          </div>
          <button type="button" className="landing-nav-button" onClick={() => navigate('/booking')}>
            立即预约
          </button>
        </div>

        <div className="landing-shell landing-hero-grid">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow">Boutique bodywork for deep comfort</p>
            <h1>暖色疗愈空间里的细致放松体验</h1>
            <p className="landing-lead">
              专注肩颈、背部、腿部与脚部放松，从选择项目到在线确认，整个预约流程安静、清晰、顺滑。
            </p>
            <p className="landing-lead landing-lead-secondary">
              Discover a warmer way to book massage sessions, with curated treatments, calm scheduling,
              and secure online payment before arrival.
            </p>

            <div className="landing-actions">
              <button type="button" className="landing-primary-button" onClick={() => navigate('/booking')}>
                立即预约 / Book Now
              </button>
              <button type="button" className="landing-secondary-button" onClick={scrollToServices}>
                查看项目 / Explore Services
              </button>
            </div>

            <div className="landing-stat-row">
              <div className="landing-stat-card">
                <strong>{services.length || 5}</strong>
                <span>精选项目 / Curated Treatments</span>
              </div>
              <div className="landing-stat-card">
                <strong>{startingPriceLabel}</strong>
                <span>起价 / Starting From</span>
              </div>
              <div className="landing-stat-card">
                <strong>Thu & Sun</strong>
                <span>营业时间 / 9:00 AM - 5:00 PM</span>
              </div>
            </div>
          </div>

          <div className="landing-hero-visual" aria-hidden="true">
            <div className="landing-visual-panel landing-visual-panel-primary">
              <p className="landing-visual-label">Signature Ritual</p>
              <h2>Quiet, warm, and intentionally restorative.</h2>
              <div className="landing-visual-pills">
                <span>Shoulders</span>
                <span>Back</span>
                <span>Legs</span>
                <span>Feet</span>
              </div>
            </div>
            <div className="landing-visual-panel landing-visual-panel-secondary">
              <p className="landing-visual-label">Booking Flow</p>
              <ul className="landing-mini-flow">
                <li>Choose treatment</li>
                <li>Select a suitable timeslot</li>
                <li>Pay securely to confirm</li>
              </ul>
            </div>
          </div>
        </div>
      </header>

      <main className="landing-shell landing-main">
        <section className="landing-value-section">
          <div className="landing-section-heading">
            <p className="landing-section-kicker">品牌体验 / Studio Promise</p>
            <h2>不只是预约按摩，而是进入一段更柔和的恢复节奏</h2>
            <p>
              页面以清晰流程承接体验，以暖色与留白建立安心感，让第一次预约也不需要猜流程。
            </p>
          </div>

          <div className="landing-value-grid">
            {valueProps.map((item) => (
              <article key={item.titleEn} className="landing-value-card">
                <p className="landing-card-kicker">{item.titleEn}</p>
                <h3>{item.titleZh}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section ref={servicesRef} className="landing-services-section" id="services">
          <div className="landing-section-heading landing-section-heading-inline">
            <div>
              <p className="landing-section-kicker">按摩项目 / Treatments</p>
              <h2>根据当下的紧绷感，选择最适合你的放松重点</h2>
            </div>
            <button type="button" className="landing-text-link" onClick={() => navigate('/booking')}>
              进入完整预约流程
            </button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {loading ? (
            <p className="empty-state landing-empty-state">正在加载项目 / Loading curated treatments...</p>
          ) : services.length > 0 ? (
            <div className="landing-services-grid">
              {services.map((service) => (
                <article key={service.id} className="landing-service-card">
                  <div className="landing-service-copy">
                    <p className="landing-card-kicker">{service.name}</p>
                    <h3>{service.name_zh}</h3>
                    <p>{service.description}</p>
                  </div>

                  <div className="landing-service-meta">
                    <span>{getDurationMinutes(service)} 分钟 / mins</span>
                    <strong>{formatMoney(service.price)}</strong>
                  </div>

                  <button
                    type="button"
                    className="landing-card-button"
                    onClick={() => navigate(`/booking?serviceType=${service.id}`)}
                  >
                    预约此项目 / Book This Treatment
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="landing-empty-panel">
              <p>当前没有可展示的按摩项目，但你仍然可以直接进入预约页查看最新安排。</p>
              <button type="button" className="landing-primary-button" onClick={() => navigate('/booking')}>
                前往预约 / Go to Booking
              </button>
            </div>
          )}
        </section>

        <section className="landing-flow-section">
          <div className="landing-section-heading">
            <p className="landing-section-kicker">预约流程 / Booking Journey</p>
            <h2>四步完成预约，支付成功后预约才会正式确认</h2>
            <p>保留现有预约链路，只把说明讲得更明白，让用户知道下一步会发生什么。</p>
          </div>

          <div className="landing-flow-grid">
            {bookingSteps.map((item) => (
              <article key={item.step} className="landing-flow-card">
                <span className="landing-step-number">{item.step}</span>
                <h3>{item.titleZh}</h3>
                <p className="landing-flow-english">{item.titleEn}</p>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-payment-section">
          <div className="landing-payment-copy">
            <p className="landing-section-kicker">支付方式 / Payment</p>
            <h2>安全在线支付，预约确认更直接</h2>
            <p>
              我们默认采用安全在线支付的方式来确认预约。这样可以减少时段占用，也能让你在完成付款后立即进入明确的确认状态。
            </p>

            <div className="landing-bullet-list">
              {paymentPoints.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </div>

          <div className="landing-payment-card">
            <p className="landing-card-kicker">Secure Online Payment</p>
            <h3>Stripe-powered checkout</h3>
            <p>安全、稳定、以确认预约为目标的支付体验。</p>
            <div className="landing-payment-badges">
              <span>Stripe</span>
              <span>Cards</span>
              <span>Express Pay</span>
            </div>
            <small>具体可用的快捷支付方式会根据设备与环境显示。</small>
          </div>
        </section>

        <section className="landing-policy-section">
          <div className="landing-policy-card landing-policy-card-primary">
            <p className="landing-section-kicker">营业信息 / Studio Hours</p>
            <h2>固定营业时段，方便你快速判断是否适合预约</h2>
            <div className="landing-hours-grid">
              <div>
                <strong>周四 / Thursday</strong>
                <span>9:00 AM - 5:00 PM</span>
              </div>
              <div>
                <strong>周日 / Sunday</strong>
                <span>9:00 AM - 5:00 PM</span>
              </div>
            </div>
          </div>

          <div className="landing-policy-card">
            <p className="landing-section-kicker">预约须知 / Booking Notes</p>
            <div className="landing-policy-list">
              {policyPoints.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-cta-section">
          <p className="landing-section-kicker">Ready to Unwind</p>
          <h2>把预约流程交给系统，把放松时间留给自己</h2>
          <p>
            从项目选择到支付确认，所有关键步骤都已经准备好。现在就进入预约页，找到适合你的时段。
          </p>
          <div className="landing-actions landing-actions-centered">
            <button type="button" className="landing-primary-button" onClick={() => navigate('/booking')}>
              立即预约 / Book Now
            </button>
            <button type="button" className="landing-secondary-button" onClick={scrollToServices}>
              查看项目 / Explore Services
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
