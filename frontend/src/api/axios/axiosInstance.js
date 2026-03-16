
import axios from "axios";

export const projectServices = axios.create({
  baseURL: "http://72.61.236.154:4132",
});

projectServices.interceptors.request.use(
  (config) => {
 
    const adminToken = localStorage.getItem("accessToken");
    const extractedToken = adminToken
      ? JSON.parse(adminToken).accessToken
      : null;

    if (extractedToken) {

      config.headers.Authorization = `Bearer ${extractedToken}`;
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
