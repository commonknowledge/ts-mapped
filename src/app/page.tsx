import { Link } from "@/components/Link";

export default function HomePage() {
  return (
    <div className="container">
      <h1>Hello Mapped</h1>
      <ul>
        <li>
          <Link href="map">Map</Link>
        </li>
        <li>
          <Link href="data-sources">Data Sources</Link>
        </li>
      </ul>
    </div>
  );
}
