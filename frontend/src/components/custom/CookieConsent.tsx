"use client";

import { useEffect, useState } from "react";

const GTM_ID = "GTM-PKBNXSM5";

type CountryCode = 'US' | 'CA' | 'IN' | 'AU' | 'NZ' | 'GB';

export default function CookieConsent() {
  const [locale, setLocale] = useState<CountryCode>('IN');
  const [isLocaleLoading, setIsLocaleLoading] = useState(true);
  const [showConsent, setShowConsent] = useState(false);

  const isValidCountryCode = (code: string): code is CountryCode => {
    return ['US', 'CA', 'IN', 'AU', 'NZ', 'GB'].includes(code.toUpperCase());
  };

  const normalizeCountryCode = (code: string): CountryCode => {
    const upperCode = code.toUpperCase();
    return isValidCountryCode(upperCode) ? (upperCode as CountryCode) : 'IN';
  };

  const detectCountry = async (): Promise<CountryCode> => {
    const providers = [
      {
        name: 'ipapi.co',
        url: 'https://ipapi.co/json',
        extractor: (data: any) => data.country,
      },
      {
        name: 'ip-api.com',
        url: 'http://ip-api.com/json/?fields=countryCode',
        extractor: (data: any) => data.countryCode,
      },
      {
        name: 'geolocation-db.com',
        url: 'https://geolocation-db.com/json/',
        extractor: (data: any) => data.country_code,
      },
      {
        name: 'browser-language',
        url: null,
        extractor: () => navigator.language.split('-')[1],
      },
    ];

    for (const provider of providers) {
      try {
        let code: string | null = null;

        if (provider.url) {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 2000);
          const res = await fetch(provider.url, { signal: controller.signal });
          clearTimeout(timeout);
          if (!res.ok) continue;

          const data = await res.json();
          code = provider.extractor(data);
        } else {
          code = provider.extractor(null);
        }

        if (code && isValidCountryCode(code)) {
          return normalizeCountryCode(code);
        }
      } catch (err) {
        console.debug(`🌐 Provider ${provider.name} failed`, err);
        continue;
      }
    }

    return 'IN';
  };

  const loadGTM = () => {
    if (document.getElementById("gtm-script")) return;

    const script = document.createElement("script");
    script.id = "gtm-script";
    script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
    script.async = true;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "gtm_consent_granted" });
  };

  const checkConsent = (country: CountryCode) => {
    const consent = localStorage.getItem("cookieConsent");

    if (country === 'GB') {
      if (consent === 'accepted') {
        loadGTM();
      } else if (!consent) {
        setShowConsent(true);
      }
    } else {
      loadGTM();
    }
  };

  useEffect(() => {
    if (showConsent) {
      document.body.style.overflow = 'hidden';
      document.body.style.pointerEvents = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    };
  }, [showConsent]);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      setIsLocaleLoading(true);
      try {
        const stored = localStorage.getItem("userLocale");

        if (stored && isValidCountryCode(stored)) {
          const normalized = normalizeCountryCode(stored);
          if (isMounted) {
            setLocale(normalized);
            checkConsent(normalized);
          }
        } else {
          const detected = await detectCountry();
          localStorage.setItem("userLocale", detected);
          if (isMounted) {
            setLocale(detected);
            checkConsent(detected);
          }
        }
      } catch (err) {
        console.error("❌ Error resolving locale:", err);
        if (isMounted) {
          setLocale('IN');
          checkConsent('IN');
        }
      } finally {
        if (isMounted) {
          setIsLocaleLoading(false);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleConsent = (accepted: boolean) => {
    localStorage.setItem("cookieConsent", accepted ? "accepted" : "rejected");
    setShowConsent(false);
    if (accepted) loadGTM();
  };

  if (!showConsent || isLocaleLoading) return null;

  return (
    <div className="fixed bottom-0 z-50 bg-[#f4cfde] text-gray-800 p-4 w-full text-center" style={{ pointerEvents: 'auto' }}>
      <p className="text-sm md:text-base">
        We use cookies to enhance your experience, show you relevant offers, and help us improve. Your choice matters.
      </p>
      <p className="text-xs md:text-sm mt-2 text-gray-700">
        Learn more in our <a href="/cookie-policy" className="underline">Cookie Policy</a>.
      </p>

      <div className="mt-2 space-x-8">
        <button
          onClick={() => handleConsent(true)}
          className="bg-white text-gray-800 cursor-pointer px-4 py-2 rounded-xl hover:scale-105 text-xs md:text-sm shadow-md"
        >
          Accept All
        </button>
        <button
          onClick={() => handleConsent(false)}
          className="bg-white text-gray-800 cursor-pointer px-4 py-2 rounded-xl hover:scale-105 text-xs md:text-sm shadow-md"
        >
          Reject
        </button>
      </div>
    </div>
  );
}