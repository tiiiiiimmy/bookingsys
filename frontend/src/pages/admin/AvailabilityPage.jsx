import React, { useEffect, useState } from 'react';
import useAdminLanguage from '../../hooks/useAdminLanguage';
import availabilityService from '../../services/availabilityService';
import {
  adminButtonDangerClass,
  adminButtonPrimaryClass,
  adminButtonSecondaryClass,
  adminEmptyStateClass,
  adminInputClass,
  adminLoadingClass,
  adminPageTitleClass,
  adminPanelClass,
  adminPanelHeaderClass,
  adminShellClass,
  adminTextareaClass,
  adminSubsectionTitleClass,
  getAdminAlertClass,
  getAdminStatusChipClass,
} from '../../components/admin/adminStyles';

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
      const dayData = businessHours.find((item) => item.dayOfWeek === dayOfWeek);
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
      const dayData = businessHours.find((item) => item.dayOfWeek === dayOfWeek);
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

  const handleCreateBlock = async (event) => {
    event.preventDefault();

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
    if (!window.confirm(t.availability.deleteConfirm)) {
      return;
    }

    try {
      await availabilityService.deleteAvailabilityBlock(blockId);
      setMessage({ type: 'success', text: t.availability.deleteBlockSuccess });
      loadData();
    } catch (error) {
      setMessage({ type: 'error', text: t.availability.deleteBlockFailedPrefix + error.message });
    }
  };

  if (loading) {
    return (
      <div className={adminLoadingClass}>
        <p>{t.common.loading}</p>
      </div>
    );
  }

  return (
    <>
      <div className={adminShellClass}>
        <section className={adminPanelClass}>
          <div className={adminPanelHeaderClass}>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-tertiary">{t.layout.availability}</p>
              <h1 className={`mt-3 ${adminPageTitleClass}`}>{t.availability.title}</h1>
            </div>
          </div>

          {message.text ? (
            <div className={getAdminAlertClass(message.type === 'error' ? 'error' : 'success')}>
              <span>{message.text}</span>
              <button
                aria-label={t.common.close}
                className="rounded-full px-2 py-1 font-semibold transition-colors hover:bg-black/5"
                type="button"
                onClick={() => setMessage({ type: '', text: '' })}
              >
                ×
              </button>
            </div>
          ) : null}
        </section>

        <section className={adminPanelClass}>
          <div className={adminPanelHeaderClass}>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-tertiary">{t.availability.businessHoursTitle}</p>
              <h2 className="mt-2 font-headline text-2xl text-on-surface">{t.availability.businessHoursTitle}</h2>
            </div>
          </div>

          <div className="space-y-3">
            {businessHours.map((day) => (
              <div
                key={day.id}
                className="rounded-[1.5rem] border border-outline-variant/40 bg-white px-5 py-4 shadow-[0_10px_24px_rgba(72,46,35,0.05)]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-[120px]">
                    <p className="text-lg font-semibold text-on-surface">{t.availability.days[day.dayOfWeek]}</p>
                    <span className={`mt-2 ${getAdminStatusChipClass(day.isActive ? 'active' : 'inactive')}`}>
                      {day.isActive ? t.availability.statusOpen : t.availability.statusClosed}
                    </span>
                  </div>

                  <div className="grid flex-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
                    <input
                      className={adminInputClass}
                      disabled={!day.isActive}
                      type="time"
                      value={day.startTime}
                      onChange={(event) => handleUpdateHours(day.dayOfWeek, event.target.value, day.endTime)}
                    />
                    <span className="text-center text-on-surface-variant">-</span>
                    <input
                      className={adminInputClass}
                      disabled={!day.isActive}
                      type="time"
                      value={day.endTime}
                      onChange={(event) => handleUpdateHours(day.dayOfWeek, day.startTime, event.target.value)}
                    />
                  </div>

                  <button
                    className={adminButtonSecondaryClass}
                    type="button"
                    onClick={() => handleToggleDay(day.dayOfWeek, day.isActive)}
                  >
                    {day.isActive ? t.availability.setClosed : t.availability.setOpen}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={adminPanelClass}>
          <div className={adminPanelHeaderClass}>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-tertiary">{t.availability.blocksTitle}</p>
              <h2 className="mt-2 font-headline text-2xl text-on-surface">{t.availability.blocksTitle}</h2>
            </div>
            <button className={adminButtonPrimaryClass} type="button" onClick={() => setShowBlockModal(true)}>
              {t.availability.addBlock}
            </button>
          </div>

          {!blocks.length ? (
            <p className={adminEmptyStateClass}>{t.availability.emptyBlocks}</p>
          ) : (
            <div className="space-y-3">
              {blocks.map((block) => (
                <div
                  key={block.id}
                  className="flex flex-col gap-4 rounded-[1.5rem] border border-outline-variant/40 bg-white px-5 py-4 shadow-[0_10px_24px_rgba(72,46,35,0.05)] lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <p className="text-lg font-semibold text-on-surface">
                      {formatDate(block.startTime)} {formatTime(block.startTime)} - {formatDate(block.endTime)} {formatTime(block.endTime)}
                    </p>
                    {block.reason ? (
                      <p className="mt-2 text-sm text-on-surface-variant">{block.reason}</p>
                    ) : null}
                  </div>
                  <button className={adminButtonDangerClass} type="button" onClick={() => handleDeleteBlock(block.id)}>
                    {t.availability.delete}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {showBlockModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 px-4 py-8 backdrop-blur-sm"
          onClick={() => setShowBlockModal(false)}
        >
          <div
            className="w-full max-w-2xl rounded-[2rem] border border-outline/15 bg-white p-6 shadow-[0_30px_70px_rgba(63,42,31,0.2)] md:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className={adminSubsectionTitleClass}>{t.availability.modal.title}</h3>
            <form className="space-y-5" onSubmit={handleCreateBlock}>
              <label className="block text-sm text-on-surface-variant">
                <span className="mb-2 block font-semibold text-on-surface">{t.availability.modal.startTime}</span>
                <input
                  className={adminInputClass}
                  required
                  type="datetime-local"
                  value={newBlock.startTime}
                  onChange={(event) => setNewBlock({ ...newBlock, startTime: event.target.value })}
                />
              </label>
              <label className="block text-sm text-on-surface-variant">
                <span className="mb-2 block font-semibold text-on-surface">{t.availability.modal.endTime}</span>
                <input
                  className={adminInputClass}
                  required
                  type="datetime-local"
                  value={newBlock.endTime}
                  onChange={(event) => setNewBlock({ ...newBlock, endTime: event.target.value })}
                />
              </label>
              <label className="block text-sm text-on-surface-variant">
                <span className="mb-2 block font-semibold text-on-surface">{t.availability.modal.reason}</span>
                <textarea
                  className={adminTextareaClass}
                  placeholder={t.availability.modal.reasonPlaceholder}
                  value={newBlock.reason}
                  onChange={(event) => setNewBlock({ ...newBlock, reason: event.target.value })}
                />
              </label>
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  className={adminButtonSecondaryClass}
                  type="button"
                  onClick={() => setShowBlockModal(false)}
                >
                  {t.availability.modal.cancel}
                </button>
                <button className={adminButtonPrimaryClass} type="submit">
                  {t.availability.modal.submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default AvailabilityPage;
