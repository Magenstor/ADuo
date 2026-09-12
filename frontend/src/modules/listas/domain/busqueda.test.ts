import { coincideConBusqueda, normalizarParaBusqueda } from './busqueda'

describe('exports', () => {
  it('returns a string from normalizarParaBusqueda and a boolean from coincideConBusqueda', () => {
    expect(typeof normalizarParaBusqueda('azucar')).toBe('string')
    expect(typeof coincideConBusqueda('azucar', 'azu')).toBe('boolean')
  })
})

describe('case folding', () => {
  it('matches an uppercase query against lowercase content', () => {
    expect(coincideConBusqueda('Azúcar', 'AZUCAR')).toBe(true)
  })

  it('matches a title-case query against a title-case content', () => {
    expect(coincideConBusqueda('Azúcar', 'Azucar')).toBe(true)
  })

  it('matches a lowercase query against a title-case content', () => {
    expect(coincideConBusqueda('Azúcar', 'azucar')).toBe(true)
  })
})

describe('true-diacritic folding', () => {
  it('folds every accented vowel, upper and lower, to its plain form', () => {
    expect(normalizarParaBusqueda('áéíóúÁÉÍÓÚü Ü')).toBe('aeiouaeiouu u')
  })
})

describe('bidirectional symmetry', () => {
  it('matches an unaccented query against accented content', () => {
    expect(coincideConBusqueda('Azúcar', 'azucar')).toBe(true)
  })

  it('matches an accented query against unaccented content', () => {
    expect(coincideConBusqueda('azucar', 'azúcar')).toBe(true)
  })
})

describe('ñ whole-token collision regression', () => {
  it('does not match piña with pina', () => {
    expect(coincideConBusqueda('piña', 'pina')).toBe(false)
  })

  it('does not match año with ano', () => {
    expect(coincideConBusqueda('año', 'ano')).toBe(false)
  })

  it('does not match caña with cana', () => {
    expect(coincideConBusqueda('caña', 'cana')).toBe(false)
  })
})

describe('substring matching in multi-word content', () => {
  it('matches a query fragment mid-content', () => {
    expect(coincideConBusqueda('Pan integral', 'integral')).toBe(true)
  })

  it('matches a query fragment at the start of the content', () => {
    expect(coincideConBusqueda('Pan integral', 'pan')).toBe(true)
  })

  it('does not match a query absent from the content', () => {
    expect(coincideConBusqueda('Pan integral', 'leche')).toBe(false)
  })
})

describe('empty and whitespace-only queries', () => {
  it('matches non-empty content with an empty query', () => {
    expect(coincideConBusqueda('Azúcar', '')).toBe(true)
  })

  it('matches non-empty content with a whitespace-only query', () => {
    expect(coincideConBusqueda('Pan integral', '   ')).toBe(true)
  })

  it('matches empty content with an empty query', () => {
    expect(coincideConBusqueda('', '')).toBe(true)
  })
})

describe('normalizing the empty string', () => {
  it('returns the empty string and does not throw', () => {
    expect(() => normalizarParaBusqueda('')).not.toThrow()
    expect(normalizarParaBusqueda('')).toBe('')
  })
})

describe('ñ partial-prefix boundary regression', () => {
  it('does not match piña with a query stopping right before the ñ', () => {
    expect(coincideConBusqueda('piña', 'pin')).toBe(false)
  })

  it('does not match año with a query stopping right before the ñ', () => {
    expect(coincideConBusqueda('año', 'an')).toBe(false)
  })
})

describe('ñ still matches itself regardless of case', () => {
  it('matches Piña with PIÑA', () => {
    expect(coincideConBusqueda('Piña', 'PIÑA')).toBe(true)
  })

  it('matches Ñoquis with ñoquis', () => {
    expect(coincideConBusqueda('Ñoquis', 'ñoquis')).toBe(true)
  })
})

describe('diaeresis and additional true-diacritic coverage', () => {
  it('matches Pingüino with pinguino', () => {
    expect(coincideConBusqueda('Pingüino', 'pinguino')).toBe(true)
  })
})

describe('purity and non-mutation', () => {
  it('is deterministic across repeated calls with the same input', () => {
    expect(normalizarParaBusqueda('Azúcar')).toBe(
      normalizarParaBusqueda('Azúcar'),
    )
    expect(coincideConBusqueda('Azúcar', 'azucar')).toBe(
      coincideConBusqueda('Azúcar', 'azucar'),
    )
  })

  it('does not mutate or reassign its string argument', () => {
    const texto = 'Azúcar'

    normalizarParaBusqueda(texto)

    expect(texto).toBe('Azúcar')
  })

  it('normalizes astral surrogate-pair characters without throwing', () => {
    expect(() => normalizarParaBusqueda('🛒 Azúcar')).not.toThrow()
    expect(coincideConBusqueda('🛒 Azúcar', '🛒')).toBe(true)
  })

  it('treats a mixed-whitespace query as whitespace-only', () => {
    expect(coincideConBusqueda('Pan integral', '\t\n')).toBe(true)
  })
})

describe('whole-string vs substring boundary', () => {
  it('matches a query equal to the full normalized content', () => {
    expect(coincideConBusqueda('Azúcar', 'Azúcar')).toBe(true)
  })
})
