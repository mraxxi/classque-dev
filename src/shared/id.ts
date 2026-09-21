export function generateId(): string {
  // Simple ULID implementation for Edge (Crypto API)
  // Time component
  const now = Date.now();
  let timeStr = '';
  let time = now;
  for (let i = 0; i < 10; i++) {
    timeStr = ENCODING[time % 32] + timeStr;
    time = Math.floor(time / 32);
  }

  // Random component
  const randomBytes = new Uint8Array(10);
  crypto.getRandomValues(randomBytes);
  let randStr = '';
  for (let i = 0; i < 16; i++) {
    // 5 bits per char
    const bitIndex = i * 5;
    const byteIndex = Math.floor(bitIndex / 8);
    const bitOffset = bitIndex % 8;
    
    let val = 0;
    if (bitOffset <= 3) {
      val = (randomBytes[byteIndex] >> (3 - bitOffset)) & 0x1f;
    } else {
      const shift1 = bitOffset - 3;
      const shift2 = 8 - shift1;
      val = ((randomBytes[byteIndex] << shift1) & 0x1f) | (randomBytes[byteIndex + 1] >> shift2);
    }
    randStr += ENCODING[val];
  }

  return timeStr + randStr;
}

const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
