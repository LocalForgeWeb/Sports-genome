import { useMemo, useState } from "react";
import { ChevronDown, Focus, RotateCcw, Search, SlidersHorizontal, Target } from "lucide-react";
import "../anatomy-clean.css";

/** Body Lab: the muscle map is the primary navigator. All muscles always visible; only worked muscles are highlighted. */
type AnatomyMapProps = { primary: string[]; secondary: string[]; onSelect: (muscle: string) => void };
type Side = "front" | "back";
type Layer = "surface" | "deep" | "all";
type Role = "Primary" | "Synergist" | "Stabilizer";
type Region = { id: string; key: string; side: Side; layer: "surface" | "deep"; label: string; action: string; why: string; paths: string[]; offset: number; stabilizer?: boolean; related?: string[]; focus: string };

const labels: Record<string, string> = {
  chest: "Pectoralis major", frontDelts: "Anterior deltoid", sideDelts: "Lateral deltoid", rearDelts: "Posterior deltoid", shoulders: "Deltoid complex", biceps: "Biceps brachii", brachialis: "Brachialis", brachioradialis: "Brachioradialis", triceps: "Triceps brachii", forearms: "Forearm compartments", abs: "Rectus abdominis", obliques: "External oblique", internalObliques: "Internal oblique", transverseAbdominis: "Transversus abdominis", serratusAnterior: "Serratus anterior", hipFlexors: "Hip flexor complex", quads: "Quadriceps femoris", adductors: "Hip adductors", abductors: "Hip abductors", tfl: "Tensor fasciae latae", glutes: "Gluteal complex", hamstrings: "Hamstrings", calves: "Gastrocnemius", soleus: "Soleus", tibialis: "Tibialis anterior", peroneals: "Peroneus longus/brevis", lats: "Latissimus dorsi", upperBack: "Upper back", traps: "Trapezius", rhomboids: "Rhomboids", lowerBack: "Spinal erectors", rotatorCuff: "Rotator cuff muscles"
};

const aliases: Record<string, string[]> = {
  chest: ["chest", "pectoral", "pectoralis", "pec"],
  frontDelts: ["frontdelts", "anteriordelt", "shoulders"],
  sideDelts: ["sidedelts", "lateraldelt", "shoulders"],
  rearDelts: ["reardelts", "posteriordelt", "shoulders"],
  biceps: ["biceps"],
  brachialis: ["brachialis"],
  brachioradialis: ["brachioradialis"],
  triceps: ["triceps"],
  forearms: ["forearms", "grip", "wristflexors", "wristextensors"],
  abs: ["abs", "rectusabdominis"],
  obliques: ["obliques", "core", "externaloblique"],
  internalObliques: ["internaloblique", "core"],
  transverseAbdominis: ["transverseabdominis", "core", "tva"],
  serratusAnterior: ["serratus", "serratusanterior"],
  hipFlexors: ["hipflexors", "iliopsoas"],
  quads: ["quads", "quadriceps"],
  adductors: ["adductors"],
  abductors: ["abductors", "glutemedius"],
  tfl: ["tfl", "tensorfasciaelatae"],
  glutes: ["glutes", "gluteusmaximus"],
  hamstrings: ["hamstrings"],
  calves: ["calves", "gastrocnemius"],
  soleus: ["soleus"],
  tibialis: ["tibialis"],
  peroneals: ["peroneals", "peroneus", "fibularis"],
  lats: ["lats", "latissimus"],
  traps: ["traps", "trapezius"],
  rhomboids: ["rhomboids"],
  lowerBack: ["lowerback", "erectors", "erectorspinae"],
  rotatorCuff: ["rotatorcuff", "infraspinatus"]
};

const clean = (value: string) => value.toLowerCase().replace(/[^a-z]/g, "");
const matches = (key: string, values: string[]) => values.some((value) => (aliases[key] || [key]).some((alias) => clean(value).includes(alias)));
const heat = (score: number) => score >= 90 ? "#db2f24" : score >= 75 ? "#f46933" : score >= 60 ? "#f5a13d" : score >= 40 ? "#d8c052" : score >= 20 ? "#73b8d9" : "#a8c4d4";
const tier = (score: number) => score >= 90 ? "S" : score >= 80 ? "A" : score >= 65 ? "B" : score >= 45 ? "C" : score >= 25 ? "D" : "F";

/* Neutral fill for muscles that are not being worked */
const NEUTRAL_FILL = "#d4dfe6";
const NEUTRAL_STROKE = "#b8c9d4";

const figure = {
  front: "M147 28 C123 28 111 44 111 66 C111 84 119 96 128 102 L111 113 C97 120 88 132 84 151 L63 207 L71 214 L90 184 L94 274 L79 303 L88 465 L112 570 L137 570 L143 435 L147 435 L153 570 L178 570 L206 465 L215 303 L200 274 L204 184 L223 214 L231 207 L210 151 C206 132 197 120 183 113 L166 102 C175 96 183 84 183 66 C183 44 171 28 147 28 Z",
  back: "M147 28 C123 28 111 44 111 66 C111 84 119 96 128 102 L111 113 C97 120 88 132 84 151 L63 207 L71 214 L90 184 L94 274 L79 303 L88 465 L112 570 L137 570 L143 435 L147 435 L153 570 L178 570 L206 465 L215 303 L200 274 L204 184 L223 214 L231 207 L210 151 C206 132 197 120 183 113 L166 102 C175 96 183 84 183 66 C183 44 171 28 147 28 Z"
};

/* ─── ANATOMICALLY CONTOURED SVG PATHS ─── */
/* All paths use bezier curves to approximate real muscle shapes within a 294×600 viewBox */

const frontPaths = {
  /* Pectoralis major – clavicular head: fan-shaped from clavicle to humerus */
  clavicularPec: [
    "M108 130 C115 124 128 121 140 128 C142 130 143 134 143 138 L143 155 C130 150 117 148 107 152 C104 146 105 136 108 130 Z",
    "M186 130 C179 124 166 121 154 128 C152 130 151 134 151 138 L151 155 C164 150 177 148 187 152 C190 146 189 136 186 130 Z"
  ],
  /* Pectoralis major – sternocostal head: broad fan from sternum */
  sternocostalPec: [
    "M107 153 C118 148 131 150 143 156 L143 188 C130 183 115 180 104 184 C100 175 101 162 107 153 Z",
    "M187 153 C176 148 163 150 151 156 L151 188 C164 183 179 180 190 184 C194 175 193 162 187 153 Z"
  ],
  /* Anterior deltoid – rounded cap shape wrapping the shoulder */
  anteriorDelt: [
    "M83 126 C76 130 72 140 72 152 C73 162 77 170 82 174 L97 170 C100 160 103 148 105 138 L102 128 C95 124 88 124 83 126 Z",
    "M211 126 C218 130 222 140 222 152 C221 162 217 170 212 174 L197 170 C194 160 191 148 189 138 L192 128 C199 124 206 124 211 126 Z"
  ],
  /* Lateral deltoid – visible from front as a sliver on outer shoulder */
  lateralDelt: [
    "M72 152 C70 160 71 170 76 178 L84 175 C81 168 79 160 80 152 Z",
    "M222 152 C224 160 223 170 218 178 L210 175 C213 168 215 160 214 152 Z"
  ],
  /* Biceps brachii – fusiform shape on anterior upper arm */
  biceps: [
    "M80 180 C78 190 77 205 79 218 C81 228 84 235 88 240 L98 236 C96 228 95 218 95 208 C95 196 96 186 98 180 Z",
    "M214 180 C216 190 217 205 215 218 C213 228 210 235 206 240 L196 236 C198 228 199 218 199 208 C199 196 198 186 196 180 Z"
  ],
  /* Brachialis – deep muscle visible between biceps and triceps */
  brachialis: [
    "M80 222 C79 228 80 235 83 241 L92 238 C90 233 89 228 89 222 C89 218 90 214 91 211 L82 213 C80 216 79 219 80 222 Z",
    "M214 222 C215 228 214 235 211 241 L202 238 C204 233 205 228 205 222 C205 218 204 214 203 211 L212 213 C214 216 215 219 214 222 Z"
  ],
  /* Brachioradialis – long muscle on outer forearm */
  brachioradialis: [
    "M82 242 C80 250 78 260 76 270 C75 278 74 284 73 290 L80 292 C81 285 82 277 83 270 C85 260 87 250 89 243 Z",
    "M212 242 C214 250 216 260 218 270 C219 278 220 284 221 290 L214 292 C213 285 212 277 211 270 C209 260 207 250 205 243 Z"
  ],
  /* Forearm flexors – teardrop group on inner forearm */
  forearms: [
    "M84 244 C86 252 88 264 89 276 C90 286 90 294 89 300 L80 298 C79 290 78 280 77 270 C76 260 77 250 79 244 Z",
    "M210 244 C208 252 206 264 205 276 C204 286 204 294 205 300 L214 298 C215 290 216 280 217 270 C218 260 217 250 215 244 Z"
  ],
  /* Serratus anterior – finger-like projections on lateral ribcage */
  serratus: [
    "M95 185 C98 183 102 184 104 187 L101 195 C98 193 95 192 93 194 Z M93 197 C96 195 100 196 102 199 L99 207 C96 205 93 204 91 206 Z M91 210 C94 208 98 209 100 212 L97 220 C94 218 91 217 89 219 Z M89 223 C92 221 96 222 98 225 L95 233 C92 231 89 230 87 232 Z",
    "M199 185 C196 183 192 184 190 187 L193 195 C196 193 199 192 201 194 Z M201 197 C198 195 194 196 192 199 L195 207 C198 205 201 204 203 206 Z M203 210 C200 208 196 209 194 212 L197 220 C200 218 203 217 205 219 Z M205 223 C202 221 198 222 196 225 L199 233 C202 231 205 230 207 232 Z"
  ],
  /* External oblique – diagonal fan on lateral abdomen */
  obliques: [
    "M100 192 C104 190 110 191 115 194 C118 196 120 199 120 202 L116 248 C113 252 108 254 104 252 C100 250 96 246 94 242 L96 202 C97 197 98 194 100 192 Z",
    "M194 192 C190 190 184 191 179 194 C176 196 174 199 174 202 L178 248 C181 252 186 254 190 252 C194 250 198 246 200 242 L198 202 C197 197 196 194 194 192 Z"
  ],
  /* Rectus abdominis – segmented vertical blocks */
  rectus: [
    "M126 192 C130 190 136 190 140 192 C142 193 143 195 143 197 L143 212 C140 213 134 213 130 213 C127 213 124 212 122 211 L122 197 C122 194 123 193 126 192 Z M122 216 C125 215 130 215 135 215 C139 215 142 216 143 217 L143 234 C140 235 135 235 130 235 C126 235 123 234 122 233 Z M122 238 C125 237 130 237 135 237 C139 237 142 238 143 239 L143 258 C140 260 135 261 130 260 C126 259 123 258 122 256 Z",
    "M168 192 C164 190 158 190 154 192 C152 193 151 195 151 197 L151 212 C154 213 160 213 164 213 C167 213 170 212 172 211 L172 197 C172 194 171 193 168 192 Z M172 216 C169 215 164 215 159 215 C155 215 152 216 151 217 L151 234 C154 235 159 235 164 235 C168 235 171 234 172 233 Z M172 238 C169 237 164 237 159 237 C155 237 152 238 151 239 L151 258 C154 260 159 261 164 260 C168 259 171 258 172 256 Z"
  ],
  /* Hip flexor (iliopsoas) – deep triangular shape in groin area */
  hipFlexor: [
    "M115 260 C120 258 128 259 134 262 C137 264 139 267 139 270 L130 290 C126 292 120 292 116 290 C112 288 108 284 106 280 L110 266 C111 263 113 261 115 260 Z",
    "M179 260 C174 258 166 259 160 262 C157 264 155 267 155 270 L164 290 C168 292 174 292 178 290 C182 288 186 284 188 280 L184 266 C183 263 181 261 179 260 Z"
  ],
  /* Tensor fasciae latae – small oval on outer hip */
  tfl: [
    "M96 286 C98 282 102 280 106 281 C110 282 112 285 112 289 C112 294 110 298 107 300 C103 302 99 301 97 298 C95 295 95 290 96 286 Z",
    "M198 286 C196 282 192 280 188 281 C184 282 182 285 182 289 C182 294 184 298 187 300 C191 302 195 301 197 298 C199 295 199 290 198 286 Z"
  ],
  /* Quadriceps – large teardrop shape on anterior thigh */
  quads: [
    "M97 302 C104 294 118 292 132 298 C136 300 139 304 140 308 L136 418 C130 422 118 424 108 422 C100 420 94 416 91 412 L88 350 C89 330 92 314 97 302 Z",
    "M197 302 C190 294 176 292 162 298 C158 300 155 304 154 308 L158 418 C164 422 176 424 186 422 C194 420 200 416 203 412 L206 350 C205 330 202 314 197 302 Z"
  ],
  /* Adductors – elongated inner thigh shape */
  adductors: [
    "M128 296 C133 294 138 295 142 298 C144 300 145 303 145 306 L144 410 C141 413 136 414 131 413 C127 412 124 410 123 407 L122 306 C122 301 124 298 128 296 Z",
    "M166 296 C161 294 156 295 152 298 C150 300 149 303 149 306 L150 410 C153 413 158 414 163 413 C167 412 170 410 171 407 L172 306 C172 301 170 298 166 296 Z"
  ],
  /* Tibialis anterior – elongated shape on outer shin */
  tibialis: [
    "M100 430 C103 427 108 426 113 427 C116 428 118 430 119 433 L116 540 C113 543 108 544 104 543 C101 542 99 540 98 537 L97 445 C97 438 98 434 100 430 Z",
    "M194 430 C191 427 186 426 181 427 C178 428 176 430 175 433 L178 540 C181 543 186 544 190 543 C193 542 195 540 196 537 L197 445 C197 438 196 434 194 430 Z"
  ],
  /* Peroneals – lateral lower leg */
  peroneals: [
    "M92 440 C94 436 97 434 100 435 C102 436 103 438 103 441 L101 535 C99 537 96 538 94 537 C92 536 91 534 91 531 Z",
    "M202 440 C200 436 197 434 194 435 C192 436 191 438 191 441 L193 535 C195 537 198 538 200 537 C202 536 203 534 203 531 Z"
  ]
};

const backPaths = {
  /* Upper trapezius – diamond shape from skull base to shoulder */
  upperTrap: [
    "M118 110 C128 104 138 98 147 94 C156 98 166 104 176 110 L170 132 C162 128 154 126 147 126 C140 126 132 128 124 132 Z"
  ],
  /* Middle trapezius – broad horizontal band */
  middleTrap: [
    "M112 138 C124 132 136 129 147 129 C158 129 170 132 182 138 L176 172 C166 166 156 162 147 162 C138 162 128 166 118 172 Z"
  ],
  /* Lower trapezius – inverted triangle */
  lowerTrap: [
    "M122 174 C132 168 140 165 147 165 C154 165 162 168 172 174 L162 228 C156 222 152 218 147 218 C142 218 138 222 132 228 Z"
  ],
  /* Rhomboids – diamond shapes between spine and scapula */
  rhomboids: [
    "M124 142 C128 138 134 136 140 138 C143 139 145 142 145 145 L142 180 C138 183 133 184 129 182 C126 180 124 177 123 174 Z",
    "M170 142 C166 138 160 136 154 138 C151 139 149 142 149 145 L152 180 C156 183 161 184 165 182 C168 180 170 177 171 174 Z"
  ],
  /* Posterior deltoid – rounded cap on back of shoulder */
  posteriorDelt: [
    "M83 126 C76 130 72 140 72 152 C73 162 77 170 82 174 L97 170 C100 160 103 148 105 138 L102 128 C95 124 88 124 83 126 Z",
    "M211 126 C218 130 222 140 222 152 C221 162 217 170 212 174 L197 170 C194 160 191 148 189 138 L192 128 C199 124 206 124 211 126 Z"
  ],
  /* Infraspinatus / rotator cuff – oval on scapula */
  cuff: [
    "M104 148 C110 144 118 143 126 146 C131 148 134 152 135 157 L130 190 C126 194 120 196 114 194 C109 192 105 188 103 184 Z",
    "M190 148 C184 144 176 143 168 146 C163 148 160 152 159 157 L164 190 C168 194 174 196 180 194 C185 192 189 188 191 184 Z"
  ],
  /* Latissimus dorsi – large wing shape */
  lats: [
    "M103 190 C110 186 120 184 132 188 C138 190 142 194 144 199 L143 264 C138 270 128 274 118 272 C110 270 103 265 98 258 L94 220 C94 206 97 196 103 190 Z",
    "M191 190 C184 186 174 184 162 188 C156 190 152 194 150 199 L151 264 C156 270 166 274 176 272 C184 270 191 265 196 258 L200 220 C200 206 197 196 191 190 Z"
  ],
  /* Triceps brachii – horseshoe shape on posterior upper arm */
  triceps: [
    "M80 180 C79 192 79 206 81 218 C83 228 86 236 90 242 L100 238 C97 230 95 220 94 210 C93 200 94 190 96 182 Z",
    "M214 180 C215 192 215 206 213 218 C211 228 208 236 204 242 L194 238 C197 230 199 220 200 210 C201 200 200 190 198 182 Z"
  ],
  /* Forearm extensors – outer forearm group */
  forearms: [
    "M82 244 C84 252 86 264 87 276 C88 286 88 294 87 300 L78 298 C77 290 76 280 76 270 C76 260 78 250 80 244 Z",
    "M212 244 C210 252 208 264 207 276 C206 286 206 294 207 300 L216 298 C217 290 218 280 218 270 C218 260 216 250 214 244 Z"
  ],
  /* Erector spinae – two vertical columns flanking spine */
  erectors: [
    "M130 232 C134 228 139 227 143 229 C145 230 146 233 146 236 L145 294 C143 298 139 300 135 299 C131 298 128 295 127 292 L126 242 C126 237 127 234 130 232 Z",
    "M164 232 C160 228 155 227 151 229 C149 230 148 233 148 236 L149 294 C151 298 155 300 159 299 C163 298 166 295 167 292 L168 242 C168 237 167 234 164 232 Z"
  ],
  /* Gluteus maximus – large rounded mass */
  gluteMax: [
    "M97 298 C106 288 120 286 134 292 C140 295 144 300 146 306 L146 340 C140 348 128 352 116 350 C106 348 98 342 94 336 L92 314 C92 306 94 302 97 298 Z",
    "M197 298 C188 288 174 286 160 292 C154 295 150 300 148 306 L148 340 C154 348 166 352 178 350 C188 348 196 342 200 336 L202 314 C202 306 200 302 197 298 Z"
  ],
  /* Gluteus medius – fan shape on outer hip */
  gluteMed: [
    "M94 282 C98 278 104 276 110 278 C115 279 119 282 121 286 C123 290 122 295 120 298 C117 302 112 304 107 303 C102 302 97 299 95 295 C93 291 93 286 94 282 Z",
    "M200 282 C196 278 190 276 184 278 C179 279 175 282 173 286 C171 290 172 295 174 298 C177 302 182 304 187 303 C192 302 197 299 199 295 C201 291 201 286 200 282 Z"
  ],
  /* Hamstrings – large posterior thigh group */
  hamstrings: [
    "M96 342 C104 336 118 334 132 338 C136 340 139 343 140 346 L137 432 C132 436 122 438 112 436 C104 434 98 430 95 426 L92 362 C92 352 93 346 96 342 Z",
    "M198 342 C190 336 176 334 162 338 C158 340 155 343 154 346 L157 432 C162 436 172 438 182 436 C190 434 196 430 199 426 L202 362 C202 352 201 346 198 342 Z"
  ],
  /* Gastrocnemius – diamond-shaped calf */
  calves: [
    "M97 438 C102 434 110 432 118 434 C124 436 128 440 130 444 L126 520 C122 525 115 528 108 526 C102 524 97 520 95 516 L93 458 C93 448 94 442 97 438 Z",
    "M197 438 C192 434 184 432 176 434 C170 436 166 440 164 444 L168 520 C172 525 179 528 186 526 C192 524 197 520 199 516 L201 458 C201 448 200 442 197 438 Z"
  ],
  /* Soleus – deeper calf below gastrocnemius */
  soleus: [
    "M98 510 C102 506 108 504 114 506 C118 507 121 510 122 513 L119 555 C116 558 111 559 106 558 C102 557 99 554 98 551 Z",
    "M196 510 C192 506 186 504 180 506 C176 507 173 510 172 513 L175 555 C178 558 183 559 188 558 C192 557 195 554 196 551 Z"
  ]
};

const regions: Region[] = [
  // ─── FRONT ───
  { id: "clavicular-pec", key: "chest", side: "front", layer: "surface", label: "Clavicular pectoralis major", action: "Shoulder flexion and horizontal adduction", why: "This upper pectoral portion helps drive the arm forward and inward during pressing patterns.", paths: frontPaths.clavicularPec, offset: 4, focus: "50% 25%" },
  { id: "sternocostal-pec", key: "chest", side: "front", layer: "surface", label: "Sternocostal pectoralis major", action: "Horizontal adduction and humeral adduction", why: "This broad chest portion is a main force contributor in horizontal pressing actions.", paths: frontPaths.sternocostalPec, offset: 0, focus: "50% 30%" },
  { id: "anterior-delt", key: "frontDelts", side: "front", layer: "surface", label: "Anterior deltoid", action: "Shoulder flexion and forward arm drive", why: "It supports forward and upward arm force when resistance is held in front of the torso.", paths: frontPaths.anteriorDelt, offset: -5, focus: "26% 26%" },
  { id: "lateral-delt-front", key: "sideDelts", side: "front", layer: "surface", label: "Lateral deltoid", action: "Shoulder abduction", why: "It lifts the arm laterally and contributes to shoulder width and overhead stability.", paths: frontPaths.lateralDelt, offset: -8, focus: "22% 28%" },
  { id: "biceps", key: "biceps", side: "front", layer: "surface", label: "Biceps brachii", action: "Elbow flexion and forearm supination", why: "It contributes to pulling and elbow-flexion work while also crossing the shoulder.", paths: frontPaths.biceps, offset: 0, focus: "22% 36%" },
  { id: "brachialis", key: "brachialis", side: "front", layer: "deep", label: "Brachialis", action: "Elbow flexion (pure)", why: "The strongest pure elbow flexor, it lies deep to the biceps and contributes to all curling and pulling movements.", paths: frontPaths.brachialis, offset: -4, focus: "22% 38%" },
  { id: "brachioradialis", key: "brachioradialis", side: "front", layer: "surface", label: "Brachioradialis", action: "Elbow flexion in neutral grip", why: "It assists elbow flexion especially with a neutral or pronated grip, bridging the upper arm and forearm.", paths: frontPaths.brachioradialis, offset: -6, focus: "20% 44%" },
  { id: "forearm-flexors", key: "forearms", side: "front", layer: "surface", label: "Forearm flexor compartment", action: "Grip and wrist flexion", why: "Grip-intensive tasks raise demand through finger and wrist flexion control.", paths: frontPaths.forearms, offset: -4, focus: "20% 46%" },
  { id: "serratus", key: "serratusAnterior", side: "front", layer: "surface", label: "Serratus anterior", action: "Scapular protraction and upward rotation", why: "It guides and stabilizes the shoulder blade during reaching and pressing.", paths: frontPaths.serratus, offset: -6, stabilizer: true, related: ["frontDelts", "chest"], focus: "30% 36%" },
  { id: "obliques", key: "obliques", side: "front", layer: "surface", label: "External oblique", action: "Trunk rotation and anti-rotation", why: "It transfers force through the torso and resists unwanted rotation during athletic movements.", paths: frontPaths.obliques, offset: -5, stabilizer: true, focus: "36% 40%" },
  { id: "rectus", key: "abs", side: "front", layer: "surface", label: "Rectus abdominis", action: "Trunk flexion and bracing", why: "It helps manage trunk position and can resist extension under load.", paths: frontPaths.rectus, offset: -8, stabilizer: true, focus: "50% 40%" },
  { id: "hip-flexors", key: "hipFlexors", side: "front", layer: "deep", label: "Hip flexor complex (iliopsoas)", action: "Hip flexion and proximal control", why: "It assists thigh lift and controls hip position in sprint, step, and lunge actions.", paths: frontPaths.hipFlexor, offset: -8, focus: "42% 47%" },
  { id: "tfl", key: "tfl", side: "front", layer: "surface", label: "Tensor fasciae latae", action: "Hip flexion, abduction, and internal rotation", why: "It assists hip flexion and abduction while tensioning the IT band for lateral knee stability.", paths: frontPaths.tfl, offset: -12, stabilizer: true, focus: "32% 50%" },
  { id: "quadriceps", key: "quads", side: "front", layer: "surface", label: "Quadriceps femoris", action: "Knee extension", why: "The quadriceps produce force to straighten the knee during squats, lunges, jumps, and deceleration.", paths: frontPaths.quads, offset: 2, focus: "36% 62%" },
  { id: "adductors", key: "adductors", side: "front", layer: "surface", label: "Hip adductor group", action: "Hip adduction and medial-leg control", why: "The adductors contribute to femoral control and deep hip-flexion positions.", paths: frontPaths.adductors, offset: -7, stabilizer: true, focus: "47% 60%" },
  { id: "tibialis", key: "tibialis", side: "front", layer: "surface", label: "Tibialis anterior", action: "Ankle dorsiflexion", why: "It controls foot clearance and ankle position through gait and landing mechanics.", paths: frontPaths.tibialis, offset: -6, focus: "36% 84%" },
  { id: "peroneals-front", key: "peroneals", side: "front", layer: "surface", label: "Peroneus longus and brevis", action: "Ankle eversion and lateral stability", why: "They stabilize the ankle laterally and assist in plantarflexion during push-off.", paths: frontPaths.peroneals, offset: -10, stabilizer: true, focus: "30% 84%" },

  // ─── BACK ───
  { id: "upper-trap", key: "traps", side: "back", layer: "surface", label: "Upper trapezius", action: "Scapular elevation and upward rotation", why: "It supports shoulder positioning and upward scapular rotation.", paths: backPaths.upperTrap, offset: -10, stabilizer: true, focus: "50% 20%" },
  { id: "middle-trap", key: "traps", side: "back", layer: "surface", label: "Middle trapezius", action: "Scapular retraction", why: "It stabilizes and retracts the shoulder blade during pulling tasks.", paths: backPaths.middleTrap, offset: -14, stabilizer: true, focus: "50% 28%" },
  { id: "lower-trap", key: "traps", side: "back", layer: "surface", label: "Lower trapezius", action: "Scapular depression and upward rotation support", why: "It supports controlled scapular motion in overhead and pulling actions.", paths: backPaths.lowerTrap, offset: -22, stabilizer: true, focus: "50% 36%" },
  { id: "rhomboids", key: "rhomboids", side: "back", layer: "deep", label: "Rhomboid major and minor", action: "Scapular retraction and downward rotation", why: "They pull the shoulder blades together and assist in maintaining upright posture.", paths: backPaths.rhomboids, offset: -16, stabilizer: true, focus: "46% 30%" },
  { id: "posterior-delt", key: "rearDelts", side: "back", layer: "surface", label: "Posterior deltoid", action: "Shoulder extension and horizontal abduction", why: "It supports arm drive behind the torso and posterior shoulder control.", paths: backPaths.posteriorDelt, offset: -4, focus: "26% 26%" },
  { id: "infraspinatus", key: "rotatorCuff", side: "back", layer: "deep", label: "Infraspinatus", action: "External rotation and joint centering", why: "This rotator cuff muscle helps center the humeral head during loaded arm movement.", paths: backPaths.cuff, offset: -24, stabilizer: true, focus: "37% 32%" },
  { id: "lats", key: "lats", side: "back", layer: "surface", label: "Latissimus dorsi", action: "Shoulder extension, adduction, and medial rotation", why: "It contributes when the arm is pulled down, back, or toward the torso.", paths: backPaths.lats, offset: 3, focus: "35% 40%" },
  { id: "triceps", key: "triceps", side: "back", layer: "surface", label: "Triceps brachii", action: "Elbow extension", why: "It contributes to pressing and terminal elbow extension under load.", paths: backPaths.triceps, offset: 1, focus: "22% 36%" },
  { id: "wrist-extensors", key: "forearms", side: "back", layer: "surface", label: "Wrist extensor compartment", action: "Wrist stabilization and extension", why: "It supports balanced wrist position during grip and loaded hand contact.", paths: backPaths.forearms, offset: -7, stabilizer: true, focus: "18% 46%" },
  { id: "erectors", key: "lowerBack", side: "back", layer: "surface", label: "Erector spinae", action: "Spinal extension and bracing", why: "These muscles help resist trunk flexion and maintain spinal position under load.", paths: backPaths.erectors, offset: -9, stabilizer: true, focus: "50% 46%" },
  { id: "glute-max", key: "glutes", side: "back", layer: "surface", label: "Gluteus maximus", action: "Hip extension and external rotation", why: "It is a principal hip extensor in hinge, sprint, jump, and rising patterns.", paths: backPaths.gluteMax, offset: 4, focus: "50% 55%" },
  { id: "glute-med", key: "abductors", side: "back", layer: "surface", label: "Gluteus medius", action: "Hip abduction and pelvic control", why: "It helps control pelvis and femur position in single-leg work.", paths: backPaths.gluteMed, offset: -18, stabilizer: true, focus: "33% 50%" },
  { id: "hamstrings", key: "hamstrings", side: "back", layer: "surface", label: "Hamstring group", action: "Knee flexion and hip extension", why: "The hamstrings assist hip extension and control the knee across athletic actions.", paths: backPaths.hamstrings, offset: 2, focus: "35% 65%" },
  { id: "gastrocnemius", key: "calves", side: "back", layer: "surface", label: "Gastrocnemius", action: "Ankle plantarflexion and propulsion", why: "It contributes to lower-leg stiffness and propulsion during locomotion.", paths: backPaths.calves, offset: 0, focus: "35% 80%" },
  { id: "soleus", key: "soleus", side: "back", layer: "deep", label: "Soleus", action: "Sustained ankle plantarflexion", why: "The soleus provides endurance-based plantarflexion for posture and slow locomotion.", paths: backPaths.soleus, offset: -8, focus: "35% 90%" },
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

  const roleFor = (region: Region): Role | null => matches(region.key, primary) ? "Primary" : matches(region.key, secondary) ? region.stabilizer ? "Stabilizer" : "Synergist" : (region.related || []).some((key) => matches(key, primary)) ? "Stabilizer" : null;
  const scoreFor = (region: Region) => { const role = roleFor(region); const base = role === "Primary" ? 90 : role === "Synergist" ? 65 : role === "Stabilizer" ? 42 : 0; return Math.max(0, Math.min(100, base + region.offset)); };

  const computed = useMemo(() => regions.map((region) => ({ ...region, role: roleFor(region), score: scoreFor(region) })), [primary, secondary]);

  /* All muscles on the current side are always shown; filtering only affects which ones are clickable/visible in the list */
  const visibleOnSide = computed.filter((region) => region.side === side && (layer === "all" || region.layer === layer));
  const filteredForList = visibleOnSide.filter((region) => (roleFilter === "All" || region.role === roleFilter) && region.label.toLowerCase().includes(query.toLowerCase()) && region.score >= threshold);
  const ranked = computed.filter((region) => region.role).sort((a, b) => b.score - a.score).slice(0, 6);
  const selected = computed.find((region) => region.id === selectedId);
  const hover = computed.find((region) => region.id === hoverId);

  const select = (region: typeof computed[number]) => { setSide(region.side); setSelectedId(region.id); setFocused(false); onSelect(region.key); };
  const clearSelection = () => { setSelectedId(""); setFocused(false); };
  const reset = () => { setSide("front"); setLayer("all"); setQuery(""); setRoleFilter("All"); setThreshold(0); clearSelection(); };
  const metric = (offset: number) => selected ? Math.max(12, Math.min(98, selected.score + offset)) : 0;
  const coreMetrics = selected ? [["Force exposure", metric(1)], ["Long-length challenge", metric(-12)], ["Stability demand", metric(selected.role === "Stabilizer" ? 24 : -22)]] as const : [];
  const fullMetrics = selected ? [["Mechanical tension", metric(2)], ["Hypertrophy potential", metric(-3)], ["Strength contribution", metric(0)], ["Stabilization demand", metric(selected.role === "Stabilizer" ? 24 : -22)], ["Long-length loading", metric(-12)], ["Eccentric demand", metric(-5)], ["Concentric demand", metric(3)], ["Isometric demand", metric(selected.role === "Stabilizer" ? 19 : -18)], ["Fatigue contribution", metric(-9)]] as const : [];

  return (
    <section className="anatomy-atlas-pro">
      <div className="atlas-pro-head">
        <div>
          <p className="metric-label">Body Lab / involvement heat map</p>
          <h2>See the work. <em>Then inspect the why.</em></h2>
        </div>
        <p>All muscles are always visible. Only muscles being worked by the current exercise are highlighted with color intensity.</p>
      </div>

      <div className="atlas-pro-grid">
        {/* ─── LEFT: Controls ─── */}
        <aside className="atlas-pro-controls">
          <div className="atlas-control-group">
            <span>View</span>
            <div className="atlas-pill-row">
              <button className={side === "front" ? "is-active" : ""} onClick={() => setSide("front")}>Front</button>
              <button className={side === "back" ? "is-active" : ""} onClick={() => setSide("back")}>Back</button>
            </div>
          </div>
          <div className="atlas-control-group">
            <span>Layer</span>
            <div className="atlas-pill-row">
              <button className={layer === "all" ? "is-active" : ""} onClick={() => setLayer("all")}>All</button>
              <button className={layer === "surface" ? "is-active" : ""} onClick={() => setLayer("surface")}>Surface</button>
              <button className={layer === "deep" ? "is-active" : ""} onClick={() => setLayer("deep")}>Deep</button>
            </div>
          </div>
          <label className="atlas-pro-search">
            <Search className="h-4 w-4" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search muscle" />
          </label>
          <details className="atlas-advanced">
            <summary><SlidersHorizontal className="h-3.5 w-3.5" /> Advanced filters <ChevronDown className="h-3.5 w-3.5" /></summary>
            <div>
              <div className="atlas-control-group">
                <span>Role</span>
                <div className="atlas-pill-row atlas-pill-row-wrap">
                  {(["All", "Primary", "Synergist", "Stabilizer"] as const).map((item) => <button key={item} onClick={() => setRoleFilter(item)} className={roleFilter === item ? "is-active" : ""}>{item}</button>)}
                </div>
              </div>
              <label className="atlas-threshold-pro">
                Involvement threshold <b>{threshold}</b>
                <input type="range" min="0" max="90" step="5" value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} />
              </label>
            </div>
          </details>
          <button className="atlas-reset-pro" onClick={reset}><RotateCcw className="h-3.5 w-3.5" /> Reset view</button>
        </aside>

        {/* ─── CENTER: SVG Body ─── */}
        <div className="atlas-pro-canvas">
          <div className="atlas-canvas-caption">
            <span>{side === "front" ? "Anterior view" : "Posterior view"}</span>
            <p>All muscles visible · worked muscles highlighted</p>
          </div>
          <div className="atlas-pro-figure">
            <svg viewBox="0 0 294 600" className={`atlas-pro-body ${focused ? "atlas-pro-focused" : ""}`} style={{ transformOrigin: selected?.focus || "50% 44%" }} aria-label={`${side} interactive anatomy heat map`} onKeyDown={(event) => { if (event.key === "Escape") clearSelection(); }}>
              {/* Body silhouette */}
              <path d={figure[side]} className="atlas-pro-silhouette" onClick={clearSelection} />

              {/* ALL muscles on this side rendered — neutral base for non-worked, colored for worked */}
              {visibleOnSide.map((region) => {
                const isWorked = Boolean(region.role);
                const isInFilteredList = filteredForList.includes(region);
                const fillColor = isWorked ? heat(region.score) : NEUTRAL_FILL;
                const strokeColor = isWorked ? "#f9fcfc" : NEUTRAL_STROKE;
                const dimmed = selectedId && selectedId !== region.id;

                return region.paths.map((path, index) => (
                  <path
                    key={`${region.id}-${index}`}
                    d={path}
                    tabIndex={0}
                    role="button"
                    aria-label={`${region.label}, ${region.role || "not involved"}, ${region.score} of 100`}
                    className={`atlas-pro-region ${selectedId === region.id ? "is-selected" : ""} ${!isWorked ? "is-neutral" : ""} ${!isInFilteredList ? "is-filtered-out" : ""}`}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={isWorked ? 1.15 : 0.7}
                    opacity={dimmed ? (isWorked ? 0.35 : 0.2) : 1}
                    onMouseEnter={() => setHoverId(region.id)}
                    onMouseLeave={() => setHoverId("")}
                    onFocus={() => setHoverId(region.id)}
                    onBlur={() => setHoverId("")}
                    onClick={(event) => { event.stopPropagation(); select(region); }}
                    onDoubleClick={() => { select(region); setFocused(true); }}
                    onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(region); } if (event.key === "Escape") clearSelection(); }}
                  />
                ));
              })}
            </svg>

            {/* Hover tooltip */}
            {hover && (
              <div className="atlas-pro-tooltip">
                <strong>{hover.label}</strong>
                <span>{hover.role || "Not involved"}</span>
                <b>{hover.score > 0 ? `${hover.score}/100 · ${tier(hover.score)} Tier` : "No activation"}</b>
                <p>{hover.action}</p>
              </div>
            )}
          </div>

          {/* Heat legend */}
          <div className="atlas-heat-legend-pro">
            <span className="atlas-legend-neutral">Neutral</span><i className="atlas-legend-swatch-neutral" />
            <span>20</span><i /><span>40</span><i /><span>60</span><i /><span>80</span><i /><span>90+</span>
          </div>

          {/* Ranked muscles strip */}
          <div className="atlas-ranking">
            <div>
              <p className="metric-label">Top muscles</p>
              <span>Click a row to focus it on the model.</span>
            </div>
            {ranked.map((region, index) => (
              <button key={region.id} onClick={() => select(region)} className={selectedId === region.id ? "is-selected" : ""}>
                <b>{index + 1}</b>
                <span>{region.label.replace("pectoralis major", "pec").replace("deltoid", "delt")}</span>
                <em>{region.score}</em>
              </button>
            ))}
          </div>
        </div>

        {/* ─── RIGHT: Inspector ─── */}
        <aside className={`atlas-pro-inspector ${selected ? "is-open" : ""}`}>
          {selected ? (
            <>
              <div className="atlas-inspector-title">
                <div>
                  <p className="metric-label">Selected muscle</p>
                  <h3>{selected.label}</h3>
                </div>
                <button onClick={clearSelection} aria-label="Clear muscle selection">×</button>
              </div>
              <div className="atlas-inspector-badges">
                <span>{selected.role || "Not involved"}</span>
                <b>{selected.score}/100</b>
                <i>{tier(selected.score)} Tier</i>
              </div>
              <div className="atlas-core-metrics">
                {coreMetrics.map(([name, value]) => (
                  <div key={name as string}>
                    <span>{name}</span>
                    <b>{value}</b>
                    <i><em style={{ width: `${value}%` }} /></i>
                  </div>
                ))}
              </div>
              <div className="atlas-why-pro">
                <p className="metric-label">Why it matters</p>
                <p>{selected.why}</p>
                <span>{selected.action}</span>
              </div>
              <button className="atlas-focus-button" onClick={() => setFocused((value) => !value)}>
                <Focus className="h-3.5 w-3.5" /> {focused ? "Reset focus" : "Focus region"}
              </button>
              <details className="atlas-full-analysis">
                <summary>View full analysis <ChevronDown className="h-4 w-4" /></summary>
                <div>
                  {fullMetrics.map(([name, value]) => (
                    <div key={name as string}>
                      <span>{name}</span>
                      <b>{value}</b>
                      <i><em style={{ width: `${value}%` }} /></i>
                    </div>
                  ))}
                  <p><b>Confidence:</b> Structured estimate based on the movement pattern, stated muscle role, and available mechanics evidence. It is not a direct force, EMG, or hypertrophy measurement.</p>
                </div>
              </details>
            </>
          ) : (
            <div className="atlas-inspector-empty-pro">
              <Target className="h-5 w-5" />
              <strong>Explore through the body</strong>
              <p>All muscles are visible. Highlighted muscles are being worked by the current exercise. Click any muscle to inspect its role and analysis.</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

export { labels as muscleLabels };
