import { BlobNotFoundError, get, put } from "@vercel/blob";

type Body = { updatedAt?: string; payload?: unknown; force?: boolean };

const WORKSPACE = "default";

function cors(res: { setHeader: (k: string, v: string) => void }) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function pathFor() {
  return `workspaces/${WORKSPACE}.json`;
}

async function readWorkspace(): Promise<{ updatedAt: string; payload: unknown } | null> {
  try {
    const result = await get(pathFor(), { access: "private", useCache: false });
    if (!result || result.statusCode !== 200) return null;
    const text = await new Response(result.stream).text();
    return JSON.parse(text) as { updatedAt: string; payload: unknown };
  } catch (err) {
    if (err instanceof BlobNotFoundError) return null;
    throw err;
  }
}

export default async function handler(
  req: { method?: string; query: { code?: string }; body?: Body | string },
  res: {
    setHeader: (k: string, v: string) => void;
    status: (n: number) => { json: (o: unknown) => void; end: () => void };
    json: (o: unknown) => void;
  },
) {
  cors(res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    res.status(503).json({ error: "Online baza nije podešena." });
    return;
  }

  try {
    if (req.method === "GET") {
      const data = await readWorkspace();
      if (!data) {
        res.status(404).json({ error: "Nema još sačuvanih podataka." });
        return;
      }
      res.status(200).json(data);
      return;
    }

    if (req.method === "PUT") {
      const raw = req.body;
      const body = (typeof raw === "string" ? (JSON.parse(raw) as Body) : (raw ?? {})) as Body;
      const updatedAt = String(body.updatedAt || "");
      if (!updatedAt || body.payload == null) {
        res.status(400).json({ error: "Nedostaju podaci." });
        return;
      }
      const current = await readWorkspace();
      if (current && current.updatedAt > updatedAt && !body.force) {
        res.status(409).json({
          error: "Na serveru je novija verzija.",
          ...current,
        });
        return;
      }
      const next = { updatedAt, payload: body.payload };
      await put(pathFor(), JSON.stringify(next), {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
        cacheControlMaxAge: 0,
      });
      res.status(200).json({ ok: true, updatedAt });
      return;
    }

    res.status(405).json({ error: "Metoda nije dozvoljena." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Greška pri čuvanju podataka." });
  }
}
