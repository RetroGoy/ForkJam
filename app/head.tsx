export default function Head() {
  return (
    <>
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#FFDD4A" />

      {/* Favicon */}
      <link rel="icon" href="/icons/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-192.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-192.png" />

      {/* Apple iOS */}
      <link rel="apple-touch-icon" href="/icons/ios_180.png" />      
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="ForkJam" />

      {/* Open Graph */}
      <meta property="og:title" content="ForkJam" />
      <meta property="og:description" content="Collaborative musical node graph." />
      <meta property="og:image" content="/og-image.png" />
      <meta property="og:url" content="https://forkjam.com" />
      <meta property="og:type" content="website" />
      <meta property="og:image:width" content="512" />
      <meta property="og:image:height" content="512" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="ForkJam" />
      <meta name="twitter:description" content="Collaborative musical node graph." />
      <meta name="twitter:image" content="/logoFj.png" />
    </>
  );
}