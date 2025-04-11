"use client";

import { useEffect } from "react";

export default function RemoveShortcutListener() {
  useEffect(() => {
    const removeAttribute = () => {
      const body = document.body;
      if (body && body.hasAttribute("cz-shortcut-listen")) {
        body.removeAttribute("cz-shortcut-listen");
      }
    };

    // Exécuter immédiatement
    removeAttribute();

    // Observer pour détecter les changements futurs
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "cz-shortcut-listen") {
          removeAttribute();
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["cz-shortcut-listen"],
    });

    return () => observer.disconnect();
  }, []);

  return null;
} 