import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import bookingService from '../services/bookingService';
import availabilityService from '../services/availabilityService';
import './BookingPage.css';

const SLOT_MINUTES = 30;
const DAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const extractError = (error, fallback) => {
  return error.response?.data?.error?.message || error.message || fallback;
};

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

const getServiceDurationMinutes = (service) => {
  if (!service) {
    return SLOT_MINUTES;
  }

  if (Number(service.duration_minutes) > 0) {
    return Number(service.duration_minutes);
  }

  if (Number(service.durationMinutes) > 0) {
    return Number(service.durationMinutes);
  }

  const nameText = `${service.name_zh || ''} ${service.name || ''}`;
  const matched = nameText.match(/(\d+)\s*分钟/);
  if (matched) {
    return Number(matched[1]);
  }

  return SLOT_MINUTES;
};

const getMonday = (value) => {
  const date = new Date(value);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + diff);
  return date;
};

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWeekDates = (weekStart) => {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
};

const sortSlots = (slots) => [...slots].sort((left, right) => new Date(left.startTime) - new Date(right.startTime));

const formatSlotDateLabel = (isoDate) => {
  const date = new Date(isoDate);
  const dayIndex = date.getDay();
  const normalizedDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
  return `${date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })} (${DAY_LABELS[normalizedDayIndex]})`;
};

const formatSlotTimeRange = (slot) => {
  return `${new Date(slot.startTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(slot.endTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
};

const PaymentStep = ({ bookingPayment, stripePromise, selectedService, selectionSummary, onBack }) => {
  if (!bookingPayment?.clientSecret || !stripePromise) {
    return null;
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret: bookingPayment.clientSecret }}>
      <PaymentCheckoutForm
        bookingPayment={bookingPayment}
        selectedService={selectedService}
        selectionSummary={selectionSummary}
        onBack={onBack}
      />
    </Elements>
  );
};

const PaymentCheckoutForm = ({ bookingPayment, selectedService, selectionSummary, onBack }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/booking/confirmation/${bookingPayment.bookingId}`,
        },
        redirect: 'if_required',
      });

      if (result.error) {
        setError(result.error.message || '支付失败，请重试');
        return;
      }

      navigate(`/booking/confirmation/${bookingPayment.bookingId}`);
    } catch (err) {
      setError(err.message || '支付失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="step-content">
      <h2>完成支付</h2>

      <div className="booking-summary">
        <h3>订单摘要</h3>
        <p><strong>项目：</strong>{selectedService?.name_zh}</p>
        <p><strong>时长：</strong>{selectionSummary.durationMinutes} 分钟</p>
        <p><strong>时间：</strong>{selectionSummary.displayText}</p>
        <p><strong>金额：</strong>{formatMoney(selectionSummary.totalPrice)}</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="payment-form">
        <PaymentElement />
        <div className="payment-actions">
          <button type="button" className="change-button" onClick={onBack} disabled={submitting}>
            返回修改
          </button>
          <button type="submit" className="next-button" disabled={!stripe || submitting}>
            {submitting ? '支付处理中...' : '确认支付'}
          </button>
        </div>
      </form>
    </div>
  );
};

const BookingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serviceTypes, setServiceTypes] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [weekSlots, setWeekSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [bookingPayment, setBookingPayment] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  const selectedDurationMinutes = getServiceDurationMinutes(selectedService);

  useEffect(() => {
    const loadServiceTypes = async () => {
      try {
        setLoading(true);
        const response = await bookingService.getServiceTypes();
        const loadedServices = response.data || [];
        setServiceTypes(loadedServices);

        const serviceId = Number(searchParams.get('serviceType'));
        if (serviceId) {
          const matchedService = loadedServices.find((service) => service.id === serviceId);
          if (matchedService) {
            setSelectedService(matchedService);
          }
        }
      } catch (err) {
        setError(extractError(err, '无法加载服务类型，请刷新页面重试'));
      } finally {
        setLoading(false);
      }
    };

    loadServiceTypes();
  }, [searchParams]);

  useEffect(() => {
    if (!selectedService) {
      return;
    }

    const loadWeeklySlots = async () => {
      try {
        setLoadingSlots(true);
        setError('');

        const dates = getWeekDates(weekStart).map((date) => formatDateKey(date));
        const response = await availabilityService.getWeeklySlots(dates, selectedDurationMinutes);
        setWeekSlots(response);
      } catch (err) {
        setError(extractError(err, '无法加载本周可预约时间'));
        setWeekSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadWeeklySlots();
  }, [selectedService, selectedDurationMinutes, weekStart]);

  useEffect(() => {
    setSelectedSlots([]);
  }, [selectedService?.id, selectedDurationMinutes]);

  const handleCustomerInfoChange = (event) => {
    const { name, value } = event.target;
    setCustomerInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSlotToggle = (slot) => {
    setError('');
    setSelectedSlots((current) => {
      const exists = current.some((value) => value.startTime === slot.startTime);
      const next = exists
        ? current.filter((value) => value.startTime !== slot.startTime)
        : [...current, slot];
      return sortSlots(next);
    });
  };

  const handleRemoveSelectedSlot = (startTime) => {
    setSelectedSlots((current) => current.filter((slot) => slot.startTime !== startTime));
  };

  const getSelectionSummary = () => {
    if (!selectedService || selectedSlots.length === 0) {
      return null;
    }

    const sorted = sortSlots(selectedSlots);
    const startTime = sorted[0].startTime;
    const endTime = sorted[sorted.length - 1].endTime;
    const durationMinutes = sorted.reduce((total, slot) => {
      const slotMinutes = Math.round((new Date(slot.endTime) - new Date(slot.startTime)) / (1000 * 60));
      return total + slotMinutes;
    }, 0);
    const totalPrice = Number(selectedService.price) * sorted.length;

    return {
      startTime,
      endTime,
      slotCount: sorted.length,
      slots: sorted,
      durationMinutes,
      totalPrice,
      displayText: sorted.length === 1
        ? `${new Date(startTime).toLocaleDateString('zh-CN')} ${new Date(startTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(endTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
        : `已选择 ${sorted.length} 个时段（可跨天）`,
    };
  };

  const selectionSummary = getSelectionSummary();
  const selectedSlotsByDate = selectedSlots.reduce((acc, slot) => {
    const dateKey = slot.startTime.slice(0, 10);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(slot);
    return acc;
  }, {});

  const handleCreateBooking = async (event) => {
    event.preventDefault();

    if (!selectedService || !selectionSummary) {
      setError('请选择按摩项目和预约时间');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await bookingService.createBooking({
        serviceTypeId: selectedService.id,
        slots: selectionSummary.slots.map((slot) => ({
          startTime: slot.startTime,
          endTime: slot.endTime,
        })),
        customer: customerInfo,
      });

      setBookingPayment(response.data);
      setStripePromise(loadStripe(response.data.publishableKey));
      setStep(3);
    } catch (err) {
      setError(extractError(err, '创建预约失败，请重试'));
    } finally {
      setLoading(false);
    }
  };

  const currentWeekLabel = `${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${getWeekDates(weekStart)[6].getMonth() + 1}月${getWeekDates(weekStart)[6].getDate()}日`;
  const currentWeekMonday = getMonday(new Date());
  const canGoPrevWeek = weekStart >= currentWeekMonday ? false : true;

  return (
    <div className="booking-page">
      <div className="booking-container booking-container-wide">
        <h1>预约按摩服务</h1>

        <div className="progress-indicator">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">选择项目与时间</span>
          </div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">填写信息</span>
          </div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">完成支付</span>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {step === 1 && (
          <div className="step-content">
            <h2>选择按摩项目与时间</h2>

            <div className="booking-summary">
              <h3>按摩项目</h3>
              <div className="service-chip-list">
                {serviceTypes.map((service) => (
                  <button
                    type="button"
                    key={service.id}
                    className={`service-chip ${selectedService?.id === service.id ? 'selected' : ''}`}
                    onClick={() => setSelectedService(service)}
                  >
                    {service.name_zh}
                    <span>{formatMoney(service.price)}/{getServiceDurationMinutes(service)}分钟</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedService && (
              <div className="booking-summary">
                <h3>已选项目</h3>
                <p><strong>{selectedService.name_zh}</strong></p>
                <p>{selectedService.description}</p>
                <p>{formatMoney(selectedService.price)} / {selectedDurationMinutes} 分钟</p>
              </div>
            )}

            {selectedService && (
              <div className="booking-summary">
                <p>
                  当前按 <strong>{selectedDurationMinutes} 分钟</strong>完整疗程展示时间段，只有可连续预约完整时长的时段才会显示。
                </p>
              </div>
            )}

            <div className="week-toolbar">
              <button
                type="button"
                className="change-button"
                onClick={() => {
                  const next = new Date(weekStart);
                  next.setDate(weekStart.getDate() - 7);
                  setWeekStart(next);
                }}
                disabled={!canGoPrevWeek}
              >
                上一周
              </button>
              <strong>{currentWeekLabel}</strong>
              <button
                type="button"
                className="change-button"
                onClick={() => {
                  const next = new Date(weekStart);
                  next.setDate(weekStart.getDate() + 7);
                  setWeekStart(next);
                }}
              >
                下一周
              </button>
            </div>

            {loadingSlots ? (
              <div className="loading">正在加载本周空余时间...</div>
            ) : (
              <div className="week-grid">
                {getWeekDates(weekStart).map((date, index) => {
                  const dateKey = formatDateKey(date);
                  const dayData = weekSlots.find((entry) => entry.date === dateKey);
                  return (
                    <div key={dateKey} className="week-day-column">
                      <div className="week-day-header">
                        <strong>{DAY_LABELS[index]}</strong>
                        <span>{date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}</span>
                      </div>
                      <div className="week-day-slots">
                        {!selectedService ? (
                          <p className="mini-empty">先选择按摩项目</p>
                        ) : !dayData?.slots?.length ? (
                          <p className="mini-empty">暂无可完整预约 {selectedDurationMinutes} 分钟的空档</p>
                        ) : (
                          dayData.slots.map((slot, slotIndex) => {
                            const selected = selectedSlots.some((value) => value.startTime === slot.startTime);
                            return (
                              <button
                                type="button"
                                key={`${slot.startTime}-${slotIndex}`}
                                className={`slot-button week-slot-button ${selected ? 'selected' : ''}`}
                                onClick={() => handleSlotToggle(slot)}
                              >
                                {new Date(slot.startTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                                {' - '}
                                {new Date(slot.endTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedSlots.length > 0 && (
              <div className="booking-summary">
                <h3>已选择的时间段</h3>
                {Object.keys(selectedSlotsByDate).sort().map((dateKey) => (
                  <div key={dateKey} className="selected-slot-group">
                    <p className="selected-slot-date"><strong>{formatSlotDateLabel(dateKey)}</strong></p>
                    <ul className="selected-slot-list">
                      {sortSlots(selectedSlotsByDate[dateKey]).map((slot) => (
                        <li key={slot.startTime} className="selected-slot-item">
                          <button
                            type="button"
                            className="selected-slot-remove"
                            onClick={() => handleRemoveSelectedSlot(slot.startTime)}
                            aria-label={`删除 ${formatSlotDateLabel(dateKey)} ${formatSlotTimeRange(slot)} 时段`}
                            title="删除该时段"
                          >
                            ×
                          </button>
                          <span className="selected-slot-time">{formatSlotTimeRange(slot)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {selectionSummary && (
              <div className="booking-summary">
                <h3>当前选择</h3>
                <p><strong>项目：</strong>{selectedService?.name_zh}</p>
                <p><strong>时间：</strong>{selectionSummary.displayText}</p>
                <p><strong>时段数：</strong>{selectionSummary.slotCount}</p>
                <p><strong>时长：</strong>{selectionSummary.durationMinutes} 分钟</p>
                <p><strong>金额：</strong>{formatMoney(selectionSummary.totalPrice)}</p>
              </div>
            )}

            {selectionSummary && (
              <button type="button" className="next-button" onClick={() => setStep(2)}>
                下一步
              </button>
            )}
          </div>
        )}

        {step === 2 && selectionSummary && (
          <div className="step-content">
            <h2>填写联系信息</h2>

            <div className="booking-summary">
              <h3>预约信息</h3>
              <p><strong>项目：</strong>{selectedService?.name_zh}</p>
              <p><strong>时间：</strong>{selectionSummary.displayText}</p>
              <p><strong>时段数：</strong>{selectionSummary.slotCount}</p>
              <p><strong>时长：</strong>{selectionSummary.durationMinutes} 分钟</p>
              <p><strong>总价：</strong>{formatMoney(selectionSummary.totalPrice)}</p>
            </div>

            <form onSubmit={handleCreateBooking} className="customer-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">名字</label>
                  <input id="firstName" type="text" name="firstName" value={customerInfo.firstName} onChange={handleCustomerInfoChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">姓氏</label>
                  <input id="lastName" type="text" name="lastName" value={customerInfo.lastName} onChange={handleCustomerInfoChange} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">邮箱</label>
                  <input id="email" type="email" name="email" value={customerInfo.email} onChange={handleCustomerInfoChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">电话</label>
                  <input id="phone" type="tel" name="phone" value={customerInfo.phone} onChange={handleCustomerInfoChange} required />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="notes">备注</label>
                <textarea id="notes" name="notes" rows="4" value={customerInfo.notes} onChange={handleCustomerInfoChange} placeholder="可填写希望重点放松的部位或其他说明" />
              </div>

              <div className="payment-note">
                支付成功后，预约才会正式确认。当前显示的时段均可完整预约你选择的按摩时长。
              </div>

              <div className="form-actions">
                <button type="button" className="change-button" onClick={() => setStep(1)}>
                  返回修改时间
                </button>
                <button type="submit" className="next-button" disabled={loading}>
                  {loading ? '创建中...' : '前往支付'}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 3 && selectionSummary && (
          <PaymentStep
            bookingPayment={bookingPayment}
            stripePromise={stripePromise}
            selectedService={selectedService}
            selectionSummary={selectionSummary}
            onBack={() => setStep(2)}
          />
        )}

        <div className="booking-footer-link">
          <button type="button" className="text-link-button" onClick={() => navigate('/')}>
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
