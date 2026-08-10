import { SVGProps } from 'react'

/*
  自作の線画アイコン集（Genius テンプレートの小さな stroke アイコンに合わせたトーン）。
  ライブラリを増やさない方針のため lucide 等は使わず必要な分だけ定義する。
  色は currentColor を継承する。
*/

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Base({ size = 20, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

/** ロゴマーク。夜空に向かう矢印＝「一歩を踏み出す」 */
export function LogoIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 15.5 15.5 8.5M9.5 8.5h6v6" />
    </Base>
  )
}

/** STEP 1 事業・商品 */
export function StoreIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 10.5V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8.5" />
      <path d="M3.5 6 5 4h14l1.5 2a2.5 2.5 0 0 1-5 .5 2.6 2.6 0 0 1-5 0 2.5 2.5 0 0 1-5-.5Z" />
      <path d="M9.5 20v-5h5v5" />
    </Base>
  )
}

/** STEP 2 ターゲット */
export function TargetIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
    </Base>
  )
}

/** STEP 3 メッセージ */
export function MessageIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-4.6 3.4A.6.6 0 0 1 5.5 20v-3H6a2 2 0 0 1-2-2Z" />
      <path d="M8.5 9.5h7M8.5 12.5h4" />
    </Base>
  )
}

/** STEP 4 サイト構成 */
export function LayoutIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 9.5h16M10 9.5V20" />
    </Base>
  )
}

/** STEP 5 コンテンツ */
export function PhotoTextIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <circle cx="9" cy="9.5" r="1.5" />
      <path d="m4 17 4.5-4.5 3.5 3.5 2.5-2.5L20 19" />
    </Base>
  )
}

/** STEP 6 サイト生成（AI） */
export function SparkIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18l-1.8-5.4L4.5 10.8 10.2 9Z" />
      <path d="M18.5 15.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9Z" />
    </Base>
  )
}

/** STEP 7 公開 */
export function RocketIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 15c5-4 6.5-8.5 6.5-11.5C15.5 3.5 11 5 7 10l-3 1 4 1" />
      <path d="M9 15l1 4 1-3" />
      <path d="M5.5 16.5c-1.2 1.2-1.7 3-1.9 3.9 1-.2 2.7-.7 3.9-1.9" />
      <circle cx="13.5" cy="8.5" r="1.3" />
    </Base>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Base>
  )
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4.5 12h15M13.5 6l6 6-6 6" />
    </Base>
  )
}

export function ChatIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M21 12a8.5 8.5 0 0 1-12.4 7.5L4 21l1.5-4.6A8.5 8.5 0 1 1 21 12Z" />
    </Base>
  )
}

/** AI音声インタビュー：マイク */
export function MicIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="9" y="3.5" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
      <path d="M12 18v2.5" />
    </Base>
  )
}

/** AI音声インタビュー：マイクオフ */
export function MicOffIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 9v2.5a3 3 0 0 0 5.1 2.1M15 11V6.5a3 3 0 0 0-5.6-1.5" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 10.6 5M18.5 11.5c0 1-.2 2-.7 2.9" />
      <path d="M12 18v2.5" />
      <path d="m4.5 4.5 15 15" />
    </Base>
  )
}

/** ステップ id → アイコンの対応。STEPS(types/wizard.ts) と番号を合わせる */
export const STEP_ICONS: Record<number, (props: IconProps) => React.JSX.Element> = {
  1: StoreIcon,
  2: TargetIcon,
  3: MessageIcon,
  4: LayoutIcon,
  5: PhotoTextIcon,
  6: SparkIcon,
  7: RocketIcon,
}
