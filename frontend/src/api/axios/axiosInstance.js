
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
        localStorage.removeItem("accessToken");
      } else {
        console.log("Error:", error.response.data);
      }
    } else {
      console.log("Error:", error.message);
   
    }
    return Promise.reject(error);
  }
);
