import { ArrowUpRight } from "lucide-react";
import type { SportMovementProfile, SportProfile } from "@/lib/sportMovementDatabase";

/**
 * What stands where the sport-action navigator goes before an action is chosen.
 *
 * The Body Lab is the reference library, so it stays open to an athlete with no
 * sport - the body map and every muscle on it still work. What it must not do is
 * pick a sport for them. It used to: with no sport chosen, `activeSportId` fell
 * back to the catalog's first sport (Wrestling) and `findSportMovement` returned
 * that sport's first action (the penetration step), which the screen then showed
 * as though the athlete had selected it.
 *
 * So nothing is pre-selected here. Choosing a sport lists its actions; choosing
 * an action is what hands over to the navigator and paints the body. Both steps
 * are the athlete's, and until they take the second one the map stays unclaimed.
 */
export function BodyLabPickSport({ sports, activeSportId, movements, onSport, onMovement, onBrowseCatalog }: {
  sports: SportProfile[];
  /** The sport being looked at, or "" before one is chosen. */
  activeSportId: string;
  /** That sport's actions, listed only once a sport is chosen. */
  movements: SportMovementProfile[];
  onSport: (sportId: string) => void;
  onMovement: (movement: SportMovementProfile) => void;
  onBrowseCatalog: () => void;
}) {
  const chosenSport = sports.find((sport) => sport.id === activeSportId);

  return (
    <section className="body-lab-pick-sport" aria-label="No sport action selected">
      <p className="metric-label">No sport action selected</p>
      <h1>Every muscle still works.</h1>
      <p>
        Nothing is highlighted on the body — tap any muscle to read what it does. To see how a
        sport action loads the body, pick {chosenSport ? "one of these actions" : "a sport"}.
      </p>

      <div className="body-lab-pick-sport-options" role="group" aria-label="Sport to look at">
        {sports.map((sport) => (
          <button
            key={sport.id}
            type="button"
            aria-pressed={sport.id === activeSportId}
            className={sport.id === activeSportId ? "body-lab-pick-sport-chosen" : ""}
            onClick={() => onSport(sport.id)}
          >
            {sport.label}
          </button>
        ))}
      </div>

      {chosenSport && movements.length > 0 && (
        <div className="body-lab-pick-sport-movements">
          <p className="metric-label">{chosenSport.label} · {movements.length} actions</p>
          <div role="group" aria-label={`${chosenSport.label} actions`}>
            {movements.map((movement) => (
              <button key={movement.id} type="button" onClick={() => onMovement(movement)}>
                <span>{movement.label}</span>
                <small>{movement.family}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      <button type="button" className="body-lab-pick-sport-catalog" onClick={onBrowseCatalog}>
        Browse the exercise catalog <ArrowUpRight className="h-4 w-4" />
      </button>
    </section>
  );
}
