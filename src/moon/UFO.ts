//
// Moon Patrol
// by Bruno Garcia <b@aduros.com>

import ImageSprite from "kit/display/ImageSprite";
import Sprite from "kit/display/Sprite";
import Texture from "kit/display/Texture";
import Hazard from "./Hazard";
import World from "./World";

export default class UFO extends ImageSprite
    implements Hazard
{
    constructor (texture :Texture) {
        super(texture);

        // Randomize parameters to make things more interesting
        this._fuel = UFO.random(5, 10);
        this._period = UFO.random(0.5, 2);
        this._amplitude = UFO.random(100, 300);
        this._hoverHeight = UFO.random(100, 200);
        this._bombInterval = UFO.random(3, 5);
    }

    onUpdate (dt :number) {
        var world = this.owner.getFromParents(World);
        this._fuel -= dt;

        this.x._ = world.worldX + 400 + this._amplitude*Math.sin(this._period*this._fuel);

        // Adjust a bit to account for the player's speed
        this.x._ -= 100*world.speed/400;

        // Apply gravity
        this.y._ += dt*100;

        if (this._fuel > 0) {
            // Snap at the hover height until we run out of fuel
            this.y._ = Math.min(this.y._, this._hoverHeight);

            // Drop a bomb every interval
            this._bombTimer += dt;
            while (this._bombTimer >= this._bombInterval) {
                world.spawnBomb(this.x._, this.y._);
                this._bombTimer -= this._bombInterval;
            }
        }
    }

    getSprite () :Sprite {
        return this;
    }

    onShot () :boolean {
        return true;
    }

    collidesWithGround () :boolean {
        return true;
    }

    private static random (min :number, max :number) {
        return min + (max-min)*Math.random();
    }

    /** Time since last bomb dropped. */
    private _bombTimer = 0.0;

    /** How frequently bombs are dropped. */
    private _bombInterval :number;

    /** How much time remaining before it goes into a dive. */
    private _fuel :number;

    /** Y position of the resting hover. */
    private _hoverHeight :number;

    /** Period of the sine wave motion. */
    private _period :number;

    /** Amplitude of the sine wave motion. */
    private _amplitude :number;
}
