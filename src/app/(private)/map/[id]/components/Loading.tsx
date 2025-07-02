import styles from "./Loading.module.css";

export default function Loading({
  blockInteraction,
}: {
  blockInteraction?: boolean;
}) {
  return (
    <div
      className={`${styles.loading} ${blockInteraction ? "" : "pointer-events-none"}`}
    >
      <div></div>
    </div>
  );
}
