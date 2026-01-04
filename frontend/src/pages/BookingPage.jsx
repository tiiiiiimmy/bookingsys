import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import bookingService from '../services/bookingService';
import availabilityService from '../services/availabilityService';
import './BookingPage.css';

const BookingPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Service, 2: Date/Time, 3: Customer Info
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Service selection
  const [serviceTypes, setServiceTypes] = useState([]);
  const [selectedService, setSelectedService] = useState(null);

  // Step 2: Date and time selection
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Step 3: Customer information
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
  });

  // Load service types on mount
  useEffect(() => {
    loadServiceTypes();
  }, []);

  const loadServiceTypes = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getServiceTypes();
      setServiceTypes(response.data);
    } catch (err) {
      setError('无法加载服务类型，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  };

  // Load available slots when date or service changes
  useEffect(() => {
    if (selectedDate && selectedService) {
      loadAvailableSlots();
    }
  }, [selectedDate, selectedService]);

  const loadAvailableSlots = async () => {
    try {
      setLoadingSlots(true);
      setError('');
      const response = await availabilityService.getAvailableSlots(
        selectedDate,
        selectedService.duration_minutes
      );
      setAvailableSlots(response.data.slots || []);
      setSelectedSlot(null);
    } catch (err) {
      setError('无法加载可用时间段');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setStep(2);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedService || !selectedSlot) {
      setError('请选择服务和时间');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const bookingData = {
        serviceTypeId: selectedService.id,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        customer: customerInfo,
      };

      const response = await bookingService.createBooking(bookingData);

      // Navigate to confirmation page with booking ID
      navigate(`/booking/confirmation/${response.data.id}`);
    } catch (err) {
      if (err.response?.data?.error?.message) {
        setError(err.response.data.error.message);
      } else {
        setError('预约失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get maximum date (3 months from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <div className="booking-page">
      <div className="booking-container">
        <h1>预约按摩服务</h1>

        {/* Progress indicator */}
        <div className="progress-indicator">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">选择服务</span>
          </div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">选择时间</span>
          </div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">填写信息</span>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Step 1: Service Selection */}
        {step === 1 && (
          <div className="step-content">
            <h2>选择服务类型</h2>
            {loading ? (
              <div className="loading">加载中...</div>
            ) : (
              <div className="service-list">
                {serviceTypes.map(service => (
                  <div
                    key={service.id}
                    className="service-card"
                    onClick={() => handleServiceSelect(service)}
                  >
                    <h3>{service.name_zh}</h3>
                    <p className="service-duration">{service.duration_minutes} 分钟</p>
                    <p className="service-price">${service.price}</p>
                    <button className="select-button">选择此服务</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Date and Time Selection */}
        {step === 2 && (
          <div className="step-content">
            <h2>选择日期和时间</h2>

            <div className="selected-service-info">
              <p><strong>已选服务：</strong>{selectedService?.name_zh} ({selectedService?.duration_minutes}分钟)</p>
              <button className="change-button" onClick={() => setStep(1)}>更改服务</button>
            </div>

            <div className="date-selection">
              <label htmlFor="booking-date">选择日期：</label>
              <input
                type="date"
                id="booking-date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={getMinDate()}
                max={getMaxDate()}
              />
            </div>

            {selectedDate && (
              <div className="time-slots">
                <h3>{formatDate(selectedDate)} 的可用时间</h3>
                {loadingSlots ? (
                  <div className="loading">加载中...</div>
                ) : availableSlots.length === 0 ? (
                  <p className="no-slots">当天没有可用时间段，请选择其他日期</p>
                ) : (
                  <div className="slots-grid">
                    {availableSlots.map((slot, index) => (
                      <button
                        key={index}
                        className={`slot-button ${selectedSlot === slot ? 'selected' : ''} ${!slot.available ? 'disabled' : ''}`}
                        onClick={() => handleSlotSelect(slot)}
                        disabled={!slot.available}
                      >
                        {formatTime(slot.startTime)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedSlot && (
              <button className="next-button" onClick={() => setStep(3)}>
                下一步
              </button>
            )}
          </div>
        )}

        {/* Step 3: Customer Information */}
        {step === 3 && (
          <div className="step-content">
            <h2>填写联系信息</h2>

            <div className="booking-summary">
              <h3>预约信息</h3>
              <p><strong>服务：</strong>{selectedService?.name_zh}</p>
              <p><strong>时长：</strong>{selectedService?.duration_minutes} 分钟</p>
              <p><strong>价格：</strong>${selectedService?.price}</p>
              <p><strong>日期：</strong>{selectedDate && formatDate(selectedDate)}</p>
              <p><strong>时间：</strong>{selectedSlot && formatTime(selectedSlot.startTime)}</p>
              <button className="change-button" onClick={() => setStep(2)}>修改时间</button>
            </div>

            <form onSubmit={handleSubmit} className="customer-form">
              <div className="form-group">
                <label htmlFor="firstName">名字 *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={customerInfo.firstName}
                  onChange={handleCustomerInfoChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">姓氏 *</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={customerInfo.lastName}
                  onChange={handleCustomerInfoChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">邮箱 *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={customerInfo.email}
                  onChange={handleCustomerInfoChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">电话 *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={customerInfo.phone}
                  onChange={handleCustomerInfoChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="notes">备注（可选）</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={customerInfo.notes}
                  onChange={handleCustomerInfoChange}
                  rows="3"
                  placeholder="有任何特殊要求或需要告知的信息吗？"
                />
              </div>

              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? '提交中...' : '确认预约'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingPage;
