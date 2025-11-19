import axios, { AxiosError } from "axios";
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
	(error: AxiosError) => Promise.reject(error),
);

// Response interceptor for error handling
api.interceptors.response.use(
	(response) => response,
	(error: AxiosError) => {
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

// Extract error message from axios error
export function getErrorMessage(error: unknown): string {
	if (axios.isAxiosError(error)) {
		const responseData = error.response?.data as
			| { error?: string; message?: string }
			| undefined;
		return (
			responseData?.error ||
			responseData?.message ||
			error.message ||
			"An unexpected error occurred"
		);
	}
	if (error instanceof Error) {
		return error.message;
	}
	return "An unexpected error occurred";
}

// API helper functions with proper error handling
export const apiHelpers = {
	async get<T>(url: string): Promise<ApiResponse<T>> {
		try {
			const response = await api.get(url);
			return response.data;
		} catch (error) {
			throw new Error(getErrorMessage(error));
		}
	},

	async post<T>(
		url: string,
		data?: Record<string, unknown>,
	): Promise<ApiResponse<T>> {
		try {
			const response = await api.post(url, data);
			return response.data;
		} catch (error) {
			throw new Error(getErrorMessage(error));
		}
	},

	async put<T>(
		url: string,
		data?: Record<string, unknown>,
	): Promise<ApiResponse<T>> {
		try {
			const response = await api.put(url, data);
			return response.data;
		} catch (error) {
			throw new Error(getErrorMessage(error));
		}
	},

	async delete<T>(url: string): Promise<ApiResponse<T>> {
		try {
			const response = await api.delete(url);
			return response.data;
		} catch (error) {
			throw new Error(getErrorMessage(error));
		}
	},
};

