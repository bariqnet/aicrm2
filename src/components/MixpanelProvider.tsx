"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  initializeMixpanel,
  setMixpanelContext,
  trackMixpanelError,
  type MixpanelUser
} from "@/lib/mixpanel-browser";
import { useUIStore } from "@/store/ui-store";

type MixpanelProviderProps = {
  apiHost?: string;
  debug?: boolean;
  token: string;
  user?: MixpanelUser | null;
  workspaceId?: string;
};

export function MixpanelProvider({
  apiHost,
  debug = false,
  token,
  user,
  workspaceId
}: MixpanelProviderProps) {
  const language = useUIStore((state) => state.language);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isScriptReady, setIsScriptReady] = useState(false);
  const identifiedUserIdRef = useRef<string | null>(null);
  const lastTrackedUrlRef = useRef<string | null>(null);

  const search = searchParams.toString();
  const url = search ? `${pathname}?${search}` : pathname;

  useEffect(() => {
    setMixpanelContext({
      language,
      user: user ?? null,
      workspaceId
    });
  }, [language, user, workspaceId]);

  useEffect(() => {
    if (!isScriptReady || !window.mixpanel) return;
    initializeMixpanel({ apiHost, debug, token });
  }, [apiHost, debug, isScriptReady, token]);

  useEffect(() => {
    if (!isScriptReady || !window.mixpanel) return;

    window.mixpanel.register({
      language,
      ...(workspaceId ? { workspace_id: workspaceId } : {})
    });

    if (workspaceId) {
      window.mixpanel.set_group?.("workspace_id", workspaceId);
    }
  }, [isScriptReady, language, workspaceId]);

  useEffect(() => {
    if (!isScriptReady || !window.mixpanel) return;

    if (!user) {
      if (identifiedUserIdRef.current) {
        window.mixpanel.reset?.();
        identifiedUserIdRef.current = null;
        lastTrackedUrlRef.current = null;
      }
      return;
    }

    if (identifiedUserIdRef.current === user.id) return;

    window.mixpanel.identify(user.id);
    window.mixpanel.people?.set({
      $email: user.email,
      $name: user.name,
      ...(workspaceId ? { workspace_id: workspaceId } : {})
    });

    identifiedUserIdRef.current = user.id;
  }, [isScriptReady, user, workspaceId]);

  useEffect(() => {
    function onWindowError(event: Event) {
      if (event instanceof ErrorEvent) {
        trackMixpanelError("window.error", event.error ?? event.message, {
          error_column: event.colno || undefined,
          error_file: event.filename || undefined,
          error_line: event.lineno || undefined
        });
        return;
      }

      const target = event.target;
      const element = target instanceof HTMLElement ? target : null;
      const tagName = element?.tagName?.toLowerCase();
      const sourceUrl =
        target instanceof HTMLImageElement || target instanceof HTMLScriptElement
          ? target.src
          : target instanceof HTMLLinkElement
            ? target.href
            : undefined;

      trackMixpanelError("window.resource-error", "Resource failed to load", {
        resource_tag: tagName,
        resource_url: sourceUrl
      });
    }

    function onUnhandledRejection(event: PromiseRejectionEvent) {
      trackMixpanelError("window.unhandledrejection", event.reason, {
        rejection_reason: typeof event.reason === "string" ? event.reason : undefined
      });
    }

    window.addEventListener("error", onWindowError, true);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onWindowError, true);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    if (!isScriptReady || !window.mixpanel || !pathname) return;
    if (lastTrackedUrlRef.current === url) return;

    window.mixpanel.track("Page Viewed", {
      language,
      page_name: document.title,
      pathname,
      search,
      url,
      ...(workspaceId ? { workspace_id: workspaceId } : {})
    });

    lastTrackedUrlRef.current = url;
  }, [isScriptReady, language, pathname, search, url, workspaceId]);

  return (
    <Script
      id="mixpanel-browser-sdk"
      src="https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js"
      strategy="afterInteractive"
      onLoad={() => setIsScriptReady(true)}
    />
  );
}
