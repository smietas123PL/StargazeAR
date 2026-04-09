import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  LANGUAGE_STORAGE_KEY,
  type Language,
  resolveInitialLanguage,
  setCurrentLanguage,
  translateText,
} from "../lib/i18n";

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);
const textNodeOriginals = new WeakMap<Text, string>();
const attributeOriginals = new WeakMap<Element, Map<string, string>>();
const translatableAttributes = ["placeholder", "title", "aria-label", "alt"] as const;

function shouldSkipNode(node: Text): boolean {
  const parent = node.parentElement;
  if (!parent) return true;
  if (parent.closest('[data-i18n-skip="true"]')) return true;
  return ["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "TEXTAREA"].includes(parent.tagName);
}

function translateTextNode(node: Text, language: Language) {
  if (shouldSkipNode(node)) return;

  const original = textNodeOriginals.get(node) ?? node.data;
  if (!textNodeOriginals.has(node)) {
    textNodeOriginals.set(node, original);
  }

  const translated = translateText(original, language);
  if (node.data !== translated) {
    node.data = translated;
  }
}

function translateElementAttributes(element: Element, language: Language) {
  if (element.closest('[data-i18n-skip="true"]')) return;

  let originalMap = attributeOriginals.get(element);
  if (!originalMap) {
    originalMap = new Map<string, string>();
    attributeOriginals.set(element, originalMap);
  }

  for (const attribute of translatableAttributes) {
    if (!element.hasAttribute(attribute)) continue;
    if (!originalMap.has(attribute)) {
      const original = element.getAttribute(attribute);
      if (original != null) originalMap.set(attribute, original);
    }
    const originalValue = originalMap.get(attribute);
    if (originalValue == null) continue;
    const translated = translateText(originalValue, language);
    if (element.getAttribute(attribute) !== translated) {
      element.setAttribute(attribute, translated);
    }
  }
}

function translateTree(node: Node, language: Language) {
  if (node.nodeType === Node.TEXT_NODE) {
    translateTextNode(node as Text, language);
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const element = node as Element;
  translateElementAttributes(element, language);
  for (const child of Array.from(element.childNodes)) {
    translateTree(child, language);
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const resolved = resolveInitialLanguage();
    setCurrentLanguage(resolved);
    return resolved;
  });

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((current) => (current === "en" ? "pl" : "en"));
  }, []);

  useEffect(() => {
    setCurrentLanguage(language);
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
      document.documentElement.dataset.language = language;
    }
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Ignore local storage write failures in restricted environments.
    }
  }, [language]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.body;
    if (!root) return;

    translateTree(root, language);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          for (const addedNode of Array.from(mutation.addedNodes)) {
            translateTree(addedNode, language);
          }
        }

        if (mutation.type === "characterData") {
          translateTree(mutation.target, language);
        }

        if (mutation.type === "attributes" && mutation.target instanceof Element) {
          translateElementAttributes(mutation.target, language);
        }
      }
    });

    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...translatableAttributes],
    });

    return () => observer.disconnect();
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
    }),
    [language, setLanguage, toggleLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
