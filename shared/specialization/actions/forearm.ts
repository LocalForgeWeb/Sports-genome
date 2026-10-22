import type { JointAction } from "../types";
import { forearmActionIds as a } from "./ids";

/**
 * Joint actions the forearm atlas explains and maps, as shipped (seed v1); every region that
 * names one of these reads this record. Plain wording is what the page shows.
 *
 * Directions are anatomical: "thumb side" and "pinky side", never screen-left or
 * screen-right, because a rotating forearm changes which surface faces the viewer.
 * "Palm down" and "palm up" assume the elbow is bent, which is how people picture
 * pronation and supination; the label carries the anatomical term for anyone who wants it.
 */
export const forearmActions: JointAction[] = [
  { id: a.elbowFlexion, joint: "Elbow", label: "Elbow flexion", plainDescription: "Bends the elbow, bringing the hand toward the shoulder." },
  { id: a.elbowExtension, joint: "Elbow", label: "Elbow extension", plainDescription: "Straightens the elbow." },
  { id: a.pronation, joint: "Forearm (radioulnar joints)", label: "Pronation", plainDescription: "Turns the forearm so the palm faces down (with the elbow bent)." },
  { id: a.supination, joint: "Forearm (radioulnar joints)", label: "Supination", plainDescription: "Turns the forearm so the palm faces up (with the elbow bent)." },
  { id: a.wristFlexion, joint: "Wrist", label: "Wrist flexion", plainDescription: "Bends the wrist toward the palm." },
  { id: a.wristExtension, joint: "Wrist", label: "Wrist extension", plainDescription: "Bends the wrist back, toward the back of the hand." },
  { id: a.radialDeviation, joint: "Wrist", label: "Radial deviation", plainDescription: "Tilts the hand toward the thumb side." },
  { id: a.ulnarDeviation, joint: "Wrist", label: "Ulnar deviation", plainDescription: "Tilts the hand toward the pinky side." },
  { id: a.fingersMcpFlexion, joint: "Finger knuckles (MCP)", label: "Knuckle flexion", plainDescription: "Bends the four fingers at the knuckles." },
  { id: a.fingersPipFlexion, joint: "Finger middle joints (PIP)", label: "Middle-joint flexion", plainDescription: "Bends the four fingers at their middle joints." },
  { id: a.fingersDipFlexion, joint: "Fingertip joints (DIP)", label: "Fingertip flexion", plainDescription: "Bends the four fingers at their end joints, curling the fingertips." },
  { id: a.fingersExtension, joint: "Finger knuckles (MCP)", label: "Finger extension", plainDescription: "Straightens the four fingers, mainly at the knuckles." },
  { id: a.littleFingerExtension, joint: "Little finger", label: "Little-finger extension", plainDescription: "Straightens the little finger on its own." },
  { id: a.indexFingerExtension, joint: "Index finger", label: "Index-finger extension", plainDescription: "Straightens the index finger on its own, as when pointing." },
  { id: a.thumbIpFlexion, joint: "Thumb tip (IP)", label: "Thumb-tip flexion", plainDescription: "Bends the tip of the thumb." },
  { id: a.thumbCmcAbduction, joint: "Thumb base (CMC)", label: "Thumb abduction", plainDescription: "Moves the thumb out from the hand at its base, away from the index finger." },
  { id: a.thumbMcpExtension, joint: "Thumb knuckle (MCP)", label: "Thumb-knuckle extension", plainDescription: "Straightens the thumb at its knuckle." },
  { id: a.thumbIpExtension, joint: "Thumb tip (IP)", label: "Thumb-tip extension", plainDescription: "Straightens the tip of the thumb." },
  { id: a.palmarAponeurosisTension, joint: "Palm", label: "Palmar fascia tension", plainDescription: "Tenses the sheet of connective tissue under the skin of the palm." },
  { id: a.distalRadioulnarStabilization, joint: "Distal radioulnar joint", label: "Steadies the forearm bones at the wrist", plainDescription: "Helps keep the ends of the two forearm bones pressed together near the wrist, including while the forearm turns." },
];
