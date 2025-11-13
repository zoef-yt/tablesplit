import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/authStore";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
	if (!socket) {
		socket = io(SOCKET_URL, {
			autoConnect: false,
			withCredentials: true,
			auth: (cb) => {
				const token = useAuthStore.getState().token;
				cb({ token });
			},
		});

		// Reconnect logic with updated token
		socket.on("connect_error", (error) => {
			console.error("Socket connection error:", error.message);
			// Try to reconnect with fresh token
			const token = useAuthStore.getState().token;
			if (token) {
				socket!.auth = { token };
			}
		});
	}
	return socket;
};

export const connectSocket = (): Socket => {
	const socket = getSocket();
	const token = useAuthStore.getState().token;

	// Only connect if we have a valid token
	if (token && !socket.connected) {
		socket.auth = { token };  // Update token before connecting
		socket.connect();
	}
	return socket;
};

export const disconnectSocket = (): void => {
	if (socket?.connected) {
		socket.disconnect();
	}
};

export const joinGroup = (groupId: string): void => {
	const socket = getSocket();
	if (socket.connected) {
		socket.emit("group:join", groupId);
	}
};

export const leaveGroup = (groupId: string): void => {
	const socket = getSocket();
	if (socket.connected) {
		socket.emit("group:leave", groupId);
	}
};

export const emitUserActivity = (groupId: string, activity: string | null): void => {
	const socket = getSocket();
	if (socket.connected) {
		socket.emit("user:activity", { groupId, activity });
	}
};

export const requestOnlineUsers = (groupId: string): void => {
	const socket = getSocket();
	if (socket.connected) {
		socket.emit("users:get-online", { groupId });
	}
};

export const requestUserActivities = (groupId: string): void => {
	const socket = getSocket();
	if (socket.connected) {
		socket.emit("users:get-activities", { groupId });
	}
};
