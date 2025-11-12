import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
	if (!socket) {
		socket = io(SOCKET_URL, {
			autoConnect: false,
			withCredentials: true,
			auth: (cb) => {
				const token = localStorage.getItem("token");
				cb({ token });
			},
		});
	}
	return socket;
};

export const connectSocket = (): Socket => {
	const socket = getSocket();
	if (!socket.connected) {
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
	socket.emit("group:join", groupId);
};

export const leaveGroup = (groupId: string): void => {
	const socket = getSocket();
	socket.emit("group:leave", groupId);
};
