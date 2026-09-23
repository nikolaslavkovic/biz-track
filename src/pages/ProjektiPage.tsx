import { useRef, useState, type FormEvent } from "react";
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, GripVertical, Pencil } from "lucide-react";
import { db, setEurToRsdRate, type Project } from "../db";
import { Button, Card, Field, Input, Select } from "../components/ui";
import type { DashboardData } from "../lib/data";
import {
  HALL_WIDTH_COLORS,
  PROJECT_STATUSES,
  ROOF_TYPES,
  SALE_CURRENCIES,
  cn,
  formatDate,
  formatDimensions,
  formatMoney,
  formatSalePrice,
  hallColor,
  projectRate,
  roofLabel,
  todayISO,
} from "../lib/utils";

const verticalOnly: Modifier = ({ transform }) => ({ ...transform, x: 0 });

function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort(
    (a, b) =>
      (a.sortOrder ?? a.id ?? 0) - (b.sortOrder ?? b.id ?? 0) ||
      (a.id ?? 0) - (b.id ?? 0),
  );
}

function statusLabel(value: string): string {
  return PROJECT_STATUSES.find((s) => s.value === value)?.label ?? value;
}

export function ProjektiPage({
  data,
  onChange,
}: {
  data: DashboardData;
  onChange: () => Promise<void>;
}) {
  const { projects, eurToRsd } = data;
  const [rate, setRate] = useState(String(eurToRsd));
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [orderOverride, setOrderOverride] = useState<number[] | null>(null);
  const suppressClickUntil = useRef(0);

  const sorted = sortProjects(projects);
  const ordered = orderOverride
    ? orderOverride
        .map((id) => sorted.find((p) => p.id === id))
        .filter((p): p is Project => !!p)
    : sorted;

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  );

  function toggle(id: number) {
    if (Date.now() < suppressClickUntil.current) return;
    setEditingId(null);
    setSelectedId((cur) => (cur === id ? null : id));
  }

  async function handleDragEnd(e: DragEndEvent) {
    suppressClickUntil.current = Date.now() + 400;
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = ordered.map((p) => p.id!);
    const next = arrayMove(
      ids,
      ids.indexOf(Number(active.id)),
      ids.indexOf(Number(over.id)),
    );
    setOrderOverride(next);
    await db.transaction("rw", db.projects, async () => {
      await Promise.all(
        next.map((id, index) => db.projects.update(id, { sortOrder: index + 1 })),
      );
    });
    await onChange();
    setOrderOverride(null);
  }

  async function saveRate(e: FormEvent) {
    e.preventDefault();
    await setEurToRsdRate(Number(rate));
    await onChange();
  }

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const maxOrder = projects.reduce(
      (m, p) => Math.max(m, p.sortOrder ?? p.id ?? 0),
      0,
    );
    const id = await db.projects.add({
      name: String(fd.get("name") || "").trim(),
      client: String(fd.get("client") || "").trim(),
      clientPhone: String(fd.get("clientPhone") || "").trim(),
      description: "",
      startDate: String(fd.get("startDate") || todayISO()),
      endDate: String(fd.get("endDate") || "") || null,
      status: String(fd.get("status") || "aktivan") as Project["status"],
      revenue: Number(fd.get("revenue") || 0),
      advance: Number(fd.get("advance") || 0),
      revenueCurrency: String(
        fd.get("revenueCurrency") || "RSD",
      ) as Project["revenueCurrency"],
      eurRateAtSale: eurToRsd,
      lengthM: Number(fd.get("lengthM") || 0),
      widthM: Number(fd.get("widthM") || 0),
      heightM: Number(fd.get("heightM") || 0),
      roofType: String(fd.get("roofType") || "dve_vode") as Project["roofType"],
      sortOrder: maxOrder + 1,
      createdAt: new Date().toISOString(),
    });
    form.reset();
    setSelectedId(id as number);
    setEditingId(null);
    await onChange();
  }

  async function update(e: FormEvent<HTMLFormElement>, id: number) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await db.projects.update(id, {
      name: String(fd.get("name") || "").trim(),
      client: String(fd.get("client") || "").trim(),
      clientPhone: String(fd.get("clientPhone") || "").trim(),
      description: String(fd.get("description") || "").trim(),
      startDate: String(fd.get("startDate")),
      endDate: String(fd.get("endDate") || "") || null,
      status: String(fd.get("status") || "aktivan") as Project["status"],
      revenue: Number(fd.get("revenue") || 0),
      advance: Number(fd.get("advance") || 0),
      revenueCurrency: String(
        fd.get("revenueCurrency") || "RSD",
      ) as Project["revenueCurrency"],
      lengthM: Number(fd.get("lengthM") || 0),
      widthM: Number(fd.get("widthM") || 0),
      heightM: Number(fd.get("heightM") || 0),
      roofType: String(fd.get("roofType") || "dve_vode") as Project["roofType"],
    });
    setEditingId(null);
    await onChange();
  }

  async function remove(id: number) {
    if (!confirm("Obrisati porudžbinu?")) return;
    await db.projects.delete(id);
    if (selectedId === id) setSelectedId(null);
    setEditingId(null);
    await onChange();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold sm:text-2xl">
          Hale — porudžbine
        </h1>
        <p className="mt-0.5 text-xs text-[var(--muted)]">
          Dodirni halu za detalje · zadrži i prevuci da promeniš redosled
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Poručene hale ({ordered.length})
        </h2>

        {ordered.length === 0 ? (
          <Card>
            <p className="text-sm text-[var(--muted)]">Još nema porudžbina.</p>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[verticalOnly]}
            onDragStart={() => {
              setSelectedId(null);
              setEditingId(null);
            }}
            onDragEnd={(e) => void handleDragEnd(e)}
            onDragCancel={() => {
              suppressClickUntil.current = Date.now() + 400;
            }}
          >
            <SortableContext
              items={ordered.map((p) => p.id!)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-1.5">
                {ordered.map((p, index) => (
                  <HallRow
                    key={p.id}
                    project={p}
                    index={index}
                    open={selectedId === p.id}
                    editing={editingId === p.id}
                    eurToRsd={eurToRsd}
                    onToggle={() => toggle(p.id!)}
                    onEdit={() => setEditingId(p.id!)}
                    onCancelEdit={() => setEditingId(null)}
                    onSave={(e) => update(e, p.id!)}
                    onRemove={() => remove(p.id!)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}

        <div className="flex flex-wrap gap-2 pt-1 text-[10px] text-[var(--muted)]">
          {Object.entries(HALL_WIDTH_COLORS).map(([w, c]) => (
            <span key={w} className="inline-flex items-center gap-1">
              <span
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: c.chip }}
              />
              {w}m
            </span>
          ))}
          <span className="inline-flex items-center gap-1">
            <span className="h-3 w-5 rounded border-2 border-slate-500 border-solid" />
            2 vode
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-3 w-5 rounded border-2 border-slate-500 border-dashed" />
            1 voda
          </span>
        </div>
      </section>

      <Card>
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-lg font-semibold">
          Nova porudžbina
        </h2>
        <p className="mb-3 text-xs text-[var(--muted)]">
          EUR cena koristi trenutni kurs ({eurToRsd}) i zaključava se na
          porudžbini.
        </p>
        <form
          onSubmit={create}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          <Field label="Naziv">
            <Input name="name" required placeholder="Hala Petrović" />
          </Field>
          <Field label="Klijent">
            <Input name="client" required />
          </Field>
          <Field label="Telefon">
            <Input name="clientPhone" />
          </Field>
          <Field label="Širina (m)">
            <Input name="widthM" type="number" step="0.1" required />
          </Field>
          <Field label="Dužina (m)">
            <Input name="lengthM" type="number" step="0.1" required />
          </Field>
          <Field label="Visina (m)">
            <Input name="heightM" type="number" step="0.1" required />
          </Field>
          <Field label="Krov">
            <Select name="roofType" defaultValue="dve_vode">
              {ROOF_TYPES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Prodajna cena">
            <Input name="revenue" type="number" step="0.01" required />
          </Field>
          <Field label="Valuta">
            <Select name="revenueCurrency" defaultValue="RSD">
              {SALE_CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Avans (opciono)">
            <Input
              name="advance"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0"
            />
          </Field>
          <Field label="Status">
            <Select name="status" defaultValue="aktivan">
              {PROJECT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Početak">
            <Input
              name="startDate"
              type="date"
              defaultValue={todayISO()}
              required
            />
          </Field>
          <Field label="Završetak">
            <Input name="endDate" type="date" />
          </Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <Button type="submit">Sačuvaj porudžbinu</Button>
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Kurs EUR → RSD
        </h2>
        <p className="mt-1 mb-3 text-xs text-[var(--muted)]">
          Važi samo za <strong>nove</strong> porudžbine. Stare EUR hale ostaju
          na kursu koji je važio kad su unete.
        </p>
        <form onSubmit={saveRate} className="flex flex-wrap items-end gap-2">
          <Field label="1 EUR =">
            <Input
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              type="number"
              min="1"
              step="0.01"
              required
              className="w-36"
            />
          </Field>
          <span className="mb-2 text-sm text-[var(--muted)]">RSD</span>
          <Button type="submit" variant="secondary">
            Sačuvaj kurs
          </Button>
        </form>
      </Card>
    </div>
  );
}

function HallRow({
  project: p,
  index,
  open,
  editing,
  eurToRsd,
  onToggle,
  onEdit,
  onCancelEdit,
  onSave,
  onRemove,
}: {
  project: Project;
  index: number;
  open: boolean;
  editing: boolean;
  eurToRsd: number;
  onToggle: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (e: FormEvent<HTMLFormElement>) => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: p.id! });
  const colors = hallColor(p.widthM);
  const dashed = p.roofType === "jedna_voda";
  const done = p.status === "zavrsen";

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 20 : undefined,
        position: "relative",
      }}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          "flex w-full touch-manipulation select-none items-center gap-2 border-2 px-2 py-1.5 text-left transition-shadow [-webkit-touch-callout:none]",
          open ? "rounded-t-lg border-b-0" : "rounded-lg",
          isDragging && "scale-[1.02] shadow-lg",
          done && !open && "opacity-60",
        )}
        style={{
          backgroundColor: colors.bg,
          borderColor: colors.border,
          borderStyle: dashed ? "dashed" : "solid",
          color: colors.text,
        }}
      >
        <GripVertical className="h-4 w-4 shrink-0 opacity-40" />
        <span
          className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md px-1 text-[11px] font-bold text-white"
          style={{ backgroundColor: colors.chip }}
        >
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-[family-name:var(--font-display)] text-sm font-bold leading-tight tracking-tight">
            {formatDimensions(p.lengthM, p.widthM, p.heightM)}
          </p>
          <p className="truncate text-[11px] leading-tight opacity-75">
            {p.roofType === "jedna_voda" ? "1 voda" : "2 vode"}
            {p.client ? ` · ${p.client}` : ""}
            {p.status !== "aktivan" ? ` · ${statusLabel(p.status)}` : ""}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 opacity-60 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div
          className="rounded-b-lg border-2 border-t-0 bg-[var(--surface)] px-3 pt-2 pb-3"
          style={{
            borderColor: colors.border,
            borderStyle: dashed ? "dashed" : "solid",
          }}
        >
          {editing ? (
            <HallEditForm
              project={p}
              eurToRsd={eurToRsd}
              onSubmit={onSave}
              onCancel={onCancelEdit}
              onRemove={onRemove}
            />
          ) : (
            <HallDetails project={p} eurToRsd={eurToRsd} onEdit={onEdit} />
          )}
        </div>
      ) : null}
    </li>
  );
}

function DetailItem({
  label,
  children,
  wide,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={cn("min-w-0", wide && "col-span-2")}>
      <dt className="text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">
        {label}
      </dt>
      <dd className="break-words text-[13px] font-medium leading-snug">
        {children}
      </dd>
    </div>
  );
}

function HallDetails({
  project: p,
  eurToRsd,
  onEdit,
}: {
  project: Project;
  eurToRsd: number;
  onEdit: () => void;
}) {
  return (
    <div className="space-y-2.5">
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
        <DetailItem label="Naziv">{p.name || "—"}</DetailItem>
        <DetailItem label="Status">{statusLabel(p.status)}</DetailItem>
        <DetailItem label="Klijent">{p.client || "—"}</DetailItem>
        <DetailItem label="Telefon">
          {p.clientPhone ? (
            <a
              href={`tel:${p.clientPhone.replace(/\s+/g, "")}`}
              className="text-[var(--accent)] underline-offset-2 hover:underline"
            >
              {p.clientPhone}
            </a>
          ) : (
            "—"
          )}
        </DetailItem>
        <DetailItem label="Dimenzije (D × Š × V)">
          {formatDimensions(p.lengthM, p.widthM, p.heightM)}
        </DetailItem>
        <DetailItem label="Krov">{roofLabel(p.roofType)}</DetailItem>
        <DetailItem label="Cena" wide>
          <span className="text-[var(--accent)]">
            {formatSalePrice(p.revenue, p.revenueCurrency, projectRate(p, eurToRsd))}
          </span>
        </DetailItem>
        {p.advance ? (
          <>
            <DetailItem label="Avans">
              {formatMoney(p.advance, p.revenueCurrency)}
            </DetailItem>
            <DetailItem label="Preostalo">
              <span className="font-semibold">
                {formatMoney(p.revenue - p.advance, p.revenueCurrency)}
              </span>
            </DetailItem>
          </>
        ) : null}
        <DetailItem label="Početak">{formatDate(p.startDate)}</DetailItem>
        <DetailItem label="Završetak">{formatDate(p.endDate)}</DetailItem>
        {p.description ? (
          <DetailItem label="Opis" wide>
            {p.description}
          </DetailItem>
        ) : null}
      </dl>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="w-full"
        onClick={onEdit}
      >
        <Pencil className="h-3.5 w-3.5" />
        Izmeni
      </Button>
    </div>
  );
}

function HallEditForm({
  project: p,
  eurToRsd,
  onSubmit,
  onCancel,
  onRemove,
}: {
  project: Project;
  eurToRsd: number;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  onRemove: () => void;
}) {
  return (
    <form key={p.id} onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Naziv" className="col-span-2">
          <Input name="name" defaultValue={p.name} required />
        </Field>
        <Field label="Klijent">
          <Input name="client" defaultValue={p.client} />
        </Field>
        <Field label="Telefon">
          <Input name="clientPhone" defaultValue={p.clientPhone} />
        </Field>
        <Field label="Dužina (m)">
          <Input name="lengthM" type="number" step="0.1" defaultValue={p.lengthM} />
        </Field>
        <Field label="Širina (m)">
          <Input name="widthM" type="number" step="0.1" defaultValue={p.widthM} />
        </Field>
        <Field label="Visina (m)">
          <Input name="heightM" type="number" step="0.1" defaultValue={p.heightM} />
        </Field>
        <Field label="Krov">
          <Select name="roofType" defaultValue={p.roofType}>
            {ROOF_TYPES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Cena">
          <Input name="revenue" type="number" step="0.01" defaultValue={p.revenue} />
        </Field>
        <Field label="Valuta">
          <Select name="revenueCurrency" defaultValue={p.revenueCurrency}>
            {SALE_CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Avans">
          <Input
            name="advance"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            defaultValue={p.advance || ""}
            placeholder="0"
          />
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue={p.status}>
            {PROJECT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Početak">
          <Input name="startDate" type="date" defaultValue={p.startDate} />
        </Field>
        <Field label="Završetak">
          <Input name="endDate" type="date" defaultValue={p.endDate ?? ""} />
        </Field>
        <Field label="Opis" className="col-span-2">
          <Input name="description" defaultValue={p.description} placeholder="opciono" />
        </Field>
      </div>
      {p.revenueCurrency === "EUR" ? (
        <p className="text-[11px] text-[var(--muted)]">
          Zaključan kurs: <strong>1 EUR = {projectRate(p, eurToRsd)} RSD</strong>
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm">
          Sačuvaj
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={onCancel}>
          Otkaži
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="ml-auto text-[var(--danger)]"
          onClick={onRemove}
        >
          Obriši
        </Button>
      </div>
    </form>
  );
}
