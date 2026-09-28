import { ArrowUpRight } from "lucide-react";
import type { SportProfile } from "@/lib/sportMovementDatabase";

/**
 * What stands where the sport-action navigator goes when no sport is chosen.
 *
 * The Body Lab is a reference library, so it stays open to an athlete with no
 * sport - the body map and every muscle on it still work. What it must not do is
 * pick a sport for them: this screen used to inherit the catalog's first sport and
 * show that sport's first action as though the athlete had selected it.
 *
 * So the action layer says it is empty and offers the two ways out: look at a
 * sport's actions, or go to the catalog, which needs no sport at all.
 */
export function BodyLabPickSport({ sports, onSport, onBrowseCatalog }: {
  sports: SportProfile[];
  onSport: (sportId: string) => void;
  onBrowseCatalog: () => void;
}) {
  return (
    <section className="body-lab-pick-sport" aria-label="No sport action selected">
      <p className="metric-label">No sport action selected</p>
      <h1>Every muscle still works.</h1>
      <p>
        You have not picked a sport, so nothing is highlighted on the body — tap any muscle to read
        what it does. To see how a sport action loads the body, choose one here.
      </p>
      <div className="body-lab-pick-sport-options" role="group" aria-label="Look at a sport">
        {sports.map((sport) => (
          <button key={sport.id} type="button" onClick={() => onSport(sport.id)}>
            {sport.label}
          </button>
        ))}
      </div>
      <button type="button" className="body-lab-pick-sport-catalog" onClick={onBrowseCatalog}>
        Browse the exercise catalog <ArrowUpRight className="h-4 w-4" />
      </button>
    </section>
  );
}
