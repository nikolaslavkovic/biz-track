import { BlobNotFoundError, get, put } from "@vercel/blob";

type Body = { code?: string; updatedAt?: string; payload?: unknown };

const CODE = /^[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/;

function cors(res: { setHeader: (k: string, v: string) => void }) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function pathFor(code: string) {
  return `workspaces/${code}.json`;
}

async function readWorkspace(code: string): Promise<{ updatedAt: string; payload: unknown } | null> {
  try {
    const result = await get(pathFor(code), { access: "private", useCache: false });
    if (!result || result.statusCode !== 200) return null;
    const text = await new Response(result.stream).text();
    return JSON.parse(text) as { updatedAt: string; payload: unknown };
  } catch (err) {
    if (err instanceof BlobNotFoundError) return null;
    throw err;
  }
}

export default async function handler(
  req: { method?: string; query: { code?: string }; body?: Body },
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
      const code = String(req.query.code || "").toLowerCase();
      if (!CODE.test(code)) {
        res.status(400).json({ error: "Neispravna šifra." });
        return;
      }
      const data = await readWorkspace(code);
      if (!data) {
        res.status(404).json({ error: "Nema podataka za ovu šifru." });
        return;
      }
      res.status(200).json(data);
      return;
    }

    if (req.method === "PUT") {
      const raw = req.body;
      const body = (typeof raw === "string" ? (JSON.parse(raw) as Body) : (raw ?? {})) as Body;
      const code = String(body.code || "").toLowerCase();
      const updatedAt = String(body.updatedAt || "");
      if (!CODE.test(code) || !updatedAt || body.payload == null) {
        res.status(400).json({ error: "Nedostaje šifra ili podaci." });
        return;
      }
      const current = await readWorkspace(code);
      if (current && current.updatedAt > updatedAt) {
        res.status(409).json({
          error: "Na serveru je novija verzija.",
          ...current,
        });
        return;
      }
      const next = { updatedAt, payload: body.payload };
      await put(pathFor(code), JSON.stringify(next), {
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
    res.status(500).json({ error: "Greška pri sinhronizaciji." });
  }
}
