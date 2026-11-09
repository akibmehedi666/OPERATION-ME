"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PwaContextValue {
  isInstalled: boolean;
  canInstall: boolean;
  isIOS: boolean;
  isOnline: boolean;
  promptInstall: () => Promise<boolean>;
  updateAvailable: boolean;
  reloadApp: () => void;
  dismissUpdate: () => void;
}

const PwaContext = createContext<PwaContextValue>({
  isInstalled: false,
  canInstall: false,
  isIOS: false,
  isOnline: true,
  promptInstall: async () => false,
  updateAvailable: false,
  reloadApp: () => {},
  dismissUpdate: () => {},
});

export const usePwa = () => useContext(PwaContext);

export const PwaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(window.navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // 1. Detect standalone / installed state
    const checkInstalled = () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(isStandalone);
    };
    checkInstalled();

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };
    mediaQuery.addEventListener("change", handleMediaChange);

    // 2. Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isAppleDevice);

    // 3. Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 4. Listen for appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    // 5. Register Service Worker & handle Update Flow
    if ("serviceWorker" in navigator && process.env.NODE_ENV !== "test") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          // If there is an existing waiting worker on load
          if (registration.waiting) {
            setWaitingWorker(registration.waiting);
            setUpdateAvailable(true);
          }

          // If a new worker is discovered
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // New update ready!
                setWaitingWorker(newWorker);
                setUpdateAvailable(true);
              }
            });
          });
        })
        .catch((err) => {
          console.warn("[PWA] ServiceWorker registration failed:", err);
        });

      // Reload when controller changes
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      mediaQuery.removeEventListener("change", handleMediaChange);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (err) {
      console.error("[PWA] Install prompt failed:", err);
      return false;
    }
  }, [deferredPrompt]);

  const reloadApp = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    } else {
      window.location.reload();
    }
  }, [waitingWorker]);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  return (
    <PwaContext.Provider
      value={{
        isInstalled,
        canInstall: Boolean(deferredPrompt),
        isIOS,
        isOnline,
        promptInstall,
        updateAvailable,
        reloadApp,
        dismissUpdate,
      }}
    >
      {children}
    </PwaContext.Provider>
  );
};
