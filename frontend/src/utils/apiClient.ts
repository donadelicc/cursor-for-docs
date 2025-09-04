import { getAuth } from "firebase/auth";

/**
 * A wrapper for the Fetch API that automatically adds the
 * Firebase Auth token to the request headers.
 */
const apiClient = {
  /**
   * Performs an authenticated POST request.
   * @param endpoint The API endpoint to call (e.g., '/documents').
   * @param body The request body (e.g., FormData).
   * @returns The raw fetch Response object.
   */
  post: async (endpoint: string, body: BodyInit | null): Promise<Response> => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error("Authentication Error: User is not signed in.");
    }

    // 1. Get the secure ID token from Firebase.
    const token = await user.getIdToken();

    // 2. Make the request with the 'Authorization' header.
    const baseUrl = "http://localhost:8000";
    const url = endpoint.startsWith("/")
      ? `${baseUrl}${endpoint}`
      : `${baseUrl}/${endpoint}`;
    const start = performance.now();
    console.log(
      `[api] POST ${url} → sending`,
      body instanceof FormData
        ? { formDataKeys: Array.from((body as FormData).keys()) }
        : body,
    );
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: body,
    });
    const durationMs = Math.round(performance.now() - start);
    console.log(`[api] POST ${url} ← ${response.status} in ${durationMs}ms`);

    if (!response.ok) {
      // Attempt to parse error details from the backend for better debugging.
      const errorData = await response
        .json()
        .catch(() => ({ detail: "An unknown API error occurred." }));
      throw new Error(
        errorData.detail || `HTTP error! Status: ${response.status}`,
      );
    }

    return response;
  },

  delete: async (endpoint: string): Promise<Response> => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error("Authentication Error: User is not signed in.");
    }

    const token = await user.getIdToken();

    const baseUrl = "http://localhost:8000";
    const url = endpoint.startsWith("/")
      ? `${baseUrl}${endpoint}`
      : `${baseUrl}/${endpoint}`;
    const start = performance.now();
    console.log(`[api] DELETE ${url} → sending`);
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const durationMs = Math.round(performance.now() - start);
    console.log(`[api] DELETE ${url} ← ${response.status} in ${durationMs}ms`);

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ detail: "An unknown API error occurred." }));
      throw new Error(
        errorData.detail || `HTTP error! Status: ${response.status}`,
      );
    }

    return response;
  },
};

export default apiClient;
