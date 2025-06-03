/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.pollinations.ai',
        port: '', // 留空表示任何端口
        pathname: '/**', // 允许此主机下的任何路径
      },
    ],
  },
};

export default nextConfig;
