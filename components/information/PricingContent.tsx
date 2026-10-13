"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Download, Satellite } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { OfflineGeoPackModal } from "@/components/ui/OfflineGeoPackModal";
import { GenericWebDisplayAd } from "@/components/ui/GenericWebDisplayAd";
import { InformationShell } from "./InformationShell";
import { AnimatedDisclosure } from "./AnimatedDisclosure";
import { singleVesselTiers } from "./pricing-data";
import { allowsMotion, findScroller } from "./useInformationMotion";
import styles from "./information.module.css";

const sections = [
  ["vessel-subscriptions", "Vessel plans"],
  ["fleet-enterprise", "Fleets"],
  ["geopack-satellite", "Offline & satellite"],
  ["free-tier-subsidies", "Free access"],
  ["b2g-licensing", "Institutions"],
  ["pricing-questions", "Questions"],
];
const fleetFeatures = [
  "Discounted annual volume licensing",
  "Central fleet dashboard and live coordinates",
  "Simultaneous multi-zone downloads and unlocks",
  "Direct API feeds into dispatch consoles",
  "Dedicated account manager and 24/7 SLA",
  "Consolidated billing and crew access",
];

export function PricingContent() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(sections[0][0]);
  const [exportOpen, setExportOpen] = useState(false);
  useGSAP(
    () => {
      const element = root.current;
      if (!element) return;
      const scroller = findScroller(element);
      const triggers = sections.map(([id]) =>
        ScrollTrigger.create({
          trigger: element.querySelector(`#${id}`),
          scroller,
          start: "top 35%",
          end: "bottom 35%",
          onEnter: () => setActive(id),
          onEnterBack: () => setActive(id),
        }),
      );
      return () => triggers.forEach((trigger) => trigger.kill());
    },
    { scope: root },
  );
  useGSAP(
    () => {
      const indicator = root.current?.querySelector("[data-nav-indicator]");
      if (indicator)
        gsap.fromTo(
          indicator,
          { scaleX: allowsMotion() ? 0.3 : 1 },
          {
            scaleX: 1,
            duration: allowsMotion() ? 0.18 : 0,
            ease: "power2.out",
            overwrite: true,
          },
        );
    },
    { scope: root, dependencies: [active] },
  );

  return (
    <InformationShell page="pricing">
      <main
        ref={root}
        id="pricing-main"
        className={styles.container}
        tabIndex={-1}
      >
        <div className={styles.hero}>
          <div data-entry>
            <span className={styles.eyebrow}>
              Access matched to your vessel
            </span>
            <h1>Pricing for municipal fishers and commercial fleets.</h1>
            <p className={styles.intro}>
              Free municipal access. Commercial subscriptions based on
              registered gross tonnage.
            </p>
          </div>
          <div id="municipal-access" className={styles.freeAccess} data-entry>
            <div>
              <h2>Municipal access, without a subscription.</h2>
              <p>
                Municipal craft at or below 3.0 GT receive free subsidized
                access. Register to set your home port.
              </p>
              <Link href="/register" className={styles.textLink}>
                Register for municipal access
                <ArrowRight size={13} />
              </Link>
              <AnimatedDisclosure label="How to start and what free access means">
                <ol className={styles.setupChecklist}>
                  <li>Create a web account with your mobile number, password, and preferred language.</li>
                  <li>Choose your coastal region and home port during onboarding.</li>
                  <li>Explore the dashboard and review how advisories work in the guide.</li>
                </ol>
                <p>₱0 means no municipal subscription fee. Confirm SMS service activation, the destination number, and any outgoing text charges before sending a command. Web registration needs internet access; reading a delivered SMS does not need mobile data.</p>
                <Link href="/guide#read-sms-advisory" className={styles.textLink}>Learn to read an advisory <ArrowRight size={14} /></Link>
              </AnimatedDisclosure>
            </div>
            <div className={styles.freePrice}>
              ₱0<small>Municipal access</small>
            </div>
          </div>
        </div>
        <nav className={styles.sectionNav} aria-label="Pricing sections">
          {sections.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              aria-current={active === id ? "location" : undefined}
              onClick={() => setActive(id)}
            >
              {label}
              {active === id && (
                <span
                  className={styles.navIndicator}
                  data-nav-indicator
                  aria-hidden="true"
                />
              )}
            </a>
          ))}
        </nav>
        <section id="vessel-subscriptions" className={styles.section}>
          <div className={styles.sectionHeading}>
            <div>
              <span className={styles.eyebrow}>Commercial vessels</span>
              <h2 className="mt-3!">Compare by vessel class.</h2>
            </div>
            <p>
              Choose your registered gross-tonnage class. Every plan includes
              one zone unlock per day and unlimited re-downloads of that zone
              for 24 hours.
            </p>
          </div>
          <div className={styles.comparison} data-reveal-group data-comparison>
            {singleVesselTiers.map((tier, index) => (
              <article
                key={tier.id}
                className={styles.tier}
                data-reveal
                aria-labelledby={`${tier.id}-title`}
              >
                <span className={styles.tonnage}>{tier.tonnage}</span>
                <h3 id={`${tier.id}-title`}>
                  {["Small-scale", "Medium-scale", "Large-scale"][index]}
                </h3>
                <div className={styles.price}>{tier.price}</div>
                <div className={styles.cadence}>
                  {tier.billingCadence.replace("/ ", "")}
                </div>
                <dl>
                  <div>
                    <dt>Coverage</dt>
                    <dd>{[
                      "Within 50 km of your home port, outside municipal waters.",
                      "One selected Fisheries Management Area (FMA).",
                      "Across the Philippine Exclusive Economic Zone (EEZ).",
                    ][index]}</dd>
                  </div>
                  <div>
                    <dt>Daily download quota</dt>
                    <dd>Unlock one zone each day. Download that same zone again for 24 hours without another unlock.</dd>
                  </div>
                </dl>
                <div className={styles.tierActions}>
                  <Link
                    href="/register"
                    className={styles.button}
                    aria-label={`Create an account for ${tier.name}`}
                  >
                    Register Vessel
                    <ArrowRight size={13} />
                  </Link>
                  <AnimatedDisclosure
                    label={`View full inclusions — ${["small", "medium", "large"][index]}-scale`}
                  >
                    <p>{tier.targetVessels}</p>
                    <p>{tier.scopeDescription} {tier.quotaDescription}</p>
                    <ul className={styles.features}>
                      {tier.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                    <p className={styles.legal}>{tier.legalCitation}</p>
                    <button
                      type="button"
                      className={styles.textLink}
                      onClick={() => setExportOpen(true)}
                    >
                      <Download size={13} />
                      Test Geo-Pack export
                    </button>
                  </AnimatedDisclosure>
                </div>
              </article>
            ))}
          </div>
          <p className={`${styles.legal} mt-4`}>
            Commercial tonnage classes: Section 3(n), RA 8550 as amended by RA
            10654. Prices are monthly, per vessel.
          </p>
        </section>
        <section
          id="fleet-enterprise"
          className={styles.section}
          data-reveal-group
        >
          <div className={styles.fleet} data-reveal>
            <div>
              <span className={styles.eyebrow}>
                One agreement for your fleet
              </span>
              <h2 className="mt-3!">Fleet agreements</h2>
              <p>
                Operators with five or more commercial vessels can arrange an
                annual license with shared operational visibility and tailored
                fleet terms.
              </p>
              <ul className={styles.features}>
                {fleetFeatures.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>
            <div className={styles.fleetOffer}>
              <div className={styles.largeNumber}>5+</div>
              <p>
                Commercial vessels
                <br />
                <strong>Annual corporate license</strong>
              </p>
              <p>
                Structure coverage around your vessel tonnages and operating
                Fisheries Management Areas.
              </p>
              <Link href="/about#fleet-planning" className={styles.button}>
                Review fleet setup
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
        <section id="geopack-satellite" className={styles.section}>
          <div className={styles.sectionHeading}>
            <h2>Offline Geo-Packs and satellite sync</h2>
            <p>
              Prepare forecast files before departure, then explore
              low-bandwidth refreshes for longer voyages beyond cellular reach.
            </p>
          </div>
          <div className={styles.twoColumns} data-reveal-group>
            <article className={styles.delivery} data-reveal>
              <Download size={24} />
              <h3>Take the forecast onboard.</h3>
              <p>
                Download 24–72 hour forecast bundles in .GPX, .KML, or .GeoJSON.
                Transfer sea-temperature fronts and hotspot coordinates to an SD
                card or USB drive for your chartplotter.
              </p>
              <div className={styles.deliveryNote}>
                <strong>One zone, multiple formats.</strong>
                <br />
                Unlock one forecast zone per 24-hour cycle. Re-download that
                zone across all supported formats without using more quota.
              </div>
              <AnimatedDisclosure label="Supported equipment and delivery details">
                <p>
                  For onboard chartplotters including Garmin, Furuno, Simrad,
                  Raymarine, and Lowrance. Bundles include sea surface
                  temperature fronts, thermocline contours, and pelagic hotspot
                  coordinates.
                </p>
              </AnimatedDisclosure>
              <button
                type="button"
                className={styles.button}
                onClick={() => setExportOpen(true)}
              >
                <Download size={14} />
                Try the Geo-Pack exporter
              </button>
            </article>
            <article className={styles.delivery} data-reveal>
              <Satellite size={24} />
              <h3>Refresh during a longer voyage.</h3>
              <p>
                The low-bandwidth satellite add-on is designed for mid-voyage
                hotspot refreshes over Starlink, Iridium, and Inmarsat
                connections.
              </p>
              <div className={styles.deliveryNote}>
                <strong>Compressed forecast updates.</strong>
                <br />
                An optional integration for commercial vessels operating beyond
                cellular coverage.
              </div>
              <AnimatedDisclosure label="Satellite payload and integration details">
                <p>
                  The existing payload example compares a roughly 1.8 KB
                  compressed binary refresh with a 15–25 MB web map/API stream
                  (approximately 99.9% payload reduction). Actual transmission
                  costs depend on the satellite service and integration.
                </p>
              </AnimatedDisclosure>
              <Link href="/about#fleet-planning" className={styles.secondaryButton}>
                Review satellite setup
                <ArrowRight size={14} />
              </Link>
            </article>
          </div>
        </section>
        <section id="free-tier-subsidies" className={styles.section}>
          <div className={styles.sectionHeading}>
            <h2>How free access is funded</h2>
            <p>
              The funding model keeps municipal access free through sponsorship,
              web advertising, and proposed telecom subsidies. Safety
              information keeps priority over commercial messages.
            </p>
          </div>
          <div className={styles.funding} data-reveal-group>
            <div className={`${styles.fundingRows} ${styles.card}`}>
              <div className={styles.referenceRow} data-reveal>
                <span>01</span>
                <div>
                  <h3>A brief sponsor acknowledgment</h3>
                  <p>
                    A single footer on sample SMS advisories, separated from
                    weather details and navigation coordinates. The intended
                    limit is 20–25 characters.
                  </p>
                </div>
              </div>
              <div className={styles.referenceRow} data-reveal>
                <span>02</span>
                <div>
                  <h3>Web display advertising</h3>
                  <p>
                    Non-intrusive banner placements on the web portal help
                    support municipal access. The existing advertising
                    demonstration appears below.
                  </p>
                </div>
              </div>
              <div className={styles.referenceRow} data-reveal>
                <span>03</span>
                <div>
                  <h3>Telecom and CSR subsidies</h3>
                  <p>
                    Proposed digital-inclusion agreements with Philippine
                    telecom providers would offset outbound SMS costs through
                    zero-rating or bulk nonprofit gateway rates.
                  </p>
                  <AnimatedDisclosure label="View the subsidy cost example">
                    <p>
                      The existing funding scenario targets a reduction from
                      ₱0.40 to below ₱0.08 per message. This is a proposed
                      subsidy scenario, not a confirmed telecom agreement.
                    </p>
                  </AnimatedDisclosure>
                </div>
              </div>
            </div>
            <div className={styles.sampleSms} data-reveal>
              <small>Sample advisory / funding example</small>
              <pre>
                {
                  "PAROLA: Waves 0.8m, wind 9kts.\nZone 3 active.\n\nSample sponsor footer."
                }
              </pre>
              <p>
                Advisory details come first. This sample is not current sea
                information.
              </p>
              <div className={`${styles.demo} mt-6`}>
                <GenericWebDisplayAd
                  slotId="pricing-preview-ad"
                  className="text-left"
                  sample
                />
              </div>
            </div>
          </div>
        </section>
        <section id="b2g-licensing" className={styles.section}>
          <div className={styles.sectionHeading}>
            <h2>Institutional data licensing</h2>
            <p>
              Proposed quarterly reports and API feeds use anonymized
              fishing-effort, fleet-mobility, and environmental data. These are
              intended use cases, rather than a list of confirmed institutional
              partners.
            </p>
          </div>
          <div className={styles.institutionRows} data-reveal-group>
            {[
              [
                "BFAR offices",
                "Fisheries Management Area monitoring, closed-season compliance, stock replenishment research, and scientific catch-quota planning.",
              ],
              [
                "Coastal LGUs",
                "Municipal Agriculture Offices and coastal resource teams: zoning, resource assessment, and bantay-dagat coordination.",
              ],
              [
                "Conservation and research",
                "Marine Protected Area delineation, migratory corridor modeling, and ocean climate resilience research.",
              ],
            ].map(([title, description]) => (
              <div key={title} data-reveal>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            ))}
          </div>
        </section>
        <section id="pricing-questions" className={styles.section}>
          <div className={styles.questions}>
            <h2>Questions before you register</h2>
            <AnimatedDisclosure label="How does the daily zone quota work?">
              <p>
                Each single-vessel subscription unlocks one forecast zone per
                24-hour cycle. Download that zone repeatedly in .GPX, .KML, or
                .GeoJSON and at 24h, 48h, or 72h horizons without consuming
                another unlock.
              </p>
            </AnimatedDisclosure>
            <AnimatedDisclosure label="Which tonnage class applies to my vessel?">
              <p>
                Municipal craft at or below 3.0 GT receive free subsidized
                access. Commercial classes are 3.1–20.0 GT, 20.1–150.0 GT, and
                above 150.0 GT. Match your plan to the gross tonnage on your
                vessel registration.
              </p>
            </AnimatedDisclosure>
            <AnimatedDisclosure label="What is the satellite sync add-on?">
              <p>
                An optional compressed binary forecast refresh for mid-voyage
                use over satellite connections. See the offline and satellite
                section for the payload example and integration inquiry.
              </p>
            </AnimatedDisclosure>
            <AnimatedDisclosure label="How are sponsor messages kept separate?">
              <p>
                Sponsor acknowledgments appear only on the final line of sample
                advisories, with a 20–25 character target. Weather details, wave
                heights, and navigation information keep priority.
              </p>
            </AnimatedDisclosure>
          </div>
        </section>
        <div className={styles.demo}>
          <OfflineGeoPackModal
            isOpen={exportOpen}
            onClose={() => setExportOpen(false)}
          />
        </div>
      </main>
    </InformationShell>
  );
}
