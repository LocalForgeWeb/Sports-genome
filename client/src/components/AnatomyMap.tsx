import { useMemo, useState } from "react";
import { ChevronDown, Focus, RotateCcw, RotateCw, Search, SlidersHorizontal, Target } from "lucide-react";
import "../anatomy-clean.css";

/** Body Lab: greyscale anatomical illustration with contoured SVG muscle overlays. */
type AnatomyMapProps = { primary: string[]; secondary: string[]; onSelect: (muscle: string) => void };
type Side = "front" | "back";
type Layer = "surface" | "deep" | "all";
type Role = "Primary" | "Synergist" | "Stabilizer";
type Region = {
  id: string; key: string; side: Side; layer: "surface" | "deep";
  label: string; action: string; why: string;
  paths: string[]; offset: number; stabilizer?: boolean; related?: string[]; focus: string;
};

const labels: Record<string, string> = {
  chest: "Pectoralis major", frontDelts: "Anterior deltoid", sideDelts: "Lateral deltoid",
  rearDelts: "Posterior deltoid", biceps: "Biceps brachii", brachialis: "Brachialis",
  brachioradialis: "Brachioradialis", triceps: "Triceps brachii", forearms: "Forearm compartments",
  abs: "Rectus abdominis", obliques: "External oblique", serratusAnterior: "Serratus anterior",
  hipFlexors: "Hip flexor complex", tfl: "Tensor fasciae latae", quads: "Quadriceps femoris",
  adductors: "Hip adductors", abductors: "Hip abductors", glutes: "Gluteal complex",
  hamstrings: "Hamstrings", calves: "Gastrocnemius", soleus: "Soleus",
  tibialis: "Tibialis anterior", peroneals: "Peroneus longus/brevis", lats: "Latissimus dorsi",
  traps: "Trapezius", rhomboids: "Rhomboids", lowerBack: "Spinal erectors",
  rotatorCuff: "Rotator cuff muscles"
};

const aliases: Record<string, string[]> = {
  chest: ["chest", "pectoral", "pectoralis", "pec"],
  frontDelts: ["frontdelts", "anteriordelt", "shoulders"],
  sideDelts: ["sidedelts", "lateraldelt", "shoulders"],
  rearDelts: ["reardelts", "posteriordelt", "shoulders"],
  biceps: ["biceps"], brachialis: ["brachialis"], brachioradialis: ["brachioradialis"],
  triceps: ["triceps"], forearms: ["forearms", "grip", "wristflexors", "wristextensors"],
  abs: ["abs", "rectusabdominis"], obliques: ["obliques", "core", "externaloblique"],
  serratusAnterior: ["serratus", "serratusanterior"],
  hipFlexors: ["hipflexors", "iliopsoas"], tfl: ["tfl", "tensorfasciaelatae"],
  quads: ["quads", "quadriceps"], adductors: ["adductors"],
  abductors: ["abductors", "glutemedius"], glutes: ["glutes", "gluteusmaximus"],
  hamstrings: ["hamstrings"], calves: ["calves", "gastrocnemius"], soleus: ["soleus"],
  tibialis: ["tibialis"], peroneals: ["peroneals", "peroneus", "fibularis"],
  lats: ["lats", "latissimus"], traps: ["traps", "trapezius"], rhomboids: ["rhomboids"],
  lowerBack: ["lowerback", "erectors", "erectorspinae"],
  rotatorCuff: ["rotatorcuff", "infraspinatus"]
};

const clean = (v: string) => v.toLowerCase().replace(/[^a-z]/g, "");
const matches = (key: string, values: string[]) => values.some(v => (aliases[key] || [key]).some(a => clean(v).includes(a)));
const heat = (s: number) => s >= 90 ? "rgba(219,47,36,.6)" : s >= 75 ? "rgba(244,105,51,.55)" : s >= 60 ? "rgba(245,161,61,.5)" : s >= 40 ? "rgba(115,184,217,.45)" : s >= 20 ? "rgba(115,184,217,.35)" : "transparent";
const heatSolid = (s: number) => s >= 90 ? "#db2f24" : s >= 75 ? "#f46933" : s >= 60 ? "#f5a13d" : s >= 40 ? "#73b8d9" : s >= 20 ? "#73b8d9" : "#b0bfc8";
const tier = (s: number) => s >= 90 ? "S" : s >= 80 ? "A" : s >= 65 ? "B" : s >= 45 ? "C" : s >= 25 ? "D" : "F";

/* Illustration URLs */
const ANTERIOR_IMG = "/manus-storage/anatomy-front-view_ee25f580.png";
const POSTERIOR_IMG = "/manus-storage/anatomy-posterior_6114a98a.png";

/* ─── ANATOMICALLY CONTOURED SVG PATHS (viewBox 0 0 300 600) ─── */
/* These paths trace the actual muscle shapes and overlay on the illustration */

const frontPaths = {
  clavicularPec: [
    "M110 128 C118 122 130 120 142 126 L142 148 C128 143 115 142 108 146 C105 140 107 133 110 128 Z",
    "M190 128 C182 122 170 120 158 126 L158 148 C172 143 185 142 192 146 C195 140 193 133 190 128 Z"
  ],
  sternocostalPec: [
    "M108 147 C116 142 130 144 142 150 L142 178 C128 173 114 170 106 174 C102 166 104 155 108 147 Z",
    "M192 147 C184 142 170 144 158 150 L158 178 C172 173 186 170 194 174 C198 166 196 155 192 147 Z"
  ],
  anteriorDelt: [
    "M86 122 C78 127 74 138 75 150 C76 160 80 167 85 170 L98 166 C100 155 103 143 106 134 L102 125 C96 121 90 120 86 122 Z",
    "M214 122 C222 127 226 138 225 150 C224 160 220 167 215 170 L202 166 C200 155 197 143 194 134 L198 125 C204 121 210 120 214 122 Z"
  ],
  lateralDelt: [
    "M74 148 C72 157 73 167 78 175 L86 172 C83 165 81 157 82 149 Z",
    "M226 148 C228 157 227 167 222 175 L214 172 C217 165 219 157 218 149 Z"
  ],
  biceps: [
    "M82 176 C80 188 79 202 81 215 C83 225 86 232 90 237 L100 233 C98 225 97 215 97 205 C97 194 98 184 100 176 Z",
    "M218 176 C220 188 221 202 219 215 C217 225 214 232 210 237 L200 233 C202 225 203 215 203 205 C203 194 202 184 200 176 Z"
  ],
  brachialis: [
    "M82 218 C81 225 82 232 85 238 L94 235 C92 230 91 225 91 219 C91 215 92 211 93 208 L84 210 C82 213 81 216 82 218 Z",
    "M218 218 C219 225 218 232 215 238 L206 235 C208 230 209 225 209 219 C209 215 208 211 207 208 L216 210 C218 213 219 216 218 218 Z"
  ],
  brachioradialis: [
    "M84 239 C82 248 80 258 78 268 C77 276 76 282 75 288 L82 290 C83 283 84 275 85 268 C87 258 89 248 91 240 Z",
    "M216 239 C218 248 220 258 222 268 C223 276 224 282 225 288 L218 290 C217 283 216 275 215 268 C213 258 211 248 209 240 Z"
  ],
  forearms: [
    "M86 241 C88 250 90 262 91 274 C92 284 92 292 91 298 L82 296 C81 288 80 278 79 268 C78 258 79 248 81 241 Z",
    "M214 241 C212 250 210 262 209 274 C208 284 208 292 209 298 L218 296 C219 288 220 278 221 268 C222 258 221 248 219 241 Z"
  ],
  serratus: [
    "M97 180 C100 178 104 179 106 182 L103 190 C100 188 97 187 95 189 Z M95 192 C98 190 102 191 104 194 L101 202 C98 200 95 199 93 201 Z M93 205 C96 203 100 204 102 207 L99 215 C96 213 93 212 91 214 Z",
    "M203 180 C200 178 196 179 194 182 L197 190 C200 188 203 187 205 189 Z M205 192 C202 190 198 191 196 194 L199 202 C202 200 205 199 207 201 Z M207 205 C204 203 200 204 198 207 L201 215 C204 213 207 212 209 214 Z"
  ],
  obliques: [
    "M102 185 C106 183 112 184 117 187 L113 245 C109 249 104 250 100 247 C97 244 94 240 93 236 L98 195 C99 190 100 187 102 185 Z",
    "M198 185 C194 183 188 184 183 187 L187 245 C191 249 196 250 200 247 C203 244 206 240 207 236 L202 195 C201 190 200 187 198 185 Z"
  ],
  rectus: [
    "M128 185 C132 183 138 183 142 185 L142 205 C138 206 132 206 128 205 Z M128 209 C132 208 138 208 142 209 L142 228 C138 229 132 229 128 228 Z M128 232 C132 231 138 231 142 232 L142 254 C138 256 132 257 128 255 Z",
    "M172 185 C168 183 162 183 158 185 L158 205 C162 206 168 206 172 205 Z M172 209 C168 208 162 208 158 209 L158 228 C162 229 168 229 172 228 Z M172 232 C168 231 162 231 158 232 L158 254 C162 256 168 257 172 255 Z"
  ],
  hipFlexor: [
    "M117 256 C122 254 130 255 136 258 L128 284 C124 286 118 286 114 284 C110 282 107 278 105 274 L112 262 C113 259 115 257 117 256 Z",
    "M183 256 C178 254 170 255 164 258 L172 284 C176 286 182 286 186 284 C190 282 193 278 195 274 L188 262 C187 259 185 257 183 256 Z"
  ],
  tfl: [
    "M97 280 C99 276 103 274 107 275 C111 276 113 279 113 283 C113 288 111 292 108 294 C104 296 100 295 98 292 C96 289 96 284 97 280 Z",
    "M203 280 C201 276 197 274 193 275 C189 276 187 279 187 283 C187 288 189 292 192 294 C196 296 200 295 202 292 C204 289 204 284 203 280 Z"
  ],
  quads: [
    "M98 296 C106 288 120 286 134 292 C138 294 141 298 142 302 L138 412 C132 416 120 418 110 416 C102 414 96 410 93 406 L90 344 C91 324 94 308 98 296 Z",
    "M202 296 C194 288 180 286 166 292 C162 294 159 298 158 302 L162 412 C168 416 180 418 190 416 C198 414 204 410 207 406 L210 344 C209 324 206 308 202 296 Z"
  ],
  adductors: [
    "M130 290 C135 288 140 289 144 292 C146 294 147 297 147 300 L146 404 C143 407 138 408 133 407 C129 406 126 404 125 401 L124 300 C124 295 126 292 130 290 Z",
    "M170 290 C165 288 160 289 156 292 C154 294 153 297 153 300 L154 404 C157 407 162 408 167 407 C171 406 174 404 175 401 L176 300 C176 295 174 292 170 290 Z"
  ],
  tibialis: [
    "M102 424 C105 421 110 420 115 421 C118 422 120 424 121 427 L118 534 C115 537 110 538 106 537 C103 536 101 534 100 531 L99 439 C99 432 100 428 102 424 Z",
    "M198 424 C195 421 190 420 185 421 C182 422 180 424 179 427 L182 534 C185 537 190 538 194 537 C197 536 199 534 200 531 L201 439 C201 432 200 428 198 424 Z"
  ],
  peroneals: [
    "M94 434 C96 430 99 428 102 429 C104 430 105 432 105 435 L103 529 C101 531 98 532 96 531 C94 530 93 528 93 525 Z",
    "M206 434 C204 430 201 428 198 429 C196 430 195 432 195 435 L197 529 C199 531 202 532 204 531 C206 530 207 528 207 525 Z"
  ]
};

const backPaths = {
  upperTrap: ["M120 108 C132 102 142 97 150 94 C158 97 168 102 180 108 L174 128 C164 124 156 122 150 122 C144 122 136 124 126 128 Z"],
  middleTrap: ["M114 134 C126 128 138 125 150 125 C162 125 174 128 186 134 L180 166 C170 160 160 157 150 157 C140 157 130 160 120 166 Z"],
  lowerTrap: ["M124 168 C134 162 142 159 150 159 C158 159 166 162 176 168 L166 222 C160 216 155 213 150 213 C145 213 140 216 134 222 Z"],
  rhomboids: [
    "M126 138 C130 134 136 132 142 134 C145 135 147 138 147 141 L144 174 C140 177 135 178 131 176 C128 174 126 171 125 168 Z",
    "M174 138 C170 134 164 132 158 134 C155 135 153 138 153 141 L156 174 C160 177 165 178 169 176 C172 174 174 171 175 168 Z"
  ],
  posteriorDelt: [
    "M86 122 C78 127 74 138 75 150 C76 160 80 167 85 170 L98 166 C100 155 103 143 106 134 L102 125 C96 121 90 120 86 122 Z",
    "M214 122 C222 127 226 138 225 150 C224 160 220 167 215 170 L202 166 C200 155 197 143 194 134 L198 125 C204 121 210 120 214 122 Z"
  ],
  cuff: [
    "M106 144 C112 140 120 139 128 142 C133 144 136 148 137 153 L132 184 C128 188 122 190 116 188 C111 186 107 182 105 178 Z",
    "M194 144 C188 140 180 139 172 142 C167 144 164 148 163 153 L168 184 C172 188 178 190 184 188 C189 186 193 182 195 178 Z"
  ],
  lats: [
    "M105 185 C112 181 122 179 134 183 C140 185 144 189 146 194 L145 258 C140 264 130 268 120 266 C112 264 105 259 100 252 L96 215 C96 201 99 191 105 185 Z",
    "M195 185 C188 181 178 179 166 183 C160 185 156 189 154 194 L155 258 C160 264 170 268 180 266 C188 264 195 259 200 252 L204 215 C204 201 201 191 195 185 Z"
  ],
  triceps: [
    "M82 176 C81 189 81 203 83 215 C85 225 88 233 92 239 L102 235 C99 227 97 217 96 207 C95 197 96 187 98 178 Z",
    "M218 176 C219 189 219 203 217 215 C215 225 212 233 208 239 L198 235 C201 227 203 217 204 207 C205 197 204 187 202 178 Z"
  ],
  forearms: [
    "M84 241 C86 250 88 262 89 274 C90 284 90 292 89 298 L80 296 C79 288 78 278 78 268 C78 258 80 248 82 241 Z",
    "M216 241 C214 250 212 262 211 274 C210 284 210 292 211 298 L220 296 C221 288 222 278 222 268 C222 258 220 248 218 241 Z"
  ],
  erectors: [
    "M132 226 C136 222 141 221 145 223 C147 224 148 227 148 230 L147 288 C145 292 141 294 137 293 C133 292 130 289 129 286 L128 236 C128 231 129 228 132 226 Z",
    "M168 226 C164 222 159 221 155 223 C153 224 152 227 152 230 L153 288 C155 292 159 294 163 293 C167 292 170 289 171 286 L172 236 C172 231 171 228 168 226 Z"
  ],
  gluteMax: [
    "M98 292 C108 282 122 280 136 286 C142 289 146 294 148 300 L148 334 C142 342 130 346 118 344 C108 342 100 336 96 330 L94 308 C94 300 96 296 98 292 Z",
    "M202 292 C192 282 178 280 164 286 C158 289 154 294 152 300 L152 334 C158 342 170 346 182 344 C192 342 200 336 204 330 L206 308 C206 300 204 296 202 292 Z"
  ],
  gluteMed: [
    "M96 276 C100 272 106 270 112 272 C117 273 121 276 123 280 C125 284 124 289 122 292 C119 296 114 298 109 297 C104 296 99 293 97 289 C95 285 95 280 96 276 Z",
    "M204 276 C200 272 194 270 188 272 C183 273 179 276 177 280 C175 284 176 289 178 292 C181 296 186 298 191 297 C196 296 201 293 203 289 C205 285 205 280 204 276 Z"
  ],
  hamstrings: [
    "M98 336 C106 330 120 328 134 332 C138 334 141 337 142 340 L139 426 C134 430 124 432 114 430 C106 428 100 424 97 420 L94 356 C94 346 95 340 98 336 Z",
    "M202 336 C194 330 180 328 166 332 C162 334 159 337 158 340 L161 426 C166 430 176 432 186 430 C194 428 200 424 203 420 L206 356 C206 346 205 340 202 336 Z"
  ],
  calves: [
    "M99 432 C104 428 112 426 120 428 C126 430 130 434 132 438 L128 514 C124 519 117 522 110 520 C104 518 99 514 97 510 L95 452 C95 442 96 436 99 432 Z",
    "M201 432 C196 428 188 426 180 428 C174 430 170 434 168 438 L172 514 C176 519 183 522 190 520 C196 518 201 514 203 510 L205 452 C205 442 204 436 201 432 Z"
  ],
  soleus: [
    "M100 504 C104 500 110 498 116 500 C120 501 123 504 124 507 L121 549 C118 552 113 553 108 552 C104 551 101 548 100 545 Z",
    "M200 504 C196 500 190 498 184 500 C180 501 177 504 176 507 L179 549 C182 552 187 553 192 552 C196 551 199 548 200 545 Z"
  ]
};

const regions: Region[] = [
  // ─── FRONT ───
  { id: "clav-pec", key: "chest", side: "front", layer: "surface", label: "Pectoralis major (clavicular)", action: "Shoulder flexion and horizontal adduction", why: "Upper pectoral portion drives the arm forward and inward during pressing.", paths: frontPaths.clavicularPec, offset: 4, focus: "50% 23%" },
  { id: "sterno-pec", key: "chest", side: "front", layer: "surface", label: "Pectoralis major (sternocostal)", action: "Horizontal adduction and humeral adduction", why: "Broad chest portion is a main force contributor in horizontal pressing.", paths: frontPaths.sternocostalPec, offset: 0, focus: "50% 28%" },
  { id: "ant-delt", key: "frontDelts", side: "front", layer: "surface", label: "Anterior deltoid", action: "Shoulder flexion and forward arm drive", why: "Supports forward and upward arm force in front of the torso.", paths: frontPaths.anteriorDelt, offset: -5, focus: "26% 25%" },
  { id: "lat-delt", key: "sideDelts", side: "front", layer: "surface", label: "Lateral deltoid", action: "Shoulder abduction", why: "Lifts the arm laterally for shoulder width and overhead stability.", paths: frontPaths.lateralDelt, offset: -8, focus: "22% 27%" },
  { id: "biceps", key: "biceps", side: "front", layer: "surface", label: "Biceps brachii", action: "Elbow flexion and forearm supination", why: "Contributes to pulling and elbow-flexion work.", paths: frontPaths.biceps, offset: 0, focus: "22% 34%" },
  { id: "brachialis", key: "brachialis", side: "front", layer: "deep", label: "Brachialis", action: "Elbow flexion (pure)", why: "Strongest pure elbow flexor, deep to the biceps.", paths: frontPaths.brachialis, offset: -4, focus: "22% 38%" },
  { id: "brachiorad", key: "brachioradialis", side: "front", layer: "surface", label: "Brachioradialis", action: "Elbow flexion in neutral grip", why: "Assists elbow flexion with neutral or pronated grip.", paths: frontPaths.brachioradialis, offset: -6, focus: "20% 44%" },
  { id: "forearm-flex", key: "forearms", side: "front", layer: "surface", label: "Forearm flexor compartment", action: "Grip and wrist flexion", why: "Grip-intensive tasks raise demand through wrist flexion control.", paths: frontPaths.forearms, offset: -4, focus: "20% 46%" },
  { id: "serratus", key: "serratusAnterior", side: "front", layer: "surface", label: "Serratus anterior", action: "Scapular protraction and upward rotation", why: "Guides and stabilizes the shoulder blade during pressing.", paths: frontPaths.serratus, offset: -6, stabilizer: true, related: ["frontDelts", "chest"], focus: "30% 33%" },
  { id: "obliques", key: "obliques", side: "front", layer: "surface", label: "External oblique", action: "Trunk rotation and anti-rotation", why: "Transfers force through the torso and resists unwanted rotation.", paths: frontPaths.obliques, offset: -5, stabilizer: true, focus: "35% 37%" },
  { id: "rectus", key: "abs", side: "front", layer: "surface", label: "Rectus abdominis", action: "Trunk flexion and bracing", why: "Manages trunk position and resists extension under load.", paths: frontPaths.rectus, offset: -8, stabilizer: true, focus: "50% 37%" },
  { id: "hip-flexor", key: "hipFlexors", side: "front", layer: "deep", label: "Hip flexor complex (iliopsoas)", action: "Hip flexion and proximal control", why: "Assists thigh lift and controls hip position in sprint and lunge actions.", paths: frontPaths.hipFlexor, offset: -8, focus: "40% 46%" },
  { id: "tfl", key: "tfl", side: "front", layer: "surface", label: "Tensor fasciae latae", action: "Hip flexion, abduction, and internal rotation", why: "Assists hip flexion and abduction while tensioning the IT band.", paths: frontPaths.tfl, offset: -12, stabilizer: true, focus: "32% 48%" },
  { id: "quads", key: "quads", side: "front", layer: "surface", label: "Quadriceps femoris", action: "Knee extension", why: "Produces force to straighten the knee during squats, lunges, jumps, and deceleration.", paths: frontPaths.quads, offset: 2, focus: "36% 60%" },
  { id: "adductors", key: "adductors", side: "front", layer: "surface", label: "Hip adductor group", action: "Hip adduction and medial-leg control", why: "Contributes to femoral control and deep hip-flexion positions.", paths: frontPaths.adductors, offset: -7, stabilizer: true, focus: "47% 58%" },
  { id: "tibialis", key: "tibialis", side: "front", layer: "surface", label: "Tibialis anterior", action: "Ankle dorsiflexion", why: "Controls foot clearance and ankle position through gait and landing.", paths: frontPaths.tibialis, offset: -6, focus: "35% 80%" },
  { id: "peroneals", key: "peroneals", side: "front", layer: "surface", label: "Peroneus longus and brevis", action: "Ankle eversion and lateral stability", why: "Stabilizes the ankle laterally and assists in plantarflexion.", paths: frontPaths.peroneals, offset: -10, stabilizer: true, focus: "30% 80%" },
  // ─── BACK ───
  { id: "upper-trap", key: "traps", side: "back", layer: "surface", label: "Upper trapezius", action: "Scapular elevation and upward rotation", why: "Supports shoulder positioning and upward scapular rotation.", paths: backPaths.upperTrap, offset: -10, stabilizer: true, focus: "50% 18%" },
  { id: "mid-trap", key: "traps", side: "back", layer: "surface", label: "Middle trapezius", action: "Scapular retraction", why: "Stabilizes and retracts the shoulder blade during pulling.", paths: backPaths.middleTrap, offset: -14, stabilizer: true, focus: "50% 25%" },
  { id: "low-trap", key: "traps", side: "back", layer: "surface", label: "Lower trapezius", action: "Scapular depression and upward rotation support", why: "Supports controlled scapular motion in overhead and pulling actions.", paths: backPaths.lowerTrap, offset: -22, stabilizer: true, focus: "50% 33%" },
  { id: "rhomboids", key: "rhomboids", side: "back", layer: "deep", label: "Rhomboid major and minor", action: "Scapular retraction and downward rotation", why: "Pulls shoulder blades together and maintains upright posture.", paths: backPaths.rhomboids, offset: -16, stabilizer: true, focus: "46% 27%" },
  { id: "post-delt", key: "rearDelts", side: "back", layer: "surface", label: "Posterior deltoid", action: "Shoulder extension and horizontal abduction", why: "Supports arm drive behind the torso and posterior shoulder control.", paths: backPaths.posteriorDelt, offset: -4, focus: "26% 25%" },
  { id: "infraspinatus", key: "rotatorCuff", side: "back", layer: "deep", label: "Infraspinatus", action: "External rotation and joint centering", why: "Rotator cuff muscle that centers the humeral head during loaded movement.", paths: backPaths.cuff, offset: -24, stabilizer: true, focus: "37% 28%" },
  { id: "lats", key: "lats", side: "back", layer: "surface", label: "Latissimus dorsi", action: "Shoulder extension, adduction, and medial rotation", why: "Contributes when the arm is pulled down, back, or toward the torso.", paths: backPaths.lats, offset: 3, focus: "35% 38%" },
  { id: "triceps", key: "triceps", side: "back", layer: "surface", label: "Triceps brachii", action: "Elbow extension", why: "Contributes to pressing and terminal elbow extension under load.", paths: backPaths.triceps, offset: 1, focus: "22% 34%" },
  { id: "wrist-ext", key: "forearms", side: "back", layer: "surface", label: "Wrist extensor compartment", action: "Wrist stabilization and extension", why: "Supports balanced wrist position during grip and loaded hand contact.", paths: backPaths.forearms, offset: -7, stabilizer: true, focus: "18% 46%" },
  { id: "erectors", key: "lowerBack", side: "back", layer: "surface", label: "Erector spinae", action: "Spinal extension and bracing", why: "Resists trunk flexion and maintains spinal position under load.", paths: backPaths.erectors, offset: -9, stabilizer: true, focus: "50% 43%" },
  { id: "glute-max", key: "glutes", side: "back", layer: "surface", label: "Gluteus maximus", action: "Hip extension and external rotation", why: "Principal hip extensor in hinge, sprint, jump, and rising patterns.", paths: backPaths.gluteMax, offset: 4, focus: "50% 52%" },
  { id: "glute-med", key: "abductors", side: "back", layer: "surface", label: "Gluteus medius", action: "Hip abduction and pelvic control", why: "Controls pelvis and femur position in single-leg work.", paths: backPaths.gluteMed, offset: -18, stabilizer: true, focus: "33% 48%" },
  { id: "hamstrings", key: "hamstrings", side: "back", layer: "surface", label: "Hamstring group", action: "Knee flexion and hip extension", why: "Assists hip extension and controls the knee across athletic actions.", paths: backPaths.hamstrings, offset: 2, focus: "35% 63%" },
  { id: "gastroc", key: "calves", side: "back", layer: "surface", label: "Gastrocnemius", action: "Ankle plantarflexion and propulsion", why: "Contributes to lower-leg stiffness and propulsion.", paths: backPaths.calves, offset: 0, focus: "35% 78%" },
  { id: "soleus", key: "soleus", side: "back", layer: "deep", label: "Soleus", action: "Sustained ankle plantarflexion", why: "Provides endurance-based plantarflexion for posture and slow locomotion.", paths: backPaths.soleus, offset: -8, focus: "35% 88%" },
];

export function AnatomyMap({ primary, secondary, onSelect }: AnatomyMapProps) {
  const [side, setSide] = useState<Side>("front");
  const [layer, setLayer] = useState<Layer>("all");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"All" | Role>("All");
  const [threshold, setThreshold] = useState(0);
  const [selectedId, setSelectedId] = useState("");
  const [hoverId, setHoverId] = useState("");
  const [focused, setFocused] = useState(false);

  const roleFor = (r: Region): Role | null =>
    matches(r.key, primary) ? "Primary" :
    matches(r.key, secondary) ? r.stabilizer ? "Stabilizer" : "Synergist" :
    (r.related || []).some(k => matches(k, primary)) ? "Stabilizer" : null;
  const scoreFor = (r: Region) => { const role = roleFor(r); const base = role === "Primary" ? 90 : role === "Synergist" ? 65 : role === "Stabilizer" ? 42 : 0; return Math.max(0, Math.min(100, base + r.offset)); };

  const computed = useMemo(() => regions.map(r => ({ ...r, role: roleFor(r), score: scoreFor(r) })), [primary, secondary]);
  const visibleOnSide = computed.filter(r => r.side === side && (layer === "all" || r.layer === layer));
  const filteredForList = visibleOnSide.filter(r => (roleFilter === "All" || r.role === roleFilter) && r.label.toLowerCase().includes(query.toLowerCase()) && r.score >= threshold);

  const rankedMap = new Map<string, typeof computed[number]>();
  computed.filter(r => r.role).sort((a, b) => b.score - a.score).forEach(r => { if (!rankedMap.has(r.key)) rankedMap.set(r.key, r); });
  const ranked = Array.from(rankedMap.values()).slice(0, 6);

  const selected = computed.find(r => r.id === selectedId);
  const hover = computed.find(r => r.id === hoverId);
  const select = (region: typeof computed[number]) => { setSide(region.side); setSelectedId(region.id); setFocused(false); onSelect(region.key); };
  const clearSelection = () => { setSelectedId(""); setFocused(false); };
  const reset = () => { setSide("front"); setLayer("all"); setQuery(""); setRoleFilter("All"); setThreshold(0); clearSelection(); };
  const metric = (offset: number) => selected ? Math.max(12, Math.min(98, selected.score + offset)) : 0;
  const coreMetrics = selected ? [["Force exposure", metric(1)], ["Long-length challenge", metric(-12)], ["Stability demand", metric(selected.role === "Stabilizer" ? 24 : -22)]] as const : [];
  const fullMetrics = selected ? [["Mechanical tension", metric(2)], ["Hypertrophy potential", metric(-3)], ["Strength contribution", metric(0)], ["Stabilization demand", metric(selected.role === "Stabilizer" ? 24 : -22)], ["Long-length loading", metric(-12)], ["Eccentric demand", metric(-5)], ["Concentric demand", metric(3)], ["Isometric demand", metric(selected.role === "Stabilizer" ? 19 : -18)], ["Fatigue contribution", metric(-9)]] as const : [];

  const imgSrc = side === "front" ? ANTERIOR_IMG : POSTERIOR_IMG;

  return (
    <section className="anatomy-atlas-pro">
      <div className="atlas-pro-head">
        <div>
          <p className="metric-label">Body Lab / involvement heat map</p>
          <h2>See the work. <em>Then inspect the why.</em></h2>
        </div>
        <p>Greyscale base. Only worked muscles show color based on involvement level.</p>
      </div>

      <div className="atlas-pro-grid">
        <aside className="atlas-pro-controls">
          <div className="atlas-control-group"><span>View</span><div className="atlas-pill-row"><button className={side === "front" ? "is-active" : ""} onClick={() => setSide("front")}>Anterior</button><button className={side === "back" ? "is-active" : ""} onClick={() => setSide("back")}>Posterior</button></div></div>
          <div className="atlas-control-group"><span>Layer</span><div className="atlas-pill-row"><button className={layer === "all" ? "is-active" : ""} onClick={() => setLayer("all")}>All</button><button className={layer === "surface" ? "is-active" : ""} onClick={() => setLayer("surface")}>Surface</button><button className={layer === "deep" ? "is-active" : ""} onClick={() => setLayer("deep")}>Deep</button></div></div>
          <label className="atlas-pro-search"><Search className="h-4 w-4" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search muscle" /></label>
          <details className="atlas-advanced"><summary><SlidersHorizontal className="h-3.5 w-3.5" /> Advanced filters <ChevronDown className="h-3.5 w-3.5" /></summary><div><div className="atlas-control-group"><span>Role</span><div className="atlas-pill-row atlas-pill-row-wrap">{(["All", "Primary", "Synergist", "Stabilizer"] as const).map(item => <button key={item} onClick={() => setRoleFilter(item)} className={roleFilter === item ? "is-active" : ""}>{item}</button>)}</div></div><label className="atlas-threshold-pro">Involvement threshold <b>{threshold}</b><input type="range" min="0" max="90" step="5" value={threshold} onChange={e => setThreshold(Number(e.target.value))} /></label></div></details>
          <button className="atlas-reset-pro" onClick={reset}><RotateCcw className="h-3.5 w-3.5" /> Reset view</button>
        </aside>

        <div className="atlas-pro-canvas">
          <div className="atlas-canvas-header">
            <span className="atlas-view-label">{side === "front" ? "Anterior view" : "Posterior view"}</span>
            <button className="atlas-flip-btn" onClick={() => setSide(s => s === "front" ? "back" : "front")} aria-label="Switch between front and back view">
              <RotateCw className="h-4 w-4" />
              <span>{side === "front" ? "Flip to Back" : "Flip to Front"}</span>
            </button>
          </div>

          <div className="atlas-illustration-wrap" onClick={clearSelection}>
            {/* Greyscale anatomical illustration as background */}
            <img src={imgSrc} alt={`${side === "front" ? "Anterior" : "Posterior"} anatomical muscle illustration`} className={`atlas-illustration atlas-illustration-grey ${focused ? "atlas-illustration-focused" : ""}`} style={{ transformOrigin: selected?.focus || "50% 44%" }} draggable={false} />

            {/* SVG overlay with contoured muscle paths — only worked muscles show color */}
            <svg viewBox="0 0 300 600" className="atlas-svg-overlay" aria-label={`${side} muscle activation overlay`}>
              {visibleOnSide.map(region => {
                const isWorked = Boolean(region.role);
                const isInList = filteredForList.includes(region);
                const isSelected = selectedId === region.id;
                const dimmed = selectedId && !isSelected;
                if (!isWorked && !isSelected) return null; // Non-worked muscles: invisible overlay
                return region.paths.map((path, i) => (
                  <path
                    key={`${region.id}-${i}`}
                    d={path}
                    fill={isWorked ? heat(region.score) : "transparent"}
                    stroke={isSelected ? "#061f31" : "rgba(255,255,255,.2)"}
                    strokeWidth={isSelected ? 2 : 0.8}
                    opacity={dimmed ? 0.3 : isInList ? 1 : 0.4}
                    className={`atlas-muscle-path ${isSelected ? "is-selected" : ""}`}
                    tabIndex={0}
                    role="button"
                    aria-label={`${region.label}, ${region.role || "not involved"}, ${region.score}/100`}
                    onMouseEnter={() => setHoverId(region.id)}
                    onMouseLeave={() => setHoverId("")}
                    onClick={e => { e.stopPropagation(); select(region); }}
                    onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(region); } if (e.key === "Escape") clearSelection(); }}
                  />
                ));
              })}
            </svg>

            {hover && (
              <div className="atlas-pro-tooltip">
                <strong>{hover.label}</strong>
                <span>{hover.role || "Not involved"}</span>
                <b>{hover.score > 0 ? `${hover.score}/100 · ${tier(hover.score)} Tier` : "No activation"}</b>
                <p>{hover.action}</p>
              </div>
            )}
          </div>

          <div className="atlas-heat-legend-pro">
            <span>Neutral</span><i className="atlas-swatch" style={{ background: "#c0cdd6" }} />
            <span>20%</span><i className="atlas-swatch" style={{ background: "#73b8d9" }} />
            <span>40%</span><i className="atlas-swatch" style={{ background: "#73b8d9" }} />
            <span>60%</span><i className="atlas-swatch" style={{ background: "#f5a13d" }} />
            <span>80%</span><i className="atlas-swatch" style={{ background: "#f46933" }} />
            <span>90+</span><i className="atlas-swatch" style={{ background: "#db2f24" }} />
          </div>

          <div className="atlas-ranking"><div><p className="metric-label">Top muscles</p><span>Click a row to focus it on the model.</span></div>
            {ranked.map((region) => (
              <button key={region.id} onClick={() => select(region)} className={selectedId === region.id ? "is-selected" : ""}>
                <i className="atlas-rank-dot" style={{ background: heatSolid(region.score) }} />
                <span>{region.label}</span>
                <em>{region.score}%</em>
                <b className="atlas-rank-bar"><i style={{ width: `${region.score}%`, background: heatSolid(region.score) }} /></b>
              </button>
            ))}
          </div>
        </div>

        <aside className={`atlas-pro-inspector ${selected ? "is-open" : ""}`}>
          {selected ? (<><div className="atlas-inspector-title"><div><p className="metric-label">Selected muscle</p><h3>{selected.label}</h3></div><button onClick={clearSelection} aria-label="Clear muscle selection">×</button></div><div className="atlas-inspector-badges"><span>{selected.role || "Not involved"}</span><b>{selected.score}/100</b><i>{tier(selected.score)} Tier</i></div><div className="atlas-core-metrics">{coreMetrics.map(([name, value]) => <div key={name as string}><span>{name}</span><b>{value}</b><i><em style={{ width: `${value}%` }} /></i></div>)}</div><div className="atlas-why-pro"><p className="metric-label">Why it matters</p><p>{selected.why}</p><span>{selected.action}</span></div><button className="atlas-focus-button" onClick={() => setFocused(v => !v)}><Focus className="h-3.5 w-3.5" /> {focused ? "Reset focus" : "Focus region"}</button><details className="atlas-full-analysis"><summary>View full analysis <ChevronDown className="h-4 w-4" /></summary><div>{fullMetrics.map(([name, value]) => <div key={name as string}><span>{name}</span><b>{value}</b><i><em style={{ width: `${value}%` }} /></i></div>)}<p><b>Confidence:</b> Structured estimate based on the movement pattern, stated muscle role, and available mechanics evidence.</p></div></details></>) : (<div className="atlas-inspector-empty-pro"><Target className="h-5 w-5" /><strong>Explore through the body</strong><p>The body is greyscale. Only worked muscles light up with color showing their involvement level. Click any highlighted muscle to inspect it.</p></div>)}
        </aside>
      </div>
    </section>
  );
}

export { labels as muscleLabels };
