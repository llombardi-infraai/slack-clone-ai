export const metadata = {
  title: 'Slack Clone',
  description: 'Simple Slack clone with AI',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white">{children}</body>
    </html>
  )
}
