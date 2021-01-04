//
// Moon Patrol
// by Bruno Garcia <b@aduros.com>

import ImageSprite from "kit/display/ImageSprite";
import Texture from "kit/display/Texture";
import Hazard from "./Hazard";

/** A moon rock that the player can crash into. */
export default class Rock extends ImageSprite
    implements Hazard
{
    constructor (texture :Texture) {
        super(texture);
    }

    getSprite () {
        return this;
    }

    onShot () :boolean {
        return true;
    }

    collidesWithGround () :boolean {
        return false;
    }
}
