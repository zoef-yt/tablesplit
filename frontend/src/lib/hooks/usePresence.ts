import { useEffect, useState } from "react";
import {
	getSocket,
	requestOnlineUsers,
	requestUserActivities,
	emitUserActivity,
} from "@/lib/socket";

export interface UserActivity {
	userId: string;
	activity: string | null;
}

export function useOnlineUsers(groupId: string | undefined) {
	const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

	useEffect(() => {
		if (!groupId) return;

		const socket = getSocket();

		// Wait for socket connection before requesting
		if (socket.connected) {
			requestOnlineUsers(groupId);
		} else {
			// Request when socket connects
			const handleConnect = () => {
				console.log("🔌 Socket connected, requesting online users");
				requestOnlineUsers(groupId);
			};
			socket.once("connect", handleConnect);
		}

		// Listen for online users updates
		const handleOnlineUsers = ({ onlineUsers }: { onlineUsers: string[] }) => {
			console.log("👥 Received online users:", onlineUsers);
			setOnlineUsers(onlineUsers);
		};

		socket.on("users:online", handleOnlineUsers);

		return () => {
			socket.off("users:online", handleOnlineUsers);
		};
	}, [groupId]);

	return onlineUsers;
}

export function useUserActivities(groupId: string | undefined) {
	const [activities, setActivities] = useState<Record<string, string>>({});

	useEffect(() => {
		if (!groupId) return;

		const socket = getSocket();

		// Wait for socket connection before requesting
		if (socket.connected) {
			requestUserActivities(groupId);
		} else {
			// Request when socket connects
			const handleConnect = () => {
				console.log("🔌 Socket connected, requesting user activities");
				requestUserActivities(groupId);
			};
			socket.once("connect", handleConnect);
		}

		// Listen for activities updates
		const handleActivities = ({
			activities,
		}: {
			activities: Record<string, string>;
		}) => {
			console.log("🎯 Received all activities:", activities);
			setActivities(activities);
		};

		const handleUserActivity = ({
			userId,
			activity,
		}: {
			userId: string;
			activity: string | null;
		}) => {
			console.log("🎯 Received activity update:", userId, activity);
			setActivities((prev) => {
				if (activity === null) {
					const { [userId]: _, ...rest } = prev;
					return rest;
				}
				return { ...prev, [userId]: activity };
			});
		};

		socket.on("users:activities", handleActivities);
		socket.on("user:activity", handleUserActivity);

		return () => {
			socket.off("users:activities", handleActivities);
			socket.off("user:activity", handleUserActivity);
		};
	}, [groupId]);

	const setUserActivity = (activity: string | null) => {
		if (groupId) {
			emitUserActivity(groupId, activity);
		}
	};

	return { activities, setUserActivity };
}

export function usePresence(groupId: string | undefined) {
	const onlineUsers = useOnlineUsers(groupId);
	const { activities, setUserActivity } = useUserActivities(groupId);

	return {
		onlineUsers,
		activities,
		setUserActivity,
		isUserOnline: (userId: string) => onlineUsers.includes(userId),
		getUserActivity: (userId: string) => activities[userId] || null,
	};
}
