import { useState, useEffect } from "react";

export default function LanguageSelector() {
  const getInitialLang = () => {
    const storedLang = localStorage.getItem("selected_language");
    if (storedLang) return storedLang;

    const match = document.cookie.match(/googtrans=\/en\/([a-z]{2})/);
    return match ? match[1] : "en";
  };

  const [lang, setLang] = useState(getInitialLang);

  useEffect(() => {
    if (!window.googleTranslateScriptLoaded) {
      const script = document.createElement("script");
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
      window.googleTranslateScriptLoaded = true;
    }

    window.googleTranslateElementInit = () => {
      const el = document.getElementById("google_translate_element");
      if (el && !el.hasChildNodes()) {
        new window.google.translate.TranslateElement(
          { pageLanguage: "en", autoDisplay: false },
          "google_translate_element"
        );
      }
    };
  }, []);

  const handleChange = (e) => {
    const selectedLang = e.target.value;

    // ✅ store in localStorage
    localStorage.setItem("selected_language", selectedLang);

    setLang(selectedLang);

    const cookieValue =
      selectedLang === "en" ? "/en/en" : `/en/${selectedLang}`;
    const domain = window.location.hostname;

    document.cookie = `googtrans=${cookieValue}; path=/;`;
    document.cookie = `googtrans=${cookieValue}; path=/; domain=${domain}`;
    document.cookie = `googtrans=${cookieValue}; path=/; domain=.${domain}`;

    const gtFrame = document.querySelector("iframe.goog-te-banner-frame");
    if (gtFrame) gtFrame.style.display = "none";

    setTimeout(() => window.location.reload(), 300);
  };

  return (
    <div className="w-full relative notranslate" translate="no">
      <select
        value={lang}
        onChange={handleChange}
        className="w-full bg-white text-gray-800 rounded-md px-2 py-1 text-sm focus:ring focus:ring-blue-300 notranslate"
        translate="no"
        style={{ backgroundImage: "none" }}
      >
        <option value="en" translate="no" className="notranslate">
          English
        </option>
        <option value="hi" translate="no" className="notranslate">
          हिन्दी
        </option>
        <option value="te" translate="no" className="notranslate">
          తెలుగు
        </option>
      </select>

      <div id="google_translate_element" className="hidden"></div>
    </div>
  );
}
