export const HOME_COPY = {
  en: {
    brand: 'Psychic Magic',
    nav: {
      services: 'Services',
      process: 'Process',
      about: 'About',
      bookNow: 'Book Now',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
    },
    hero: {
      title: 'Psychic Magic',
      subtitle: 'Spiritual Guidance & Psychic Readings',
      description: 'Discover gentle spiritual guidance, energy work, and intuitive readings designed to help you find clarity, love, abundance, and inner peace.',
      bookNow: 'Book Now',
      explore: 'Explore Services',
      heroAlt: 'Spiritual guidance and psychic reading',
    },
    about: {
      title1: 'Professional Relaxation',
      desc1: 'Thoughtful bodywork tailored to different sources of tension, stress, and physical fatigue.',
      title2: 'Healing Environment',
      desc2: 'Slow down in a space shaped by soft light, gentle scent, and a calm restorative mood.',
      title3: 'Secure Payment',
      desc3: 'Enjoy a smoother booking journey with Stripe-secured checkout and clear confirmation steps.',
    },
    services: {
      heading: 'Signature Treatments',
      loading: 'Loading treatments...',
      empty: 'There are no bookable treatments at the moment, but you can still open the booking page for the latest availability.',
      goBooking: 'Go to Booking',
      bookNow: 'Book Now',
      defaultDescription: 'A tailored treatment adjusted to your pressure preference and focus areas.',
      durationLabel: 'mins',
      subtitleFallback: 'Treatment',
    },
    process: {
      heading: 'Booking Process',
      subheading: 'A simple four-step journey into deep relaxation',
      paymentHint: 'Your booking is confirmed only after successful payment',
      steps: [
        {
          title: 'Choose Service',
          subtitle: 'Select Service',
          description: 'Pick the treatment that best matches your body\'s current needs.',
        },
        {
          title: 'Select Time',
          subtitle: 'Select Time',
          description: 'View real-time availability and reserve the timeslot that suits you.',
        },
        {
          title: 'Fill Details',
          subtitle: 'Fill Info',
          description: 'Provide your basic contact details so we can prepare for your visit.',
        },
        {
          title: 'Pay to Confirm',
          subtitle: 'Payment Confirmation',
          description: 'Complete secure online payment to lock in your session.',
        },
      ],
    },
    payment: {
      heading: 'Secure Online Payment',
      description: 'We use Stripe for industry-standard payment protection. Major cards are supported, and fast checkout options may appear when available on your device.',
    },
    info: {
      heading: 'Hours & Location',
      hoursTitle: 'Hours',
      hoursLine1: 'Every Thursday & Sunday',
      hoursLine2: '9:00 AM - 5:00 PM',
      locationTitle: 'Location',
      locationLine1: 'City Sanctuary Wellness Studio',
      locationLine2: 'Detailed directions are shared after booking confirmation',
      policiesTitle: 'Policies',
      policies: [
        {
          label: 'Rescheduling:',
          text: 'Please submit your request at least 24 hours before the appointment time.',
        },
        {
          label: 'Refunds:',
          text: 'Cancellations require manual review, and approved refunds are returned to the original payment method.',
        },
        {
          label: 'Late arrivals:',
          text: 'Treatment time may be shortened proportionally to protect later appointments.',
        },
      ],
    },
    cta: {
      title: 'Start Your Healing Journey',
      subtitle: 'Your next reset can begin today',
      button: 'Book Now',
    },
    footer: {
      rights: 'All rights reserved',
      hours: 'Hours',
      payments: 'Payments',
      contact: 'Contact',
      refund: 'Refund Policy',
    },
    errors: {
      loadServices: 'Unable to load treatments',
    },
  },
};

export const SERVICE_TRANSLATIONS = {
  'Deep Tissue': {
    en: {
      title: 'Deep Tissue Massage',
      subtitle: 'Deep Tissue',
      description: 'Targets deeper muscular tension to ease chronic tightness, soreness, and built-up strain.',
    },
  },
  'Swedish Aroma': {
    en: {
      title: 'Swedish Aromatherapy',
      subtitle: 'Swedish Aroma',
      description: 'Blends essential oils with flowing Swedish strokes for a lighter, more balanced full-body reset.',
    },
  },
  'Hot Stone': {
    en: {
      title: 'Hot Stone Therapy',
      subtitle: 'Hot Stone',
      description: 'Uses warmed volcanic stones to soften deep tension and create a grounded, soothing body experience.',
    },
  },
  'Focus Release': {
    en: {
      title: 'Head, Neck & Shoulder Relief',
      subtitle: 'Focus Release',
      description: 'Designed for desk-bound tension, helping quickly release heaviness around the head, neck, and shoulders.',
    },
  },
};

export const BOOKING_FLOW_COPY = {
  en: {
    nav: {
      home: 'Home',
      booking: 'Booking',
      manage: 'Manage',
      bookNow: 'Book Now',
    },
    footer: HOME_COPY.en.footer,
    booking: {
      heroTag: 'Booking Flow',
      title: 'Reserve Your Session',
      description: 'Choose your service, pick a time, and complete secure payment in a few simple steps.',
      progressTitle: 'Booking Steps',
      steps: ['Choose service & time', 'Fill details', 'Confirm payment'],
      cards: {
        service: 'Services',
        serviceSelected: 'Selected',
        availability: 'Available this week',
        selectedSlots: 'Selected timeslots',
        summary: 'Current selection',
        contact: 'Contact details',
        payment: 'Payment confirmation',
        paymentSummary: 'Order summary',
      },
      hints: {
        durationWindow: 'Slots are shown in {duration}-minute windows, so only fully bookable sessions appear.',
        payment: 'Your booking is only confirmed after successful payment. Every visible slot can accommodate the full duration you selected.',
        multiSlot: '{count} slots selected across one or more days',
      },
      actions: {
        next: 'Next',
        backToTime: 'Back to time selection',
        backToInfo: 'Back to edit',
        toPayment: 'Continue to payment',
        creating: 'Creating...',
        payNow: 'Confirm payment',
        paying: 'Processing payment...',
        previousWeek: 'Previous week',
        nextWeek: 'Next week',
        returnHome: 'Return home',
      },
      labels: {
        item: 'Service',
        duration: 'Duration',
        time: 'Time',
        amount: 'Amount',
        slotCount: 'Timeslots',
        totalPrice: 'Total',
        firstName: 'First name',
        lastName: 'Last name',
        email: 'Email',
        phone: 'Phone',
        notes: 'Notes',
      },
      placeholders: {
        notes: 'Share any details or questions',
      },
      empty: {
        chooseService: 'Choose a service first',
        noSlots: 'No fully bookable {duration}-minute sessions are available on this day',
      },
      loading: {
        services: 'Loading services...',
        weeklySlots: 'Loading this week\'s availability...',
      },
      errors: {
        loadServices: 'Unable to load services. Please refresh and try again.',
        loadSlots: 'Unable to load weekly availability.',
        createBooking: 'Unable to create the booking. Please try again.',
        chooseServiceAndTime: 'Please choose a service and at least one timeslot.',
        paymentFailed: 'Payment failed. Please try again.',
      },
      aria: {
        removeSlot: 'Remove {date} {time}',
      },
    },
    confirmation: {
      heroTag: 'Booking Status',
      loading: 'Loading...',
      notFound: 'Booking not found',
      title: {
        pending: 'Booking in progress',
        confirmed: 'Booking confirmed',
        expired: 'Booking expired',
        paymentFailed: 'Payment incomplete',
        cancelled: 'Booking cancelled',
      },
      message: {
        syncing: 'We are syncing your payment and booking status.',
        confirmed: 'Payment succeeded and your booking is now fully confirmed.',
        expired: 'The booking hold expired. Please choose a new time and complete payment again.',
        paymentFailed: 'Payment did not complete successfully, so the booking is not confirmed yet.',
        cancelled: 'This booking is currently cancelled.',
        pending: 'Once payment clears, the booking will confirm automatically.',
      },
      cards: {
        bookingDetails: 'Booking details',
        contact: 'Contact details',
        nextSteps: 'What happens next',
      },
      labels: {
        bookingId: 'Booking ID',
        service: 'Service',
        duration: 'Duration',
        time: 'Appointment time',
        price: 'Price',
        status: 'Booking status',
        paymentStatus: 'Payment status',
        reservedUntil: 'Held until',
        name: 'Name',
        email: 'Email',
        phone: 'Phone',
        notes: 'Notes',
      },
      steps: [
        'After payment succeeds, the system confirms the booking and sends an email.',
        'If the page still shows pending, wait a few seconds and refresh.',
        'For cancellations, please contact support directly. For rescheduling, use the management link from your email.',
      ],
      actions: {
        returnHome: 'Return home',
        rebook: 'Book again',
      },
      errors: {
        loadBooking: 'Unable to load booking details.',
      },
    },
    manage: {
      heroTag: 'Booking Management',
      title: 'Submit a Reschedule Request',
      description: 'Review your current booking and request a new timeslot.',
      cards: {
        currentBooking: 'Current booking',
        instructions: 'Rescheduling policy',
        availableSlots: 'Available reschedule times',
        history: 'Previous reschedule requests',
      },
      labels: {
        customer: 'Customer',
        service: 'Service',
        duration: 'Duration',
        time: 'Time',
        status: 'Status',
        paymentStatus: 'Payment status',
        supportEmail: 'Support email',
        newDate: 'Choose a new date',
        note: 'Request note',
      },
      instructions: 'This page only supports reschedule requests. For cancellations, please contact support directly.',
      placeholders: {
        note: 'Add any context about why you would like to move the session',
      },
      actions: {
        submit: 'Submit reschedule request',
        returnHome: 'Return home',
      },
      messages: {
        submitted: 'Your reschedule request has been sent. Please wait for admin review.',
      },
      empty: {
        noSlots: 'No available times on this date',
        noHistory: 'There are no previous reschedule requests.',
        noNote: 'No customer note',
      },
      loading: {
        page: 'Loading...',
        slots: 'Loading...',
      },
      errors: {
        loadBooking: 'Unable to load booking details.',
        loadSlots: 'Unable to load reschedule availability.',
        chooseSlot: 'Please choose a new appointment time.',
        submit: 'Unable to submit the reschedule request.',
      },
    },
    status: {
      booking: {
        pending: 'Pending payment confirmation',
        confirmed: 'Confirmed',
        cancelled: 'Cancelled',
        completed: 'Completed',
        no_show: 'No-show',
        expired: 'Expired',
      },
      payment: {
        pending: 'Pending',
        failed: 'Failed',
        succeeded: 'Succeeded',
        refunded: 'Refunded',
        partially_refunded: 'Partially refunded',
      },
      request: {
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected',
      },
    },
  },
};

export const getLocalizedServiceContent = (service, _language, fallbackDescription) => {
  const matched = SERVICE_TRANSLATIONS[service?.name]?.en;

  if (matched) {
    return matched;
  }

  return {
    title: service?.name || 'Service',
    subtitle: service?.name || 'Service',
    description: service?.description || fallbackDescription,
  };
};
