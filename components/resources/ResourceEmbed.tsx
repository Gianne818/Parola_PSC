import styles from "./resource-embed.module.css";

export function ResourceEmbed({ children }: { children: React.ReactNode }) {
  return <div className={styles.embed}>{children}</div>;
}
