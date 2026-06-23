import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Where We Watch: Find a venue for the World Cup',
  description: 'Find a pub, bar or restaurant showing World Cup games near you. Live availability, real-time crowd backing, and instant reservations.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
