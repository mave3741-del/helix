import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PROVIDER_DEFS, last4, type ConnectionState, type ProviderPublic } from "./providers";

const DIR = join(process.cwd(), ".helix");
const FILE = join(DIR, "credentials.json");
const KEYFILE = join(DIR, "master.key");

export interface StoredCredential {
  providerId: string;
  last4: string;
  endpoint: string;
  model: string;
  cipher: string;
  iv: string;
  tag: string;
  updatedAt: number;
  connection: ConnectionState;
  lastProbeAt: number | null;
  lastError: string | null;
  latencyMs: number | null;
  discoveredModels: string[];
}

export type PublicCredential = ProviderPublic;

interface Vault {
  providers: Record<string, StoredCredential>;
}

function masterKey(): Buffer {
  mkdirSync(DIR, { recursive: true });
  const fromEnv = process.env.HELIX_MASTER_KEY;
  if (fromEnv && fromEnv.length >= 16) return scryptSync(fromEnv, "helix-cred-v1", 32);
  if (existsSync(KEYFILE)) return Buffer.from(readFileSync(KEYFILE, "utf8").trim(), "hex");
  const raw = randomBytes(32);
  writeFileSync(KEYFILE, raw.toString("hex"), { mode: 0o600 });
  return raw;
}

function encrypt(plain: string): { cipher: string; iv: string; tag: string } {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", masterKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { cipher: enc.toString("base64"), iv: iv.toString("base64"), tag: tag.toString("base64") };
}

function decrypt(row: StoredCredential): string {
  const decipher = createDecipheriv("aes-256-gcm", masterKey(), Buffer.from(row.iv, "base64"));
  decipher.setAuthTag(Buffer.from(row.tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(row.cipher, "base64")), decipher.final()]).toString("utf8");
}

function loadVault(): Vault {
  try {
    if (!existsSync(FILE)) return { providers: {} };
    const parsed = JSON.parse(readFileSync(FILE, "utf8")) as Vault;
    if (!parsed || typeof parsed !== "object" || !parsed.providers) return { providers: {} };
    return parsed;
  } catch {
    return { providers: {} };
  }
}

function saveVault(vault: Vault) {
  mkdirSync(DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(vault), { mode: 0o600 });
}

function envFor(def: (typeof PROVIDER_DEFS)[number]) {
  const key = def.envKey ? process.env[def.envKey] : undefined;
  const base = def.envBase ? process.env[def.envBase] : undefined;
  const model = def.envModel ? process.env[def.envModel] : undefined;
  return { key, base, model };
}

export function listPublicCredentials(): PublicCredential[] {
  const vault = loadVault();
  return PROVIDER_DEFS.map((def) => {
    const stored = vault.providers[def.id] as StoredCredential | undefined;
    const env = envFor(def);
    const configured = Boolean(stored || env.key || env.base || def.kind === "local" || def.kind === "heuristic");
    const source: PublicCredential["source"] = stored ? "owner" : env.key || env.base ? "environment" : "none";
    return {
      providerId: def.id,
      name: def.name,
      kind: def.kind,
      configured,
      source: def.kind === "heuristic" ? "none" : source,
      last4: stored ? stored.last4 : env.key ? "env" : "",
      endpoint: stored?.endpoint || env.base || def.defaultBase,
      model: stored?.model || env.model || def.defaultModel,
      needsKey: def.needsKey,
      connection:
        def.kind === "heuristic"
          ? "connected"
          : stored?.connection ?? (configured ? "untested" : "not_configured"),
      lastProbeAt: stored?.lastProbeAt ?? null,
      lastError: stored?.lastError ?? (configured ? null : "Not configured"),
      latencyMs: stored?.latencyMs ?? null,
      discoveredModels: stored?.discoveredModels ?? [],
      capabilities: def.capabilities,
      notes: def.notes,
    };
  });
}

export function saveOwnerCredential(input: {
  providerId: string;
  apiKey?: string;
  endpoint?: string;
  model?: string;
}): PublicCredential {
  const def = PROVIDER_DEFS.find((p) => p.id === input.providerId);
  if (!def) throw new Error("Unknown provider");
  const vault = loadVault();
  const existing = vault.providers[def.id];
  const key = (input.apiKey ?? "").trim();
  const keep = existing && !key ? decrypt(existing) : key;
  if (def.needsKey && !keep && def.kind !== "local") {
    throw new Error("API key required");
  }
  const secret = keep || (def.kind === "local" ? "local" : "");
  const enc = encrypt(secret);
  vault.providers[def.id] = {
    providerId: def.id,
    last4: secret === "local" ? "" : last4(secret),
    endpoint: (input.endpoint ?? existing?.endpoint ?? def.defaultBase).trim(),
    model: (input.model ?? existing?.model ?? def.defaultModel).trim(),
    cipher: enc.cipher,
    iv: enc.iv,
    tag: enc.tag,
    updatedAt: Date.now(),
    connection: "untested",
    lastProbeAt: null,
    lastError: null,
    latencyMs: null,
    discoveredModels: existing?.discoveredModels ?? [],
  };
  saveVault(vault);
  return listPublicCredentials().find((p) => p.providerId === def.id)!;
}

export function deleteOwnerCredential(providerId: string) {
  const vault = loadVault();
  delete vault.providers[providerId];
  saveVault(vault);
}

export function resolveSecret(providerId: string): {
  key: string | undefined;
  base: string;
  model: string;
} | null {
  const def = PROVIDER_DEFS.find((p) => p.id === providerId);
  if (!def) return null;
  if (def.kind === "heuristic") return { key: undefined, base: "", model: "local-heuristic" };
  const vault = loadVault();
  const stored = vault.providers[providerId];
  const env = envFor(def);
  const key = stored ? decrypt(stored) : env.key;
  const base = stored?.endpoint || env.base || def.defaultBase;
  const model = stored?.model || env.model || def.defaultModel;
  if (!base) return null;
  if (def.needsKey && !key) return null;
  if (def.kind === "local" && !base) return null;
  return { key: key || (def.kind === "local" ? "local" : undefined), base, model };
}

export function recordProbe(
  providerId: string,
  patch: Partial<Pick<StoredCredential, "connection" | "lastError" | "latencyMs" | "discoveredModels">>,
) {
  const vault = loadVault();
  const row = vault.providers[providerId];
  if (!row) {
    vault.providers[providerId] = {
      providerId,
      last4: "",
      endpoint: PROVIDER_DEFS.find((p) => p.id === providerId)?.defaultBase ?? "",
      model: PROVIDER_DEFS.find((p) => p.id === providerId)?.defaultModel ?? "",
      cipher: "",
      iv: "",
      tag: "",
      updatedAt: Date.now(),
      connection: patch.connection ?? "untested",
      lastProbeAt: Date.now(),
      lastError: patch.lastError ?? null,
      latencyMs: patch.latencyMs ?? null,
      discoveredModels: patch.discoveredModels ?? [],
    };
    // Don't persist empty cipher rows for env-only probes.
    if (!row && !vault.providers[providerId].cipher) {
      // keep in-memory only via return; still write probe metadata if credential exists
    }
  } else {
    Object.assign(row, patch, { lastProbeAt: Date.now() });
    saveVault(vault);
  }
  if (row) saveVault(vault);
}

export function secretsLeak(text: string) {
  const vault = loadVault();
  for (const row of Object.values(vault.providers)) {
    if (!row.cipher) continue;
    try {
      const secret = decrypt(row);
      if (secret.length > 8 && text.includes(secret)) return true;
    } catch {
      /* ignore */
    }
  }
  for (const def of PROVIDER_DEFS) {
    if (!def.envKey) continue;
    const v = process.env[def.envKey];
    if (v && v.length > 8 && text.includes(v)) return true;
  }
  return false;
}
