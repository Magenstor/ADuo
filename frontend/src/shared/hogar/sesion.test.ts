import type { UserSchema } from '@insforge/sdk'
import { aUsuarioDesdeUserSchema, urlDeRetorno } from '@/shared/hogar/sesion'

function unUserSchema(overrides: Partial<UserSchema> = {}): UserSchema {
  return {
    id: 'user-1',
    email: 'ana@example.com',
    emailVerified: true,
    createdAt: '2026-08-25T00:00:00.000Z',
    updatedAt: '2026-08-25T00:00:00.000Z',
    metadata: null,
    profile: { name: 'Ana', avatar_url: 'https://example.com/ana.png' },
    ...overrides,
  }
}

describe('aUsuarioDesdeUserSchema', () => {
  it('maps id, email, name and avatar_url from a populated profile', () => {
    const usuario = aUsuarioDesdeUserSchema(unUserSchema())

    expect(usuario).toEqual({
      id: 'user-1',
      email: 'ana@example.com',
      nombre: 'Ana',
      avatarUrl: 'https://example.com/ana.png',
    })
  })

  it('maps name and avatarUrl to null when profile is null', () => {
    const usuario = aUsuarioDesdeUserSchema(unUserSchema({ profile: null }))

    expect(usuario).toEqual({
      id: 'user-1',
      email: 'ana@example.com',
      nombre: null,
      avatarUrl: null,
    })
  })
})

describe('urlDeRetorno', () => {
  it('resolves to the app origin with a trailing slash', () => {
    expect(urlDeRetorno('http://localhost:3000')).toBe('http://localhost:3000/')
  })
})
