export const ADMIN_COPY = {
  en: {
    common: {
      loading: 'Loading...',
      loadingDetails: 'Loading details...',
      none: 'None',
      close: 'Close',
      minuteUnit: 'min',
      languageSwitcher: 'Language switcher',
    },
    layout: {
      brand: 'Booking System',
      dashboard: 'Dashboard',
      bookings: 'Bookings',
      availability: 'Availability',
      customers: 'Customers',
      logout: 'Log out',
      loading: 'Loading...',
    },
    login: {
      title: 'Admin Login',
      email: 'Email',
      password: 'Password',
      submit: 'Sign in',
      submitting: 'Signing in...',
      backHome: '← Back to home',
      failed: 'Login failed',
    },
    dashboard: {
      loadError: 'Unable to load dashboard data',
      welcome: 'Welcome',
      stats: {
        todayBookings: 'Today bookings',
        weekBookings: 'This week',
        monthRevenue: 'This month revenue',
        customerCount: 'Total customers',
        pendingRescheduleRequests: 'Pending reschedules',
      },
      upcomingTitle: 'Upcoming bookings',
      emptyUpcoming: 'No upcoming bookings',
    },
    bookings: {
      title: 'Booking Management',
      detailTitle: 'Booking Details',
      loadListError: 'Unable to load bookings',
      loadDetailError: 'Unable to load booking details',
      updateSuccess: 'Booking status updated',
      updateFailed: 'Failed to update booking status',
      rescheduleSuccess: 'Booking rescheduled',
      rescheduleFailed: 'Failed to reschedule booking',
      reviewApproveSuccess: 'Reschedule request approved',
      reviewRejectSuccess: 'Reschedule request rejected',
      reviewFailed: 'Failed to review reschedule request',
      adminCancelledReason: 'Cancelled by admin',
      filters: {
        allStatuses: 'All statuses',
        searchPlaceholder: 'Search customer / email / phone',
        search: 'Search',
      },
      empty: 'No bookings match the current filters',
      selectHint: 'Select a booking on the left to view details',
      fields: {
        bookingId: 'Booking ID',
        customer: 'Customer',
        email: 'Email',
        phone: 'Phone',
        service: 'Service',
        duration: 'Duration',
        time: 'Time',
        price: 'Price',
        bookingStatus: 'Booking status',
        paymentStatus: 'Payment status',
        paymentIntent: 'Payment Intent',
        manageToken: 'Manage token',
      },
      notes: 'Customer note',
      actions: {
        confirmBooking: 'Confirm booking',
        confirmArrival: 'Confirm arrival',
        markCompleted: 'Mark completed',
        markNoShow: 'Mark no-show',
        cancelBooking: 'Cancel booking',
        submitReschedule: 'Submit reschedule',
        approve: 'Approve',
        reject: 'Reject',
      },
      attendance: {
        notArrived: 'Not arrived',
        arrived: 'Arrived',
      },
      reschedule: {
        title: 'Reschedule Manually',
        startTime: 'Start time',
        endTime: 'End time',
        adminNote: 'Admin note (optional)',
      },
      requests: {
        title: 'Reschedule Requests',
        empty: 'No reschedule requests',
        noCustomerNote: 'No customer note',
        approvePrompt: 'Review note (optional)',
        rejectPrompt: 'Rejection reason (optional)',
      },
    },
    customers: {
      title: 'Customer Management',
      detailTitle: 'Customer Details',
      loadListError: 'Unable to load customers',
      loadDetailError: 'Unable to load customer details',
      searchPlaceholder: 'Search name / email / phone',
      search: 'Search',
      empty: 'No customers found',
      selectHint: 'Select a customer on the left to view details',
      bookingCountSuffix: 'bookings',
      fields: {
        name: 'Name',
        email: 'Email',
        phone: 'Phone',
        createdAt: 'Created at',
        bookingCount: 'Booking count',
        totalSpent: 'Total spent',
      },
      historyTitle: 'Booking History',
      emptyHistory: 'No booking history',
    },
    availability: {
      title: 'Availability Management',
      loadErrorPrefix: 'Failed to load: ',
      updateHoursSuccess: 'Business hours updated',
      updateTimeSuccess: 'Hours updated',
      createBlockSuccess: 'Blocked period added',
      createBlockFailedPrefix: 'Failed to add: ',
      updateFailedPrefix: 'Update failed: ',
      deleteBlockSuccess: 'Blocked period deleted',
      deleteBlockFailedPrefix: 'Delete failed: ',
      deleteConfirm: 'Delete this blocked period?',
      businessHoursTitle: 'Business Hours',
      blocksTitle: 'Blocked Periods',
      addBlock: '+ Add blocked period',
      emptyBlocks: 'No blocked periods',
      statusOpen: 'Open',
      statusClosed: 'Closed',
      setClosed: 'Set closed',
      setOpen: 'Set open',
      delete: 'Delete',
      modal: {
        title: 'Add Blocked Period',
        startTime: 'Start time',
        endTime: 'End time',
        reason: 'Reason (optional)',
        reasonPlaceholder: 'For example: vacation, personal errand',
        cancel: 'Cancel',
        submit: 'Add',
      },
      days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    },
    statuses: {
      pending: 'Pending',
      confirmed: 'Confirmed',
      arrived: 'Arrived',
      completed: 'Completed',
      cancelled: 'Cancelled',
      no_show: 'No show',
      expired: 'Expired',
      succeeded: 'Succeeded',
      failed: 'Failed',
      refunded: 'Refunded',
      partially_refunded: 'Partially refunded',
      approved: 'Approved',
      rejected: 'Rejected',
    },
    fallback: {
      notFound: 'Page not found',
    },
  },
};

export const getAdminStatusLabel = (copy, status) => {
  if (!status) {
    return copy?.common?.none ?? '-';
  }

  return copy?.statuses?.[status] ?? status;
};

export const getAdminBookingStatusBadges = (copy, status) => {
  switch (status) {
    case 'confirmed':
      return [
        { tone: 'confirmed', label: copy?.statuses?.confirmed ?? 'confirmed' },
        { tone: 'no_show', label: copy?.bookings?.attendance?.notArrived ?? copy?.statuses?.no_show ?? 'not_arrived' },
      ];
    case 'arrived':
      return [
        { tone: 'confirmed', label: copy?.statuses?.confirmed ?? 'confirmed' },
        { tone: 'arrived', label: copy?.bookings?.attendance?.arrived ?? copy?.statuses?.arrived ?? 'arrived' },
      ];
    case 'no_show':
      return [
        { tone: 'confirmed', label: copy?.statuses?.confirmed ?? 'confirmed' },
        { tone: 'no_show', label: copy?.statuses?.no_show ?? 'no_show' },
      ];
    default:
      return [
        { tone: status || 'pending', label: getAdminStatusLabel(copy, status) },
      ];
  }
};
