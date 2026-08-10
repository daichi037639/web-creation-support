import { STEPS } from '@/types/wizard'
import { StartOrResume } from '@/components/StartOrResume'
import { LogoIcon, STEP_ICONS } from '@/components/ui/icons'

const wizardSteps = STEPS.filter((s) => s.id > 0)

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* ダークヒーロー（Suno / Kling のトーン）。作業画面はライトで統一する */}
      <section className="bg-night text-white">
        <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2">
            <LogoIcon size={26} className="text-accent-400" />
            <span className="text-sm font-semibold tracking-wide">Webサイト制作支援</span>
          </div>
          <a
            href="#steps"
            className="rounded-full border border-white/25 px-4 py-1.5 text-xs text-white/80 transition-colors hover:border-white/50 hover:text-white"
          >
            進め方を見る
          </a>
        </header>

        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 px-5 pt-16 pb-20 text-center">
          <p className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs text-white/70">
            AIがとなりで伴走する、はじめてのサイトづくり
          </p>
          <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
            あなたの商売の魅力を、
            <br className="hidden sm:block" />
            Webで伝わるかたちに。
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-white/60">
            良い商品や想いを持っているのに、まだWebで伝えられていない方へ。
            AIが隣で一緒に考えながら、計画から公開まであなたのサイトを完成に導きます。
          </p>

          {/* Suno の入力カードを模した開始パネル */}
          <div className="w-full max-w-xl rounded-2xl border border-night-line bg-night-card p-6 shadow-2xl shadow-black/40">
            <p className="mb-5 text-sm text-white/45">
              むずかしい準備はいりません。AIの質問に答えていくだけで進みます。
            </p>
            <StartOrResume />
          </div>
        </div>
      </section>

      {/* Genius 風のライトセクション：ラベルピル + 枠線カード */}
      <section id="steps" className="bg-canvas">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-10 px-5 py-16">
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="rounded-full border border-line bg-surface px-4 py-1.5 text-xs font-semibold text-accent-700">
              進め方
            </p>
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">
              全7ステップで、計画から公開まで
            </h2>
            <p className="max-w-lg text-sm leading-relaxed text-muted">
              順番どおりでなくても大丈夫。入力は自動で保存され、いつでも続きから再開できます。
            </p>
          </div>

          <ol className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wizardSteps.map((step) => {
              const Icon = STEP_ICONS[step.id]
              return (
                <li
                  key={step.id}
                  className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line-soft bg-canvas text-sub">
                      {Icon && <Icon size={20} />}
                    </span>
                    <span className="text-xs font-semibold tracking-widest text-accent-700">
                      STEP {step.id}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{step.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{step.description}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      <footer className="border-t border-line bg-surface py-6 text-center text-xs text-muted">
        Webサイト制作支援 — AIと一緒に、想いが伝わるサイトへ
      </footer>
    </main>
  )
}
