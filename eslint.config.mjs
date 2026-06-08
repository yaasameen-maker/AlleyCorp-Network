import nextConfig from "eslint-config-next";
import prettierConfig from "eslint-config-prettier";

const config = [
  ...nextConfig,
  prettierConfig,
  {
    ignores: ["node_modules/**", ".next/**", "*.tsbuildinfo", "stories/**"],
  },
];

export default config;
