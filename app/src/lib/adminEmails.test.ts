import { describe, it, expect } from 'vitest'
import { parseAdminEmails, isAdminEmail } from './adminEmails'

describe('parseAdminEmails', () => {
  it('カンマ区切りを配列にする', () => {
    expect(parseAdminEmails('a@example.com,b@example.com')).toEqual([
      'a@example.com',
      'b@example.com',
    ])
  })

  it('空白をトリムし小文字化する', () => {
    expect(parseAdminEmails(' A@Example.com , b@example.com ')).toEqual([
      'a@example.com',
      'b@example.com',
    ])
  })

  it('未設定・空文字は空配列', () => {
    expect(parseAdminEmails(undefined)).toEqual([])
    expect(parseAdminEmails('')).toEqual([])
    expect(parseAdminEmails(' , ,')).toEqual([])
  })
})

describe('isAdminEmail', () => {
  const allowlist = ['admin@example.com']

  it('リストにあるメールは true（大文字小文字は無視）', () => {
    expect(isAdminEmail('admin@example.com', allowlist)).toBe(true)
    expect(isAdminEmail('Admin@Example.com', allowlist)).toBe(true)
  })

  it('リストにないメール・未定義は false', () => {
    expect(isAdminEmail('other@example.com', allowlist)).toBe(false)
    expect(isAdminEmail(undefined, allowlist)).toBe(false)
    expect(isAdminEmail('', allowlist)).toBe(false)
  })

  it('空のリストでは常に false', () => {
    expect(isAdminEmail('admin@example.com', [])).toBe(false)
  })
})
