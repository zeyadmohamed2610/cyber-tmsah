import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

/**
 * SEO Component for managing meta tags
 * Provides Open Graph, Twitter Cards, and standard meta tags
 */
export const SEO = ({
  title = "CYBER TMSAH - منصة الأمن السيبراني",
  description = "منصة أكاديمية متكاملة لطلاب الأمن السيبراني. مواد دراسية، جداول محاضرات، ومراجعات شاملة في مكان واحد.",
  image = "/og-image.jpg",
  url = "https://cybertmsah.com",
  type = "website",
}: SEOProps) => {
  const fullTitle = title.includes("CYBER TMSAH") ? title : `${title} | CYBER TMSAH`;
  
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#0a0a0f" />
      <meta name="color-scheme" content="dark" />
      
      {/* Favicon - favicon.png مصدر واحد */}
      <link rel="icon" type="image/png" href="/favicon.png" />
      <link rel="apple-touch-icon" href="/favicon.png" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="ar_AR" />
      <meta property="og:site_name" content="CYBER TMSAH" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      
      {/* Additional Meta Tags */}
      <meta name="author" content="زياد محمد" />
      <meta name="keywords" content="أمن سيبراني, جامعة العاصمة, تكنولوجيا, مواد دراسية, جدول محاضرات, cybersecurity" />
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      
      {/* Structured Data - Organization */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "CYBER TMSAH",
          "description": description,
          "url": url,
          "logo": "/logo.png",
          "founder": {
            "@type": "Person",
            "name": "زياد محمد"
          },
          "sameAs": [
            "https://www.facebook.com/zeyad.eltmsah",
            "https://www.linkedin.com/in/zeyadmohamed26/",
            "https://github.com/zeyadmohamed2610"
          ]
        })}
      </script>
      
      {/* Structured Data - WebSite */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "CYBER TMSAH",
          "url": url,
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": `${url}/search?q={search_term_string}`
            },
            "query-input": "required name=search_term_string"
          }
        })}
      </script>
    </Helmet>
  );
};

export default SEO;
