import { SearchResult } from "@/types";

interface SearchHistoryProps {
  history?: SearchResult[];
  onSelect: (coordinates: [number, number]) => void;
}

export default function SearchHistory({
  history = [],
  onSelect,
}: SearchHistoryProps) {
  return (
    <ul className="space-y-2">
      {history.map((result, index) => (
        <li
          key={index}
          className="text-sm hover:bg-gray-100 p-2 rounded cursor-pointer"
          onClick={() => onSelect(result.coordinates)}
        >
          {result.text}
        </li>
      ))}
    </ul>
  );
}
