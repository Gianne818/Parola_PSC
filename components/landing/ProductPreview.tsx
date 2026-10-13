import Image from "next/image";
import styles from "./landing.module.css";

/** Original laptop chassis with a screenshot of the real application. */
export default function ProductPreview() {
  return (
    <figure className={styles.productPreview}>
      <div className={styles.laptop} data-laptop-parallax>
        <div data-laptop-arrival>
          <Image
            src="/images/hero-image.png"
            alt=""
            width={1811}
            height={1161}
            preload
            sizes="(min-width: 1024px) 620px, (min-width: 640px) 580px, 100vw"
            className={styles.laptopChassis}
          />
          <div className={styles.laptopScreen}>
            <Image
              src="/images/parola-dashboard-capture.png"
              alt="Parola dashboard showing the coastal hotspot map, municipal advisor, and sea weather conditions"
              width={3092}
              height={1680}
              preload
              sizes="(min-width: 1024px) 550px, (min-width: 640px) 500px, 90vw"
              className={styles.dashboardCapture}
            />
          </div>
        </div>
      </div>
      <figcaption className={styles.productCaption}>
        <span aria-hidden="true" />The Parola dashboard
      </figcaption>
    </figure>
  );
}
