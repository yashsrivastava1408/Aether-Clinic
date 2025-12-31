// client/tailwind.config.js
export default {
  // (content is optional in v4 when using @source, but it's fine to keep)
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  safelist: [
    // text colors you use
    "text-red-500","text-blue-500","text-cyan-500","text-green-500","text-gray-500",
    // bg colors you use
    "bg-red-500","bg-blue-500","bg-cyan-500","bg-green-500","bg-gray-500",
    // hover borders you use
    "hover:border-red-500","hover:border-blue-500","hover:border-cyan-500","hover:border-green-500","hover:border-gray-500",
  ],
  theme: { extend: {} },
  plugins: [],
};