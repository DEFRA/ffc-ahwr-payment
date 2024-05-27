require('dotenv').config()

jest.mock('../app/config/storage', () => ({
  storageAccount: 'mockStorageAccount'
}))

jest.mock('../app/config/storage', () => ({
  storageAccount: 'mockStorageAccount'
}))
