import React, { useState, useEffect } from 'react';
import availabilityService from '../../services/availabilityService';

const AvailabilityPage = () => {
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

  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  useEffect(() => {
    loadData();
  }, []);

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
      setMessage({ type: 'error', text: '加载失败: ' + error.message });
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
      setMessage({ type: 'success', text: '营业时间已更新' });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: '更新失败: ' + error.message });
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
      setMessage({ type: 'success', text: '时间已更新' });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: '更新失败: ' + error.message });
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
      setMessage({ type: 'success', text: '屏蔽时间已添加' });
      setShowBlockModal(false);
      setNewBlock({ startTime: '', endTime: '', reason: '' });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: '添加失败: ' + error.message });
    }
  };

  const handleDeleteBlock = async (blockId) => {
    if (!confirm('确定要删除这个屏蔽时间吗？')) return;

    try {
      await availabilityService.deleteAvailabilityBlock(blockId);
      setMessage({ type: 'success', text: '屏蔽时间已删除' });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: '删除失败: ' + error.message });
    }
  };

  if (loading) {
    return <div className="loading-screen"><p>加载中...</p></div>;
  }

  return (
    <div className="availability-page">
      <h1>时间管理</h1>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
          <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
        </div>
      )}

      {/* Business Hours Section */}
      <section className="section">
        <h2>营业时间</h2>
        <div className="business-hours-list">
          {businessHours.map(day => (
            <div key={day.id} className="business-hours-item">
              <div className="day-info">
                <strong>{dayNames[day.dayOfWeek]}</strong>
                <span className={`status ${day.isActive ? 'active' : 'inactive'}`}>
                  {day.isActive ? '营业' : '休息'}
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
                {day.isActive ? '设为休息' : '设为营业'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Blocked Periods Section */}
      <section className="section">
        <div className="section-header">
          <h2>屏蔽时间</h2>
          <button className="btn-primary" onClick={() => setShowBlockModal(true)}>
            + 添加屏蔽时间
          </button>
        </div>

        {blocks.length === 0 ? (
          <p className="empty-state">暂无屏蔽时间</p>
        ) : (
          <div className="blocks-list">
            {blocks.map(block => (
              <div key={block.id} className="block-item">
                <div className="block-info">
                  <div>
                    <strong>
                      {new Date(block.startTime).toLocaleDateString('zh-CN')} {' '}
                      {new Date(block.startTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </strong>
                    {' - '}
                    <strong>
                      {new Date(block.endTime).toLocaleDateString('zh-CN')} {' '}
                      {new Date(block.endTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </strong>
                  </div>
                  {block.reason && <p className="block-reason">{block.reason}</p>}
                </div>
                <button
                  className="btn-danger"
                  onClick={() => handleDeleteBlock(block.id)}
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add Block Modal */}
      {showBlockModal && (
        <div className="modal-overlay" onClick={() => setShowBlockModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>添加屏蔽时间</h3>
            <form onSubmit={handleCreateBlock}>
              <div className="form-group">
                <label>开始时间</label>
                <input
                  type="datetime-local"
                  value={newBlock.startTime}
                  onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>结束时间</label>
                <input
                  type="datetime-local"
                  value={newBlock.endTime}
                  onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>原因（可选）</label>
                <input
                  type="text"
                  value={newBlock.reason}
                  onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })}
                  placeholder="例如：休假、临时有事"
                />
              </div>
              <div className="modal-buttons">
                <button type="button" className="btn-secondary" onClick={() => setShowBlockModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn-primary">
                  添加
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
