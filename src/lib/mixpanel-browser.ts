"use client";

import type { SessionUser } from "@/lib/crm-types";

export type MixpanelUser = Pick<SessionUser, "email" | "id" | "name">;

export type MixpanelProperties = Record<string, string | number | boolean | null | undefined>;

type MixpanelPendingEvent = {
  eventName: string;
  properties?: MixpanelProperties;
};

type MixpanelContext = {
  language?: string;
  user?: MixpanelUser | null;
  workspaceId?: string;
};

type InitializeMixpanelOptions = {
  apiHost?: string;
  debug?: boolean;
  token: string;
};

declare global {
  interface Window {
    __mixpanelContext__?: MixpanelContext;
    __mixpanelInitialized__?: boolean;
    __mixpanelPendingEvents__?: MixpanelPendingEvent[];
    mixpanel?: {
      identify: (distinctId: string) => void;
      init: (
        token: string,
        config?: {
          api_host?: string;
          debug?: boolean;
          ignore_dnt?: boolean;
          persistence?: "cookie" | "localStorage";
          track_pageview?: boolean;
        }
      ) => void;
      people?: {
        set: (properties: MixpanelProperties) => void;
      };
      register: (properties: MixpanelProperties) => void;
      reset?: () => void;
      set_group?: (groupKey: string, groupId: string) => void;
      track: (eventName: string, properties?: MixpanelProperties) => void;
    };
  }
}

type MixpanelErrorInput = Error | (Error & { digest?: string }) | string | unknown;

function serializeUnknownValue(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
    return String(value);
  }

  if (value instanceof Error) {
    return value.message;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
}

function truncate(value: string | undefined, maxLength: number): string | undefined {
  if (!value) return undefined;
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

function normalizeError(error: MixpanelErrorInput): {
  digest?: string;
  message: string;
  name: string;
  stack?: string;
} {
  if (error instanceof Error) {
    const digest = "digest" in error && typeof error.digest === "string" ? error.digest : undefined;

    return {
      digest,
      message: error.message || "Unknown error",
      name: error.name || "Error",
      stack: error.stack
    };
  }

  if (typeof error === "string") {
    return {
      message: error,
      name: "Error"
    };
  }

  return {
    message: serializeUnknownValue(error) ?? "Unknown error",
    name: "UnknownError"
  };
}

function readClientLocation() {
  if (typeof window === "undefined") {
    return {
      pathname: undefined,
      referrer: undefined,
      url: undefined
    };
  }

  return {
    pathname: window.location.pathname,
    referrer: document.referrer || undefined,
    url: window.location.href
  };
}

export function setMixpanelContext(context: MixpanelContext) {
  if (typeof window === "undefined") return;
  window.__mixpanelContext__ = context;
}

export function getMixpanelContext(): MixpanelContext {
  if (typeof window === "undefined") return {};
  return window.__mixpanelContext__ ?? {};
}

export function trackMixpanelEvent(eventName: string, properties?: MixpanelProperties) {
  if (typeof window === "undefined") return;

  if (!window.mixpanel) {
    window.__mixpanelPendingEvents__ = [...(window.__mixpanelPendingEvents__ ?? []), { eventName, properties }];
    return;
  }

  window.mixpanel.track(eventName, properties);
}

export function flushMixpanelQueue() {
  if (typeof window === "undefined" || !window.mixpanel) return;

  const pendingEvents = window.__mixpanelPendingEvents__ ?? [];
  if (!pendingEvents.length) return;

  for (const event of pendingEvents) {
    window.mixpanel.track(event.eventName, event.properties);
  }

  window.__mixpanelPendingEvents__ = [];
}

export function initializeMixpanel({ apiHost, debug = false, token }: InitializeMixpanelOptions) {
  if (typeof window === "undefined" || !window.mixpanel) return;

  if (!window.__mixpanelInitialized__) {
    window.mixpanel.init(token, {
      ...(apiHost ? { api_host: apiHost } : {}),
      debug,
      ignore_dnt: true,
      persistence: "localStorage",
      track_pageview: false
    });

    window.__mixpanelInitialized__ = true;
  }

  flushMixpanelQueue();
}

export function buildMixpanelErrorProperties(
  error: MixpanelErrorInput,
  extra: MixpanelProperties = {}
): MixpanelProperties {
  const normalizedError = normalizeError(error);
  const context = getMixpanelContext();
  const location = readClientLocation();
  const language =
    context.language ??
    (typeof document === "undefined" ? undefined : document.documentElement.lang || undefined);

  return {
    error_digest: normalizedError.digest,
    error_message: truncate(normalizedError.message, 1200),
    error_name: truncate(normalizedError.name, 240),
    error_stack: truncate(normalizedError.stack, 8000),
    language,
    pathname: location.pathname,
    referrer: location.referrer,
    url: location.url,
    user_email: context.user?.email,
    user_id: context.user?.id,
    user_name: context.user?.name,
    workspace_id: context.workspaceId,
    ...extra
  };
}

export function trackMixpanelError(source: string, error: MixpanelErrorInput, extra: MixpanelProperties = {}) {
  trackMixpanelEvent(
    "Application Error",
    buildMixpanelErrorProperties(error, {
      page_name: typeof document === "undefined" ? undefined : document.title || undefined,
      source,
      ...extra
    })
  );
}
