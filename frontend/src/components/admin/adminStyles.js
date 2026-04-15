export const adminShellClass = 'space-y-6';

export const adminLoadingClass =
  'flex min-h-screen items-center justify-center px-6 py-12 text-sm text-on-surface-variant';

export const adminPageTitleClass = 'font-headline text-3xl text-on-surface md:text-4xl';

export const adminPanelClass =
  'rounded-[1.75rem] border border-outline/15 bg-white/85 p-6 shadow-[0_18px_40px_rgba(72,46,35,0.08)] backdrop-blur';

export const adminPanelHeaderClass = 'mb-5 flex flex-wrap items-start justify-between gap-3';

export const adminGridClass = 'grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]';

export const adminInputClass =
  'w-full rounded-2xl border border-outline-variant/60 bg-white px-4 py-3 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-fixed disabled:cursor-not-allowed disabled:bg-surface-container-low';

export const adminTextareaClass = `${adminInputClass} min-h-28 resize-y`;

export const adminButtonPrimaryClass =
  'inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-on-primary transition-all hover:-translate-y-0.5 hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-60';

export const adminButtonSecondaryClass =
  'inline-flex items-center justify-center rounded-full border border-outline px-5 py-3 text-sm font-semibold text-secondary transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60';

export const adminButtonDangerClass =
  'inline-flex items-center justify-center rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60';

export const adminButtonSuccessClass =
  'inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60';

export const adminButtonWarningClass =
  'inline-flex items-center justify-center rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60';

export const adminAlertBaseClass =
  'flex flex-wrap items-start justify-between gap-3 rounded-[1.5rem] border px-5 py-4 text-sm';

export const adminEmptyStateClass =
  'rounded-[1.5rem] border border-dashed border-outline/30 bg-surface-container-low px-5 py-8 text-center text-sm text-on-surface-variant';

export const adminListClass = 'space-y-3';

export const adminCardListItemClass =
  'rounded-[1.5rem] border border-outline-variant/40 bg-white px-5 py-4 shadow-[0_10px_24px_rgba(72,46,35,0.05)]';

export const adminListButtonClass =
  `${adminCardListItemClass} w-full text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_16px_30px_rgba(143,77,47,0.12)]`;

export const adminDetailGridClass = 'grid gap-4 md:grid-cols-2';

export const adminDetailCardClass =
  'rounded-[1.5rem] border border-outline-variant/40 bg-surface-container-low px-4 py-4';

export const adminSectionStackClass = 'space-y-6';

export const adminFieldLabelClass = 'text-xs uppercase tracking-[0.2em] text-on-surface-variant';

export const adminFieldValueClass = 'mt-2 text-sm font-semibold break-words text-on-surface';

export const adminSubsectionTitleClass = 'mb-4 font-headline text-2xl text-on-surface';

export const getAdminAlertClass = (tone) => {
  const tones = {
    error: 'border-rose-200 bg-rose-50 text-rose-800',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    info: 'border-primary-fixed bg-primary-fixed/40 text-on-primary-fixed',
  };

  return `${adminAlertBaseClass} ${tones[tone] || tones.info}`;
};

export const getAdminStatusChipClass = (tone) => {
  const tones = {
    neutral: 'bg-stone-200 text-stone-700',
    pending: 'bg-amber-100 text-amber-800',
    warning: 'bg-amber-100 text-amber-800',
    confirmed: 'bg-sky-100 text-sky-800',
    success: 'bg-emerald-100 text-emerald-800',
    succeeded: 'bg-emerald-100 text-emerald-800',
    approved: 'bg-emerald-100 text-emerald-800',
    completed: 'bg-emerald-100 text-emerald-800',
    active: 'bg-emerald-100 text-emerald-800',
    arrived: 'bg-teal-100 text-teal-800',
    rejected: 'bg-rose-100 text-rose-800',
    danger: 'bg-rose-100 text-rose-800',
    cancelled: 'bg-rose-100 text-rose-800',
    failed: 'bg-rose-100 text-rose-800',
    inactive: 'bg-stone-200 text-stone-600',
    expired: 'bg-stone-200 text-stone-700',
    no_show: 'bg-violet-100 text-violet-800',
    noShow: 'bg-violet-100 text-violet-800',
  };

  return `inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tones[tone] || tones.neutral}`;
};
