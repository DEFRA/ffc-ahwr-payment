import { createServer } from '../../../../app/server'

jest.mock('../../../../app/config/index.js')

describe('Server test', () => {
  test('createServer returns server', () => {
    const server = createServer()
    expect(server).toBeDefined()
  })
})
