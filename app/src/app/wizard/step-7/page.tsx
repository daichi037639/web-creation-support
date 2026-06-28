import Link from 'next/link'
import { Button } from '@/components/ui/Button'

const steps = [
  {
    title: 'GitHubアカウントを作成する',
    body: 'github.com にアクセスし、「Sign up」からアカウントを作成してください。メールアドレスがあれば無料で登録できます。',
    url: 'https://github.com',
    urlLabel: 'GitHubへ',
  },
  {
    title: 'リポジトリ（保存場所）を作る',
    body: 'GitHubにログイン後、「New repository」をクリックし、リポジトリ名を入力して「Create repository」を押してください。',
    url: null,
    urlLabel: null,
  },
  {
    title: '生成したコードをアップロードする',
    body: '前のステップで「別タブで開く」→「ページのソースを保存」してindex.htmlを取得し、GitHubのリポジトリにドラッグ＆ドロップでアップロードしてください。',
    url: null,
    urlLabel: null,
  },
  {
    title: 'Vercelアカウントを作成する',
    body: 'vercel.com にアクセスし、「Sign Up」→「Continue with GitHub」でGitHubアカウントと連携して登録します。',
    url: 'https://vercel.com',
    urlLabel: 'Vercelへ',
  },
  {
    title: 'GitHubリポジトリをVercelに接続する',
    body: 'Vercelのダッシュボードで「Add New → Project」をクリックし、作成したGitHubリポジトリを選択して「Deploy」を押してください。',
    url: null,
    urlLabel: null,
  },
  {
    title: '公開URLを確認する',
    body: 'デプロイ完了後、「xxx.vercel.app」形式のURLが発行されます。これがあなたのサイトのアドレスです。',
    url: null,
    urlLabel: null,
  },
]

export default function Step7Page() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-medium uppercase tracking-widest text-green-600">STEP 7</p>
        <h1 className="text-2xl font-bold text-gray-900">サイトを公開する</h1>
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="font-semibold">なぜこのステップが必要か：</span>
          GitHubとVercelに自分のアカウントを作ることで、このサービスを使わなくなっても自分でサイトを管理できる状態になります。
        </p>
      </header>

      <ol className="flex flex-col gap-4">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
              {i + 1}
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-gray-900">{step.title}</p>
              <p className="text-sm text-gray-600">{step.body}</p>
              {step.url && (
                <a
                  href={step.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-xs font-medium text-green-700 underline"
                >
                  {step.urlLabel} →
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="rounded-2xl bg-green-50 p-6 text-center">
        <p className="text-lg font-bold text-green-800">🎉 おめでとうございます！</p>
        <p className="mt-1 text-sm text-green-700">
          これであなたのサイトが世界に公開されます。<br />
          困ったことがあれば、いつでもAIチャットに相談してください。
        </p>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Link href="/wizard/step-6">
          <Button variant="ghost">← 戻る</Button>
        </Link>
        <Link href="/">
          <Button variant="secondary">トップへ戻る</Button>
        </Link>
      </div>
    </div>
  )
}
