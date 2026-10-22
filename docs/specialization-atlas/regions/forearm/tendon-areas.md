# Forearm tendon areas: memberships and their evidence (22 Oct 2026)

Where each forearm muscle attaches, as tendon exposure counts it, and what each membership rests on. The content is `shared/specialization/regions/forearm/tendonAreas.ts` (`tendonAreaExtras`), with the sources it adds in `shared/specialization/sources/forearmTendon.ts`; the rules it is held to are tested in `client/src/lib/specialization/forearmTendonAreas.test.ts`. The design is `../../11-forearm-research-and-stack.md` §4.1 (areas, records, evidence, content tests), §4.4 (copy) and §4.6 (region-agnostic); the evidence standard is `../../03-anatomy-evidence.md` with `../../10-multi-region.md` §8.

**The rule.** A muscle belongs to the area of each place it attaches, where it starts and where it ends. So a wrist curl counts at the inner elbow (where FCR and FCU start) and at the front of the wrist (where they end), and a hammer curl counts at the outer elbow (where the brachioradialis starts) and at the radial styloid (where it ends). Areas overlap, so the page never adds their counts together. Each muscle carries the research package's regional group (`muscles.json` `regional_groups`) as `packageGroups`, for traceability only.

**Region records, not claims** (§1.6). An attachment is not one of the four claim kinds (function, appearance, selectivity, variation), so these are reviewed records held on the device, in the app's code only. Nothing here reaches the database or the seed.

## 1. Method

Web search only, as for the forearm's claims (`03-anatomy-evidence.md` §1). Page fetches fail in this build: on 22 Oct 2026 the proxy refused `radiopaedia.org` and `www.ncbi.nlm.nih.gov`, and the fetch tool could not resolve them. Every check is therefore against what the search results showed: titles, URLs, and excerpts or generated summaries of the pages.

1. For each (group, muscle) pair, search for where the muscle starts or ends, preferring the library's own records (StatPearls, Kenhub, Elsevier Complete Anatomy, Radiopaedia, IMAIOS, the university tables), then the same publishers' pages the library lacked.
2. Reuse a library record wherever its URL is the page the excerpt came from (the library files one URL under one key). Where the record's note did not already hold the attachment, the excerpt is quoted in the pair's `reviewNote` and in §4 below; the record's note is not edited (the forearm's A-records are in the seed).
3. Add a page the library lacked to `sources/forearmTendon.ts`, with a note saying what the search showed and what it could not confirm.
4. Cite each source on the pair with a `locator` (the part of the page the excerpt came from) and a `qualification` where the source narrows the membership or was seen only in part.
5. Mark a pair `reviewed` only when at least one excerpt says the muscle attaches at that place; mark it single-source when only one source does. Every reviewed pair here has two or more.
6. Word every label, description and caveat in plain directions (inner and outer, thumb side and pinky side, front and back) and keep out every word §4.4 keeps out of the section; the test scans all of it.

## 2. Limits

- **Excerpts, not full texts.** No page was opened. Locators name the part of the page an excerpt came from (a Kenhub key-facts row, an Elsevier Quick Facts row, a StatPearls section, a Radiopaedia article's text); they should be tightened to exact headings when the pages can be opened (`03-anatomy-evidence.md` open issue 3).
- **Search summaries can misquote.** Three did here, and none is relied on: Radiopaedia's sentence on which muscle forms which portion of the common flexor origin came back garbled, so only its list of members is used; one summary of Radiopaedia's common extensor origin placed ECU's origin on the supracondylar ridge (that is ECRL's place, and the same article lists ECU among the tendinous portions on the epicondyle); one summary of StatPearls' ECU article said the common extensor tendon is shared with FCU and FDP (the ulnar head's aponeurosis is). StatPearls' EPL insertion sentence was summarized garbled; EPL's end on the thumb rests on Kenhub and Elsevier.
- **Automated review.** "Reviewed" means checked by this automated process against search results, not by a clinician or an anatomist.
- **Where, not how much.** These records say where muscles attach. They say nothing about how much load a set puts on a tendon, and the section never shows a number for it.

## 3. Every membership

29 pairs in 12 groups and four areas, in the page's order. Status is per (group, muscle) pair. "Single source" is "yes" when one source alone places the muscle there.

| Area | Group | Muscle | Status | Single source | Sources (locator) |
|---|---|---|---|---|---|
| Inner elbow | Common flexor origin | PT | reviewed | no | A53 (Overview of the superficial group); radiopaedia.common_flexor_origin (Article text: the shared tendon and the muscles that form it); A22 (Key facts: Origin), qualifying |
| Inner elbow | Common flexor origin | FCR | reviewed | no | A53 (Overview of the superficial group); radiopaedia.common_flexor_origin (Article text: FCR and palmaris longus), qualifying; A6 (Key facts: Origin and insertion) |
| Inner elbow | Common flexor origin | PL | reviewed | no | A53 (Overview of the superficial group); radiopaedia.common_flexor_origin (Article text: FCR and palmaris longus), qualifying; elsevier.palmaris_longus (Quick Facts: Origin) |
| Inner elbow | Common flexor origin | FCU | reviewed | no | A53 (Overview of the superficial group); radiopaedia.common_flexor_origin (Article text: the shared tendon and the muscles that form it); kenhub.flexor_carpi_ulnaris (Origin), qualifying |
| Inner elbow | Common flexor origin | FDS | reviewed | no | A53 (Overview of the superficial group); radiopaedia.common_flexor_origin (Article text: the shared tendon and the muscles that form it); A12 (Structure and Function: origins), qualifying; kenhub.flexor_digitorum_superficialis (Origin) |
| Outer elbow | Common extensor origin | ECRB | reviewed | no | radiopaedia.common_extensor_origin (Article text: the tendinous portions, front to back); A29 (Structure and Function: origin), qualifying; elsevier.extensor_carpi_radialis_brevis (Quick Facts: Origin) |
| Outer elbow | Common extensor origin | ED | reviewed | no | radiopaedia.common_extensor_origin (Article text: the tendinous portions, front to back); A32 (Quick Facts: Origin) |
| Outer elbow | Common extensor origin | EDM | reviewed | no | radiopaedia.common_extensor_origin (Article text: the tendinous portions, front to back); A35 (Origin) |
| Outer elbow | Common extensor origin | ECU | reviewed | no | radiopaedia.common_extensor_origin (Article text: the tendinous portions, front to back), qualifying; A31 (Structure and Function: origin), qualifying; kenhub.extensor_carpi_ulnaris (Origin) |
| Outer elbow | Ridge above the outer elbow | ECRL | reviewed | no | A27 (Origin), qualifying; A28 (Quick Facts: Origin); imaios.extensor_carpi_radialis_longus (Origin), qualifying |
| Outer elbow | Ridge above the outer elbow | BR | reviewed | no | A1 (Structure and Function: origin), qualifying; A3 (Key facts: Origin) |
| Outer elbow | Supinator | SUP | reviewed | no | A46 (Origin and insertion); A47 (Quick Facts: Origin and insertion), qualifying |
| Wrist and thumb | Front of the wrist | FCR | reviewed | no | A6 (Key facts: Origin and insertion); A7 (Insertion), qualifying |
| Wrist and thumb | Front of the wrist | FCU | reviewed | no | A8 (Structure and Function: attachments); kenhub.flexor_carpi_ulnaris (Insertion) |
| Wrist and thumb | Front of the wrist | PL | reviewed | no | kenhub.palmaris_longus (Course and insertion); elsevier.palmaris_longus (Quick Facts: Insertion); A9 (Structure and Function; Clinical Significance), qualifying |
| Wrist and thumb | Back of the wrist | ECRL | reviewed | no | A27 (Key facts: Insertion); A28 (Quick Facts: Insertion) |
| Wrist and thumb | Back of the wrist | ECRB | reviewed | no | A29 (Structure and Function: insertion); elsevier.extensor_carpi_radialis_brevis (Quick Facts: Insertion) |
| Wrist and thumb | Back of the wrist | ECU | reviewed | no | A31 (Structure and Function: insertion); kenhub.extensor_carpi_ulnaris (Insertion) |
| Wrist and thumb | Thumb side of the wrist | APL | reviewed | no | A38 (Abductor pollicis longus; anatomical snuffbox), qualifying; A41 (Relations: anatomical snuffbox), qualifying; pmid.19092992 (Abstract), qualifying |
| Wrist and thumb | Thumb side of the wrist | EPB | reviewed | no | A38 (Abductor pollicis longus; anatomical snuffbox), qualifying; A41 (Relations: anatomical snuffbox), qualifying; pmid.19092992 (Abstract), qualifying; A43 (Introduction and review of insertion studies), qualifying |
| Wrist and thumb | Thumb | FPL | reviewed | no | A19 (Key facts: Origin and insertion); elsevier.flexor_pollicis_longus (Quick Facts: Insertion) |
| Wrist and thumb | Thumb | EPL | reviewed | no | A45 (Key facts: Insertion); elsevier.extensor_pollicis_longus (Quick Facts: Insertion); A44 (Introduction; Structure: course), qualifying |
| Wrist and thumb | Radial styloid | BR | reviewed | no | A1 (Structure and Function: insertion), qualifying; A3 (Key facts: Insertion), qualifying; A2 (Insertion), qualifying |
| Wrist and thumb | Above the wrist, deep | PQ | reviewed | no | A23 (Summary: origin and insertion); A24 (Key facts: Origin and insertion) |
| Fingers | Finger flexors | FDS | reviewed | no | A12 (Structure and Function: insertion); kenhub.flexor_digitorum_superficialis (Insertion) |
| Fingers | Finger flexors | FDP | reviewed | no | A15 (Quick Facts: Insertion); A14 (Structure and Function), qualifying |
| Fingers | Finger extensors | ED | reviewed | no | A33 (Overview: belly and tendons); A32 (Quick Facts: Insertion) |
| Fingers | Finger extensors | EDM | reviewed | no | A36 (Extensor digiti minimi), qualifying; A35 (Key facts: Insertion) |
| Fingers | Finger extensors | EI | reviewed | no | A37 (Key facts: Insertion); A36 (Extensor indicis) |

"Qualifying" marks a citation with a `qualification`: what the source adds that narrows the membership, or how much of it was seen. A citation marked only "Seen through web-search excerpts of the page, not the full text" is not marked here.

## 4. Each group, and what each sentence rests on

Quotes are from the search excerpts or summaries as seen on 22 Oct 2026 (search text, not page text). Where an A-record's library note already holds the attachment, it is quoted from the note.

### Inner elbow

Description: "The bony knob on the inner side of the elbow, on the pinky side with the palm facing forward, where the wrist and finger flexors and pronator teres start from a shared tendon." Rests on A53's note ("sharing the common flexor origin on the medial epicondyle") and Radiopaedia ("a thick tendinous structure originating from the medial epicondyle"). The pinky side is the medial side with the palm facing forward, as the forearm's node copy already says it.

**Common flexor origin.**
- **PT.** A53 (library note): "groups pronator teres, flexor carpi radialis, palmaris longus, flexor carpi ulnaris and flexor digitorum superficialis as superficial anterior muscles sharing the common flexor origin on the medial epicondyle". Radiopaedia: the common flexor origin splits "in anterosuperior and posteroinferior common tendinous portions", which pronator teres, FDS and FCU form. A22 (library note), qualifying: "humeral head from the medial supracondylar ridge, ulnar head from the coronoid process". Elsevier's and IMAIOS's pronator teres pages (search, not cited) put the humeral head on the medial epicondyle through the common flexor tendon, as A53 and Radiopaedia do.
- **FCR.** A53 as above. Radiopaedia, qualifying: FCR and palmaris longus "also originate from the medial epicondyle and are overlying the flexor digitorum superficialis", and "are also counted to the flexor-pronator mass and variably to the common flexor origin". A6 (library note): "medial epicondyle to the bases of metacarpals 2–3".
- **PL.** A53 as above. Radiopaedia, qualifying, as for FCR. Elsevier (new): origin "the medial epicondyle via the common flexor tendon".
- **FCU.** A53 as above. Radiopaedia: FCU forms part of the common tendon. Kenhub FCU (new), qualifying: "the smaller humeral head arises from the common flexor origin on the medial epicondyle", "the more extensive ulnar head originates from the olecranon and proximal part of the posterior border of ulna".
- **FDS.** A53 as above, qualifying: its note adds that "a teaching source places FDS in a middle layer beneath the first four". Radiopaedia: FDS forms part of the common tendon and lies "deep to the origin of the flexor carpi radialis and the palmaris longus". A12 (StatPearls FDS), qualifying: "The humeroulnar head originates off the medial epicondyle of the humerus and the coronoid process of the ulna"; "The radial head originates on the upper half of the volar aspect of the radial shaft". Kenhub FDS (new): the humeroulnar head "originates from both the medial epicondyle of humerus via the common flexor tendon, as well as the medial margin of the coronoid process of ulna".

Caveat, sentence by sentence:
- "Not every member starts only here: pronator teres and FCU also have a head on the ulna, and FDS one on the radius, and one reference puts the upper head of pronator teres on the ridge just above the bony knob." A22 (ulnar head from the coronoid process; humeral head on the ridge), Kenhub FCU (ulnar head from the olecranon), A12 (FDS radial head).
- "One reference counts FCR and palmaris longus only sometimes as part of the shared tendon, though both start on the knob." Radiopaedia ("variably to the common flexor origin"; "also originate from the medial epicondyle").
- "The deep finger flexor (FDP) and the long thumb flexor (FPL) start on the forearm bones, so they are not counted here, even where a reference reports a small extra slip of FPL from the knob." A15 (FDP: "the medial coronoid process and the upper three-quarters of the anterior and medial ulna, plus the adjacent interosseous membrane"), A19 (FPL: "the anterior radius and interosseous membrane"), Elsevier FPL (new: "possible origins at the coronoid process or medial epicondyle"). Not counted here as the package's §6.1 asks: "The medial flexor group does not mean FDP and FPL share the common flexor origin."
- "Palmaris longus is missing in some people." A9 (library note: "commonly absent"), cited on PL at the front of the wrist; Kenhub PL ("absent in some people").

### Outer elbow

Description: "The bony knob on the outer side of the elbow, on the thumb side with the palm facing forward, and the ridge above it: the wrist and finger extensors start from a shared tendon on the knob, the brachioradialis and ECRL on the ridge, and the supinator from the ligaments there to the top of the radius." Rests on Radiopaedia (the common extensor origin "from the anterolateral surface of the lateral epicondyle"), A1, A3, A27, A28 (the ridge), and A46 and A47 (the supinator).

**Common extensor origin.**
- **ECRB.** Radiopaedia (new): "Tendinous portions originating from the common extensor footprint distal to the extensor carpi radialis longus origin from anterior to posterior": ECRB, then the extensor digitorum with EDM, then ECU. A29 (StatPearls ECRB), qualifying: "originates from the lateral epicondyle of the humerus by a common tendon"; also a reported variant that "originate[s] from the fascia of the extensor digitorum communis rather than its usual origin on the lateral epicondyle". Elsevier ECRB (new): "Origin: Lateral epicondyle of humerus, via common extensor tendon."
- **ED.** Radiopaedia as above; "The mere origin of the extensor carpi radialis brevis and extensor digitorum communis tendons are also coalescent". A32 (Elsevier ED): arises from the common extensor tendon "and adds the adjacent antebrachial fascia".
- **EDM.** Radiopaedia as above. A35 (Kenhub EDM): "arises from the lateral epicondyle of the humerus through the common extensor tendon, which it shares with extensor digitorum, extensor carpi radialis brevis, and extensor carpi ulnaris".
- **ECU.** Radiopaedia, qualifying: "the extensor carpi ulnaris origin on the other hand can be separated with a thick fascia arising posteroinferiorly from the lateral epicondyle". A31 (StatPearls ECU), qualifying: "The humeral head arises from the lateral epicondyle through the common extensor tendon, and the ulnar head arises from a shared aponeurosis on the posterior ulna." Kenhub ECU (new): "originates from the lateral epicondyle of humerus, via the common extensor tendon, and adjacent fascia. The lateral epicondyle is a common origin for extensor carpi ulnaris, extensor digitorum, extensor carpi radialis brevis and extensor digiti minimi muscles."

Caveat:
- "ECRB, the extensor digitorum, EDM and ECU start here from one shared tendon." Radiopaedia; Kenhub ECU.
- "ECU also starts from the back of the ulna, and one reference says its part of the tendon can be told apart by a thick layer of fascia while the others merge." A31, Kenhub ECU (the posterior border of the ulna); Radiopaedia (the thick fascia; ECRB and ED coalescent).
- "ECRL is not counted here: it starts on the ridge above, though two references say a small part of it also comes from this tendon." A27 ("A small portion of its fibers originate from the common extensor tendon attached to the lateral epicondyle of humerus"), IMAIOS ECRL ("also receives some fibres from the lateral intermuscular septum and the common extensor origin"). Not counted here as the package's §6.1 asks: "ECRL must not be assigned to the common extensor origin simply because ECRB is."

**Ridge above the outer elbow.**
- **ECRL.** A27 (Kenhub ECRL), qualifying: "The majority of extensor carpi radialis longus originates from the lateral supracondylar ridge of humerus (distal third) and anterior aspect of the lateral intermuscular septum of the arm. A small portion of its fibers originate from the common extensor tendon". A28 (Elsevier ECRL): "inferior one third of lateral supracondylar ridge of humerus", "located inferior to the origin site of the brachioradialis muscle". IMAIOS ECRL (new), qualifying: "the lower third of the lateral supracondylar ridge of the humerus, just below where the brachioradialis starts", with "some fibres from the lateral intermuscular septum and the common extensor origin".
- **BR.** A1 (StatPearls BR), qualifying: "The brachioradialis originates proximally from the proximal two-thirds of the lateral humeral supracondylar ridge and inserts distally on the base of the lateral radial styloid process." That sentence came from the same article's point-of-care page (`statpearls.com/point-of-care/18504`); the Bookshelf excerpt (`NBK526110`, A1's URL) said only that it "arises with the extensor carpi radialis longus muscle from the lateral humeral supracondylar ridge". A3 (Kenhub BR): "Origin: Lateral supracondylar ridge of humerus, lateral intermuscular septum of arm"; the fuller article gives "the upper two-thirds of the ridge". The design asked for BR to be named single-source unless A3's excerpt agreed; it agrees.

Caveat:
- "The brachioradialis starts on the upper part of this ridge and ECRL on the lower part, just above the bony knob." A1 and A3 (upper two-thirds), A27, A28 and IMAIOS (lower or distal third, below the brachioradialis).
- "Two references say a small part of ECRL also starts from the common extensor tendon; at the outer elbow, ECRL is counted on the ridge only." A27, IMAIOS; the package's §6.1.

**Supinator.**
- **SUP.** A46 (Kenhub supinator): "Its origin is the lateral epicondyle of humerus, radial collateral ligament, annular ligament, supinator crest of ulna"; insertion on "the upper third of the radius's lateral, posterior, and anterior surfaces". A47 (Elsevier supinator), qualifying: origin "the supinator crest and fossa of the ulna, the radial collateral ligament of the elbow, and the annular ligament of the radius"; fibres "insert onto the anterior, lateral, and posterior aspects of the proximal one third of the radius". The A47 excerpt did not name the lateral epicondyle.

Caveat: "Both references have the supinator start from the ligaments on the outer side of the elbow and a crest on the ulna just below it, and wrap the top third of the radius; only one also names the outer bony knob among its starting points." A46, A47 as quoted.

### Wrist and thumb

Description: "Where the wrist muscles end on the bones at the base of the hand, front and back; where the thumb's long tendons run and end; and where two muscles end on the forearm bones just above the wrist." Rests on the insertions below, and on A23, A24 and A1 for the two muscles that end above the wrist (PQ and the brachioradialis).

**Front of the wrist.**
- **FCR.** A6 (library note): "medial epicondyle to the bases of metacarpals 2–3". A7 (IMAIOS FCR), qualifying: the tendon "inserts primarily onto the base of the second metacarpal bone, and variably onto the base of the third metacarpal bone".
- **FCU.** A8 (library note): "inserts on the pisiform, hook of hamate and fifth metacarpal". Kenhub FCU (new): inserts on "the pisiform and hamate carpal bones, as well as the base of the fifth metacarpal bone".
- **PL.** Kenhub PL (new): "The tendon enters the palmar surface of the hand by passing superficially (i.e. external) to the flexor retinaculum"; "A few tendinous fibers blend with the superior surface of the retinaculum, while the majority widens and continues distally to finally insert into the palmar aponeurosis." Elsevier PL (new): insertion "the palmar aponeurosis and flexor retinaculum of the hand". A9 (library note), qualifying: "appears to tension the palmar aponeurosis; commonly absent, and absence has not been shown to reduce grip strength".

Caveat: "FCR ends mainly at the base of the index finger's hand bone and sometimes the middle finger's as well; FCU ends at the pisiform and nearby bones on the pinky side; palmaris longus ends in the sheet of tissue in the palm and is missing in some people." A6, A7; A8, Kenhub FCU; Kenhub PL, Elsevier PL, A9.

**Back of the wrist.**
- **ECRL.** A27 (library note): "inserts on the base of the second metacarpal"; the search on 22 Oct gave Kenhub's key facts as "posterior aspect of base of metacarpal bone 2". A28 (Elsevier ECRL): "Dorsal aspect of base of second metacarpal bone."
- **ECRB.** A29 (library note): "inserts on the base of the third metacarpal"; the search gave "It inserts at the base of the third metacarpal on the radial side of the dorsal surface." Elsevier ECRB (new): "Insertion: Dorsal aspect of base of third metacarpal bone."
- **ECU.** A31 (library note): "inserts on the dorsal base of the fifth metacarpal via the sixth extensor compartment". Kenhub ECU (new): "The tendon passes over the dorsal surface of triquetral bone and inserts to the medial aspect of the base of metacarpal bone 5."

Caveat: "ECRL ends at the base of the index finger's hand bone, ECRB at the middle finger's and ECU at the little finger's." The six citations above. "The finger extensors' tendons also cross the back of the wrist; they are counted where they end, on the fingers." A33 (library note: the extensor digitorum's tendons pass "under the extensor retinaculum to digits 2–5"); the counting rule is §4.1's (by attachment), not a source's.

**Thumb side of the wrist.**
- **APL.** A38 (library note), qualifying: "the tendons of abductor pollicis longus and extensor pollicis brevis form the lateral border of the anatomical snuffbox". A41 (library note), qualifying: EPB "with the abductor pollicis longus tendon forms the lateral border of the anatomical snuffbox". Hazani et al. 2008 (`pmid.19092992`, new), qualifying: the APL and EPB tendons occupy the first dorsal compartment, "positioned lateral to the radial styloid process"; APL had "1, 2, 3, or 4 slips". A38 and A41 place the tendons at the snuffbox, which lies at the thumb side of the wrist; they do not name the compartment, and their qualification says so.
- **EPB.** A38, A41 and Hazani as for APL; Hazani, qualifying: a separate compartment for EPB in just over a third of specimens. A43 (library note), qualifying: "textbook descriptions of the EPB tendon disagree with published anatomical studies; in one cadaver study only a quarter of tendons inserted in the conventional way, into the base of the proximal phalanx".

Caveat: "APL and EPB run together past the thumb side of the wrist, in the first of the tunnels that hold the tendons on the back of the wrist." Hazani (the first dorsal compartment is the first of the extensor compartments). "In a cadaver study EPB had a tunnel of its own in just over a third of wrists and APL split into one to four slips, and where EPB's tendon ends varies between people." Hazani; A43.

**Thumb.**
- **FPL.** A19 (Kenhub FPL): "the origin as the anterior radius and interosseous membrane, and the insertion as the palmar surface of the thumb's distal phalanx". Elsevier FPL (new): "the palmar aspect of the base of the distal phalanx of the thumb is the insertion".
- **EPL.** A45 (Kenhub EPL): "Its insertion is the posterior base of the thumb's distal phalanx." Elsevier EPL (new): "a long tendon reaching the dorsal base of the distal phalanx of the thumb". A44 (library note), qualifying: "passes over Lister's tubercle and is the only occupant of the third extensor compartment"; its insertion sentence was summarized garbled and is not relied on.

Caveat: "FPL ends on the palm side of the thumb's end bone and EPL on its back, after bending around a bony bump on the back of the radius." A19, Elsevier FPL; A45, Elsevier EPL; A44 (Lister's tubercle). "FPL is missing, or joined to a neighbouring flexor, in a small number of people." A19 (library note: "absent in a small part of the population and can blend with neighbouring flexors").

**Radial styloid.**
- **BR.** A1, qualifying as at the ridge: "inserts distally on the base of the lateral radial styloid process", "via a thin tendon". A3 (Kenhub BR), qualifying: "Insertion (Proximal to) styloid process of radius." A2 (Elsevier BR), qualifying: "the tendon runs inferiorly and attaches to the lateral aspect of the distal radius, superior to the styloid".

Caveat: "References differ slightly on where the brachioradialis ends: at the base of the radial styloid, the bony tip of the radius on the thumb side of the wrist, or just above it." A1; A3 and A2. "It does not cross the wrist." A1 (library note: "one of two extensor-compartment muscles that do not cross the wrist"), as `br.function` already says.

**Above the wrist, deep.**
- **PQ.** A23 (Radiopaedia PQ): "the origin as the anterior surface of the distal quarter of the ulnar shaft, and the insertion as the anterior surface of the distal quarter of the radial shaft". A24 (Kenhub PQ): "the pronator quadratus origin as the distal anterior surface of the ulna and the insertion as the distal anterior surface of the radius". Elsevier's PQ page (search, not cited) gives the same distal quarters.

Caveat: "Pronator quadratus does not cross the wrist: both its ends are on the front of the two forearm bones, in their last quarter above the wrist." A23, A24.

### Fingers

Description: "The long tendons that end on the four fingers: the finger flexors on the palm side and the finger extensors on the back." Rests on the insertions below.

**Finger flexors.**
- **FDS.** A12 (StatPearls FDS): "the flexor digitorum superficialis tendinously slips insert onto the middle phalangeal bases of second, third, fourth, and fifth digits, on the volar surface of the hand". Kenhub FDS (new): "the muscle's tendons split near the wrist and attach to the middle phalanges of digits 2 through 5".
- **FDP.** A15 (Elsevier FDP): "the insertion at the palmar bases of the distal phalanges of the index, middle, ring, and little fingers". A14 (library note), qualifying: "flexes the MCP and DIP joints of the medial four digits and is the only muscle that flexes the DIP joints"; "tendons insert deep to the FDS tendons". A14 gives the course and the joints, not the bone.

Caveat: "FDS and FDP each send a tendon to each of the four fingers, FDS ending on the middle bones and FDP on the end bones; the counts do not tell one finger from another." A12 ("four digital components, each with its own tendon"), Kenhub FDS, A15; the package's §6.1: "FDS/FDP aggregate multiple digital tendons, so a finger-specific view must not pretend these rows distinguish each digit."

**Finger extensors.**
- **ED.** A33 (library note): "its belly ends in four tendons about a third of the way down the forearm, passing under the extensor retinaculum to digits 2–5". A32 (Elsevier ED): "the dorsal bases of the middle and distal phalanges of the index through little fingers".
- **EDM.** A36 (library note), qualifying: "extensor digiti minimi inserts into the extensor expansion of the fifth digit, and some anatomists regard it as the ulnar-most part of extensor digitorum". A35 (Kenhub EDM): "it inserts on the extensor expansion of digit 5".
- **EI.** A37 (Kenhub EI): "the tendon of extensor indicis inserts at the extensor expansion on the back of the proximal phalanx of the index finger", having joined "the ulnar side of the tendons of extensor digitorum". A36 (library note): extensor indicis "arises from the distal posterior ulna and interosseous membrane, joins the index tendon of extensor digitorum".

Caveat: "The extensor digitorum sends a tendon to each of the four fingers; EI joins its tendon to the index finger and EDM ends beside its tendon to the little finger, and some anatomists treat EDM as part of the extensor digitorum. The counts do not tell one finger from another." A33, A37, A36, A35.

## 5. Single-source memberships

**None.** Every reviewed pair rests on at least two sources whose excerpts place the muscle there (§3). Details inside a pair that one source alone gives are named instead, in the pair's qualification and the group's caveat:
- the supinator's start on the outer bony knob itself (A46 only; A47's excerpt names the ligaments and the crest);
- pronator teres' upper head on the ridge above the inner knob (A22 only; A53, Radiopaedia, Elsevier and IMAIOS put it on the knob);
- FCR and palmaris longus as only variably part of the shared flexor tendon (Radiopaedia only);
- ECU's part of the shared extensor tendon separable by fascia (Radiopaedia only);
- the ECRB variant from the extensor digitorum's fascia (A29 only);
- FPL's possible extra origin from the inner knob or the coronoid process (Elsevier only);
- the EPB compartment and APL slip figures (Hazani et al. only).

## 6. Drafts

**No draft pair remains.** The design held three pairs as drafts "until a second source agrees" (§4.1, §8.4); a second source agreed for each, and each pair's `reviewNote` says so:

| Pair | The design's reason | What agreed |
|---|---|---|
| ECU, common extensor origin | Sources differ on its ulnar head; only Radiopaedia placed it | A31 (StatPearls ECU: "The humeral head arises from the lateral epicondyle through the common extensor tendon") and Kenhub ECU ("originates from the lateral epicondyle of humerus, via the common extensor tendon"). The ulnar head starts on the back of the ulna in all three; no source puts it in the shared tendon, and the caveat says so. Radiopaedia's fuller excerpt lists ECU among the tendinous portions; the one summary that seemed to disagree misplaced ECRL's description (§2). |
| Supinator, its attachments around the outer elbow | Only study aids gave the ligament and crest attachments | A46 (Kenhub) and A47 (Elsevier), both library records, name the radial collateral and annular ligaments, the supinator crest of the ulna and the upper third of the radius. Only A46 names the lateral epicondyle (§5). |
| PQ, above the wrist | Both attachments on the distal radius and ulna rested on A23 alone | A24 (Kenhub PQ): "the distal anterior surface of the ulna" to "the distal anterior surface of the radius". |

So every own target muscle is placed and `tendonNotPlaced` is empty. If a later review returns any of these to draft, the muscle stays counted in its other groups (ECU at the back of the wrist); the supinator and PQ, which have one group each, would go to `tendonNotPlaced` with the reason, and the content test requires exactly that.

## 7. What is not placed

- **Muscles:** none of the 19 (§6).
- **Nodes in no group, by design:** the anconeus (an adjacent muscle, at the back of the elbow), and the upper arm's biceps and brachialis (external members). Their attachments are outside the forearm's own areas: a front-of-elbow area for the biceps and brachialis would be the upper arm's content to define, not the forearm's. The test holds them out of every group.
- **Attachments with no group of their own,** so a muscle is counted only at its other attachment: pronator teres' end on the middle of the radius; the origins on the forearm bones of FDP, FPL, APL, EPB, EPL and EI; FDS's radial head; and the ulnar heads of FCU and ECU. None of these is a shared tendon or a site the package groups; each muscle is counted where its groups above place it.
- **What the areas do not cover at all:** the ligaments, the joint surfaces and the finger pulleys (the package's §6.1: "Ligaments, joint contact and finger pulleys are not measured by this model"), and the small muscles of the hand.

## 8. Sources

**Added** (`sources/forearmTendon.ts`, twelve records, each cited by a pair, none in any region's `sources`, so the seed is unchanged; the page receives them as the extras' `referenceSources`): `radiopaedia.common_flexor_origin`, `radiopaedia.common_extensor_origin` (both named in §1.5), `imaios.extensor_carpi_radialis_longus` (the design's "Imaios reports a small contribution"), `kenhub.extensor_carpi_ulnaris`, `kenhub.flexor_carpi_ulnaris`, `kenhub.palmaris_longus`, `elsevier.palmaris_longus`, `kenhub.flexor_digitorum_superficialis`, `elsevier.extensor_carpi_radialis_brevis`, `elsevier.flexor_pollicis_longus`, `elsevier.extensor_pollicis_longus`, and `pmid.19092992` (Hazani, Engineer, Cooney and Wilhelmi, Eplasty 2008, PMC2586286; the PubMed id is the one its PMC record gives).

**Reused** (library records, unedited): A1, A2, A3, A6, A7, A8, A9, A12, A14, A15, A19, A22, A23, A24, A27, A28, A29, A31, A32, A33, A35, A36, A37, A38, A41, A43, A44, A45, A46, A47, A53. A54 (Kenhub superficial extensors) is not cited: its recorded note says only that the group arises "mostly from the common extensor origin", which places no single muscle. A55 is not cited: its note does not give the thumb tendons' compartments.

**Searched and not cited:** Elsevier's and IMAIOS's pronator teres pages and Elsevier's pronator quadratus page (each agrees with a cited source; not needed for a second source); Loyola's LUMEN dissector pages (the school of the package's A02 table, whose PDF §1.5 could not find; they agree with the cited sources but are not in the library and were not needed); Wikipedia (read, never cited, as `03-anatomy-evidence.md` §1 does).

## 9. For the reviewer

- **The design's evidence list names "A53, Radiopaedia" and "A54, Radiopaedia" for the two common origins.** A53 and A54 are Kenhub's group pages in the library, not Radiopaedia; the Radiopaedia records are the two new keys §1.5 names. A54 is not cited (above).
- **A27 and A28 hold the ECRL origin only in this review.** Their library notes give action and insertion; the origin quotes in §4 come from the 22 Oct search, recorded in the pairs' `reviewNote`s, because the A-records are seeded and their notes are not edited here.
- **The three drafts are reviewed** (§6). The page's sample copy in §4.4 ("Not placed in an area yet: the supinator, …") was written while the supinator was a draft; with these records, no muscle is unplaced, and the line names only sets of exercises in no area.
- **What the method note's sources are.** S15, S16, S17 and Impellizzeri 2020 (§1.5, §4.4's method note) are cited by no membership and are not added here; adding S15–S17 under `pmid.` keys would also change the R0 import report, which matches the package's sources against the library.
