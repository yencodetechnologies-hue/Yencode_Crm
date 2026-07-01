
import axios from "axios";

export const projectServices = axios.create({
  // Prefer env-configured baseURL; default to same-origin proxy path for Vercel rewrites.
  baseURL: import.meta.env.VITE_BASE_URL || "/api",
});

projectServices.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.log("Error in Axios interceptor request", error);
    return Promise.reject(error);
  }
);

projectServices.interceptors.response.use(
  (response) => {

    return response;
  },
  (error) => {
    if (error.response) {
      console.log("Error in Axios interceptor response", error);
      const { status } = error.response;
      if (status === 401) {
        // Only clear token when server rejects it; optional-auth APIs still work without one
        const hadToken = !!localStorage.getItem("accessToken");
        localStorage.removeItem("accessToken");
        if (hadToken && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      } else {
        console.log("Error:", error.response.data);
      }
    } else {
      console.log("Error:", error.message);
   
    }
    return Promise.reject(error);
  }
);
