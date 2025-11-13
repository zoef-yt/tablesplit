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

		// Request initial online users
		requestOnlineUsers(groupId);

		// Listen for online users updates
		const handleOnlineUsers = ({ onlineUsers }: { onlineUsers: string[] }) => {
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

		// Request initial activities
		requestUserActivities(groupId);

		// Listen for activities updates
		const handleActivities = ({
			activities,
		}: {
			activities: Record<string, string>;
		}) => {
			setActivities(activities);
		};

		const handleUserActivity = ({
			userId,
			activity,
		}: {
			userId: string;
			activity: string | null;
		}) => {
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
