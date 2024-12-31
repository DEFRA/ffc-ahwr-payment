import { createServer } from '../../../../app/server'

describe('Server test', () => {
  test('createServer returns server', () => {
    const server = createServer()
    expect(server).toBeDefined()
  })
})
