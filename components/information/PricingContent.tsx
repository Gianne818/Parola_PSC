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
  "Proposed annual licensing; no contract established",
  "Fleet dashboard planned; no live vessel tracking",
  "Multi-zone entitlements planned",
  "Dispatch API integration planned",
  "Support terms pending; no SLA established",
  "Fleet billing and delegated access planned",
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
              Free Standard municipal access. Commercial prices and vessel
              classes below are proposals; paid activation is not available here.
            </p>
          </div>
          <div id="municipal-access" className={styles.freeAccess} data-entry>
            <div>
              <h2>Municipal access, without a subscription.</h2>
              <p>
                Standard municipal access is free. Tonnage eligibility and
                marine boundaries require review. Create an account to set your home port.
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
                <p>₱0 means no Standard municipal subscription fee. The portal currently offers manual weather SMS requests when the service is enabled; a request does not confirm delivery. Routine SMS for up to five selected weekdays and separate any-day critical alerts are planned. No inbound commands or replies are required. Registration and portal reporting need internet; reading a delivered SMS does not.</p>
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
              Compare proposed gross-tonnage bands. Verification, activation,
              authoritative marine scope, and zone cycle rules remain pending.
              Account creation grants no commercial entitlement or fishing permission.
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
                    <dt>Proposed scope — coverage unverified</dt>
                    <dd>{[
                      "Within 50 km of your home port, outside municipal waters.",
                      "One selected Fisheries Management Area (FMA).",
                      "Across the Philippine Exclusive Economic Zone (EEZ).",
                    ][index]}</dd>
                  </div>
                  <div>
                    <dt>Proposed zone allowance</dt>
                    <dd>{tier.quotaDescription}</dd>
                  </div>
                </dl>
                <div className={styles.tierActions}>
                  <Link
                    href="/register"
                    className={styles.button}
                    aria-label={`Create an account for ${tier.name}`}
                  >
                    Create account only
                    <ArrowRight size={13} />
                  </Link>
                  <AnimatedDisclosure
                    label={`View proposal and current limits — ${["small", "medium", "large"][index]}-scale`}
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
                      Download a sample Geo-Pack
                    </button>
                  </AnimatedDisclosure>
                </div>
              </article>
            ))}
          </div>
          <p className={`${styles.legal} mt-4`}>
            Displayed tonnage bands are provisional and do not establish legal
            classification. Prices are proposed monthly amounts per vessel,
            not a checkout, active subscription or guarantee of service.
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
                Fleet roadmap proposal
              </span>
              <h2 className="mt-3!">Fleet agreements</h2>
              <p>
                The proposal considers operators with five or more vessels.
                Annual licensing, shared visibility and fleet terms require
                separate validation and agreement; they are not active services.
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
                <strong>Proposed annual corporate license</strong>
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
              Explore local sample files. Validated forecast exports and
              satellite refreshes are not available in this demo.
            </p>
          </div>
          <div className={styles.twoColumns} data-reveal-group>
            <article className={styles.delivery} data-reveal>
              <Download size={24} />
              <h3>Explore a sample export.</h3>
              <p>
                Download static demonstration points in .GPX, .KML or .GeoJSON.
                The horizon selector does not generate a forecast. Sample files
                are not for navigation or fishing decisions.
              </p>
              <div className={styles.deliveryNote}>
                <strong>Sample files, no entitlement.</strong>
                <br />
                Zone locks, cycle resets and re-download rules require a
                verified server contract. This demo establishes none of them.
              </div>
              <AnimatedDisclosure label="Equipment validation still needed">
                <p>
                  No chartplotter model or import workflow has been verified.
                  A file extension alone does not establish device support.
                  Environmental layers and forecast horizons need validated data.
                </p>
              </AnimatedDisclosure>
              <button
                type="button"
                className={styles.button}
                onClick={() => setExportOpen(true)}
              >
                <Download size={14} />
                Try the sample exporter
              </button>
            </article>
            <article className={styles.delivery} data-reveal>
              <Satellite size={24} />
              <h3>Satellite refreshes are planned.</h3>
              <p>
                Mid-voyage satellite refreshes are roadmap work. No satellite
                integration, provider agreement or supported device is established.
              </p>
              <div className={styles.deliveryNote}>
                <strong>Unvalidated concept.</strong>
                <br />
                Payload size, transmission costs and bandwidth savings have
                not been measured for an operational integration.
              </div>
              <AnimatedDisclosure label="Satellite payload and integration details">
                <p>
                  There is no verified binary payload or working satellite
                  delivery path in this demo. Validation is needed before any
                  size, savings or compatibility claim.
                </p>
              </AnimatedDisclosure>
              <Link href="/about#fleet-planning" className={styles.secondaryButton}>
                Review satellite proposal
                <ArrowRight size={14} />
              </Link>
            </article>
          </div>
        </section>
        <section id="free-tier-subsidies" className={styles.section}>
          <div className={styles.sectionHeading}>
            <h2>How free access is funded</h2>
            <p>
              The proposal would fund free Standard access through approved
              sponsorship, advertising and telecom subsidies. These examples
              establish no revenue or partner agreement. Critical alerts and
              enterprise messages are intended to remain ad-free.
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
                    Sample web banners illustrate a possible funding source.
                    No advertising revenue or sponsor agreement is established.
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
                One zone per cycle is proposed. Calendar versus rolling resets,
                expiry and re-download rules await agreement. Current exports
                are local samples, not quota-controlled forecasts.
              </p>
            </AnimatedDisclosure>
            <AnimatedDisclosure label="Which tonnage class applies to my vessel?">
              <p>
                Standard municipal access is free. The displayed commercial
                bands are provisional; exact boundaries, fractional tonnages,
                verification and permitted marine areas require review. Selecting
                a plan does not establish legal clearance.
              </p>
            </AnimatedDisclosure>
            <AnimatedDisclosure label="What is the satellite sync add-on?">
              <p>
                A planned mid-voyage refresh concept, not an available add-on.
                Provider, payload and device validation remain pending.
              </p>
            </AnimatedDisclosure>
            <AnimatedDisclosure label="How are sponsor messages kept separate?">
              <p>
                Sample routine advisories may illustrate a separate sponsor
                footer. Live sponsorship requires separate consent and approval;
                critical alerts and enterprise messages are intended to be ad-free.
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
