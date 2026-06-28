import Link from 'next/link'
import { STEPS } from '@/types/wizard'
import { Button } from '@/components/ui/Button'

const wizardSteps = STEPS.filter((s) => s.id > 0)

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-10 px-4 py-16">
      <header className="flex flex-col items-center gap-4 text-center">
        <div className="text-4xl">🌿</div>
        <h1 className="text-3xl font-bold text-gray-900">Webサイト制作支援</h1>
        <p className="max-w-md text-base text-gray-600">
          良い商品や想いを持っているのに、まだWebで伝えられていない方へ。
          <br />
          AIが隣で一緒に考えながら、あなたのサイトを完成まで導きます。
        </p>
      </header>

      <section className="w-full rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-green-600">
          進め方（全7ステップ）
        </h2>
        <ol className="flex flex-col gap-3">
          {wizardSteps.map((step) => (
            <li key={step.id} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                {step.id}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900">{step.title}</p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-col items-center gap-3">
        <Link href="/wizard/step-1">
          <Button className="px-10 py-3 text-base">はじめる →</Button>
        </Link>
        <p className="text-xs text-gray-400">途中で離れても、続きから再開できます</p>
      </div>
    </main>
  )
}
