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

		// Connection event handlers
		socket.on("connect", () => {
			console.log("✅ Socket connected:", socket!.id);
		});

		socket.on("disconnect", () => {
			console.log("❌ Socket disconnected");
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
		console.log("📍 Joining group:", groupId);
		socket.emit("group:join", groupId);
	} else {
		console.warn("⚠️ Cannot join group - socket not connected");
	}
};

export const leaveGroup = (groupId: string): void => {
	const socket = getSocket();
	if (socket.connected) {
		console.log("📍 Leaving group:", groupId);
		socket.emit("group:leave", groupId);
	}
};

export const emitUserActivity = (groupId: string, activity: string | null): void => {
	const socket = getSocket();
	if (socket.connected) {
		console.log("🎯 Emitting activity:", activity, "for group:", groupId);
		socket.emit("user:activity", { groupId, activity });
	} else {
		console.warn("⚠️ Socket not connected yet, waiting to emit activity:", activity);
		// Wait for socket to connect, then emit
		socket.once("connect", () => {
			console.log("🎯 Socket connected, now emitting activity:", activity);
			socket.emit("user:activity", { groupId, activity });
		});
	}
};

export const requestOnlineUsers = (groupId: string): void => {
	const socket = getSocket();
	if (socket.connected) {
		console.log("👥 Requesting online users for group:", groupId);
		socket.emit("users:get-online", { groupId });
	} else {
		console.warn("⚠️ Cannot request online users - socket not connected");
	}
};

export const requestUserActivities = (groupId: string): void => {
	const socket = getSocket();
	if (socket.connected) {
		console.log("🎯 Requesting user activities for group:", groupId);
		socket.emit("users:get-activities", { groupId });
	} else {
		console.warn("⚠️ Cannot request activities - socket not connected");
	}
};
