import './globals.css';

export const metadata = {
  title: 'BendyRoom',
  description: 'BendyRoom - Band Practice Setlist',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body style={{ margin: 0, backgroundColor: '#0d1310' }}>
        {children}
      </body>
    </html>
  );
}