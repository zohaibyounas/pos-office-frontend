import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/products`; // adjust base URL if needed

export const getProducts = () => axios.get(API);
export const addProduct = (data) => axios.post(API, data);
export const getProductById = (id) => axios.get(`${API}/${id}`);
export const updateProduct = (id, data) => axios.put(`${API}/${id}`, data);
export const deleteProduct = (id) =>
  axios.delete(`${import.meta.env.VITE_API_URL}/products/${id}`);
