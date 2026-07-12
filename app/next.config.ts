import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // playwright はバンドルせず Node.js の require で読み込む（スクリーンショット取得用）
  serverExternalPackages: ["playwright"],
};

export default nextConfig;
