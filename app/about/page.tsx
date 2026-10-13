import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CloudSun, Radio, Smartphone, Ship } from "lucide-react";
import { InformationShell } from "@/components/information/InformationShell";
import styles from "@/components/information/information.module.css";

export const metadata: Metadata = {
  title: "About | Parola",
  description:
    "Why Parola brings maritime advisories and fishing hotspot guidance to basic phones in Philippine coastal communities.",
};
const objectives = [
  [
    "01",
    "Help prevent avoidable incidents",
    "Bring weather advisories and safety-hold information into the decisions fishers make before leaving port.",
  ],
  [
    "02",
    "Make scouting more informed",
    "Use sea-temperature and chlorophyll information to guide fishing hotspot predictions and trip planning.",
  ],
  [
    "03",
    "Keep access within reach",
    "Deliver useful information through SMS on the basic phones coastal communities already use.",
  ],
];
const journey = [
  {
    icon: CloudSun,
    title: "Sea and weather information",
    description: "Weather advisories and ocean information provide the inputs.",
  },
  {
    icon: Radio,
    title: "Parola advisory",
    description:
      "Parola turns those inputs into localized guidance for a registered vessel and home port.",
  },
  {
    icon: Smartphone,
    title: "Basic phone",
    description:
      "An SMS carries the advisory. Reading it requires no app or mobile data plan.",
  },
  {
    icon: Ship,
    title: "Fisher’s next action",
    description:
      "Review conditions, check hotspot guidance, or respond to a safety hold before departure.",
  },
];

export default function AboutPage() {
  return (
    <InformationShell page="about">
      <main id="about-main" className={styles.container} tabIndex={-1}>
        <div className={styles.hero}>
          <span className={styles.eyebrow}>Why Parola exists</span>
          <h1>Built for Philippine coastal communities.</h1>
          <div data-entry>
            <p className={styles.intro}>
              Maritime advisories and fishing hotspot guidance should reach the
              people who need them — including fishers carrying a basic mobile
              phone.
            </p>
            <Link href="/guide" className={styles.textLink}>
              See how Parola works
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
        <section className={styles.section}>
          <div className={styles.mission}>
            <div className={styles.missionCopy}>
              <span className={styles.eyebrow}>Our purpose</span>
              <h2 className={styles.missionQuote}>
                Safety information should be within reach before a boat leaves
                port.
              </h2>
              <p>
                Philippine municipal fishers support their families and coastal
                food security while working around changing weather, fuel costs,
                and limited connectivity.
              </p>
              <p>
                Parola brings ocean information into a familiar format: a short
                text message. The aim is to make weather guidance and fishing
                predictions easier to use in everyday coastal operations.
              </p>
            </div>
            <div
              className={styles.card}
              data-reveal-group
              aria-label="Parola objectives"
            >
              {objectives.map(([number, title, description]) => (
                <div key={number} className={styles.referenceRow} data-reveal>
                  <span>{number}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>Process explanation</span>
              <h2 className="mt-3!">
                From ocean information to a useful text.
              </h2>
            </div>
            <p>
              Parola connects weather and hotspot guidance to a vessel’s coastal
              context. This sequence explains the process; it is not a live
              dispatch.
            </p>
          </div>
          <div className={styles.journey} data-journey>
            <div
              className={styles.journeyRail}
              data-journey-rail
              aria-hidden="true"
            />
            {journey.map(({ icon: Icon, title, description }) => (
              <div key={title} className={styles.journeyNode} data-journey-node>
                <div className={styles.journeyIcon}>
                  <Icon size={21} aria-hidden="true" />
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            ))}
          </div>
          <div className={styles.smsReasons} data-reveal-group>
            <div data-reveal>
              <h3>No smartphone barrier</h3>
              <p>
                Fishers can read advisories on a standard SMS-capable phone,
                without an app-store download.
              </p>
            </div>
            <div data-reveal>
              <h3>Less dependence on mobile data</h3>
              <p>
                SMS does not require a mobile data connection. Delivery still
                depends on cellular signal and network availability.
              </p>
            </div>
            <div data-reveal>
              <h3>A two-way conversation</h3>
              <p>
                Commands such as ADVISORY, HOTSPOT, and STATUS let fishers
                request information when they need it.
              </p>
            </div>
          </div>
        </section>
        <section className={styles.section}>
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>Institutional context</span>
              <h2 className="mt-3!">
                Support the work already happening on shore.
              </h2>
            </div>
            <p>
              Parola is designed to complement BFAR, Philippine Coast Guard, and
              municipal workflows. These are intended areas of alignment, not
              claims of endorsement or confirmed partnerships.
            </p>
          </div>
          <div className={styles.twoColumns}>
            <div className={styles.card} data-reveal-group>
              {[
                [
                  "01",
                  "Vessel and home-port records",
                  "Connect vessel identification and landing-site information to coastal coordination and muster workflows.",
                ],
                [
                  "02",
                  "Marine warning communication",
                  "Bring PAGASA advisory information closer to the small-boat crews who need to review conditions before departure.",
                ],
                [
                  "03",
                  "Anonymized fisheries information",
                  "Support future FMA monitoring, coastal zoning, and stock research through aggregated catch and fleet information.",
                ],
              ].map(([number, title, description]) => (
                <div key={number} className={styles.referenceRow} data-reveal>
                  <span>{number}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <dl
                className={styles.standards}
                aria-label="Existing Parola reference settings"
              >
                <div>
                  <dt>Landing safety demo</dt>
                  <dd>1.5m example</dd>
                  <small>Sample threshold; actual alert settings vary</small>
                </div>
                <div>
                  <dt>Departure decisions</dt>
                  <dd>Official guidance</dd>
                  <small>Review current advisories and port instructions</small>
                </div>
                <div>
                  <dt>Municipal subscription</dt>
                  <dd>₱0</dd>
                  <small>Craft at or below 3.0 GT</small>
                </div>
                <div>
                  <dt>SMS access</dt>
                  <dd>Cellular signal</dd>
                  <small>Delivered texts need no mobile data</small>
                </div>
              </dl>
              <p className={`${styles.legal} mt-4`}>
                Public demonstrations use sample information. SMS delivery depends on an enabled service and network availability; prediction scores do not guarantee catches.
              </p>
            </div>
          </div>
        </section>
        <section id="fleet-planning" className={styles.section}>
          <div className={styles.sectionHeading}>
            <h2>Plan a coastal or fleet rollout.</h2>
            <p>Start with the boats, ports, and communication needs involved. Fleet terms and satellite arrangements need confirmation before deployment.</p>
          </div>
          <div className={styles.twoColumns} data-reveal-group>
            <div className={styles.card} data-reveal>
              <h3>For your vessel or cooperative</h3>
              <ol className={styles.setupChecklist}>
                <li>Have your mobile number and home-port location ready.</li>
                <li>Create an account, choose your language, and complete the port setup.</li>
                <li>Review the dashboard and sample advisories before relying on an enabled SMS service.</li>
              </ol>
              <Link href="/guide" className={styles.textLink}>Follow the practical guide <ArrowRight size={14} /></Link>
            </div>
            <div className={styles.card} data-reveal>
              <h3>For commercial fleets and satellite use</h3>
              <ol className={styles.setupChecklist}>
                <li>List vessel count, registered gross tonnage, and operating areas. Fleet agreements start at five commercial vessels.</li>
                <li>Identify who receives advisories and manages fleet information.</li>
                <li>Review onboard chartplotter file formats and any satellite connection you intend to use.</li>
              </ol>
              <Link href="/pricing#fleet-enterprise" className={styles.textLink}>Review fleet terms <ArrowRight size={14} /></Link>
              <Link href="/pricing#geopack-satellite" className={styles.textLink}>Explore offline and satellite options <ArrowRight size={14} /></Link>
            </div>
          </div>
        </section>
        <section className={styles.closing} data-closing>
          <div>
            <h2>Connect your vessel or coastal cooperative.</h2>
            <p>
              Register your vessel and home port, or start with the guide to
              explore advisories, hotspot predictions, and safety holds.
            </p>
          </div>
          <div className={styles.actions}>
            <Link href="/register" className={styles.button}>
              Register vessel
              <ArrowRight size={14} />
            </Link>
            <Link href="/guide" className={styles.secondaryButton}>
              Explore system guide
            </Link>
          </div>
        </section>
      </main>
    </InformationShell>
  );
}
