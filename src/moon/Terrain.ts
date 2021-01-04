//
// Moon Patrol
// by Bruno Garcia <b@aduros.com>

import Graphics from "kit/display/Graphics";
import Sprite from "kit/display/Sprite";
import World from "./World";

/** Handles displaying the terrain height map. */
export default class Terrain extends Sprite
{
    onUpdate (dt :number) {
        var world = this.owner.getFromParents(World);

        // Camera position is adjusted a bit by the current speed
        this.x._ = -world.worldX + 0.5*(world.speed-world.speedMax);
    }

    draw (g :Graphics) {
        var world = this.owner.getFromParents(World);

        // Draw each slice of the height map
        var x = world.worldX - world.accumulator;
        for (let height of world.heights) {
            if (height > 0) {
                g.fillRect(0xfe9c4b, x, world.info.height-height, world.sliceWidth, height);
            }
            x += world.sliceWidth;
        }
    }
}
