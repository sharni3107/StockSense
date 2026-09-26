import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoriesApi, Category } from "../api/categories";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { Table } from "../components/Table";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { FieldWrapper, Input } from "../components/FormField";
import { LoadingState, ErrorMessage, EmptyState } from "../components/States";

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list });

  const [modalCategory, setModalCategory] = useState<Category | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: () =>
      modalCategory === "new" ? categoriesApi.create(name) : categoriesApi.update((modalCategory as Category).id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setModalCategory(null);
      setName("");
      setFormError(null);
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => categoriesApi.remove(deleteTarget!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setDeleteTarget(null);
    },
    onError: (err: Error) => {
      alert(err.message);
      setDeleteTarget(null);
    },
  });

  function openNew() {
    setName("");
    setFormError(null);
    setModalCategory("new");
  }

  function openEdit(cat: Category) {
    setName(cat.name);
    setFormError(null);
    setModalCategory(cat);
  }

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Group products for easier filtering and reporting."
        actions={<Button onClick={openNew}>Add Category</Button>}
      />

      {isLoading && <LoadingState />}
      {error && <ErrorMessage message={(error as Error).message} />}
      {data && data.length === 0 && (
        <EmptyState title="No categories yet" description="Create your first category to start organizing products." />
      )}

      {data && data.length > 0 && (
        <Table
          rows={data}
          rowKey={(c) => c.id}
          columns={[
            { header: "Name", render: (c) => <span className="font-medium text-slate-900">{c.name}</span> },
            { header: "Products", align: "right", render: (c) => c.productCount },
            {
              header: "Actions",
              align: "right",
              render: (c) => (
                <div className="flex justify-end gap-2">
                  <button className="text-sm text-primary hover:underline" onClick={() => openEdit(c)}>
                    Edit
                  </button>
                  <button
                    className="text-sm text-status-out-text hover:underline"
                    onClick={() => setDeleteTarget(c)}
                  >
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
        />
      )}

      {modalCategory && (
        <Modal title={modalCategory === "new" ? "Add Category" : "Edit Category"} onClose={() => setModalCategory(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
            className="space-y-4"
          >
            {formError && <ErrorMessage message={formError} />}
            <FieldWrapper label="Category name">
              <Input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            </FieldWrapper>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setModalCategory(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete category"
          message={`Delete "${deleteTarget.name}"? This can't be undone.`}
          onConfirm={() => deleteMutation.mutate()}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
