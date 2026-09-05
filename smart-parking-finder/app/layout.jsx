import { ToastProvider } from '../components/ToastProvider';
import { SessionProvider } from '../components/SessionProvider';
import ServiceWorkerRegister from '../components/ServiceWorkerRegister';
import ReferralCapture from '../components/ReferralCapture';

export const metadata = {
  title: 'ParkSwift — Smart Parking Finder',
  description: 'Find, list, and manage live parking availability across Lagos.',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Intentionally a plain <link>, not a CSS import: this stylesheet is shared
            verbatim with the static marketing pages in public/, which load it the
            same way. Importing it into the bundle would fork the design system. */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/assets/styles.css" />
      </head>
      <body>
        <ServiceWorkerRegister />
        <SessionProvider>
          <ReferralCapture />
          <ToastProvider>{children}</ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
