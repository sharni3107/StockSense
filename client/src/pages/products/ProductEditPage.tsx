import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "../../api/products";
import { categoriesApi } from "../../api/categories";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { FieldWrapper, Input, Select } from "../../components/FormField";
import { ErrorMessage, LoadingState } from "../../components/States";

export default function ProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery({ queryKey: ["product", id], queryFn: () => productsApi.get(id!) });
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list });

  const [form, setForm] = useState({ name: "", sku: "", categoryId: "", unit: "", reorderLevel: "0" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        sku: product.sku,
        categoryId: product.category.id,
        unit: product.unit,
        reorderLevel: String(product.reorderLevel),
      });
    }
  }, [product]);

  const updateMutation = useMutation({
    mutationFn: () =>
      productsApi.update(id!, {
        name: form.name,
        sku: form.sku,
        categoryId: form.categoryId,
        unit: form.unit,
        reorderLevel: Number(form.reorderLevel),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      navigate(`/products/${id}`);
    },
    onError: (err: Error) => setError(err.message),
  });

  if (isLoading) return <LoadingState />;

  return (
    <div className="max-w-xl">
      <PageHeader title="Edit Product" description={`Editing ${product?.name}`} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          updateMutation.mutate();
        }}
        className="space-y-4 rounded-lg border border-border bg-white p-6"
      >
        {error && <ErrorMessage message={error} />}

        <FieldWrapper label="Product name">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
        </FieldWrapper>

        <div className="grid grid-cols-2 gap-4">
          <FieldWrapper label="SKU / Code">
            <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
          </FieldWrapper>
          <FieldWrapper label="Category">
            <Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} required>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FieldWrapper>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FieldWrapper label="Unit of measure">
            <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} required />
          </FieldWrapper>
          <FieldWrapper label="Reorder level">
            <Input
              type="number"
              min={0}
              value={form.reorderLevel}
              onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })}
            />
          </FieldWrapper>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={() => navigate(`/products/${id}`)}>
            Cancel
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
