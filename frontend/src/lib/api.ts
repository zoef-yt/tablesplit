import axios from "axios";
import type { ApiResponse } from "@/types";
import { useAuthStore } from "@/stores/authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const api = axios.create({
	baseURL: `${API_URL}/api`,
	headers: {
		"Content-Type": "application/json",
	},
	withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
	(config) => {
		// Get token from Zustand store
		const token = useAuthStore.getState().token;
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error),
);

// Response interceptor for error handling
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			// Token expired or invalid - logout user
			useAuthStore.getState().logout();
			if (typeof window !== "undefined") {
				window.location.href = "/auth/login";
			}
		}
		return Promise.reject(error);
	},
);

// API helper functions
export const apiHelpers = {
	async get<T>(url: string): Promise<ApiResponse<T>> {
		const response = await api.get(url);
		return response.data;
	},

	async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
		const response = await api.post(url, data);
		return response.data;
	},

	async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
		const response = await api.put(url, data);
		return response.data;
	},

	async delete<T>(url: string): Promise<ApiResponse<T>> {
		const response = await api.delete(url);
		return response.data;
	},
};
