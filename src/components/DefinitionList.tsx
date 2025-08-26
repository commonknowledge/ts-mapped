interface DefinitionListItem {
  label: string;
  value: string;
}

export function DefinitionList({ items }: { items: DefinitionListItem[] }) {
  return (
    <dl className="flex flex-col gap-6 text-sm">
      {items.map(
        ({ label, value }) =>
          value && (
            <div key={label}>
              <dt className="mb-2 font-medium">{label}</dt>
              <dd className="max-w-[45ch] overflow-hidden overflow-ellipsis">
                {value}
              </dd>
            </div>
          ),
      )}
    </dl>
  );
}
