import * as listas from './index'

describe('listas public boundary', () => {
  it('exports only the two application hooks at runtime', () => {
    expect(Object.keys(listas).sort()).toEqual(['useArticulos', 'useListas'])
  })
})
