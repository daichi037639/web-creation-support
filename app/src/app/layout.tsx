import type { Metadata } from 'next'
import { Geist, Noto_Sans_JP } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
// 日本語グリフは unicode-range で必要分だけ読み込まれるため subsets は latin で足りる
const notoSansJP = Noto_Sans_JP({ subsets: ['latin'], variable: '--font-noto-sans-jp' })

export const metadata: Metadata = {
  title: 'Webサイト制作支援',
  description: '初心者でも一歩を踏み出せる、Webサイト制作の伴走サービス',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${geist.variable} ${notoSansJP.variable} h-full antialiased`}>
      <body className="min-h-full bg-canvas font-sans">{children}</body>
    </html>
  )
}
