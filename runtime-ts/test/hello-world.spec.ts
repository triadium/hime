import { helloWorld } from '../src/index'

describe('Testing hello world', () => {
  test('return value', () => {
    expect(helloWorld()).toBe('Hello world!')
  })
})
