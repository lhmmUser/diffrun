"use client";

import { useEffect, useState } from "react";

const GTM_ID = "GTM-PKBNXSM5";

export default function CookieConsent() {
  const [locale, setLocale] = useState<string | null>(null);
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    const detectCountry = async () => {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      const userLocale = data.country || "";
      setLocale(userLocale);

      const consent = localStorage.getItem("cookieConsent");

      if (userLocale === "GB") {
        if (consent === "accepted") {
          loadGTM();
        } else if (!consent) {
          setShowConsent(true);
        }  
      } else {
        loadGTM();
      }
    };

    detectCountry();
  }, []);

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

  const handleConsent = (accepted: boolean) => {
    localStorage.setItem("cookieConsent", accepted ? "accepted" : "rejected");
    setShowConsent(false);
    if (accepted) loadGTM();
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-0 z-50 bg-[#5784ba] text-white p-4 w-full text-center">
      <p>This site uses cookies for analytics. Accept?</p>
      <div className="mt-2 space-x-4">
        <button onClick={() => handleConsent(true)} className="bg-white text-black cursor-pointer px-4 py-2 rounded">
          Accept
        </button>
        <button onClick={() => handleConsent(false)} className="bg-gray-800 text-white cursor-pointer px-4 py-2 rounded">
          Reject
        </button>
      </div>
    </div>
  );
}