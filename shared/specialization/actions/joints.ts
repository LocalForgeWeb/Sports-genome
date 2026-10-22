import type { JointAction } from "../types";
import { abdomenActionIds as ab, ankleActionIds as an, footActionIds as ft, hipActionIds as hp, kneeActionIds as kn, scapulaActionIds as sc, shoulderActionIds as sh, spineActionIds as sp } from "./ids";

/**
 * The joint actions the other regions name (docs/specialization-atlas/10-multi-region.md §1.2),
 * added with the multi-region model so every region lane reads one definition of each. The
 * forearm's actions, the elbow's among them, are in `forearm.ts`.
 *
 * Written as the forearm's are: the label carries the anatomical term, the description says
 * the movement in plain words, from the standard position (standing, arms at the sides).
 * Directions are anatomical (forward, back, toward the other leg), never screen-left or
 * screen-right. No action is region-specific: the chest and the shoulders name one shoulder
 * flexion.
 */
export const jointActions: JointAction[] = [
  { id: sh.flexion, joint: "Shoulder", label: "Shoulder flexion", plainDescription: "Raises the arm forward and up in front of the body." },
  { id: sh.extension, joint: "Shoulder", label: "Shoulder extension", plainDescription: "Brings the arm down and back from in front of the body, and on behind it." },
  { id: sh.abduction, joint: "Shoulder", label: "Shoulder abduction", plainDescription: "Raises the arm out to the side." },
  { id: sh.adduction, joint: "Shoulder", label: "Shoulder adduction", plainDescription: "Brings an arm raised out to the side back down toward the body." },
  { id: sh.horizontalAdduction, joint: "Shoulder", label: "Horizontal adduction", plainDescription: "Moves an arm held out at shoulder height forward and across the chest." },
  { id: sh.horizontalAbduction, joint: "Shoulder", label: "Horizontal abduction", plainDescription: "Moves an arm held out in front at shoulder height back and out to the side." },
  { id: sh.externalRotation, joint: "Shoulder", label: "Shoulder external rotation", plainDescription: "Turns the upper arm outward on its long axis: with the elbow bent, the hand swings away from the belly." },
  { id: sh.internalRotation, joint: "Shoulder", label: "Shoulder internal rotation", plainDescription: "Turns the upper arm inward on its long axis: with the elbow bent, the hand swings toward the belly." },

  { id: sc.elevation, joint: "Shoulder blade", label: "Scapular elevation", plainDescription: "Lifts the shoulder blade toward the ear, as in a shrug." },
  { id: sc.depression, joint: "Shoulder blade", label: "Scapular depression", plainDescription: "Pulls the shoulder blade down, away from the ear." },
  { id: sc.protraction, joint: "Shoulder blade", label: "Scapular protraction", plainDescription: "Slides the shoulder blade forward around the ribs, away from the spine, as when reaching forward." },
  { id: sc.retraction, joint: "Shoulder blade", label: "Scapular retraction", plainDescription: "Draws the shoulder blade back toward the spine, as when squeezing the shoulder blades together." },
  { id: sc.upwardRotation, joint: "Shoulder blade", label: "Scapular upward rotation", plainDescription: "Turns the shoulder blade so the shoulder socket faces up, as the arm rises overhead." },
  { id: sc.downwardRotation, joint: "Shoulder blade", label: "Scapular downward rotation", plainDescription: "Turns the shoulder blade back so the shoulder socket faces down, as a raised arm is pulled down." },

  { id: sp.flexion, joint: "Spine", label: "Spinal flexion", plainDescription: "Bends the trunk forward, curling the ribs toward the pelvis." },
  { id: sp.extension, joint: "Spine", label: "Spinal extension", plainDescription: "Straightens the trunk from a forward bend, or arches it backward." },
  { id: sp.lateralFlexion, joint: "Spine", label: "Spinal lateral flexion", plainDescription: "Bends the trunk to one side." },
  { id: sp.rotation, joint: "Spine", label: "Spinal rotation", plainDescription: "Twists the trunk, turning the shoulders relative to the hips." },

  { id: ab.compression, joint: "Abdominal wall", label: "Abdominal compression", plainDescription: "Draws the belly wall in and tightens it, raising the pressure inside the abdomen." },

  { id: hp.flexion, joint: "Hip", label: "Hip flexion", plainDescription: "Brings the thigh forward and up toward the trunk, or the trunk down toward the thigh." },
  { id: hp.extension, joint: "Hip", label: "Hip extension", plainDescription: "Moves the thigh back from in front of the body, or lifts the trunk from a forward lean at the hips." },
  { id: hp.abduction, joint: "Hip", label: "Hip abduction", plainDescription: "Moves the leg out to the side, away from the other leg." },
  { id: hp.adduction, joint: "Hip", label: "Hip adduction", plainDescription: "Brings the leg in toward the other leg." },
  { id: hp.externalRotation, joint: "Hip", label: "Hip external rotation", plainDescription: "Turns the thigh outward on its long axis, so the knee and toes point out." },
  { id: hp.internalRotation, joint: "Hip", label: "Hip internal rotation", plainDescription: "Turns the thigh inward on its long axis, so the knee and toes point in." },

  { id: kn.extension, joint: "Knee", label: "Knee extension", plainDescription: "Straightens the knee." },
  { id: kn.flexion, joint: "Knee", label: "Knee flexion", plainDescription: "Bends the knee, bringing the heel toward the buttock." },

  { id: an.plantarFlexion, joint: "Ankle", label: "Plantar flexion", plainDescription: "Points the foot down, as when rising onto the toes." },
  { id: an.dorsiflexion, joint: "Ankle", label: "Dorsiflexion", plainDescription: "Pulls the top of the foot up toward the shin." },

  { id: ft.inversion, joint: "Foot (below the ankle)", label: "Inversion", plainDescription: "Tilts the sole of the foot inward, toward the other foot." },
  { id: ft.eversion, joint: "Foot (below the ankle)", label: "Eversion", plainDescription: "Tilts the sole of the foot outward, away from the other foot." },
];
