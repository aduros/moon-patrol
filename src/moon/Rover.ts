//
// Moon Patrol
// by Bruno Garcia <b@aduros.com>

import Entity from "kit/Entity";
import ImageSprite from "kit/display/ImageSprite";
import Sprite from "kit/display/Sprite";
import World from "./World";

/** The player's vehicle. */
export default class Rover extends Sprite
{
    /** The main body of the rover. */
    chassis :ImageSprite;

    /** Each of the 3 wheels. */
    wheels :Array<ImageSprite>;

    onStart () {
        var assets = this.owner.getAssetsFromParents();

        this.chassis = new ImageSprite(assets.getTexture("images/chassis"));
        this.owner.addChild(new Entity().add(this.chassis));

        this.wheels = [20, 60, 110].map(x => {
            var wheel = new ImageSprite(assets.getTexture("images/wheel"));
            wheel.centerAnchor().setScale(0.25).setRotation(Math.random()*360).setXY(x, 0);
            this.owner.addChild(new Entity().add(wheel));
            return wheel;
        });
    }

    /** Gets the current world position of the chassis. */
    getWorldY () {
        if (this._jumping) {
            return this.y._;
        } else {
            return this.chassis.y._;
        }
    }

    onUpdate (dt :number) {
        var world = this.owner.getFromParents(World);

        var x = world.worldX + 300;
        this.x._ = x;

        if (this._jumping) {
            for (var wheel of this.wheels) {
                wheel.rotation._ += 8*world.speed*dt;
            }

            var h = world.getHeightAt(x);

            this.y._ += this._velY*dt;
            this._velY += 500.0*dt; // Apply gravity

            // Check collision with ground
            if (this._velY > 0 && this.y._ >= world.info.height - h - this.chassis.getNaturalHeight()) {
                this._jumping = false;
            }
        }

        if (!this._jumping) {
            this.y._ = 0;

            // Snap the wheels and chassis to the ground
            var minY = Infinity;
            for (var wheel of this.wheels) {
                var h = world.getHeightAt(x + wheel.x._);
                if (h > 0) {
                    wheel.y._ = world.info.height - h - 0.5*wheel.scaleY._*wheel.getNaturalHeight();
                }
                wheel.rotation._ += 4*world.speed*dt;

                minY = Math.min(wheel.y._, minY);
            }

            var targetY = minY - 40;
            if (this.chassis.y._ > 0) {
                // Interpolate with the current position to give the chassis some suspension
                this.chassis.y._ = (targetY + this.chassis.y._) / 2;
            } else {
                // Special case if over a pit while invincible
                this.chassis.y._ = targetY;
            }
        }
    }

    /**
    * Called when the player wants to jump.
    * @returns Whether the jump was started.
    */
    jump () :boolean {
        if (this._jumping) {
            return false; // Already jumping
        }

        this._jumping = true;
        this._velY = -300;

        this.y._ = this.chassis.y._;
        for (var wheel of this.wheels) {
            wheel.y._ = 40;
        }
        this.chassis.y._ = 0;

        return true;
    }

    private _jumping = false;
    private _velY = 0.0;
}
