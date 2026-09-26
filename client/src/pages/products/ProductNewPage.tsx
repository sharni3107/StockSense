import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "../../api/products";
import { categoriesApi } from "../../api/categories";
import { locationsApi } from "../../api/locations";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { FieldWrapper, Input, Select } from "../../components/FormField";
import { ErrorMessage } from "../../components/States";

export default function ProductNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list });
  const { data: locations } = useQuery({ queryKey: ["locations"], queryFn: () => locationsApi.list() });

  const [form, setForm] = useState({
    name: "",
    sku: "",
    categoryId: "",
    unit: "",
    reorderLevel: "0",
    initialStock: "0",
    locationId: "",
  });
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      productsApi.create({
        name: form.name,
        sku: form.sku,
        categoryId: form.categoryId,
        unit: form.unit,
        reorderLevel: Number(form.reorderLevel),
        initialStock: Number(form.initialStock),
        locationId: form.locationId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      navigate("/products");
    },
    onError: (err: Error) => setError(err.message),
  });

  const needsLocation = Number(form.initialStock) > 0;

  return (
    <div className="max-w-xl">
      <PageHeader title="Add Product" description="Create a new product to track in inventory." />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          createMutation.mutate();
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
              <option value="" disabled>
                Select category
              </option>
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
            <Input
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="kg, pcs, box..."
              required
            />
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

        <div className="grid grid-cols-2 gap-4">
          <FieldWrapper label="Initial stock (optional)">
            <Input
              type="number"
              min={0}
              value={form.initialStock}
              onChange={(e) => setForm({ ...form, initialStock: e.target.value })}
            />
          </FieldWrapper>
          {needsLocation && (
            <FieldWrapper label="Stock location">
              <Select
                value={form.locationId}
                onChange={(e) => setForm({ ...form, locationId: e.target.value })}
                required
              >
                <option value="" disabled>
                  Select location
                </option>
                {locations?.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.warehouse.name} / {l.name}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={() => navigate("/products")}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Saving..." : "Save Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}
