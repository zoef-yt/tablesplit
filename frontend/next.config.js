/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	images: {
		domains: ["localhost"],
	},
	output: "standalone",
	outputFileTracingRoot: require("path").join(__dirname, "../"),
};

module.exports = nextConfig;
