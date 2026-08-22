# User-Supplied Hierarchical Sport-Science Model Specification

## Requested Reasoning Path

The recommendation engine should follow this path whenever sufficient evidence exists:

> **Sport → Position / event / style → Sport movement → Biomechanical demand → Physiological demand → Physical quality → Required adaptation → Training modality → Exercise → Programming**

The system must not jump from a sport label directly to exercises when intermediate movement and demand data are available.

## Required Data Boundaries

| Layer | Requested elements | Representation boundary |
|---|---|---|
| Sport | Duration, work:rest, contact, skill openness, energy systems, physical qualities, injury-relevant demands | Values retain type, confidence, evidence source, and reasoning. |
| Modifier | Position, event, stroke, distance, competition role, or style | Modifiers adjust the parent sport context instead of claiming an entirely separate sport. |
| Movement | Planes, joint actions, muscle roles, contraction type, force direction, velocity/RFD, fatigue, repeatability, stability, coordination | Evidence confidence and source are attached to every claim. |
| Exercise | Mechanics, task constraints, loading opportunity, fatigue, skill, setup, equipment, and evidence confidence | Family-level evidence does not become a claim of direct individual physiology. |
| Programming | Sets, repetitions, load, RPE/RIR, rest, tempo, intent, range, frequency, volume, progression, and deload context | Repetitions alone do not define adaptation. |

## Evidence Rules

Evidence is scored by quality, directness, consistency, sample size, population similarity, ecological validity, recency, supporting/conflicting sources, and overall confidence. Causal, associational, mechanistic, descriptive, and expert-inference conclusions remain visibly distinct. Model estimates must not be presented as measured physiology or biological percentages.

## Directness and Transfer Rules

Exercise-to-movement transfer is separate from muscle targeting. It considers movement pattern, force vector, joint action, range, contraction, velocity/RFD, unilateral/stability/coordination, energy-system, stretch-shortening-cycle, and muscle-function similarity. General physical preparation, special physical preparation, and highly specific sport practice stay distinct; sport practice is the highest-specificity stimulus.

## Supplied Bibliography Scope

The user supplied 100 sport-science references spanning Wrestling, American football, Basketball, Soccer, Baseball, Track & Field, Swimming, Tennis, Volleyball, Boxing, MMA, Brazilian jiu-jitsu, Ice Hockey, Lacrosse, Rugby, Golf, Gymnastics, Rowing, Alpine Skiing, and Olympic Weightlifting. The packet prioritizes systematic reviews, meta-analyses, position/context evidence, and warns against translating athlete correlations into causal prescriptions.

## Priority Modifiers

The packet specifically calls for position/event/style modifiers for football, basketball, baseball, rugby, ice hockey, track & field, swimming, wrestling, and Alpine skiing. Notable distinctions include wrestling styles; pitcher/catcher/position player; goalie versus skater; forward versus back; sprint/distance/jump/throw events; stroke and distance; and Alpine rather than cross-country skiing.
