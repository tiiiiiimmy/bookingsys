import React, { useState } from 'react';

const MODAL_COPY = {
  contact: {
    title: 'Contact',
    content: (
      <p>
        Please contact us directly for booking questions, rescheduling help, or service inquiries.
      </p>
    ),
  },
  refund: {
    title: 'Refund Policy',
    content: (
      <div className="space-y-5">
        

        <section className="space-y-2">
          <h4 className="font-semibold text-stone-800">1. Introduction</h4>
          <p>
            Thank you for choosing [Website Name]. We are committed to providing professional psychic,
            spiritual guidance, tarot reading, mediumship, energy reading, and related consultation
            services.
          </p>
          <p>
            This Refund Policy explains when refunds may or may not be available for purchases made
            through our website.
          </p>
          <p>
            By purchasing our services, you acknowledge that you have read and agreed to this Refund
            Policy.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="font-semibold text-stone-800">2. Nature of Our Services</h4>
          <p>
            Our services are provided for entertainment, personal insight, spiritual exploration, and
            guidance purposes only.
          </p>
          <p>We do not guarantee:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Specific outcomes;</li>
            <li>Future events;</li>
            <li>Accuracy of predictions;</li>
            <li>Financial, legal, medical, or relationship results;</li>
            <li>Any particular personal, emotional, or spiritual benefit.</li>
          </ul>
          <p>
            All readings and consultations reflect the opinions, interpretations, and intuitive
            impressions of the reader at the time of the session.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="font-semibold text-stone-800">3. Cancellation Before a Session</h4>
          <p>
            Clients may cancel a scheduled session and receive a full refund if cancellation is requested
            at least <strong>24 hours before the scheduled appointment time</strong>.
          </p>
          <p>
            Cancellation requests received less than 24 hours before the appointment may not be eligible
            for a refund.
          </p>
          <p>We reserve the right to charge a reasonable administration fee where applicable.</p>
        </section>

        <section className="space-y-2">
          <h4 className="font-semibold text-stone-800">4. Missed Appointments</h4>
          <p>If a client fails to attend a scheduled session without prior notice:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>The session will be considered completed; and</li>
            <li>No refund will be provided.</li>
          </ul>
          <p>If technical issues on our side prevent the session from taking place, we will either:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Reschedule the session at no additional cost; or</li>
            <li>Provide a full refund.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h4 className="font-semibold text-stone-800">5. Completed Readings and Consultations</h4>
          <p>
            Because psychic readings, tarot readings, mediumship sessions, and spiritual consultations are
            personalized services that are delivered immediately upon completion:
          </p>
          <p>
            <strong>
              No refunds will be issued once a consultation, reading, report, recording, or digital
              service has been delivered.
            </strong>
          </p>
          <p>This includes situations where:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>The client disagrees with the reading;</li>
            <li>The information provided does not meet expectations;</li>
            <li>Predictions do not occur as expected;</li>
            <li>The client feels dissatisfied with subjective interpretations;</li>
            <li>The client changes their mind after the service has been completed.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h4 className="font-semibold text-stone-800">6. Digital Products</h4>
          <p>
            Where digital reports, recorded readings, downloadable content, or other digital products are
            purchased:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Refunds are not available once access, download, delivery, or viewing has commenced.</li>
            <li>
              If a product cannot be accessed due to a technical fault caused by us, we will provide a
              replacement, correction, or refund where appropriate.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h4 className="font-semibold text-stone-800">7. Faulty Services</h4>
          <p>
            Nothing in this Refund Policy limits your rights under applicable New Zealand consumer
            protection laws, including the Consumer Guarantees Act 1993.
          </p>
          <p>
            If a service has not been supplied with reasonable care and skill, or has not been provided
            substantially as described, you may be entitled to a remedy under New Zealand law.
          </p>
          <p>Any request for such a remedy will be assessed on a case-by-case basis.</p>
        </section>

        <section className="space-y-2">
          <h4 className="font-semibold text-stone-800">8. Exceptional Circumstances</h4>
          <p>
            We may, at our sole discretion, provide a partial or full refund in exceptional circumstances,
            including but not limited to:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Duplicate payments;</li>
            <li>Billing errors;</li>
            <li>Accidental multiple purchases;</li>
            <li>Service interruptions caused by our systems.</li>
          </ul>
          <p>
            Approval of a refund in one case does not create an obligation to provide refunds in future
            cases.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="font-semibold text-stone-800">9. Chargebacks</h4>
          <p>
            Clients agree to contact us first to resolve any payment dispute before initiating a chargeback
            through their payment provider.
          </p>
          <p>
            Fraudulent or abusive chargeback requests may result in suspension or termination of access to
            our services.
          </p>
        </section>

        <p>We aim to respond to all refund-related enquiries within 5 business days.</p>
      </div>
    ),
  },
};

const PublicSiteFooter = () => {
  const [activeModal, setActiveModal] = useState(null);
  const modalCopy = activeModal ? MODAL_COPY[activeModal] : null;

  return (
    <footer className="bg-stone-100">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-8 py-16 md:grid-cols-4">
        <div className="md:col-span-1">
          <h2 className="mb-6 font-headline text-lg text-orange-900">Psychic Magic</h2>
          <p className="font-sans text-sm leading-relaxed tracking-wide text-stone-500">
            © 2025 Psychic Magic.
            <br />
            All rights reserved.
          </p>
        </div>
        <div className="space-y-4">
          <p className="font-sans text-sm tracking-wide text-stone-500">
            Hours: Thu &amp; Sun 9AM–5PM
          </p>
          <p className="font-sans text-sm tracking-wide text-stone-500">
            Payments: Stripe &amp; Cards
          </p>
        </div>
        <div className="space-y-4">
          <button
            className="block font-sans text-sm tracking-wide text-stone-500 opacity-80 transition-opacity hover:opacity-100"
            type="button"
            onClick={() => setActiveModal('contact')}
          >
            Contact
          </button>
          <button
            className="block font-sans text-sm tracking-wide text-stone-500 opacity-80 transition-opacity hover:opacity-100"
            type="button"
            onClick={() => setActiveModal('refund')}
          >
            Refund Policy
          </button>
        </div>
      
      </div>

      {modalCopy && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="footer-modal-title"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="footer-modal-title" className="font-headline text-lg text-orange-900">
              {modalCopy.title}
            </h3>
            <div className="mt-4 font-sans text-sm leading-relaxed text-stone-600">
              {modalCopy.content}
            </div>
            <button
              className="mt-6 rounded-full bg-orange-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-800"
              type="button"
              onClick={() => setActiveModal(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </footer>
  );
};

export default PublicSiteFooter;
