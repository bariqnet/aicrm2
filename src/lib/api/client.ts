const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) }
  });
  if (!res.ok) throw new Error(`API Error ${res.status}`);
  return res.json() as Promise<T>;
}
