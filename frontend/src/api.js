import axios from "axios";

const api = axios.create({
  baseURL: "https://stock-market-z5gd.onrender.com/api",
});

export default api;