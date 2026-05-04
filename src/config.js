const API_URL = "https://api-gestor-financeiro.onrender.com/api";

//const LOCAL_API_URL = "http://localhost:3000/api";

export default API_URL;

export async function apiFetch(url, options = {}) {
    const token = localStorage.getItem("token");

    return fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    },
  });
}