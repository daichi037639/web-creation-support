// Component Library のカタログ（単一情報源）。
// ここから AI 向け JSON Schema（schema.ts）、props validation、Showcase の
// サンプル props がすべて派生する。React 実装は components/site/ 側にあり、
// このファイルは server / test から安全に import できる pure なデータのみ持つ

export type ScalarFieldKind = 'string' | 'text' | 'enum' | 'image' | 'cta'

export interface ScalarFieldSpec {
  kind: ScalarFieldKind
  required?: boolean
  desc: string
  /** kind: 'enum' のみ */
  values?: string[]
}

export interface ItemsFieldSpec {
  kind: 'items'
  required?: boolean
  desc: string
  max: number
  item: Record<string, ScalarFieldSpec>
}

export type FieldSpec = ScalarFieldSpec | ItemsFieldSpec

export type ComponentCategory =
  | 'header'
  | 'hero'
  | 'story'
  | 'features'
  | 'products'
  | 'gallery'
  | 'testimonials'
  | 'faq'
  | 'cta'
  | 'access'
  | 'contact'
  | 'footer'

export interface ComponentDef {
  component: string
  category: ComponentCategory
  /** AIに渡す「いつ使うか」の説明 */
  use: string
  fields: Record<string, FieldSpec>
  /** Renderer がページ構成から自動注入する props（AIには生成させない） */
  injects?: ('nav' | 'siteName')[]
  /** Showcase・フォールバックで使うサンプル props */
  defaults: Record<string, unknown>
}

export const ICON_VALUES = [
  'leaf', 'star', 'heart', 'shield', 'clock', 'gem', 'users', 'flame',
] as const

const eyebrow: FieldSpec = {
  kind: 'string',
  desc: '見出し上の小さなラベル（例：私たちのこだわり）。10文字以内',
}
const image = (desc: string, required = false): FieldSpec => ({ kind: 'image', desc, required })
const cta = (desc: string, required = false): FieldSpec => ({ kind: 'cta', desc, required })

const SAMPLE_IMG = (ratio: '1/1' | '4/3' | '3/2' | '16/9' | '3/4', intent: string) => ({
  type: 'placeholder',
  aspectRatio: ratio,
  intent,
})

const SAMPLE_NAV = [
  { label: 'ホーム', href: '/home' },
  { label: '商品紹介', href: '/products' },
  { label: '私たちについて', href: '/about' },
  { label: 'アクセス', href: '/access' },
]

export const COMPONENT_CATALOG: ComponentDef[] = [
  // ───────────────────────── Header
  {
    component: 'HeaderSimple',
    category: 'header',
    use: '標準的なヘッダー。左にサイト名、右にナビゲーション。ほとんどのサイトに合う',
    fields: {
      siteName: { kind: 'string', required: true, desc: 'サイト名・屋号' },
      tagline: { kind: 'string', desc: 'サイト名の横に添える一言（例：創業七十年の茶舗）' },
    },
    injects: ['nav'],
    defaults: { siteName: '喜多の園', tagline: '創業七十年の茶舗', nav: SAMPLE_NAV },
  },
  {
    component: 'HeaderCentered',
    category: 'header',
    use: '中央揃えの上品なヘッダー。老舗・格式を重視するサイト向け',
    fields: {
      siteName: { kind: 'string', required: true, desc: 'サイト名・屋号' },
      tagline: { kind: 'string', desc: 'サイト名の上に置く一言' },
    },
    injects: ['nav'],
    defaults: { siteName: '御料理 ふる川', tagline: '桐生 会席料理', nav: SAMPLE_NAV },
  },
  // ───────────────────────── Hero
  {
    component: 'HeroCentered',
    category: 'hero',
    use: '中央揃えの文字主体ヒーロー。メッセージを主役にしたいとき。写真が無くても成立する',
    fields: {
      eyebrow,
      title: { kind: 'string', required: true, desc: 'キャッチコピー。25文字以内で情緒的に' },
      description: { kind: 'text', desc: 'コピーを補足する2〜3文' },
      primaryCta: cta('主要ボタン'),
      secondaryCta: cta('補助ボタン'),
    },
    defaults: {
      eyebrow: '群馬・桐生',
      title: '三代続く茶畑から、まっすぐ食卓へ',
      description:
        '農薬を使わず、手間ひまかけて育てた緑茶とほうじ茶。摘みたての香りをそのままお届けします。',
      primaryCta: { label: '商品を見る', href: '/products' },
      secondaryCta: { label: '私たちについて', href: '/about' },
    },
  },
  {
    component: 'HeroSplit',
    category: 'hero',
    use: '左右分割ヒーロー。コピーと写真を対等に見せる。写真が1枚でもあるときの第一候補',
    fields: {
      eyebrow,
      title: { kind: 'string', required: true, desc: 'キャッチコピー。25文字以内' },
      description: { kind: 'text', desc: '補足の2〜3文' },
      primaryCta: cta('主要ボタン'),
      secondaryCta: cta('補助ボタン'),
      image: image('メイン写真。3/2 か 4/3 推奨', true),
      imagePosition: { kind: 'enum', values: ['left', 'right'], desc: '写真の位置' },
    },
    defaults: {
      eyebrow: '手打ちの味',
      title: '毎朝打つ麺と、地元野菜の出汁',
      description: '桐生名物ひもかわうどんを、自家製麺で。家族でゆっくり過ごせる店内です。',
      primaryCta: { label: 'メニューを見る', href: '/menu' },
      image: SAMPLE_IMG('3/2', '湯気の立つひもかわうどんの写真'),
      imagePosition: 'right',
    },
  },
  {
    component: 'HeroFullBleed',
    category: 'hero',
    use: '写真全面のヒーロー。雰囲気の良い写真があるとき最も印象的。旅館・飲食・工房向け',
    fields: {
      eyebrow,
      title: { kind: 'string', required: true, desc: 'キャッチコピー。20文字以内' },
      description: { kind: 'text', desc: '補足の1〜2文' },
      primaryCta: cta('主要ボタン'),
      image: image('背景写真。16/9 推奨', true),
    },
    defaults: {
      eyebrow: '山あいの一軒宿',
      title: '静けさに、湯けむり',
      description: '渓流のせせらぎを聞きながら、源泉かけ流しの湯をお楽しみください。',
      primaryCta: { label: 'ご予約はこちら', href: '#contact' },
      image: SAMPLE_IMG('16/9', '夕暮れの露天風呂と山の風景'),
    },
  },
  {
    component: 'HeroMinimal',
    category: 'hero',
    use: '余白と文字だけの静かなヒーロー。士業・高級ブランドなど、落ち着きを最優先するとき',
    fields: {
      title: { kind: 'string', required: true, desc: 'キャッチコピー。20文字以内' },
      description: { kind: 'text', desc: '補足の1〜2文' },
    },
    defaults: {
      title: '相続の不安を、確かな安心に',
      description: '桐生で三十年。地域の暮らしに寄り添う司法書士事務所です。',
    },
  },
  // ───────────────────────── Story / About
  {
    component: 'StoryImageLeft',
    category: 'story',
    use: '写真左・文章右の紹介セクション。歴史・こだわり・人物紹介に',
    fields: {
      eyebrow,
      title: { kind: 'string', required: true, desc: 'セクション見出し' },
      body: { kind: 'text', required: true, desc: '本文。3〜5文で具体的に' },
      image: image('雰囲気の伝わる写真。3/4 か 4/3'),
      cta: cta('詳細ページへのリンク'),
    },
    defaults: {
      eyebrow: '私たちのこと',
      title: '祖父の代から、変わらない製法で',
      body: '昭和三十年、祖父がこの地に小さな茶工場を建てました。以来、蒸し・揉み・乾燥まで一貫して自家工場で行っています。効率よりも香りを。その想いだけは、三代目の今も変わりません。',
      image: SAMPLE_IMG('3/4', '茶葉を手で確かめる職人の手元'),
    },
  },
  {
    component: 'StoryImageRight',
    category: 'story',
    use: '写真右・文章左の紹介セクション。StoryImageLeft と交互に使うとリズムが出る',
    fields: {
      eyebrow,
      title: { kind: 'string', required: true, desc: 'セクション見出し' },
      body: { kind: 'text', required: true, desc: '本文。3〜5文で具体的に' },
      image: image('雰囲気の伝わる写真。3/4 か 4/3'),
      cta: cta('詳細ページへのリンク'),
    },
    defaults: {
      eyebrow: '土づくり',
      title: '農薬に頼らない、待つ農業',
      body: '虫がつけば手で取り、草が伸びれば手で刈る。遠回りに見えても、土の力を信じて待つことが、いちばんの近道だと考えています。',
      image: SAMPLE_IMG('3/4', '朝日の差す茶畑の風景'),
    },
  },
  {
    component: 'StoryEditorial',
    category: 'story',
    use: '写真を使わない読み物風セクション。理念・ご挨拶など、言葉でじっくり伝えたいとき',
    fields: {
      eyebrow,
      title: { kind: 'string', required: true, desc: 'セクション見出し' },
      lead: { kind: 'text', required: true, desc: '導入の1〜2文。少し大きく表示される' },
      body: { kind: 'text', required: true, desc: '本文。4〜6文' },
      quote: { kind: 'string', desc: '引用風に大きく見せる一言' },
    },
    defaults: {
      eyebrow: 'ご挨拶',
      title: '暮らしの節目に、そっと寄り添う',
      lead: '相続、登記、遺言。人生の節目には、慣れない手続きがつきものです。',
      body: '私たちは、専門用語をできるだけ使わず、お客さまの言葉で説明することを大切にしています。どんな小さな不安でも、まずはお聞かせください。最初のご相談は無料です。',
      quote: 'わからないまま、進めない。',
    },
  },
  // ───────────────────────── Features / Strengths
  {
    component: 'FeatureCards',
    category: 'features',
    use: '強み・特徴をカードで並べる。3つがもっとも美しい。アイコン付き',
    fields: {
      eyebrow,
      title: { kind: 'string', required: true, desc: 'セクション見出し' },
      description: { kind: 'text', desc: '補足の1〜2文' },
      items: {
        kind: 'items',
        required: true,
        desc: '強みのリスト。3個推奨、最大6個',
        max: 6,
        item: {
          icon: { kind: 'enum', values: [...ICON_VALUES], desc: 'アイコン', required: true },
          title: { kind: 'string', required: true, desc: '強みの名前。10文字前後' },
          description: { kind: 'text', required: true, desc: '説明。2文程度' },
        },
      },
    },
    defaults: {
      eyebrow: '選ばれる理由',
      title: '三つのこだわり',
      items: [
        { icon: 'leaf', title: '無農薬栽培', description: '農薬を使わず、土の力で育てています。お子さまにも安心して。' },
        { icon: 'flame', title: '自家焙煎', description: '注文をいただいてから焙じる、香り高いほうじ茶。' },
        { icon: 'heart', title: '産地直送', description: '摘みたてを最短翌日にお届け。鮮度が違います。' },
      ],
    },
  },
  {
    component: 'FeatureList',
    category: 'features',
    use: '番号付きの縦リストで強みや流れを見せる。サービスの手順・ご利用の流れにも使える',
    fields: {
      eyebrow,
      title: { kind: 'string', required: true, desc: 'セクション見出し' },
      items: {
        kind: 'items',
        required: true,
        desc: '項目。3〜5個',
        max: 5,
        item: {
          title: { kind: 'string', required: true, desc: '項目名' },
          description: { kind: 'text', required: true, desc: '説明。2文程度' },
        },
      },
    },
    defaults: {
      eyebrow: 'ご相談の流れ',
      title: 'はじめてでも、この順番で',
      items: [
        { title: 'お電話・メールでご連絡', description: 'まずはお気軽にご連絡ください。初回相談は無料です。' },
        { title: '面談・お見積もり', description: '状況を伺い、必要な手続きと費用を明確にご説明します。' },
        { title: '手続きの実行', description: '書類の作成から申請まで、責任を持って代行します。' },
      ],
    },
  },
  // ───────────────────────── Products / Services
  {
    component: 'ProductGrid',
    category: 'products',
    use: '商品・サービスをカードのグリッドで一覧。3の倍数が美しい',
    fields: {
      eyebrow,
      title: { kind: 'string', required: true, desc: 'セクション見出し' },
      description: { kind: 'text', desc: '補足の1〜2文' },
      items: {
        kind: 'items',
        required: true,
        desc: '商品リスト。3〜6個',
        max: 6,
        item: {
          image: { kind: 'image', desc: '商品写真。1/1 か 4/3', required: true },
          name: { kind: 'string', required: true, desc: '商品名' },
          price: { kind: 'string', desc: '価格（例：1,080円〜）' },
          description: { kind: 'text', desc: '短い説明。1〜2文' },
        },
      },
    },
    defaults: {
      eyebrow: 'お品書き',
      title: '定番の三品',
      items: [
        { image: SAMPLE_IMG('1/1', '緑茶の茶葉と湯呑み'), name: '特上煎茶', price: '1,620円', description: '一番茶のみを使った、当園いちばんの看板商品。' },
        { image: SAMPLE_IMG('1/1', '焙じたての茶色いほうじ茶'), name: '自家焙煎ほうじ茶', price: '980円', description: '香ばしさが立つ浅煎り。食後の一杯に。' },
        { image: SAMPLE_IMG('1/1', 'ギフト用の茶筒と包装'), name: '贈答用詰め合わせ', price: '3,240円〜', description: '大切な方への贈り物に。熨斗も承ります。' },
      ],
    },
  },
  {
    component: 'ProductShowcase',
    category: 'products',
    use: '商品を1つずつ大きく紹介する交互レイアウト。商品数が少なく、深く語りたいとき',
    fields: {
      eyebrow,
      title: { kind: 'string', required: true, desc: 'セクション見出し' },
      items: {
        kind: 'items',
        required: true,
        desc: '商品。2〜4個',
        max: 4,
        item: {
          image: { kind: 'image', desc: '商品写真。3/2 か 4/3', required: true },
          name: { kind: 'string', required: true, desc: '商品名' },
          price: { kind: 'string', desc: '価格' },
          description: { kind: 'text', required: true, desc: '説明。3〜4文でこだわりを語る' },
        },
      },
    },
    defaults: {
      eyebrow: '看板商品',
      title: 'じっくり、ご紹介します',
      items: [
        {
          image: SAMPLE_IMG('3/2', '織機で織られる帯の様子'),
          name: '桐生織の帯',
          price: '38,000円〜',
          description: '千三百年の歴史を持つ桐生織。熟練の職人がジャカード織機で一本ずつ織り上げます。締めやすく、崩れにくい。日常の着物にこそ使ってほしい帯です。',
        },
        {
          image: SAMPLE_IMG('3/2', '色とりどりの織り生地の反物'),
          name: '御召の反物',
          price: '58,000円〜',
          description: 'しゃり感のある風合いが特徴の御召。単衣にも袷にも仕立てられます。',
        },
      ],
    },
  },
  {
    component: 'MenuList',
    category: 'products',
    use: '品名と価格のリスト。飲食店のメニュー、サロンの料金表、士業の費用一覧に',
    fields: {
      eyebrow,
      title: { kind: 'string', required: true, desc: 'セクション見出し' },
      description: { kind: 'text', desc: '補足の1文' },
      items: {
        kind: 'items',
        required: true,
        desc: '品目。4〜10個',
        max: 10,
        item: {
          name: { kind: 'string', required: true, desc: '品名' },
          price: { kind: 'string', required: true, desc: '価格' },
          description: { kind: 'string', desc: '短い補足' },
        },
      },
      note: { kind: 'string', desc: '欄外の注記（例：価格はすべて税込です）' },
    },
    defaults: {
      eyebrow: 'お品書き',
      title: 'メニュー',
      items: [
        { name: 'ひもかわうどん', price: '880円', description: '幅広麺の桐生名物。つけ汁でどうぞ' },
        { name: '天ぷらひもかわ', price: '1,280円', description: '地元野菜の天ぷら付き' },
        { name: 'もつ煮定食', price: '950円', description: 'じっくり煮込んだ自家製もつ煮' },
        { name: 'ソースかつ丼', price: '1,050円', description: '桐生のソウルフード' },
      ],
      note: '価格はすべて税込です。仕入れにより内容が変わることがあります。',
    },
  },
  // ───────────────────────── Gallery
  {
    component: 'GalleryGrid',
    category: 'gallery',
    use: '写真をグリッドで見せる。店内・料理・作品などの雰囲気を伝える',
    fields: {
      eyebrow,
      title: { kind: 'string', desc: 'セクション見出し' },
      items: {
        kind: 'items',
        required: true,
        desc: '写真。4〜8枚',
        max: 8,
        item: {
          image: { kind: 'image', required: true, desc: '写真。1/1 か 4/3' },
          caption: { kind: 'string', desc: '短いキャプション' },
        },
      },
    },
    defaults: {
      eyebrow: 'ギャラリー',
      title: '店内のようす',
      items: [
        { image: SAMPLE_IMG('1/1', '木のぬくもりのある店内') },
        { image: SAMPLE_IMG('1/1', 'カウンター席と暖簾') },
        { image: SAMPLE_IMG('1/1', '中庭の見える座敷') },
        { image: SAMPLE_IMG('1/1', '入口の看板と提灯') },
      ],
    },
  },
  {
    component: 'GalleryStrip',
    category: 'gallery',
    use: '横に流れる帯状の写真列。セクションの区切りに雰囲気を差し込む。見出しなし',
    fields: {
      items: {
        kind: 'items',
        required: true,
        desc: '写真。3〜8枚',
        max: 8,
        item: {
          image: { kind: 'image', required: true, desc: '写真。3/4 か 1/1' },
          caption: { kind: 'string', desc: '短いキャプション' },
        },
      },
    },
    defaults: {
      items: [
        { image: SAMPLE_IMG('3/4', '茶畑の畝') },
        { image: SAMPLE_IMG('3/4', '摘みたての新芽') },
        { image: SAMPLE_IMG('3/4', '蒸し工程の湯気') },
        { image: SAMPLE_IMG('3/4', '茶箱と量り') },
      ],
    },
  },
  // ───────────────────────── Testimonials
  {
    component: 'TestimonialCards',
    category: 'testimonials',
    use: 'お客さまの声をカードで2〜3件。信頼づくりに',
    fields: {
      eyebrow,
      title: { kind: 'string', required: true, desc: 'セクション見出し' },
      items: {
        kind: 'items',
        required: true,
        desc: '声。2〜3件',
        max: 3,
        item: {
          quote: { kind: 'text', required: true, desc: '声の本文。2〜3文' },
          author: { kind: 'string', required: true, desc: '名前（例：50代・女性）' },
          meta: { kind: 'string', desc: '補足（例：贈答用をご購入）' },
        },
      },
    },
    defaults: {
      eyebrow: 'お客さまの声',
      title: '続けてくださる理由',
      items: [
        { quote: '母への贈り物に選びました。包装も丁寧で、母がとても喜んでいました。今では自宅用も定期購入しています。', author: '40代・女性', meta: '贈答用をご購入' },
        { quote: 'スーパーのお茶に戻れなくなりました。香りが全然違います。', author: '60代・男性', meta: '定期購入2年目' },
      ],
    },
  },
  {
    component: 'TestimonialSingle',
    category: 'testimonials',
    use: 'ひとつの声を大きく見せる。特に印象的な声があるとき',
    fields: {
      quote: { kind: 'text', required: true, desc: '声の本文。2〜3文' },
      author: { kind: 'string', required: true, desc: '名前' },
      meta: { kind: 'string', desc: '補足' },
    },
    defaults: {
      quote: '祖母の代からこちらの帯を締めています。孫の成人式にも、迷わずお願いしました。',
      author: '70代・女性',
      meta: '三代でご愛顧',
    },
  },
  // ───────────────────────── FAQ
  {
    component: 'FaqAccordion',
    category: 'faq',
    use: 'よくある質問。タップで開閉するアコーディオン。4件以上あるとき',
    fields: {
      eyebrow,
      title: { kind: 'string', required: true, desc: 'セクション見出し' },
      items: {
        kind: 'items',
        required: true,
        desc: '質問。4〜8件',
        max: 8,
        item: {
          question: { kind: 'string', required: true, desc: '質問' },
          answer: { kind: 'text', required: true, desc: '回答。2〜3文' },
        },
      },
    },
    defaults: {
      eyebrow: 'よくあるご質問',
      title: 'Q & A',
      items: [
        { question: '駐車場はありますか？', answer: '店舗前に5台分ございます。満車の場合は近隣のコインパーキングをご利用ください。' },
        { question: '予約はできますか？', answer: 'お電話にて承ります。土日はご予約をおすすめしています。' },
        { question: '贈答用の包装はできますか？', answer: 'はい、無料で承ります。熨斗の名入れもご相談ください。' },
        { question: '配送はしていますか？', answer: '全国へ発送いたします。8,000円以上のご注文で送料無料です。' },
      ],
    },
  },
  {
    component: 'FaqSimple',
    category: 'faq',
    use: 'よくある質問を開いた状態で並べる。質問が2〜3件と少ないとき',
    fields: {
      eyebrow,
      title: { kind: 'string', required: true, desc: 'セクション見出し' },
      items: {
        kind: 'items',
        required: true,
        desc: '質問。2〜4件',
        max: 4,
        item: {
          question: { kind: 'string', required: true, desc: '質問' },
          answer: { kind: 'text', required: true, desc: '回答。2〜3文' },
        },
      },
    },
    defaults: {
      eyebrow: 'よくあるご質問',
      title: 'ご相談の前に',
      items: [
        { question: '相談だけでも大丈夫ですか？', answer: 'もちろんです。初回のご相談は無料ですので、お気軽にお越しください。' },
        { question: '費用はいつ支払いますか？', answer: '手続き完了後のお支払いです。お見積もり以上の金額を請求することはありません。' },
      ],
    },
  },
  // ───────────────────────── CTA
  {
    component: 'CtaBanner',
    category: 'cta',
    use: 'ページの締めに置く行動喚起の帯。メインカラー背景で目立つ',
    fields: {
      title: { kind: 'string', required: true, desc: '呼びかけ。15文字前後' },
      description: { kind: 'text', desc: '補足の1〜2文' },
      cta: cta('ボタン', true),
      subNote: { kind: 'string', desc: 'ボタン下の小さな注記（例：初回相談無料）' },
    },
    defaults: {
      title: 'まずは、一杯のお茶から',
      description: 'オンラインショップでは全国へお届けしています。',
      cta: { label: 'オンラインショップへ', href: '/products' },
      subNote: '8,000円以上で送料無料',
    },
  },
  {
    component: 'CtaSplit',
    category: 'cta',
    use: '電話番号と営業時間を添えた行動喚起。電話でのお問い合わせが中心の事業向け',
    fields: {
      title: { kind: 'string', required: true, desc: '呼びかけ' },
      description: { kind: 'text', desc: '補足の1〜2文' },
      tel: { kind: 'string', desc: '電話番号（例：0277-00-0000）' },
      hours: { kind: 'string', desc: '受付時間（例：9:00〜18:00 水曜定休）' },
      cta: cta('ボタン（メールフォーム等）'),
    },
    defaults: {
      title: 'ご予約・お問い合わせ',
      description: '当日のご予約もお受けしています。お気軽にお電話ください。',
      tel: '0277-00-0000',
      hours: '11:00〜15:00 / 17:00〜21:00（火曜定休）',
      cta: { label: 'メールで問い合わせる', href: '#contact' },
    },
  },
  // ───────────────────────── Access
  {
    component: 'AccessInfo',
    category: 'access',
    use: '地図と店舗情報。実店舗があるサイトには必ず入れる',
    fields: {
      title: { kind: 'string', desc: 'セクション見出し。既定は「アクセス」' },
      address: { kind: 'string', required: true, desc: '住所' },
      tel: { kind: 'string', desc: '電話番号' },
      hours: { kind: 'string', desc: '営業時間' },
      closed: { kind: 'string', desc: '定休日' },
      note: { kind: 'string', desc: '補足（駐車場・最寄り駅など）' },
      showMap: { kind: 'enum', values: ['yes', 'no'], desc: 'Google マップを埋め込むか' },
    },
    defaults: {
      title: 'アクセス',
      address: '群馬県桐生市本町1-2-3',
      tel: '0277-00-0000',
      hours: '9:00〜18:00',
      closed: '水曜日',
      note: '上毛電鉄 西桐生駅から徒歩5分／駐車場5台',
      showMap: 'yes',
    },
  },
  {
    component: 'AccessSimple',
    category: 'access',
    use: '店舗概要をラベルと値の表で見せる。会社概要・事業所情報にも使える',
    fields: {
      title: { kind: 'string', desc: 'セクション見出し。既定は「店舗情報」' },
      items: {
        kind: 'items',
        required: true,
        desc: 'ラベルと値の組。3〜6個',
        max: 6,
        item: {
          label: { kind: 'string', required: true, desc: 'ラベル（例：屋号）' },
          value: { kind: 'string', required: true, desc: '値' },
        },
      },
    },
    defaults: {
      title: '店舗情報',
      items: [
        { label: '屋号', value: '喜多の園' },
        { label: '創業', value: '昭和30年' },
        { label: '所在地', value: '群馬県桐生市本町1-2-3' },
        { label: '事業内容', value: '緑茶・ほうじ茶の栽培、製造、販売' },
      ],
    },
  },
  // ───────────────────────── Contact
  {
    component: 'ContactSimple',
    category: 'contact',
    use: '電話・メール・営業時間をまとめた問い合わせセクション。フォームが不要なとき',
    fields: {
      title: { kind: 'string', required: true, desc: 'セクション見出し' },
      description: { kind: 'text', desc: '一言添える' },
      tel: { kind: 'string', desc: '電話番号' },
      email: { kind: 'string', desc: 'メールアドレス' },
      hours: { kind: 'string', desc: '受付時間' },
    },
    defaults: {
      title: 'お問い合わせ',
      description: 'ご注文・ご相談はお電話またはメールで承ります。',
      tel: '0277-00-0000',
      email: 'info@example.com',
      hours: '9:00〜18:00（水曜定休）',
    },
  },
  {
    component: 'ContactForm',
    category: 'contact',
    use: 'お問い合わせフォーム。STEP 4 でフォーム希望があるときに使う',
    fields: {
      title: { kind: 'string', required: true, desc: 'セクション見出し' },
      description: { kind: 'text', desc: 'フォーム上の説明文' },
      email: { kind: 'string', desc: '送信先メールアドレス' },
      note: { kind: 'string', desc: 'フォーム下の注記（例：2営業日以内に返信します）' },
    },
    defaults: {
      title: 'お問い合わせ',
      description: 'ご質問・ご相談は、下記フォームからお送りください。',
      email: 'info@example.com',
      note: '2営業日以内にご返信いたします。',
    },
  },
  // ───────────────────────── Footer
  {
    component: 'FooterSimple',
    category: 'footer',
    use: '標準的なフッター。サイト名とナビゲーション',
    fields: {
      siteName: { kind: 'string', required: true, desc: 'サイト名' },
    },
    injects: ['nav'],
    defaults: { siteName: '喜多の園', nav: SAMPLE_NAV },
  },
  {
    component: 'FooterRich',
    category: 'footer',
    use: '住所・電話・営業時間つきのフッター。実店舗のあるサイト向け',
    fields: {
      siteName: { kind: 'string', required: true, desc: 'サイト名' },
      description: { kind: 'string', desc: '一言（例：創業七十年の茶舗）' },
      address: { kind: 'string', desc: '住所' },
      tel: { kind: 'string', desc: '電話番号' },
      hours: { kind: 'string', desc: '営業時間' },
    },
    injects: ['nav'],
    defaults: {
      siteName: '喜多の園',
      description: '群馬・桐生の茶農園',
      address: '群馬県桐生市本町1-2-3',
      tel: '0277-00-0000',
      hours: '9:00〜18:00（水曜定休）',
      nav: SAMPLE_NAV,
    },
  },
]

export const CATALOG_BY_NAME: Record<string, ComponentDef> = Object.fromEntries(
  COMPONENT_CATALOG.map((def) => [def.component, def]),
)

export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  header: 'ヘッダー',
  hero: 'ヒーロー',
  story: 'ストーリー・紹介',
  features: '強み・特徴',
  products: '商品・サービス',
  gallery: 'ギャラリー',
  testimonials: 'お客さまの声',
  faq: 'よくある質問',
  cta: '行動喚起（CTA）',
  access: 'アクセス',
  contact: 'お問い合わせ',
  footer: 'フッター',
}
