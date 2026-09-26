import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { locationsApi, Location } from "../api/locations";
import { warehousesApi } from "../api/warehouses";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { Table } from "../components/Table";
import { Modal } from "../components/Modal";
import { FieldWrapper, Input, Select } from "../components/FormField";
import { LoadingState, ErrorMessage, EmptyState } from "../components/States";

export default function LocationsPage() {
  const queryClient = useQueryClient();
  const [warehouseFilter, setWarehouseFilter] = useState("");

  const { data: warehouses } = useQuery({ queryKey: ["warehouses"], queryFn: warehousesApi.list });
  const { data, isLoading, error } = useQuery({
    queryKey: ["locations", warehouseFilter],
    queryFn: () => locationsApi.list(warehouseFilter || undefined),
  });

  const [editing, setEditing] = useState<Location | "new" | null>(null);
  const [form, setForm] = useState({ name: "", code: "", warehouseId: "" });
  const [formError, setFormError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: () =>
      editing === "new" ? locationsApi.create(form) : locationsApi.update((editing as Location).id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      setEditing(null);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  function openNew() {
    setForm({ name: "", code: "", warehouseId: warehouses?.[0]?.id || "" });
    setFormError(null);
    setEditing("new");
  }

  function openEdit(l: Location) {
    setForm({ name: l.name, code: l.code, warehouseId: l.warehouseId });
    setFormError(null);
    setEditing(l);
  }

  return (
    <div>
      <PageHeader
        title="Locations"
        description="Racks, bins, or floor areas that belong to a warehouse."
        actions={<Button onClick={openNew}>Add Location</Button>}
      />

      <div className="mb-4 flex gap-2">
        <Select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} className="w-56">
          <option value="">All warehouses</option>
          {warehouses?.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </Select>
      </div>

      {isLoading && <LoadingState />}
      {error && <ErrorMessage message={(error as Error).message} />}
      {data && data.length === 0 && (
        <EmptyState title="No locations yet" description="Add a location to start receiving and storing stock." />
      )}

      {data && data.length > 0 && (
        <Table
          rows={data}
          rowKey={(l) => l.id}
          columns={[
            { header: "Name", render: (l) => <span className="font-medium text-slate-900">{l.name}</span> },
            { header: "Code", render: (l) => <span className="tabular-nums text-slate-500">{l.code}</span> },
            { header: "Warehouse", render: (l) => l.warehouse.name },
            {
              header: "Actions",
              align: "right",
              render: (l) => (
                <button className="text-sm text-primary hover:underline" onClick={() => openEdit(l)}>
                  Edit
                </button>
              ),
            },
          ]}
        />
      )}

      {editing && (
        <Modal title={editing === "new" ? "Add Location" : "Edit Location"} onClose={() => setEditing(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
            className="space-y-4"
          >
            {formError && <ErrorMessage message={formError} />}
            <FieldWrapper label="Warehouse">
              <Select
                value={form.warehouseId}
                onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
                required
              >
                <option value="" disabled>
                  Select a warehouse
                </option>
                {warehouses?.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
            <FieldWrapper label="Name">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
            </FieldWrapper>
            <FieldWrapper label="Code">
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            </FieldWrapper>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
