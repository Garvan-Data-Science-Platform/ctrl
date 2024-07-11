import { add, subtract } from './SomeModule'

describe('Add', () => {
  it('should add two numbers', () => {
    expect(add(1, 2)).toBe(3)
    expect(add(-1, 1)).toBe(0)
    expect(add(0, 0)).toBe(0)
    expect(add(1.5, 2.5)).toBe(4)
  })
})

describe('Subtract', () => {
  it('should subtract two numbers', () => {
    expect(subtract(1, 2)).toBe(-1)
    expect(subtract(-1, 1)).toBe(-2)
    expect(subtract(0, 0)).toBe(0)
    expect(subtract(1.5, 2.5)).toBe(-1)
    expect(subtract(5, 1)).toEqual(-subtract(1, 5))
  })
})
