import { beforeEach, describe, expect, it } from 'vitest'
import { getLocalStorage, setLocalStorage } from '@/domTools/localStorage'

describe('localStorage 工具', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('往返（set → get）', () => {
    it('对象 / 数组 / 数字 / 布尔值正确往返', () => {
      setLocalStorage('obj', { a: 1, b: 'x' })
      expect(getLocalStorage('obj')).toEqual({ a: 1, b: 'x' })

      setLocalStorage('arr', [1, 2, 3])
      expect(getLocalStorage('arr')).toEqual([1, 2, 3])

      setLocalStorage('num', 123)
      expect(getLocalStorage('num')).toBe(123)

      setLocalStorage('bool', true)
      expect(getLocalStorage('bool')).toBe(true)
    })

    it('普通字符串原样往返（不被 JSON 引号包裹）', () => {
      setLocalStorage('str', 'hello world')

      /** 验证底层存储是裸字符串，没有多包一层引号 */
      expect(localStorage.getItem('str')).toBe('hello world')
      expect(getLocalStorage('str')).toBe('hello world')
    })

    it('回归：以减号开头的字符串能正确读取，不再抛 JSON 错误', () => {
      /** 复现 bug：'-created_time' 裸写后 JSON.parse('-created_time') 会报 "No number after minus sign" */
      setLocalStorage('card_list_last_order_by', '-created_time')
      expect(getLocalStorage('card_list_last_order_by')).toBe('-created_time')
    })

    it('回归：空字符串能正确读取，不再抛 "Unexpected end of JSON input"', () => {
      setLocalStorage('card_list_last_opened_card_id', '')
      expect(getLocalStorage('card_list_last_opened_card_id')).toBe('')
    })
  })

  describe('容错', () => {
    it('键不存在时返回 null', () => {
      expect(getLocalStorage('not_exist')).toBeNull()
    })

    it('字面量 "undefined" 返回 null', () => {
      localStorage.setItem('u', 'undefined')
      expect(getLocalStorage('u')).toBeNull()
    })

    it('历史遗留的非 JSON 脏数据退回原始字符串，不抛错', () => {
      /** 直接写入非 JSON 的裸值（模拟旧版本 / 外部写入） */
      localStorage.setItem('legacy', '-created_time')
      expect(() => getLocalStorage('legacy')).not.toThrow()
      expect(getLocalStorage('legacy')).toBe('-created_time')
    })
  })

  describe('autoParseJSON = false', () => {
    it('返回原始字符串，跳过 JSON.parse', () => {
      setLocalStorage('obj', { a: 1 })
      expect(getLocalStorage('obj', false)).toBe('{"a":1}')
    })

    it('长得像 JSON 的字符串需用 false 保持 string 类型', () => {
      setLocalStorage('numeric_str', '123')

      /** 默认 autoParseJSON 会被解析成 number（裸写设计的固有取舍，已在 JSDoc 标注） */
      expect(getLocalStorage('numeric_str')).toBe(123)

      /** 传 false 才能保持原始字符串 */
      expect(getLocalStorage('numeric_str', false)).toBe('123')
    })
  })

  describe('autoToJSON = false', () => {
    it('原样写入字符串', () => {
      setLocalStorage('raw', '[1,2]', false)
      expect(localStorage.getItem('raw')).toBe('[1,2]')
      expect(getLocalStorage('raw')).toEqual([1, 2])
    })
  })
})
