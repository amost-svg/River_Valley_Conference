import { useEffect } from 'react';

interface SeoProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'organization';
  structuredData?: Record<string, any>;
}

export default function Seo({
  title = 'River Valley Conference - Excellence in High School Athletics',
  description = 'Official website of the River Valley Conference IHSA organization featuring school directories, sports schedules, conference standings, and athletic programs.',
  image = '/rvc-og-image.jpg',
  url,
  type = 'website',
  structuredData
}: SeoProps) {
  
  useEffect(() => {
    // Set document title
    document.title = title;
    
    // Get current URL if not provided
    const currentUrl = url || window.location.href;
    
    // Helper function to set or update meta tag
    const setMetaTag = (name: string, content: string, property?: boolean) => {
      const attribute = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Basic meta tags
    setMetaTag('description', description);
    // Note: viewport is handled by index.html to avoid duplication
    
    // Open Graph tags
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:image', image, true);
    setMetaTag('og:url', currentUrl, true);
    setMetaTag('og:type', type, true);
    setMetaTag('og:site_name', 'River Valley Conference', true);
    
    // Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', image);
    
    // Additional mobile-friendly meta tags
    setMetaTag('format-detection', 'telephone=no');
    setMetaTag('mobile-web-app-capable', 'yes');
    setMetaTag('apple-mobile-web-app-capable', 'yes');
    setMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent');
    setMetaTag('theme-color', '#1e3a8a'); // Conference navy color
    
    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);

    // Add or update structured data
    if (structuredData) {
      let scriptTag = document.querySelector('script[type="application/ld+json"]');
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.setAttribute('type', 'application/ld+json');
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(structuredData);
    }

  }, [title, description, image, url, type, structuredData]);

  // Add default organization structured data
  useEffect(() => {
    if (!structuredData) {
      const organizationData = {
        "@context": "https://schema.org",
        "@type": "SportsOrganization",
        "name": "River Valley Conference",
        "description": "Illinois High School Association conference featuring 10 member schools competing in various athletic programs",
        "url": window.location.origin,
        "logo": `${window.location.origin}/rvc-logo.png`,
        "foundingDate": "1950",
        "address": {
          "@type": "PostalAddress",
          "addressRegion": "Illinois",
          "addressCountry": "US"
        },
        "sport": [
          "Volleyball", "Soccer", "Basketball", "Baseball", "Softball", 
          "Track and Field", "Scholastic Bowl", "Cross Country"
        ],
        "memberOf": {
          "@type": "Organization",
          "name": "Illinois High School Association",
          "url": "https://www.ihsa.org"
        }
      };

      let scriptTag = document.querySelector('script[type="application/ld+json"][data-default="true"]');
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.setAttribute('type', 'application/ld+json');
        scriptTag.setAttribute('data-default', 'true');
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(organizationData);
    }
  }, [structuredData]);

  return null; // This component doesn't render anything visible
}