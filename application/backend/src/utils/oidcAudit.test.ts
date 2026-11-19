import { createIdToken, createJwt } from 'common/testing/TestHelpers'
import { TestOIDC } from 'common/testing/constants'
import { hasMFASignal, readIdTokenClaims } from './oidcAudit'

const { ACR, INSTITUTIONS, PROVIDER } = TestOIDC
const NOW = Math.floor(Date.now() / 1000)
const expected = { issuer: PROVIDER.providerUrl, clientId: PROVIDER.clientId, nowSeconds: NOW }

describe('OIDC audit functions', () => {
  describe('readIdTokenClaims()', () => {
    it('Keeps the allowlisted claims from a valid token', () => {
      const claims = {
        acr: ACR.REFEDS_MFA,
        amr: ['pwd', 'otp'],
        auth_time: NOW - 60,
        ...INSTITUTIONS.WITH_MFA,
      }

      expect(readIdTokenClaims(createIdToken(claims), expected)).toStrictEqual({ claims })
    })

    it('Drops claims outside the allowlist', () => {
      const token = createIdToken({
        acr: ACR.REFEDS_MFA,
        sub: 'user-123',
        email: 'someone@example.edu',
        eppn: 'someone@example.edu',
        'https://example.org/upstream': '{"name":"Someone"}',
      })

      expect(readIdTokenClaims(token, expected)).toStrictEqual({ claims: { acr: ACR.REFEDS_MFA } })
    })

    it('Drops allowlisted claims that have the wrong type', () => {
      const token = createIdToken({
        acr: 1,
        amr: 'mfa',
        auth_time: '1800000000',
        idp: ['https://idp.example.edu'],
      })

      expect(readIdTokenClaims(token, expected)).toStrictEqual({ claims: {} })
    })

    it('Accepts several audiences when azp names this client', () => {
      const token = createIdToken({
        aud: ['other-client', PROVIDER.clientId],
        azp: PROVIDER.clientId,
        acr: ACR.REFEDS_MFA,
      })

      expect(readIdTokenClaims(token, expected)).toStrictEqual({ claims: { acr: ACR.REFEDS_MFA } })
    })

    it.each([
      ['there is no token', undefined, 'no ID token in the token response'],
      ['the token is empty', '', 'no ID token in the token response'],
      ['the token is not a JWT', 'not-a-jwt', 'ID token is not a valid JWT'],
      ['the payload is not JSON', createJwt('not json'), 'ID token is not a valid JWT'],
      [
        'the payload is a JSON string',
        createJwt(JSON.stringify('just a string')),
        'ID token is not a valid JWT',
      ],
      [
        'the issuer is another provider',
        createIdToken({ iss: 'https://other.example.org' }),
        'ID token issuer does not match the provider',
      ],
      [
        'there is no issuer',
        createIdToken({ iss: undefined }),
        'ID token issuer does not match the provider',
      ],
      [
        'the audience is another client',
        createIdToken({ aud: 'other-client' }),
        'ID token audience does not include this client',
      ],
      [
        'there is no audience',
        createIdToken({ aud: undefined }),
        'ID token audience does not include this client',
      ],
      [
        'several audiences have no matching azp',
        createIdToken({ aud: ['other-client', PROVIDER.clientId] }),
        'ID token azp does not match this client',
      ],
      ['the token has expired', createIdToken({ exp: NOW }), 'ID token has expired'],
      ['there is no expiry', createIdToken({ exp: undefined }), 'ID token has expired'],
    ])('Returns a reason instead of claims when %s', (_case, token, reason) => {
      expect(readIdTokenClaims(token, expected)).toStrictEqual({ claimsError: reason })
    })

    it.each([
      [null, 'no ID token in the token response'],
      [123, 'no ID token in the token response'],
      [{}, 'no ID token in the token response'],
      ['a.b.c', 'ID token is not a valid JWT'],
      ['...', 'ID token is not a valid JWT'],
      ['%%%.%%%.%%%', 'ID token is not a valid JWT'],
    ])('Returns a reason without throwing for malformed input %p', (input, reason) => {
      expect(readIdTokenClaims(input, expected)).toStrictEqual({ claimsError: reason })
    })
  })

  describe('hasMFASignal()', () => {
    const acrValues = { acrValues: [ACR.REFEDS_MFA] }
    const amrValues = { amrValues: ['mfa'] }

    it.each([
      {
        name: 'the REFEDS MFA acr',
        claims: { acr: ACR.REFEDS_MFA },
        values: acrValues,
        result: true,
      },
      {
        name: 'a password-only acr',
        claims: { acr: ACR.PASSWORD_ONLY },
        values: acrValues,
        result: false,
      },
      {
        name: 'the REFEDS SFA acr',
        claims: { acr: ACR.REFEDS_SFA },
        values: acrValues,
        result: false,
      },
      { name: 'no acr', claims: {}, values: acrValues, result: false },
      { name: 'an amr with mfa', claims: { amr: ['pwd', 'mfa'] }, values: amrValues, result: true },
      { name: 'an amr without mfa', claims: { amr: ['pwd'] }, values: amrValues, result: false },
      {
        name: 'an amr when only acr values count',
        claims: { amr: ['mfa'] },
        values: acrValues,
        result: false,
      },
    ])('Returns $result for $name', ({ claims, values, result }) => {
      expect(hasMFASignal(claims, values)).toBe(result)
    })
  })
})
