import React, { useState, useEffect } from 'react';
import useAdminLanguage from '../../hooks/useAdminLanguage';
import availabilityService from '../../services/availabilityService';

const AvailabilityPage = () => {
  const { t, formatDate, formatTime } = useAdminLanguage();
  const [businessHours, setBusinessHours] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [newBlock, setNewBlock] = useState({
    startTime: '',
    endTime: '',
    reason: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadData();
  }, [t.availability.loadErrorPrefix]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [hoursRes, blocksRes] = await Promise.all([
        availabilityService.getBusinessHours(),
        availabilityService.getAvailabilityBlocks(),
      ]);
      setBusinessHours(hoursRes.data);
      setBlocks(blocksRes.data);
    } catch (error) {
      setMessage({ type: 'error', text: t.availability.loadErrorPrefix + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDay = async (dayOfWeek, currentIsActive) => {
    try {
      const dayData = businessHours.find(h => h.dayOfWeek === dayOfWeek);
      await availabilityService.updateBusinessHours(dayOfWeek, {
        startTime: dayData.startTime,
        endTime: dayData.endTime,
        isActive: !currentIsActive,
      });
      setMessage({ type: 'success', text: t.availability.updateHoursSuccess });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: t.availability.updateFailedPrefix + error.message });
    }
  };

  const handleUpdateHours = async (dayOfWeek, startTime, endTime) => {
    try {
      const dayData = businessHours.find(h => h.dayOfWeek === dayOfWeek);
      await availabilityService.updateBusinessHours(dayOfWeek, {
        startTime,
        endTime,
        isActive: dayData.isActive,
      });
      setMessage({ type: 'success', text: t.availability.updateTimeSuccess });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: t.availability.updateFailedPrefix + error.message });
    }
  };

  const handleCreateBlock = async (e) => {
    e.preventDefault();
    try {
      await availabilityService.createAvailabilityBlock({
        startTime: newBlock.startTime,
        endTime: newBlock.endTime,
        blockType: 'blocked',
        reason: newBlock.reason,
      });
      setMessage({ type: 'success', text: t.availability.createBlockSuccess });
      setShowBlockModal(false);
      setNewBlock({ startTime: '', endTime: '', reason: '' });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: t.availability.createBlockFailedPrefix + error.message });
    }
  };

  const handleDeleteBlock = async (blockId) => {
    if (!window.confirm(t.availability.deleteConfirm)) return;

    try {
      await availabilityService.deleteAvailabilityBlock(blockId);
      setMessage({ type: 'success', text: t.availability.deleteBlockSuccess });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: t.availability.deleteBlockFailedPrefix + error.message });
    }
  };

  if (loading) {
    return <div className="loading-screen"><p>{t.common.loading}</p></div>;
  }

  return (
    <div className="availability-page">
      <h1>{t.availability.title}</h1>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
          <button aria-label={t.common.close} onClick={() => setMessage({ type: '', text: '' })}>×</button>
        </div>
      )}

      <section className="section">
        <h2>{t.availability.businessHoursTitle}</h2>
        <div className="business-hours-list">
          {businessHours.map(day => (
            <div key={day.id} className="business-hours-item">
              <div className="day-info">
                <strong>{t.availability.days[day.dayOfWeek]}</strong>
                <span className={`status ${day.isActive ? 'active' : 'inactive'}`}>
                  {day.isActive ? t.availability.statusOpen : t.availability.statusClosed}
                </span>
              </div>
              <div className="hours-info">
                <input
                  type="time"
                  value={day.startTime}
                  disabled={!day.isActive}
                  onChange={(e) => handleUpdateHours(day.dayOfWeek, e.target.value, day.endTime)}
                />
                <span>-</span>
                <input
                  type="time"
                  value={day.endTime}
                  disabled={!day.isActive}
                  onChange={(e) => handleUpdateHours(day.dayOfWeek, day.startTime, e.target.value)}
                />
              </div>
              <button
                className="btn-secondary"
                onClick={() => handleToggleDay(day.dayOfWeek, day.isActive)}
              >
                {day.isActive ? t.availability.setClosed : t.availability.setOpen}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>{t.availability.blocksTitle}</h2>
          <button className="btn-primary" onClick={() => setShowBlockModal(true)}>
            {t.availability.addBlock}
          </button>
        </div>

        {blocks.length === 0 ? (
          <p className="empty-state">{t.availability.emptyBlocks}</p>
        ) : (
          <div className="blocks-list">
            {blocks.map(block => (
              <div key={block.id} className="block-item">
                <div className="block-info">
                  <div>
                    <strong>
                      {formatDate(block.startTime)} {formatTime(block.startTime)}
                    </strong>
                    {' - '}
                    <strong>
                      {formatDate(block.endTime)} {formatTime(block.endTime)}
                    </strong>
                  </div>
                  {block.reason && <p className="block-reason">{block.reason}</p>}
                </div>
                <button
                  className="btn-danger"
                  onClick={() => handleDeleteBlock(block.id)}
                >
                  {t.availability.delete}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {showBlockModal && (
        <div className="modal-overlay" onClick={() => setShowBlockModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{t.availability.modal.title}</h3>
            <form onSubmit={handleCreateBlock}>
              <div className="form-group">
                <label>{t.availability.modal.startTime}</label>
                <input
                  type="datetime-local"
                  value={newBlock.startTime}
                  onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.availability.modal.endTime}</label>
                <input
                  type="datetime-local"
                  value={newBlock.endTime}
                  onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.availability.modal.reason}</label>
                <input
                  type="text"
                  value={newBlock.reason}
                  onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })}
                  placeholder={t.availability.modal.reasonPlaceholder}
                />
              </div>
              <div className="modal-buttons">
                <button type="button" className="btn-secondary" onClick={() => setShowBlockModal(false)}>
                  {t.availability.modal.cancel}
                </button>
                <button type="submit" className="btn-primary">
                  {t.availability.modal.submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .availability-page {
          max-width: 900px;
        }

        .section {
          background: white;
          padding: 30px;
          border-radius: 8px;
          margin-bottom: 30px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .section h2 {
          margin-bottom: 20px;
          color: #333;
        }

        .business-hours-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .business-hours-item {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 6px;
        }

        .day-info {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-width: 80px;
        }

        .status {
          font-size: 0.85rem;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .status.active {
          background: #d4edda;
          color: #155724;
        }

        .status.inactive {
          background: #f8d7da;
          color: #721c24;
        }

        .hours-info {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }

        .hours-info input {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .blocks-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .block-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 6px;
        }

        .block-reason {
          margin-top: 5px;
          color: #666;
          font-size: 0.9rem;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }

        .btn-danger:hover {
          background: #c82333;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          padding: 30px;
          border-radius: 8px;
          max-width: 500px;
          width: 90%;
        }

        .modal-content h3 {
          margin-bottom: 20px;
        }

        .modal-buttons {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .alert {
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .alert button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0 8px;
        }

        .alert-success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .alert-error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
      `}</style>
    </div>
  );
};

export default AvailabilityPage;
