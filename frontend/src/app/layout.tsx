import type { Metadata, Viewport } from "next";
import "../styles/globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
	title: "TableSplit - Group Expenses, Poker Style",
	description:
		"Transform group expense tracking into an immersive poker-themed social experience",
	manifest: "/manifest.json",
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "TableSplit",
	},
	formatDetection: {
		telephone: false,
	},
};

export const viewport: Viewport = {
	themeColor: "#1a4d2e",
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className="font-sans" suppressHydrationWarning>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
