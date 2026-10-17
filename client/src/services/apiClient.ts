import axios from 'axios';

// Create central axios instance
export const apiClient = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
});

// Response interceptor for error handling / unauthorized redirects
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Optionally handle 401 Unauthorized globally if needed
    return Promise.reject(error);
  }
);

export default apiClient;
