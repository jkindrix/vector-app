import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getRouteMetadata } from '../utils/routeUtils';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  type?: 'website' | 'article';
  canonical?: string;
  noindex?: boolean;
  dateModified?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title: propTitle,
  description: propDescription,
  keywords: propKeywords,
  image,
  type = 'website',
  canonical,
  noindex = false,
  dateModified
}) => {
  const location = useLocation();

  // Get route-based metadata
  const routeMetadata = getRouteMetadata(location.pathname);

  // Use props or derive from route
  const title = propTitle || routeMetadata.title;
  const description = propDescription || routeMetadata.description;
  const keywords = propKeywords || routeMetadata.keywords;

  const fullUrl = `${window.location.origin}${location.pathname}`;
  const canonicalUrl = canonical || fullUrl;

  // Update page title dynamically
  useEffect(() => {
    document.title = title;
  }, [title]);

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content="Vector" />
      {image && <meta property="og:image" content={image} />}
      {image && <meta property="og:image:alt" content={`${title} - Vector`} />}
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      {/* PWA Meta Tags */}
      <meta name="application-name" content="Vector" />
      <meta name="apple-mobile-web-app-title" content="Vector" />
      <meta name="theme-color" content="#2563eb" />

      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      {/* Structured Data */}
      {type === 'article' && (
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: title,
            description,
            url: canonicalUrl,
            ...(dateModified && { dateModified }),
            publisher: {
              '@type': 'Organization',
              name: 'Vector',
            },
          })}
        </script>
      )}
    </Helmet>
  );
};
