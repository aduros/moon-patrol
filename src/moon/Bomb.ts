//
// Moon Patrol
// by Bruno Garcia <b@aduros.com>

import ImageSprite from "kit/display/ImageSprite";
import Sprite from "kit/display/Sprite";
import Texture from "kit/display/Texture";
import Hazard from "./Hazard";

/** A bomb dropped by a UFO. */
export default class Bomb extends ImageSprite
    implements Hazard
{
    constructor (image :Texture, private _velX :number) {
        super(image);
    }

    onUpdate (dt :number) {
        this.x._ += this._velX*dt;
        this.y._ += 200*dt;
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
}
