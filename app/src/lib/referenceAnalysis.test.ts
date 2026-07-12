import { describe, it, expect } from 'vitest'
import {
  isSafePublicUrl,
  extractPageText,
  extractHtmlTitle,
  parseAnalysisJson,
} from './referenceAnalysis'

describe('isSafePublicUrl', () => {
  it('通常の http/https URL は許可', () => {
    expect(isSafePublicUrl('https://example.com')).toBe(true)
    expect(isSafePublicUrl('http://example.co.jp/menu')).toBe(true)
  })

  it('http/https 以外のスキームは拒否', () => {
    expect(isSafePublicUrl('ftp://example.com')).toBe(false)
    expect(isSafePublicUrl('javascript:alert(1)')).toBe(false)
    expect(isSafePublicUrl('file:///etc/passwd')).toBe(false)
  })

  it('localhost・IP直指定・不正な文字列は拒否', () => {
    expect(isSafePublicUrl('http://localhost:3000')).toBe(false)
    expect(isSafePublicUrl('http://127.0.0.1')).toBe(false)
    expect(isSafePublicUrl('http://192.168.1.1/admin')).toBe(false)
    expect(isSafePublicUrl('http://[::1]')).toBe(false)
    expect(isSafePublicUrl('http://server.local')).toBe(false)
    expect(isSafePublicUrl('not a url')).toBe(false)
    expect(isSafePublicUrl('')).toBe(false)
  })
})

describe('extractPageText', () => {
  it('script/style とタグを除去してテキストだけ返す', () => {
    const html =
      '<html><head><style>body{color:red}</style></head>' +
      '<body><script>var x=1;</script><h1>老舗の味</h1><p>創業100年</p></body></html>'
    expect(extractPageText(html)).toBe('老舗の味 創業100年')
  })

  it('HTMLエンティティと連続空白をまとめる', () => {
    expect(extractPageText('<p>A&amp;B   C</p>')).toBe('A B C')
  })

  it('maxLength で切り詰める', () => {
    expect(extractPageText('<p>' + 'あ'.repeat(100) + '</p>', 10)).toHaveLength(10)
  })

  it('空HTMLは空文字', () => {
    expect(extractPageText('')).toBe('')
    expect(extractPageText('<script>only()</script>')).toBe('')
  })
})

describe('extractHtmlTitle', () => {
  it('title タグの中身を返す', () => {
    expect(extractHtmlTitle('<title>和菓子の老舗 | 花月堂</title>')).toBe(
      '和菓子の老舗 | 花月堂',
    )
  })

  it('属性付き・改行入りにも対応', () => {
    expect(extractHtmlTitle('<title data-x="1">\n  店名\n</title>')).toBe('店名')
  })

  it('title がなければ空文字', () => {
    expect(extractHtmlTitle('<html></html>')).toBe('')
  })
})

describe('parseAnalysisJson', () => {
  const valid = JSON.stringify({
    title: 'テスト店',
    industry: '飲食店',
    styleTags: ['和風', 'ミニマル'],
    summary: '落ち着いた和の雰囲気。',
    analysis: {
      colorScheme: '生成り＋深緑',
      layout: '1カラム',
      typography: '明朝体',
      tone: '上質',
      targetAudience: '30-50代',
      takeaways: ['余白を広く'],
    },
  })

  it('正しいJSONをパースできる', () => {
    const result = parseAnalysisJson(valid)
    expect(result?.industry).toBe('飲食店')
    expect(result?.styleTags).toEqual(['和風', 'ミニマル'])
    expect(result?.analysis.takeaways).toEqual(['余白を広く'])
  })

  it('コードフェンスや前後の説明文があってもパースできる', () => {
    const wrapped = '分析結果です。\n```json\n' + valid + '\n```\nいかがでしょう。'
    expect(parseAnalysisJson(wrapped)?.title).toBe('テスト店')
  })

  it('industry か summary が欠けていれば null', () => {
    expect(parseAnalysisJson('{"title":"x"}')).toBeNull()
    expect(parseAnalysisJson('{"industry":"飲食店"}')).toBeNull()
  })

  it('壊れたJSON・JSONなしは null', () => {
    expect(parseAnalysisJson('{"industry": ')).toBeNull()
    expect(parseAnalysisJson('JSONはありません')).toBeNull()
    expect(parseAnalysisJson('')).toBeNull()
  })

  it('型が違うフィールドは安全なデフォルトに落とす', () => {
    const odd = JSON.stringify({
      industry: '飲食店',
      summary: '概要',
      styleTags: ['ok', 123, null],
      analysis: { takeaways: 'not-array' },
    })
    const result = parseAnalysisJson(odd)
    expect(result?.styleTags).toEqual(['ok'])
    expect(result?.analysis.takeaways).toEqual([])
    expect(result?.analysis.colorScheme).toBe('')
  })
})
