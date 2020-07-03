import { expect } from 'chai'

describe('Pusher Pub/Sub Tests', () => {
  it('Can Import Pusher', () => {
    const Pusher = require('pusher')

    expect(Pusher).to.not.equal(null)
  })
})
