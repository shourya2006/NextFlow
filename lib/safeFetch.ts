import dns from "dns";
import https from "https";
import net from "net";

const MAX_BYTES = 200 * 1024 * 1024;
const TIMEOUT_MS = 60_000;
const MAX_REDIRECTS = 5;

const blockedAddresses = new net.BlockList();
blockedAddresses.addSubnet("0.0.0.0", 8, "ipv4");
blockedAddresses.addSubnet("10.0.0.0", 8, "ipv4");
blockedAddresses.addSubnet("100.64.0.0", 10, "ipv4");
blockedAddresses.addSubnet("127.0.0.0", 8, "ipv4");
blockedAddresses.addSubnet("169.254.0.0", 16, "ipv4");
blockedAddresses.addSubnet("172.16.0.0", 12, "ipv4");
blockedAddresses.addSubnet("192.0.0.0", 24, "ipv4");
blockedAddresses.addSubnet("192.168.0.0", 16, "ipv4");
blockedAddresses.addSubnet("198.18.0.0", 15, "ipv4");
blockedAddresses.addSubnet("224.0.0.0", 4, "ipv4");
blockedAddresses.addSubnet("240.0.0.0", 4, "ipv4");
blockedAddresses.addAddress("::", "ipv6");
blockedAddresses.addAddress("::1", "ipv6");
blockedAddresses.addSubnet("64:ff9b::", 96, "ipv6");
blockedAddresses.addSubnet("fc00::", 7, "ipv6");
blockedAddresses.addSubnet("fe80::", 10, "ipv6");
blockedAddresses.addSubnet("ff00::", 8, "ipv6");

export function isBlockedAddress(address: string): boolean {
  return blockedAddresses.check(address, net.isIP(address) === 6 ? "ipv6" : "ipv4");
}

// Validating inside the socket's own lookup means the checked address is the one
// connected to, so a hostname can't pass a check and then rebind to a private IP.
const publicOnlyLookup = ((hostname: string, options: any, callback: any) => {
  dns.lookup(hostname, options, (err: Error | null, address: any, family?: number) => {
    if (err) return callback(err);
    const addresses: string[] = Array.isArray(address) ? address.map((a) => a.address) : [address];
    if (addresses.some(isBlockedAddress)) {
      return callback(new Error(`Blocked request to private address for ${hostname}`));
    }
    callback(null, address, family);
  });
}) as net.LookupFunction;

export function assertAllowedUrl(url: URL): void {
  if (url.protocol !== "https:") {
    throw new Error(`Only https URLs are allowed, got ${url.protocol}`);
  }
  // Node skips the lookup function for IP literals, so check those here.
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(host) && isBlockedAddress(host)) {
    throw new Error("Blocked request to private address");
  }
}

type SafeResponse = {
  status: number;
  statusText: string;
  contentType: string;
  location?: string;
  body: Buffer;
};

function requestOnce(url: URL, signal: AbortSignal): Promise<SafeResponse> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { lookup: publicOnlyLookup, signal }, (res) => {
      const status = res.statusCode ?? 0;
      const meta = {
        status,
        statusText: res.statusMessage ?? "",
        contentType: res.headers["content-type"] ?? "",
        location: res.headers.location,
      };

      if (status < 200 || status >= 300) {
        res.resume();
        resolve({ ...meta, body: Buffer.alloc(0) });
        return;
      }

      const chunks: Buffer[] = [];
      let total = 0;
      res.on("data", (chunk: Buffer) => {
        total += chunk.length;
        if (total > MAX_BYTES) {
          res.destroy(new Error(`Response exceeds ${MAX_BYTES} bytes`));
          return;
        }
        chunks.push(chunk);
      });
      res.on("end", () => resolve({ ...meta, body: Buffer.concat(chunks) }));
      res.on("error", reject);
    });
    req.on("error", reject);
  });
}

/** Fetches a user-supplied URL: https only, public addresses only, bounded size and time. */
export async function safeFetch(rawUrl: string): Promise<SafeResponse> {
  const signal = AbortSignal.timeout(TIMEOUT_MS);
  let url = new URL(rawUrl);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    assertAllowedUrl(url);
    const res = await requestOnce(url, signal);
    if (res.status >= 300 && res.status < 400 && res.location) {
      url = new URL(res.location, url);
      continue;
    }
    return res;
  }
  throw new Error("Too many redirects");
}
