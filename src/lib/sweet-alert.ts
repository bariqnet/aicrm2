type SwalIcon = "success" | "error" | "warning" | "info" | "question";

type SwalCustomClass = {
  popup?: string;
  title?: string;
  htmlContainer?: string;
  confirmButton?: string;
  cancelButton?: string;
  actions?: string;
};

type SwalOptions = {
  title?: string;
  text?: string;
  icon?: SwalIcon;
  toast?: boolean;
  position?:
    | "top"
    | "top-start"
    | "top-end"
    | "center"
    | "center-start"
    | "center-end"
    | "bottom"
    | "bottom-start"
    | "bottom-end";
  timer?: number;
  showConfirmButton?: boolean;
  showCancelButton?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
  focusConfirm?: boolean;
  allowOutsideClick?: boolean;
  customClass?: SwalCustomClass;
  background?: string;
  color?: string;
  buttonsStyling?: boolean;
};

type SwalResult = {
  isConfirmed: boolean;
  isDismissed: boolean;
  isDenied: boolean;
};

type SwalLike = {
  fire: (options: SwalOptions) => Promise<SwalResult>;
};

declare global {
  interface Window {
    Swal?: SwalLike;
  }
}

const SWEETALERT_SCRIPT_ID = "sweetalert2-script";
const SWEETALERT_STYLE_ID = "sweetalert2-style";
const SWEETALERT_SCRIPT_SRC =
  "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js";
const SWEETALERT_STYLE_SRC =
  "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css";

const THEMED_BASE: SwalOptions = {
  background: "hsl(var(--background))",
  color: "hsl(var(--foreground))",
  buttonsStyling: false,
  customClass: {
    popup: "swal-popup",
    title: "swal-title",
    htmlContainer: "swal-text",
    actions: "swal-actions",
    confirmButton: "swal-confirm",
    cancelButton: "swal-cancel"
  }
};

let swalLoader: Promise<SwalLike> | null = null;

function mergeOptions(base: SwalOptions, incoming: SwalOptions): SwalOptions {
  return {
    ...base,
    ...incoming,
    customClass: {
      ...(base.customClass ?? {}),
      ...(incoming.customClass ?? {})
    }
  };
}

function ensureStyleTag(): void {
  if (typeof window === "undefined") return;
  if (document.getElementById(SWEETALERT_STYLE_ID)) return;

  const link = document.createElement("link");
  link.id = SWEETALERT_STYLE_ID;
  link.rel = "stylesheet";
  link.href = SWEETALERT_STYLE_SRC;
  document.head.appendChild(link);
}

function loadSwalScript(): Promise<SwalLike> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("SweetAlert is only available in the browser"));
  }

  if (window.Swal) {
    return Promise.resolve(window.Swal);
  }

  ensureStyleTag();

  const existingScript = document.getElementById(SWEETALERT_SCRIPT_ID) as HTMLScriptElement | null;
  if (existingScript) {
    return new Promise<SwalLike>((resolve, reject) => {
      existingScript.addEventListener("load", () => {
        if (window.Swal) resolve(window.Swal);
        else reject(new Error("SweetAlert script loaded but unavailable"));
      });
      existingScript.addEventListener("error", () => {
        reject(new Error("Failed to load SweetAlert script"));
      });
    });
  }

  return new Promise<SwalLike>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SWEETALERT_SCRIPT_ID;
    script.async = true;
    script.src = SWEETALERT_SCRIPT_SRC;

    script.onload = () => {
      if (window.Swal) {
        resolve(window.Swal);
      } else {
        reject(new Error("SweetAlert script loaded but unavailable"));
      }
    };

    script.onerror = () => reject(new Error("Failed to load SweetAlert script"));
    document.body.appendChild(script);
  });
}

async function getSwal(): Promise<SwalLike> {
  if (!swalLoader) {
    swalLoader = loadSwalScript();
  }
  return swalLoader;
}

export async function fireSweetAlert(options: SwalOptions): Promise<SwalResult> {
  try {
    const swal = await getSwal();
    return swal.fire(mergeOptions(THEMED_BASE, options));
  } catch {
    if (typeof window !== "undefined") {
      const message = [options.title, options.text].filter(Boolean).join("\n\n");
      if (options.showCancelButton) {
        const confirmed = window.confirm(message || "Please confirm");
        return {
          isConfirmed: confirmed,
          isDismissed: !confirmed,
          isDenied: false
        };
      }
      window.alert(message || "Notice");
    }
    return { isConfirmed: false, isDismissed: true, isDenied: false };
  }
}

export async function showSuccessAlert(title: string, text?: string): Promise<void> {
  await fireSweetAlert({
    icon: "success",
    title,
    text,
    toast: true,
    position: "top-end",
    timer: 1800,
    showConfirmButton: false
  });
}

export async function showErrorAlert(title: string, text?: string): Promise<void> {
  await fireSweetAlert({
    icon: "error",
    title,
    text,
    confirmButtonText: "Ok",
    allowOutsideClick: true
  });
}

export async function showInfoAlert(title: string, text?: string): Promise<void> {
  await fireSweetAlert({
    icon: "info",
    title,
    text,
    confirmButtonText: "Ok"
  });
}

export async function confirmAlert(
  title: string,
  text: string,
  confirmButtonText = "Confirm"
): Promise<boolean> {
  const result = await fireSweetAlert({
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: "Cancel",
    focusConfirm: false
  });
  return result.isConfirmed;
}

export async function getResponseError(
  response: Response,
  fallbackMessage: string
): Promise<string> {
  const payload = (await response.json().catch(() => null)) as
    | { error?: string; message?: string }
    | null;

  if (payload?.error) return payload.error;
  if (payload?.message) return payload.message;
  return fallbackMessage;
}
