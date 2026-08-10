// Showcase（/dev/components）用のサンプルサイト構成。
// 「複数セクションを組み合わせたときの品質」を確認するための実データに近い構成

import type { SiteData } from '@/types/site'
import { TOKEN_PRESETS } from '@/lib/site/tokens'

const ph = (
  aspectRatio: '1/1' | '4/3' | '3/2' | '16/9' | '3/4',
  intent: string,
) => ({ type: 'placeholder', aspectRatio, intent })

/** 老舗・伝統系（茶農園） */
const shinise: SiteData = {
  version: 1,
  brief: {
    siteName: '喜多の園',
    tagline: '三代続く茶畑から、まっすぐ食卓へ',
    industry: '食品・農産物の生産販売',
    audience: '健康志向の30〜50代、贈答品を探す人',
    toneKeywords: ['老舗らしい', '誠実', '和'],
    keyMessages: ['無農薬栽培', '三代続く歴史', '産地直送'],
  },
  designTokens: TOKEN_PRESETS['shinise-warm'],
  assets: [],
  pages: [
    {
      id: 'page-home',
      slug: 'home',
      title: 'ホーム',
      sections: [
        { id: 'home-s1', component: 'HeaderCentered', props: { siteName: '喜多の園', tagline: '群馬・桐生 創業七十年の茶舗' } },
        {
          id: 'home-s2',
          component: 'HeroSplit',
          props: {
            eyebrow: '群馬・桐生',
            title: '三代続く茶畑から、まっすぐ食卓へ',
            description: '農薬を使わず、手間ひまかけて育てた緑茶とほうじ茶。摘みたての香りをそのままお届けします。',
            primaryCta: { label: '商品を見る', href: '#products' },
            secondaryCta: { label: '私たちのこと', href: '#story' },
            image: ph('3/2', '朝日の差す茶畑と摘み手'),
            imagePosition: 'right',
          },
        },
        {
          id: 'home-s3',
          component: 'FeatureCards',
          props: {
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
          id: 'home-s4',
          component: 'StoryImageLeft',
          props: {
            eyebrow: '私たちのこと',
            title: '祖父の代から、変わらない製法で',
            body: '昭和三十年、祖父がこの地に小さな茶工場を建てました。以来、蒸し・揉み・乾燥まで一貫して自家工場で行っています。効率よりも香りを。その想いだけは、三代目の今も変わりません。',
            image: ph('3/4', '茶葉を手で確かめる職人の手元'),
          },
        },
        {
          id: 'home-s5',
          component: 'GalleryStrip',
          props: {
            items: [
              { image: ph('3/4', '茶畑の畝') },
              { image: ph('3/4', '摘みたての新芽') },
              { image: ph('3/4', '蒸し工程の湯気') },
              { image: ph('3/4', '茶箱と量り') },
              { image: ph('3/4', '店先の暖簾') },
            ],
          },
        },
        {
          id: 'home-s6',
          component: 'ProductGrid',
          style: { headingScale: 'lg', spacing: 'loose' },
          props: {
            eyebrow: 'お品書き',
            title: '定番の三品',
            items: [
              { image: ph('1/1', '緑茶の茶葉と湯呑み'), name: '特上煎茶', price: '1,620円', description: '一番茶のみを使った、当園いちばんの看板商品。' },
              { image: ph('1/1', '焙じたてのほうじ茶'), name: '自家焙煎ほうじ茶', price: '980円', description: '香ばしさが立つ浅煎り。食後の一杯に。' },
              { image: ph('1/1', 'ギフト用の茶筒と包装'), name: '贈答用詰め合わせ', price: '3,240円〜', description: '大切な方への贈り物に。熨斗も承ります。' },
            ],
          },
        },
        {
          id: 'home-s7',
          component: 'TestimonialCards',
          props: {
            eyebrow: 'お客さまの声',
            title: '続けてくださる理由',
            items: [
              { quote: '母への贈り物に選びました。包装も丁寧で、母がとても喜んでいました。今では自宅用も定期購入しています。', author: '40代・女性', meta: '贈答用をご購入' },
              { quote: 'スーパーのお茶に戻れなくなりました。香りが全然違います。', author: '60代・男性', meta: '定期購入2年目' },
            ],
          },
        },
        {
          id: 'home-s8',
          component: 'FaqAccordion',
          style: { spacing: 'tight' },
          props: {
            eyebrow: 'よくあるご質問',
            title: 'Q & A',
            items: [
              { question: '贈答用の包装はできますか？', answer: 'はい、無料で承ります。熨斗の名入れもご相談ください。' },
              { question: '配送はしていますか？', answer: '全国へ発送いたします。8,000円以上のご注文で送料無料です。' },
              { question: '賞味期限はどのくらいですか？', answer: '未開封で製造から10か月です。開封後はお早めにお召し上がりください。' },
            ],
          },
        },
        {
          id: 'home-s9',
          component: 'CtaBanner',
          props: {
            title: 'まずは、一杯のお茶から',
            description: 'オンラインショップでは全国へお届けしています。',
            cta: { label: 'オンラインショップへ', href: '#contact' },
            subNote: '8,000円以上で送料無料',
          },
        },
        {
          id: 'home-s10',
          component: 'AccessInfo',
          props: {
            title: 'アクセス',
            address: '群馬県桐生市本町1-2-3',
            tel: '0277-00-0000',
            hours: '9:00〜18:00',
            closed: '水曜日',
            note: '上毛電鉄 西桐生駅から徒歩5分／駐車場5台',
            showMap: 'yes',
          },
        },
        { id: 'home-s11', component: 'FooterRich', props: { siteName: '喜多の園', description: '群馬・桐生の茶農園', address: '群馬県桐生市本町1-2-3', tel: '0277-00-0000', hours: '9:00〜18:00（水曜定休）' } },
      ],
    },
  ],
}

/** 飲食・店舗系（うどん店） */
const restaurant: SiteData = {
  version: 1,
  brief: {
    siteName: '麺処 ふる川',
    tagline: '毎朝打つ麺と、地元野菜の出汁',
    industry: '飲食店',
    audience: '家族連れ・桐生観光の人',
    toneKeywords: ['温かい', '職人', '和'],
    keyMessages: ['自家製麺', '地元食材', '家族で過ごせる'],
  },
  designTokens: TOKEN_PRESETS['washoku-dark'],
  assets: [],
  pages: [
    {
      id: 'page-home',
      slug: 'home',
      title: 'ホーム',
      sections: [
        { id: 'home-s1', component: 'HeaderSimple', props: { siteName: '麺処 ふる川', tagline: '桐生名物 ひもかわうどん' } },
        {
          id: 'home-s2',
          component: 'HeroFullBleed',
          props: {
            eyebrow: '桐生名物',
            title: '幅広一寸、手打ちの誇り',
            description: '毎朝四時から打つひもかわうどん。つるりと喉を通る、桐生の味です。',
            primaryCta: { label: 'メニューを見る', href: '#products' },
            image: ph('16/9', '湯気の立つひもかわうどんの丼'),
          },
        },
        {
          id: 'home-s3',
          component: 'StoryImageRight',
          props: {
            eyebrow: '店主のこと',
            title: '打ち場に立って、三十年',
            body: '十八で修行に入り、二十八でこの店を継ぎました。麺の厚みは一ミリ以下。この薄さを均一に伸ばせるまで、十年かかりました。今日も明日も、同じ麺を打ち続けます。',
            image: ph('3/4', '麺棒で生地を伸ばす店主の姿'),
          },
        },
        {
          id: 'home-s4',
          component: 'MenuList',
          style: { headingScale: 'lg', spacing: 'loose' },
          props: {
            eyebrow: 'お品書き',
            title: 'メニュー',
            items: [
              { name: 'ひもかわうどん', price: '880円', description: '幅広麺の桐生名物。つけ汁でどうぞ' },
              { name: '天ぷらひもかわ', price: '1,280円', description: '地元野菜の天ぷら付き' },
              { name: 'もつ煮定食', price: '950円', description: 'じっくり煮込んだ自家製もつ煮' },
              { name: 'ソースかつ丼', price: '1,050円', description: '桐生のソウルフード' },
              { name: '季節の炊き込みご飯', price: '400円', description: '数量限定' },
            ],
            note: '価格はすべて税込です。仕入れにより内容が変わることがあります。',
          },
        },
        {
          id: 'home-s5',
          component: 'GalleryGrid',
          props: {
            eyebrow: 'ギャラリー',
            title: '店のようす',
            items: [
              { image: ph('1/1', '木のぬくもりのある店内') },
              { image: ph('1/1', 'カウンター席と暖簾') },
              { image: ph('1/1', '中庭の見える座敷') },
              { image: ph('1/1', '入口の看板と提灯') },
            ],
          },
        },
        {
          id: 'home-s6',
          component: 'TestimonialSingle',
          props: {
            quote: '帰省のたびに必ず寄ります。この麺は、桐生でしか食べられない味。',
            author: '30代・男性',
            meta: '県外からのリピーター',
          },
        },
        {
          id: 'home-s7',
          component: 'CtaSplit',
          props: {
            title: 'ご予約・お問い合わせ',
            description: '当日のご予約もお受けしています。お気軽にお電話ください。',
            tel: '0277-00-0000',
            hours: '11:00〜15:00 / 17:00〜21:00（火曜定休）',
          },
        },
        {
          id: 'home-s8',
          component: 'AccessInfo',
          props: {
            address: '群馬県桐生市仲町2-3-4',
            tel: '0277-00-0000',
            hours: '11:00〜15:00 / 17:00〜21:00',
            closed: '火曜日',
            note: 'JR桐生駅から徒歩8分／専用駐車場8台',
            showMap: 'yes',
          },
        },
        { id: 'home-s9', component: 'FooterSimple', props: { siteName: '麺処 ふる川' } },
      ],
    },
  ],
}

/** 士業・サービス系（司法書士） */
const professional: SiteData = {
  version: 1,
  brief: {
    siteName: 'さくら司法書士事務所',
    tagline: '相続の不安を、確かな安心に',
    industry: '士業・専門サービス',
    audience: '相続・登記に悩む地域の家族',
    toneKeywords: ['信頼', '誠実', '落ち着き'],
    keyMessages: ['初回相談無料', '地域密着30年', 'わかりやすい説明'],
  },
  designTokens: TOKEN_PRESETS['trust-blue'],
  assets: [],
  pages: [
    {
      id: 'page-home',
      slug: 'home',
      title: 'ホーム',
      sections: [
        { id: 'home-s1', component: 'HeaderSimple', props: { siteName: 'さくら司法書士事務所', tagline: '桐生・みどり・太田' } },
        {
          id: 'home-s2',
          component: 'HeroMinimal',
          props: {
            title: '相続の不安を、確かな安心に',
            description: '桐生で三十年。地域の暮らしに寄り添う司法書士事務所です。初回のご相談は無料です。',
          },
        },
        {
          id: 'home-s3',
          component: 'StoryEditorial',
          props: {
            eyebrow: 'ご挨拶',
            title: '暮らしの節目に、そっと寄り添う',
            lead: '相続、登記、遺言。人生の節目には、慣れない手続きがつきものです。',
            body: '私たちは、専門用語をできるだけ使わず、お客さまの言葉で説明することを大切にしています。どんな小さな不安でも、まずはお聞かせください。',
            quote: 'わからないまま、進めない。',
          },
        },
        {
          id: 'home-s4',
          component: 'FeatureCards',
          style: { background: 'tint' },
          props: {
            eyebrow: '取扱業務',
            title: 'こんなご相談をお受けしています',
            items: [
              { icon: 'shield', title: '相続登記', description: '不動産の名義変更から遺産分割協議書の作成まで。' },
              { icon: 'users', title: '遺言書の作成', description: 'ご家族の想いをかたちに。公正証書遺言をサポート。' },
              { icon: 'gem', title: '会社設立登記', description: '創業時の定款作成から登記申請までを代行します。' },
            ],
          },
        },
        {
          id: 'home-s5',
          component: 'FeatureList',
          props: {
            eyebrow: 'ご相談の流れ',
            title: 'はじめてでも、この順番で',
            items: [
              { title: 'お電話・メールでご連絡', description: 'まずはお気軽にご連絡ください。初回相談は無料です。' },
              { title: '面談・お見積もり', description: '状況を伺い、必要な手続きと費用を明確にご説明します。' },
              { title: '手続きの実行', description: '書類の作成から申請まで、責任を持って代行します。' },
              { title: 'ご報告・お引き渡し', description: '完了書類をお渡しし、今後の手続きもご案内します。' },
            ],
          },
        },
        {
          id: 'home-s6',
          component: 'MenuList',
          style: { align: 'left' },
          props: {
            eyebrow: '費用の目安',
            title: '料金表',
            items: [
              { name: '相続登記', price: '66,000円〜', description: '実費（登録免許税等）は別途' },
              { name: '遺言書作成サポート', price: '55,000円〜' },
              { name: '会社設立登記', price: '88,000円〜' },
              { name: '初回相談（60分）', price: '無料' },
            ],
            note: '案件の内容により変動します。必ず事前にお見積もりをご提示します。',
          },
        },
        {
          id: 'home-s7',
          component: 'FaqSimple',
          props: {
            eyebrow: 'よくあるご質問',
            title: 'ご相談の前に',
            items: [
              { question: '相談だけでも大丈夫ですか？', answer: 'もちろんです。初回のご相談は無料ですので、お気軽にお越しください。' },
              { question: '費用はいつ支払いますか？', answer: '手続き完了後のお支払いです。お見積もり以上の金額を請求することはありません。' },
            ],
          },
        },
        {
          id: 'home-s8',
          component: 'CtaBanner',
          props: {
            title: 'ひとりで悩む前に、ご相談ください',
            cta: { label: '無料相談を予約する', href: '#contact' },
            subNote: '土曜も営業しています',
          },
        },
        {
          id: 'home-s9',
          component: 'ContactForm',
          props: {
            title: 'お問い合わせ',
            description: 'ご相談の予約・ご質問は、下記フォームからお送りください。',
            email: 'info@example.com',
            note: '2営業日以内にご返信いたします。',
          },
        },
        { id: 'home-s10', component: 'FooterRich', props: { siteName: 'さくら司法書士事務所', description: '群馬県司法書士会所属', address: '群馬県桐生市錦町3-4-5', tel: '0277-00-0000', hours: '平日・土曜 9:00〜18:00' } },
      ],
    },
  ],
}

export const SAMPLE_SITES: Record<string, { label: string; site: SiteData }> = {
  shinise: { label: '老舗・伝統系（茶農園）', site: shinise },
  restaurant: { label: '飲食・店舗系（うどん店）', site: restaurant },
  professional: { label: '士業・サービス系（司法書士）', site: professional },
}
