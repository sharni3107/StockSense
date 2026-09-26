import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { warehousesApi, Warehouse } from "../api/warehouses";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { Table } from "../components/Table";
import { Modal } from "../components/Modal";
import { FieldWrapper, Input } from "../components/FormField";
import { LoadingState, ErrorMessage, EmptyState } from "../components/States";

export default function WarehousesPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["warehouses"], queryFn: warehousesApi.list });

  const [editing, setEditing] = useState<Warehouse | "new" | null>(null);
  const [form, setForm] = useState({ name: "", code: "", address: "" });
  const [formError, setFormError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: () =>
      editing === "new" ? warehousesApi.create(form) : warehousesApi.update((editing as Warehouse).id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      setEditing(null);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  function openNew() {
    setForm({ name: "", code: "", address: "" });
    setFormError(null);
    setEditing("new");
  }

  function openEdit(w: Warehouse) {
    setForm({ name: w.name, code: w.code, address: w.address || "" });
    setFormError(null);
    setEditing(w);
  }

  return (
    <div>
      <PageHeader
        title="Warehouses"
        description="Physical sites that contain your storage locations."
        actions={<Button onClick={openNew}>Add Warehouse</Button>}
      />

      {isLoading && <LoadingState />}
      {error && <ErrorMessage message={(error as Error).message} />}
      {data && data.length === 0 && (
        <EmptyState title="No warehouses yet" description="Add your first warehouse to start creating locations." />
      )}

      {data && data.length > 0 && (
        <Table
          rows={data}
          rowKey={(w) => w.id}
          columns={[
            { header: "Name", render: (w) => <span className="font-medium text-slate-900">{w.name}</span> },
            { header: "Code", render: (w) => <span className="tabular-nums text-slate-500">{w.code}</span> },
            { header: "Address", render: (w) => w.address || "—" },
            { header: "Locations", align: "right", render: (w) => w.locationCount },
            {
              header: "Actions",
              align: "right",
              render: (w) => (
                <button className="text-sm text-primary hover:underline" onClick={() => openEdit(w)}>
                  Edit
                </button>
              ),
            },
          ]}
        />
      )}

      {editing && (
        <Modal title={editing === "new" ? "Add Warehouse" : "Edit Warehouse"} onClose={() => setEditing(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
            className="space-y-4"
          >
            {formError && <ErrorMessage message={formError} />}
            <FieldWrapper label="Name">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
            </FieldWrapper>
            <FieldWrapper label="Code">
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            </FieldWrapper>
            <FieldWrapper label="Address (optional)">
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
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
