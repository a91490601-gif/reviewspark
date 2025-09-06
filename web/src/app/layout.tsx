import "./globals.css";

export const metadata = {
  title: "ReviewSpark",
  description: "reviewspark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
