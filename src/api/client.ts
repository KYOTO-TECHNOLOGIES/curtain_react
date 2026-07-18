import axios from 'axios';

// The base URL points directly to the backend IP you provided
export const api = axios.create({
  baseURL: 'http://187.127.171.93:8110/api/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptors for token handling or error handling if needed
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // You can handle global errors here (e.g. showing the Lottie Network Error component)
    return Promise.reject(error);
  }
);
