//
// Moon Patrol
// by Bruno Garcia <b@aduros.com>

import FillSprite from "kit/display/FillSprite";

/** A bullet shot by the rover. */
export default class Bullet extends FillSprite
{
    /** The amount of time remaining before this bullet expires early. */
    life :number = Infinity;

    // Bullet velocity
    velX :number = 0;
    velY :number = 0;

    constructor (width :number, height :number) {
        super(0xffffff, width, height);
        this.centerAnchor();
    }

    setVelocity (velX :number, velY :number) {
        this.velX = velX;
        this.velY = velY;
        return this;
    }

    setLife (life :number) {
        this.life = life;
        return this;
    }

    onUpdate (dt :number) {
        this.life -= dt;
        this.x._ += this.velX*dt;
        this.y._ += this.velY*dt;
    }
}
