import type { Source } from "../types";

/**
 * Sources cited only by tendon exposure's attachment areas (docs/specialization-atlas/
 * 11-forearm-research-and-stack.md §1.5, §4.1; the review is regions/forearm/tendon-areas.md):
 * the attachment pages the library's anatomy records did not already hold. No region lists them in
 * its `sources`, so the seed never writes them (emit-seed.ts reads only those lists); they reach the
 * page through the forearm's `referenceSources`, loaded with its tendon areas.
 *
 * What they support: where a muscle starts and ends, nothing more. None of them measured a load,
 * and none is evidence about a set, a tendon's response or a person's training.
 *
 * Checked by web search on 22 Oct 2026. Page fetches fail in this build (the proxy refused
 * radiopaedia.org and www.ncbi.nlm.nih.gov that day), so each note says what the search results
 * showed, as the library's A-records do, and anything they could not confirm.
 */

const CHECKED = "2026-10-22";

export const forearmTendonSources: Source[] = [
  {
    id: "radiopaedia.common_flexor_origin",
    url: "https://radiopaedia.org/articles/common-flexor-origin-of-the-elbow",
    title: "Radiopaedia: common flexor origin of the elbow",
    doi: null,
    evidenceType: "anatomy",
    retrievedOn: CHECKED,
    notes: "Checked via web-search results: a thick tendinous structure arising from the medial epicondyle, splitting into an anterosuperior and a posteroinferior common tendinous portion, which pronator teres, flexor digitorum superficialis and flexor carpi ulnaris form; flexor carpi radialis and palmaris longus also arise from the medial epicondyle, over FDS, and are counted to the flexor-pronator mass and only variably to the common flexor origin. One summary sentence on which muscle forms which portion was garbled, so the portions are not relied on, only the members.",
  },
  {
    id: "radiopaedia.common_extensor_origin",
    url: "https://radiopaedia.org/articles/common-extensor-origin-of-the-elbow",
    title: "Radiopaedia: common extensor origin of the elbow",
    doi: null,
    evidenceType: "anatomy",
    retrievedOn: CHECKED,
    notes: "Checked via web-search results: a flat tendinous structure from the anterolateral surface of the lateral epicondyle, just distal to the origin of extensor carpi radialis longus; its tendinous portions, from anterior to posterior, are extensor carpi radialis brevis, extensor digitorum with extensor digiti minimi, and extensor carpi ulnaris. The ECRB and extensor digitorum origins are coalescent; the ECU origin can be separated by a thick fascia. One search summary put ECU's origin above the epicondyle on the supracondylar ridge, against the article's own list (that is ECRL's place); that summary was not relied on.",
  },
  {
    id: "imaios.extensor_carpi_radialis_longus",
    url: "https://www.imaios.cn/en/e-anatomy/anatomical-structures/extensor-carpi-radialis-longus-14217928",
    title: "IMAIOS e-Anatomy: extensor carpi radialis longus",
    doi: null,
    evidenceType: "anatomy",
    retrievedOn: CHECKED,
    notes: "Checked via web-search results (imaios.cn mirror): arises from the lower third of the lateral supracondylar ridge, just below the brachioradialis, and also receives some fibres from the lateral intermuscular septum and the common extensor origin on the lateral epicondyle; its tendon inserts on the dorsal base of the second metacarpal.",
  },
  {
    id: "kenhub.extensor_carpi_ulnaris",
    url: "https://www.kenhub.com/en/library/anatomy/extensor-carpi-ulnaris-muscle",
    title: "Kenhub: extensor carpi ulnaris muscle",
    doi: null,
    evidenceType: "anatomy",
    retrievedOn: CHECKED,
    notes: "Checked via web-search results: originates from the lateral epicondyle via the common extensor tendon, which is a common origin for ECU, extensor digitorum, ECRB and extensor digiti minimi, and from the posterior border of the ulna via an aponeurosis shared with FCU and FDP; the tendon passes over the triquetrum and inserts on the medial base of the fifth metacarpal.",
  },
  {
    id: "kenhub.flexor_carpi_ulnaris",
    url: "https://www.kenhub.com/en/library/anatomy/flexor-carpi-ulnaris-muscle",
    title: "Kenhub: flexor carpi ulnaris muscle",
    doi: null,
    evidenceType: "anatomy",
    retrievedOn: CHECKED,
    notes: "Checked via web-search results: two heads joined by a tendinous arch, a smaller humeral head from the common flexor origin on the medial epicondyle and a larger ulnar head from the olecranon and the proximal posterior border of the ulna; inserts on the pisiform, the hamate and the base of the fifth metacarpal.",
  },
  {
    id: "kenhub.palmaris_longus",
    url: "https://www.kenhub.com/en/library/anatomy/palmaris-longus-muscle",
    title: "Kenhub: palmaris longus muscle",
    doi: null,
    evidenceType: "anatomy",
    retrievedOn: CHECKED,
    notes: "Checked via web-search results: originates from the medial epicondyle via the common flexor origin; its tendon enters the palm superficial to the flexor retinaculum, a few fibres blending with the retinaculum and most inserting into the palmar aponeurosis; absent in some people.",
  },
  {
    id: "elsevier.palmaris_longus",
    url: "https://www.elsevier.com/resources/anatomy/muscular-system/muscles-of-upper-limb/palmaris-longus-muscle/20264",
    title: "Elsevier Complete Anatomy, Quick Facts: palmaris longus",
    doi: null,
    evidenceType: "anatomy",
    retrievedOn: CHECKED,
    notes: "Checked via web-search results: origin, the medial epicondyle via the common flexor tendon; insertion, the palmar aponeurosis and the flexor retinaculum; flexes the hand at the wrist.",
  },
  {
    id: "kenhub.flexor_digitorum_superficialis",
    url: "https://www.kenhub.com/en/library/anatomy/flexor-digitorum-superficialis-muscle",
    title: "Kenhub: flexor digitorum superficialis muscle",
    doi: null,
    evidenceType: "anatomy",
    retrievedOn: CHECKED,
    notes: "Checked via web-search results: the humeroulnar head originates from the medial epicondyle via the common flexor tendon and from the medial margin of the coronoid process, with some fibres from the ulnar collateral ligament; its tendons split near the wrist and attach to the middle phalanges of digits 2 to 5. The radial head was not in the Kenhub excerpt (StatPearls, A12, gives it).",
  },
  {
    id: "elsevier.extensor_carpi_radialis_brevis",
    url: "https://www.elsevier.com/resources/anatomy/muscular-system/muscles-of-upper-limb/extensor-carpi-radialis-brevis/21097",
    title: "Elsevier Complete Anatomy, Quick Facts: extensor carpi radialis brevis",
    doi: null,
    evidenceType: "anatomy",
    retrievedOn: CHECKED,
    notes: "Checked via web-search results: origin, the lateral epicondyle via the common extensor tendon; insertion, the dorsal base of the third metacarpal.",
  },
  {
    id: "elsevier.flexor_pollicis_longus",
    url: "https://www.elsevier.com/resources/anatomy/muscular-system/muscles-of-upper-limb/flexor-pollicis-longus/24379",
    title: "Elsevier Complete Anatomy, Quick Facts: flexor pollicis longus",
    doi: null,
    evidenceType: "anatomy",
    retrievedOn: CHECKED,
    notes: "Checked via web-search results: inserts on the palmar base of the distal phalanx of the thumb; besides its origin on the radius, lists possible origins from the coronoid process or the medial epicondyle.",
  },
  {
    id: "elsevier.extensor_pollicis_longus",
    url: "https://www.elsevier.com/resources/anatomy/muscular-system/muscles-of-upper-limb/extensor-pollicis-longus/19953",
    title: "Elsevier Complete Anatomy, Quick Facts: extensor pollicis longus",
    doi: null,
    evidenceType: "anatomy",
    retrievedOn: CHECKED,
    notes: "Checked via web-search results: a long tendon that inserts on the dorsal base of the distal phalanx of the thumb.",
  },
  {
    id: "pmid.19092992",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC2586286/",
    title: "Hazani, Engineer, Cooney and Wilhelmi, Anatomic landmarks for the first dorsal compartment (Eplasty 8:e53, 2008)",
    doi: null,
    evidenceType: "anatomy",
    retrievedOn: CHECKED,
    notes: "Title, authors and abstract seen through web search; the PubMed id is the one the PMC record gives (PMC2586286), and the record's year reads 2008 in citations and 2009 on PMC. Cadaver study of 32 wrists: the abductor pollicis longus and extensor pollicis brevis tendons occupy the first dorsal compartment beside the radial styloid; EPB had a compartment of its own in just over a third of specimens, and APL had one to four slips, three most often. The bony prominences of the thumb side of the wrist located the compartment reliably. An anatomy study, not a training one.",
  },
];
