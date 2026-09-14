# Research: NFD and collation behavior for `ñ` — change `dominio-busqueda`

Lane: does `Intl.Collator` / `localeCompare` with `sensitivity: 'base'` in the `es` locale treat `ñ` and `n` as equal, and what exactly does NFD do to `ñ`?

Status: **done**. Every claim below carries a source; the one inference the evidence phase could not settle from documents was closed by direct measurement (see "Empirical verification").

## Why this lane exists

`Intl.Collator` was already rejected for this change on an independent and stronger ground: it has no substring primitive, and this feature needs "content contains query" matching rather than whole-string comparison. This lane is confirmatory. It does not reopen that decision.

## Findings

### 1. NFD decomposition of `ñ`/`Ñ` — CONFIRMED

The Unicode Character Database is the authoritative machine-readable source:

```
00D1;LATIN CAPITAL LETTER N WITH TILDE;Lu;0;L;004E 0303;...
00F1;LATIN SMALL LETTER N WITH TILDE;Ll;0;L;006E 0303;...
```

Field 6 (`Decomposition_Mapping`) is `004E 0303` / `006E 0303` with no compatibility tag, so it is a canonical decomposition and fires under NFD.

Source: <https://www.unicode.org/Public/UCD/latest/ucd/UnicodeData.txt>

U+0303 COMBINING TILDE sits inside the Combining Diacritical Marks block U+0300–U+036F — the same block that holds U+0301 COMBINING ACUTE ACCENT (á é í ó ú) and U+0308 COMBINING DIAERESIS (ü). **This is precisely what makes an explicit U+0303 exclusion necessary:** a blanket strip of U+0300–U+036F removes the tilde from `ñ` exactly as it removes the acute from `á`, collapsing `ñ` → `n`.

Source: <https://en.wikipedia.org/wiki/Combining_Diacritical_Marks> (block range; the canonical authority remains the Unicode Standard/UCD)

### 2. ECMA-402 `sensitivity` semantics — CONFIRMED

`sensitivity: 'base'` is spec-defined as comparing only at Unicode Collation Algorithm **primary** strength: accent (secondary) and case (tertiary) differences are ignored, and only base-letter differences compare as unequal.

Sources: <https://tc39.es/ecma402/#sec-initializecollator> · <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator/Collator> (MDN states verbatim that `base` "is equivalent to the primary strength level")

### 3. CLDR Spanish collation tailoring for `ñ` — CONFIRMED, and it resolves cleanly

CLDR's Spanish collation source tailors:

```
&N<ñ<<<Ñ
```

Read against the LDML operator definitions, a single `<` is a **primary** difference and `<<<` is tertiary (case). So `ñ` is primary-distinct from `n`, and only `Ñ` vs `ñ` is a case-level distinction.

This is identical in the *standard* modern and *traditional* pre-1994 Spanish collations. The 1994 Real Academia Española reform demoted `ch` and `ll` from primary collating elements to ordinary digraphs; it did not touch `ñ`. No source found states or implies `ñ` was ever secondary/tertiary-level relative to `n` in any CLDR/ICU version.

Sources: <https://github.com/unicode-org/cldr/blob/main/common/collation/es.xml> · <https://cldr-smoke.unicode.org/spec/main/ldml/tr35-collation.html> (operator strengths) · <https://www.unicode.org/cldr/charts/42/collation/es.html> (corroborating sort-order chart)

### 4. Practical conclusion — `'ñ'.localeCompare('n', 'es', {sensitivity:'base'})` is NON-ZERO

Chaining finding 2 (base = primary strength only) with finding 3 (CLDR gives `ñ` its own primary weight in `es`) implies a conformant engine returns non-zero: `ñ` and `n` are treated as **different letters**, not equal.

Note the direction of this result. It is the opposite of what the exploration phase suspected. `Intl.Collator` would not have folded `ñ` into `n` — it correctly keeps them apart. What it still cannot do is search for a substring, which is the ground on which it was rejected.

### 5. Substring limitation — CONFIRMED

`Intl.Collator.prototype.compare` and `String.prototype.localeCompare` are whole-string comparators returning −1/0/1. TC39's own `ecma402` issue #506 requests adding locale-sensitive substring matching (`includes`, `indexOf`) precisely "because it does not exist today" — direct confirmation from the spec repository that no such primitive exists.

Sources: <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator> · <https://github.com/tc39/ecma402/issues/506>

## Empirical verification

The evidence phase flagged finding 4 as inferred from two specs rather than directly observed. Measured in this repository's own runtime (Node v26.8.1, ICU 78.3):

| Expression | Result |
|---|---|
| `'ñ'.localeCompare('n','es',{sensitivity:'base'})` | `1` (non-zero — confirms finding 4) |
| `'á'.localeCompare('a','es',{sensitivity:'base'})` | `0` (accents do fold, as expected) |
| `[...'ñ'.normalize('NFD')]` | `U+006E`, `U+0303` (confirms finding 1) |
| `[...'Ñ'.normalize('NFD')]` | `U+004E`, `U+0303` |
| `'piña'` stripped over the full U+0300–U+036F range | **`pina`** — the trap, reproduced |
| `'piña'` stripped excluding U+0303 | `piña` — preserved |
| `'Azúcar'` stripped excluding U+0303, lowercased | `azucar` — the task's acceptance example |

Finding 4 is therefore observed, not only inferred. The remaining caveat is unchanged: this was measured on one engine, and an engine shipping stale or non-standard ICU data could in principle diverge. That risk does not affect the chosen approach, which operates at the code-point level and depends on no collation data at all.

## Consequences for the design

- The U+0303 exclusion is not a stylistic preference. It is required by the canonical decomposition documented in finding 1, and the failure it prevents is reproduced above.
- The chosen NFD approach is independent of ICU/CLDR data versions, so it carries none of the engine-divergence risk discussed in findings 3–5.
- Findings 3 and 4 correct the exploration's stated suspicion that `sensitivity: 'base'` would fold `ñ` into `n`. The rejection of `Intl.Collator` stands on the substring limitation in finding 5, which is independent and decisive.

## Open risks

- A future CLDR revision changing the Spanish `es.xml` tailoring for `ñ` would require re-verifying findings 3 and 4. This does not affect the implemented approach.
- ECMA-402's `sensitivity` table was corroborated through MDN's verbatim mirror plus search results rather than a single direct fetch of the spec section (the spec page truncated on fetch).
