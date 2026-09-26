interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = "Search..." }: Props) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-9 w-64 rounded border border-border bg-white px-3 text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
    />
  );
}
