import { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  actions?: ReactNode;
  badge?: ReactNode;
}

export function PageHeader({ title, description, actions, badge }: Props) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h1 className="text-heading-lg font-bold text-navy truncate">{title}</h1>
          {badge}
        </div>
        {description && (
          <p className="mt-1 text-sm text-navy-400">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
