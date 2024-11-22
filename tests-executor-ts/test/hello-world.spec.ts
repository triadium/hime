import { helloWorld } from '../src/app'

describe('Testing hello world', () => {
  test('return value', () => {
    expect(helloWorld()).toBe('Hello world!')
  })
})
