import type { JointAction } from "../../types";
import { forearmActionIds as a } from "../../ids";

/** Joint actions the forearm atlas explains and maps. Plain wording is what the page shows. */
export const forearmActions: JointAction[] = [
  { id: a.elbowFlexion, joint: "Elbow", label: "Elbow flexion", plainDescription: "Bends the elbow, bringing the hand toward the shoulder." },
  { id: a.elbowExtension, joint: "Elbow", label: "Elbow extension", plainDescription: "Straightens the elbow." },
  { id: a.pronation, joint: "Forearm (radioulnar joints)", label: "Pronation", plainDescription: "Turns the forearm so the palm faces down or back." },
  { id: a.supination, joint: "Forearm (radioulnar joints)", label: "Supination", plainDescription: "Turns the forearm so the palm faces up or forward." },
  { id: a.wristFlexion, joint: "Wrist", label: "Wrist flexion", plainDescription: "Bends the wrist toward the palm." },
  { id: a.wristExtension, joint: "Wrist", label: "Wrist extension", plainDescription: "Bends the wrist back, toward the back of the hand." },
  { id: a.radialDeviation, joint: "Wrist", label: "Radial deviation", plainDescription: "Tilts the hand toward the thumb side." },
  { id: a.ulnarDeviation, joint: "Wrist", label: "Ulnar deviation", plainDescription: "Tilts the hand toward the pinky side." },
  { id: a.fingersMcpFlexion, joint: "Finger knuckles (MCP)", label: "Knuckle flexion", plainDescription: "Bends the fingers at the knuckles." },
  { id: a.fingersPipFlexion, joint: "Finger middle joints (PIP)", label: "Middle-joint flexion", plainDescription: "Bends the fingers at their middle joints." },
  { id: a.fingersDipFlexion, joint: "Fingertip joints (DIP)", label: "Fingertip flexion", plainDescription: "Bends the fingertips." },
  { id: a.fingersExtension, joint: "Finger knuckles (MCP)", label: "Finger extension", plainDescription: "Straightens the fingers, mainly at the knuckles." },
  { id: a.littleFingerExtension, joint: "Little finger", label: "Little-finger extension", plainDescription: "Straightens the little finger." },
  { id: a.indexFingerExtension, joint: "Index finger", label: "Index-finger extension", plainDescription: "Straightens the index finger." },
  { id: a.thumbIpFlexion, joint: "Thumb tip (IP)", label: "Thumb-tip flexion", plainDescription: "Bends the tip of the thumb." },
  { id: a.thumbCmcAbduction, joint: "Thumb base (CMC)", label: "Thumb abduction", plainDescription: "Moves the thumb away from the palm at its base." },
  { id: a.thumbMcpExtension, joint: "Thumb knuckle (MCP)", label: "Thumb-knuckle extension", plainDescription: "Straightens the thumb at its knuckle." },
  { id: a.thumbIpExtension, joint: "Thumb tip (IP)", label: "Thumb-tip extension", plainDescription: "Straightens the tip of the thumb." },
  { id: a.palmarAponeurosisTension, joint: "Palm", label: "Palmar fascia tension", plainDescription: "Tenses the sheet of connective tissue in the palm." },
  { id: a.distalRadioulnarStabilization, joint: "Distal radioulnar joint", label: "Holds the forearm bones together", plainDescription: "Helps keep the two forearm bones together near the wrist." },
];
