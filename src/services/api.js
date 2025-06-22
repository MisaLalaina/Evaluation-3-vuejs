import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api/api/v1",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    // const token = localStorage.getItem('token');
    const token =
      "eyJraWQiOiJpZGVtcGllcmUiLCJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJTdXBlclVzZXIiLCJBRF9DbGllbnRfSUQiOjExLCJBRF9Vc2VyX0lEIjoxMDAsIkFEX1JvbGVfSUQiOjEwMiwiQURfT3JnX0lEIjowLCJBRF9MYW5ndWFnZSI6ImVuX1VTIiwiQURfU2Vzc2lvbl9JRCI6MTAwMDAxMywiaXNzIjoiaWRlbXBpZXJlLm9yZyIsImV4cCI6NjE3NTAzNTY5NzV9.hxfDmKlGxZxQMtNHJltu3VxYM8I8u6wuTrq8aplgXW1566JHxT5LLT0HEX13XEYsgrr_1eY5f4snQZhZopPElw";
    // console.log(`Token: ${token}`); // Debugging line to check token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          w;
          localStorage.removeItem("token");
          router.push("/");
          break;
        case 403:
          break;
        case 500:
          break;
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
