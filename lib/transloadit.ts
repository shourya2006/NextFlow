export type TransloaditKind = "image" | "video";

const POLLING: Record<TransloaditKind, { attempts: number; intervalMs: number }> = {
  image: { attempts: 20, intervalMs: 1000 },
  video: { attempts: 60, intervalMs: 2000 },
};

/** Uploads a file using server-signed params. Returns the result URL, or null if there is none. */
export async function uploadToTransloadit(
  kind: TransloaditKind,
  blob: Blob,
  fileName: string
): Promise<string | null> {
  const signRes = await fetch("/api/transloadit/signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind }),
  });
  if (!signRes.ok) throw new Error("Could not authorize upload");
  const { params, signature } = await signRes.json();

  const formData = new FormData();
  formData.append("params", params);
  formData.append("signature", signature);
  formData.append("file", blob, fileName);

  const uploadRes = await fetch("https://api2.transloadit.com/assemblies?wait=true", {
    method: "POST",
    body: formData,
  });
  if (!uploadRes.ok) throw new Error("Upload failed");
  let result = await uploadRes.json();

  if (result.ok === "ASSEMBLY_EXECUTING" && result.assembly_ssl_url) {
    const { attempts, intervalMs } = POLLING[kind];
    for (let i = 0; i < attempts && result.ok === "ASSEMBLY_EXECUTING"; i++) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      const pollRes = await fetch(result.assembly_ssl_url);
      result = await pollRes.json();
    }
  }

  const stepName = kind === "image" ? "resize" : "encode";
  const firstStep = Object.keys(result?.results || {})[0];
  return (
    result?.results?.[stepName]?.[0]?.ssl_url ??
    result?.uploads?.[0]?.ssl_url ??
    (firstStep ? result.results[firstStep]?.[0]?.ssl_url : undefined) ??
    null
  );
}
