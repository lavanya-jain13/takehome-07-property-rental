const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3000/api";

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function api<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { body, headers, ...rest } = options;

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...rest,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body:
        body !== undefined
          ? JSON.stringify(body)
          : undefined,
    }
  );

  let data: unknown = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(
      typeof data === "object" &&
        data !== null &&
        "message" in data
        ? String(data.message)
        : `Request failed with status ${response.status}`
    );

    Object.assign(error, {
      status: response.status,
      data,
    });

    throw error;
  }

  return data as T;
}