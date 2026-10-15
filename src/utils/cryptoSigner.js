/**
 * VAULTCHAIN — Digital Signature & Cryptographic Utility
 * Uses native Web Crypto API (ECDSA P-256 + SHA-256)
 *
 * Security Guarantee:
 * - User private keys are generated on-device and stored only in client storage.
 * - Private keys are NEVER sent to the backend or stored on the blockchain.
 * - Consistent canonical transaction serialization ensures tamper-evident hashes.
 */

// ─── Helpers: ArrayBuffer <-> Hex ───────────────────────────────────────────
export function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBuffer(hex) {
  const clean = hex.replace(/\s+/g, '');
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

// ─── SHA-256 Hashing ────────────────────────────────────────────────────────
export async function computeSha256(dataString) {
  const encoder = new TextEncoder();
  const data = encoder.encode(dataString);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

// ─── Canonical Representation ───────────────────────────────────────────────
export function createCanonicalRepresentation({ transactionId, fromAccount, toAccount, amount, timestamp, nonce }) {
  const cleanTxId   = (transactionId || '').trim();
  const cleanFrom   = (fromAccount || '').trim();
  const cleanTo     = (toAccount || '').trim();
  const numAmount   = parseFloat(amount || 0);
  const cleanAmount = isNaN(numAmount) ? '0' : String(Number(numAmount.toFixed(4)).toString());
  const cleanNonce  = (nonce || '').trim();

  return `transactionId:${cleanTxId}|fromAccount:${cleanFrom}|toAccount:${cleanTo}|amount:${cleanAmount}|timestamp:${timestamp}|nonce:${cleanNonce}`;
}

// ─── Keypair Management (ECDSA P-256) ─────────────────────────────────────────
const STORAGE_PREFIX = 'vaultchain_ecdsa_key_';

export async function getOrCreateKeypair(userEmail = 'default') {
  const key = `${STORAGE_PREFIX}${userEmail.toLowerCase().trim()}`;
  const stored = localStorage.getItem(key);

  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.publicKeyHex && parsed.privateKeyJwk) {
        return parsed;
      }
    } catch (e) {
      console.warn('Corrupted local keypair, regenerating...', e);
    }
  }

  // Generate new ECDSA P-256 keypair
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    true, // extractable
    ['sign', 'verify']
  );

  // Export public key as SPKI (SubjectPublicKeyInfo) in Hex (compatible with Java X509EncodedKeySpec)
  const spkiBuffer = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
  const publicKeyHex = bufferToHex(spkiBuffer);

  // Export private key as JWK for client-side persistence
  const privateKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);

  const payload = {
    publicKeyHex,
    privateKeyJwk,
    algorithm: 'ECDSA-P256-SHA256',
    createdAt: new Date().toISOString()
  };

  localStorage.setItem(key, JSON.stringify(payload));
  return payload;
}

export function getUserPublicKey(userEmail = 'default') {
  const key = `${STORAGE_PREFIX}${userEmail.toLowerCase().trim()}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored).publicKeyHex;
    } catch {
      // Return null on JSON parse failure
      return null;
    }
  }
  return null;
}

// ─── Digital Transaction Signing ────────────────────────────────────────────
export async function signTransaction({ transactionId, fromAccount, toAccount, amount, timestamp, nonce, userEmail }) {
  const email = userEmail || localStorage.getItem('userEmail') || 'default';
  const keypair = await getOrCreateKeypair(email);

  const finalTxId = transactionId || `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const finalTimestamp = timestamp || Math.floor(Date.now() / 1000);
  const finalNonce = nonce || `nonce_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // 1. Build canonical payload
  const canonicalPayload = createCanonicalRepresentation({
    transactionId: finalTxId,
    fromAccount,
    toAccount,
    amount,
    timestamp: finalTimestamp,
    nonce: finalNonce
  });

  // 2. Generate SHA-256 hash of canonical payload
  const transactionHash = await computeSha256(canonicalPayload);

  // 3. Import private key to WebCrypto
  const privateKey = await window.crypto.subtle.importKey(
    'jwk',
    keypair.privateKeyJwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  // 4. Digitally sign the canonical payload
  const encoder = new TextEncoder();
  const dataToSign = encoder.encode(canonicalPayload);

  const signatureBuffer = await window.crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: { name: 'SHA-256' }
    },
    privateKey,
    dataToSign
  );

  const digitalSignature = bufferToHex(signatureBuffer);

  return {
    transactionId: finalTxId,
    fromAccount,
    toAccount,
    amount,
    timestamp: finalTimestamp,
    nonce: finalNonce,
    canonicalPayload,
    transactionHash,
    digitalSignature,
    publicKey: keypair.publicKeyHex,
    algorithm: 'ECDSA-P256-SHA256'
  };
}

// ─── Client-Side Verification ───────────────────────────────────────────────
export async function verifySignatureLocally(signedData) {
  try {
    const {
      transactionId, fromAccount, toAccount, amount, timestamp, nonce,
      transactionHash, digitalSignature, publicKey
    } = signedData;

    // 1. Check hash integrity
    const recomputedCanonical = createCanonicalRepresentation({
      transactionId, fromAccount, toAccount, amount, timestamp, nonce
    });
    const recomputedHash = await computeSha256(recomputedCanonical);

    if (recomputedHash.toLowerCase() !== (transactionHash || '').toLowerCase()) {
      return {
        valid: false,
        status: 'TAMPERED',
        reason: 'Transaction details do not match the signed hash. Content was tampered with.',
        recomputedHash,
        providedHash: transactionHash
      };
    }

    // 2. Import public key
    const spkiBuffer = hexToBuffer(publicKey);
    const pubKey = await window.crypto.subtle.importKey(
      'spki',
      spkiBuffer,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify']
    );

    // 3. Verify signature
    const sigBuffer = hexToBuffer(digitalSignature);
    const encoder = new TextEncoder();
    const dataToVerify = encoder.encode(recomputedCanonical);

    const isValid = await window.crypto.subtle.verify(
      { name: 'ECDSA', hash: { name: 'SHA-256' } },
      pubKey,
      sigBuffer,
      dataToVerify
    );

    return {
      valid: isValid,
      status: isValid ? 'VERIFIED' : 'INVALID_SIGNATURE',
      reason: isValid ? 'Cryptographically verified via ECDSA P-256.' : 'Signature does not match public key or data.',
      recomputedHash,
      providedHash: transactionHash
    };
  } catch (err) {
    return {
      valid: false,
      status: 'VERIFICATION_ERROR',
      reason: 'Cryptographic error: ' + err.message
    };
  }
}
