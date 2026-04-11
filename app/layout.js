import './globals.css';
import ClientProviders from './providers';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://healthbridge-gcc.vercel.app';

export const metadata = {
  title: { default: 'Healthcare Investor Intelligence Platform -- Saudi Arabia & GCC', template: '%s | Healthcare Investor Intelligence' },
  description: 'The #1 platform connecting healthcare investors with opportunities in Saudi Arabia. 400+ investors, 18,000+ providers mapped, AI investment advisor, deal flow pipeline, Vision 2030 aligned.',
  keywords: ['Saudi healthcare investment', 'GCC healthcare investor', 'Vision 2030 healthcare', 'MISA healthcare license', 'MOH hospital licensing', 'healthcare investor directory', 'Saudi medical investment', 'استثمار صحي السعودية', 'مستثمرين قطاع صحي', 'رؤية 2030 صحة'],
  authors: [{ name: 'HealthBridge GCC' }],
  creator: 'HealthBridge GCC',
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: '/' },
  openGraph: { type: 'website', locale: 'en_US', url: SITE_URL, siteName: 'Healthcare Investor Intelligence', title: 'Healthcare Investor Intelligence -- Saudi Arabia & GCC', description: 'Connect with 400+ healthcare investors in Saudi Arabia.', images: [{ url: `${SITE_URL}/og-image.svg`, width: 1200, height: 630 }] },
  twitter: { card: 'summary_large_image', title: 'Healthcare Investor Intelligence -- Saudi Arabia & GCC', images: [`${SITE_URL}/og-image.svg`] },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
