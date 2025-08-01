import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "在线学习与作业管理平台",
  description: "在线作业提交、批改和毕业资格审核平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}