//
// Moon Patrol
// by Bruno Garcia <b@aduros.com>

import Assets from "kit/Assets";
import CreatorObject from "kit/creator/CreatorObject";
import Director from "kit/scene/Director";
import EmitterSprite from "kit/particle/EmitterSprite";
import Entity from "kit/Entity";
import EzScene from "ez/EzScene";
import FMath from "kit/math/FMath";
import Key from "kit/input/Key";
import PatternSprite from "kit/display/PatternSprite";
import Playback from "kit/sound/Playback";
import PropertyBag from "kit/creator/PropertyBag";
import Sprite from "kit/display/Sprite";
import System from "kit/System";

import Bomb from "./Bomb";
import Bullet from "./Bullet";
import Hazard from "./Hazard";
import Pit from "./Pit";
import Rock from "./Rock";
import Rover from "./Rover";
import Terrain from "./Terrain";
import UFO from "./UFO";

/** Encapsulates game state. */
export default class World extends CreatorObject
{
    /** The width of each vertical slice of the terrain height map, in pixels. */
    sliceWidth :number = 10;

    /** How many slices in the entire terrain height map. */
    sliceCount :integer = 120;

    /** Current rover speed. */
    speed :number = 200;

    /** Maximum possible rover speed. */
    speedMax :number = 400;

    /** Minimum possible rover speed. */
    speedMin :number = 100;

    constructor () {
        super();
        this._heights = new Array(this.sliceCount);
    }

    onStart () {
        var assets = this.owner.getFromParents(Assets);

        var parallax = new Entity();
        this.owner.parent.addChildAt(parallax, 0);

        // Setup the scrolling background layers
        this._parallax1 = new PatternSprite(assets.getTexture("images/bg1"));
        this._parallax1.width._ = 2000;
        parallax.addChild(new Entity().add(this._parallax1));
        this._parallax2 = new PatternSprite(assets.getTexture("images/bg2"));
        this._parallax2.width._ = 2000;
        parallax.addChild(new Entity().add(this._parallax2));

        for (let ii = 0; ii < this._heights.length; ++ii) {
            this._heights[ii] = this.createNextHeight();
        }

        var sprite = new Terrain();
        this.info.transformSprite(sprite);
        this.owner.add(sprite);

        this.spawnRover();
        this.setLives(2);

        this.setMusic("sounds/music1");

        this.connect1(System.keyboard.down, event => {
            switch (event.key) {
            case Key.Up:
                if (this._rover != null && this._rover.jump()) {
                    assets.getSound("sounds/jump").play();
                }
                break;
            case Key.Space:
                if (this._rover != null && this._bullets.length < 4) {
                    assets.getSound("sounds/shoot").play();

                    // Shoot right
                    var bullet = new Bullet(12, 4);
                    bullet.setXY(this._rover.x._ + 145, this._rover.getWorldY() + 26);
                    bullet.setVelocity(1000 + this.speed, 0).setLife(0.25);
                    this.owner.addChild(new Entity().add(bullet));
                    this._bullets.push(bullet);

                    // Shoot up
                    var bullet = new Bullet(4, 12);
                    bullet.setXY(this._rover.x._ + 41, this._rover.getWorldY() + 5);
                    bullet.setVelocity(this.speed, -1000);
                    this.owner.addChild(new Entity().add(bullet));
                    this._bullets.push(bullet);
                }
                break;
            default:
            }
        });
    }

    onUpdate (dt :number) {
        // Apply rover acceleration
        if (this._rover != null) {
            var acceleration = 0.0;
            if (System.keyboard.isDown(Key.Left)) {
                acceleration = -400;
            } else if (System.keyboard.isDown(Key.Right)) {
                acceleration = 400;
            }
            if (acceleration != 0) {
                this.speed = FMath.clamp(this.speed + acceleration*dt, this.speedMin, this.speedMax);
            }
        }

        // Spawn hazards
        this._spawnTimer -= dt;
        if (this._spawnTimer <= 0) {
            this._spawnTimer = 1 + 5*Math.random();

            var r = Math.random();
            if (r > 0.7) {
                this.spawnRock();
            } else if (r > 0.4) {
                this.spawnPit();
            } else {
                this.spawnUFO();
            }
        }

        var dx = this.speed*dt;

        // Scroll parallax background layers
        this._parallax1.x._ -= 0.2*dx;
        while (this._parallax1.x._ < -this._parallax1.texture.width) {
            this._parallax1.x._ += this._parallax1.texture.width;
        }
        this._parallax2.x._ -= 0.5*dx;
        while (this._parallax2.x._ < -this._parallax2.texture.width) {
            this._parallax2.x._ += this._parallax2.texture.width;
        }

        this._worldX += dx;
        this._accumulator += dx;

        // Generate a new slice if needed
        while (this._accumulator > this.sliceWidth) {
            this._accumulator -= this.sliceWidth;
            this._heights.shift();
            this._heights.push(this.createNextHeight());
        }

        var chassisBounds = null;
        if (this._rover != null && this._rover.alpha._ >= 1) {
            chassisBounds = Sprite.getBounds(this._rover.chassis.owner);
            chassisBounds.x += this._rover.x._;
            chassisBounds.y += this._rover.y._;

            this.addToScore(dx);
        }

        // Check hazard collisions
        for (var ii = 0; ii < this._hazards.length; ++ii) {
            var hazard = this._hazards[ii];
            var sprite = hazard.getSprite();
            if (sprite.x._ < this._worldX-500) {
                // Scrolled off screen, discard
                this._hazards.splice(ii--, 1);
                sprite.owner.dispose();
                continue;
            }

            var hazardBounds = Sprite.getBounds(sprite.owner);
            if (chassisBounds != null && chassisBounds.intersects(hazardBounds)) {
                // Hazard hit the rover
                var explosion = this.spawnExplosion(this._rover.x._ + this._rover.chassis.getNaturalWidth()/2, this._rover.getWorldY());
                explosion.complete.connect(() => {
                    if (this._lives > 0) {
                        this.setLives(this._lives-1);
                        this.spawnRover();
                        this._rover.alpha.animate(0, 1, 2);
                        if (this._lives == 0) {
                            // Down to the last life, switch to the higher intensity music
                            this.setMusic("sounds/music2");
                        }
                    } else {
                        var director = this.owner.getFromParents(Director);
                        var scene = new EzScene("End");
                        director.unwindToScene(scene);
                        scene.owner.yieldForStart();
                        scene.owner.get(PropertyBag).set("score", Integer(this._score));
                    }
                });
                this._rover.owner.dispose();
                this._rover = null;
            }

            if (hazard.collidesWithGround() && hazardBounds.bottom >= this.getYAt(sprite.x._)) {
                // Hazard hit the ground
                this.spawnExplosion(sprite.x._, sprite.y._);
                this._hazards.splice(ii--, 1);
                sprite.owner.dispose();
                continue;
            }

            for (var jj = 0; jj < this._bullets.length; ++jj) {
                var bullet = this._bullets[jj];
                if (hazardBounds.intersects(Sprite.getBounds(bullet.owner)) && hazard.onShot()) {
                    // Hazard hit by bullet
                    this._bullets.splice(jj--, 1);
                    bullet.owner.dispose();

                    this.spawnExplosion(sprite.x._, sprite.y._);
                    this._hazards.splice(ii--, 1);
                    sprite.owner.dispose();

                    this.addToScore(5000);
                    break;
                }
            }
        }

        // Clean up out of bound bullets
        for (var ii = 0; ii < this._bullets.length; ++ii) {
            var bullet = this._bullets[ii];
            var localX = bullet.x._ - this._worldX;
            var localY = bullet.y._;
            if (bullet.life < 0 || localX < 0 || localX > this.info.width || localY < 0 || localY > this.info.height) {
                this._bullets.splice(ii--, 1);
                bullet.owner.dispose();
            }
        }
    }

    /** Get the terrain height at the given world x-coordinate. */
    getHeightAt (worldX :number) :number {
        var localX = worldX - this._worldX + this._accumulator;
        var idx = Integer(localX / this.sliceWidth);
        return (idx >= 0 && idx < this._heights.length) ? this._heights[idx] : 0;
    }

    /** Get the terrain ground y position at the given world x-coordinate. */
    getYAt (worldX :number) :number {
        return this.info.height - this.getHeightAt(worldX);
    }

    public get worldX () :number {
        return this._worldX;
    }

    /** The x position that new ground-based hazards should be spawned at. */
    private getSpawnX () :number {
        return this._worldX + this.sliceCount*this.sliceWidth - this._accumulator;
    }

    /** The y position that new ground-based hazards should be spawned at. */
    private getSpawnY () :number {
        return this.info.height - this._heights[this._heights.length-1];
    }

    public get accumulator () :number {
        return this._accumulator;
    }

    public get heights () :Array<number> {
        return this._heights;
    }

    /** Generates the height value for the next slice. */
    private createNextHeight () :number {
        if (this._worldX < this._zeroHeightUntil) {
            return 0.0;
        }
        var h = this._brush + Math.random()*World.TERRAIN_NOISE - 0.5*World.TERRAIN_NOISE;
        this._brush = FMath.clamp(h, World.MIN_HEIGHT, World.MAX_HEIGHT);
        return this._brush;
    }

    spawnRover () {
        this._rover = new Rover();
        this.owner.addChild(new Entity().add(this._rover));
        this._rover.owner.yieldForStart();
    }

    spawnRock () {
        var x = this.getSpawnX(), y = this.getSpawnY();

        var assets = this.owner.getFromParents(Assets);
        var rock = new Rock(assets.getTexture("images/rock"));
        rock.setXY(x, y+4).setAnchor(rock.getNaturalWidth()/2, rock.getNaturalHeight());
        this.owner.addChild(new Entity().add(rock));
        this._hazards.push(rock);
    }

    spawnPit () {
        var x = this.getSpawnX(), y = this.getSpawnY();
        if (y <= 0) {
            return; // Tried to generate a pit inside of an existing pit, abort
        }

        var assets = this.owner.getFromParents(Assets);
        var pit = new Pit(assets.getTexture("images/pit"));
        pit.setXY(x, y - 10); // -10 to slightly raise the hitbox so the player can't just drive over it
        this.owner.addChild(new Entity().add(pit));
        this._hazards.push(pit);

        // Pause terrain generation until the pit is passed through
        this._zeroHeightUntil = this._worldX + pit.getNaturalWidth();
    }

    spawnUFO () {
        var assets = this.owner.getFromParents(Assets);
        var ufo = new UFO(assets.getTexture("images/ufo"));
        ufo.setXY(this.getSpawnX(), 0).centerAnchor();
        this.owner.addChild(new Entity().add(ufo));
        this._hazards.push(ufo);
    }

    spawnBomb (x :number, y :number) {
        var assets = this.owner.getFromParents(Assets);
        var bomb = new Bomb(assets.getTexture("images/bomb"), this.speed);
        bomb.setXY(x, y).centerAnchor();
        this.owner.addChild(new Entity().add(bomb));
        this._hazards.push(bomb);
    }

    spawnExplosion (x :number, y :number) :EmitterSprite {
        var assets = this.owner.getFromParents(Assets);
        assets.getSound("sounds/explode").play();

        var sprite = assets.getParticleSystem("particles/explode").createEmitter().once();
        sprite.setXY(x, y);
        this.owner.addChild(new Entity().add(sprite));
        return sprite;
    }

    addToScore (delta :number) {
        this._score += delta;

        // Update UI
        var bag = this.owner.getFromParents(PropertyBag);
        bag.set("score", Integer(this._score));
    }

    setLives (lives :integer) {
        this._lives = lives;

        // Update UI
        var bag = this.owner.getFromParents(PropertyBag);
        bag.set("lives", this._lives);
    }

    setMusic (name :string) {
        if (World._music != null) {
            World._music.dispose();
        }
        if (name != null) {
            var assets = this.owner.getFromParents(Assets);
            World._music = assets.getSound(name).loop();
        }
    }

    // Terrain generation params
    private static TERRAIN_NOISE = 8;
    private static MIN_HEIGHT = 100;
    private static MAX_HEIGHT = 200;

    /** The value of the last generated height slice for continuity. */
    private _brush :number = (World.MAX_HEIGHT+World.MIN_HEIGHT)/2;

    /** The current camera position. */
    private _worldX :number = 0;

    /** How far into the current slice we are before a new one must be generated. */
    private _accumulator :number = 0;

    private _lives :integer;
    private _score :number = 0;
    private _spawnTimer :number = 5;

    private _zeroHeightUntil :number = 0;
    private _heights :Array<number>;

    private _rover :Rover;
    private _hazards :Array<Hazard> = [];
    private _bullets :Array<Bullet> = [];

    // Parallax background
    private _parallax1 :PatternSprite;
    private _parallax2 :PatternSprite;

    private static _music :Playback;
}
