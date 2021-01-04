//
// Moon Patrol
// by Bruno Garcia <b@aduros.com>

import ImageSprite from "kit/display/ImageSprite";
import Texture from "kit/display/Texture";
import Hazard from "./Hazard";

/** A pit that the player can fall into. */
export default class Pit extends ImageSprite
    implements Hazard
{
    constructor (texture :Texture) {
        super(texture);
    }

    getSprite () {
        return this;
    }

    onShot () :boolean {
        return false; // Pits can't be shot
    }

    collidesWithGround () :boolean {
        return false;
    }
}
