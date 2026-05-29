export interface BoardSession {
  inviteCode: string;
  isLegacy?: boolean;
}

export function normalizeInviteCode(value: string) {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

export function generateInviteCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(8);
  const browserCrypto = globalThis.crypto;

  if (browserCrypto?.getRandomValues) {
    browserCrypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

export function getSessionFindingPath(inviteCode: string, findingId: string) {
  return ["sessions", inviteCode, "findings", findingId] as const;
}

export function getSessionSettingsPath(inviteCode: string) {
  return ["sessions", inviteCode, "settings", "general"] as const;
}
