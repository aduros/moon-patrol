//
// Moon Patrol
// by Bruno Garcia <b@aduros.com>

import Sprite from "kit/display/Sprite";

/** A hazard is anything that can collide with and kill the player. */
export default interface Hazard
{
    /** The visual representation of the hazard. */
    getSprite () :Sprite;

    /** Whether this hazard should collide with the terrain. */
    collidesWithGround () :boolean;

    /**
     * Called when shot by a player bullet.
     * @returns True if the collision should be handled, false if ignored.
     */
    onShot () :boolean;
}
