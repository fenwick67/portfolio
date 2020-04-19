// physics agents are things like the player, which move around the environment and get pushed by walls.

import {entities} from "./entities.js"
import { Raycaster, Vector3, Object3D } from "three";
import {forEach} from "lodash"

const DOWN = new Vector3(0, -1, 0)
const CAST_OFFSET = new Vector3(0,1,0)
var raycaster = new Raycaster;
var ray_origin = new Vector3()

var object_radius = 2;

// check walls
var wallCheckOrigins = [
    new Vector3(0,0,object_radius).add(CAST_OFFSET),
    new Vector3(0,0,-object_radius).add(CAST_OFFSET),
    new Vector3(object_radius,0,0).add(CAST_OFFSET),
    new Vector3(-object_radius,0,0).add(CAST_OFFSET)
];

var locationCache = {}

/**
 * 
 * @param {Object3D} o 
 * @param {*} delta 
 */
function physicsUpdate(o, delta){
    // check floor
    var floors = entities.physfloors;
    ray_origin.addVectors(o.position, CAST_OFFSET)
    raycaster.set(ray_origin, DOWN);
    var intersects = raycaster.intersectObjects( floors, true );
    if (intersects.length > 0){
        o.position.setY(ray_origin.y - intersects[0].distance)
    }

    // get old location for wall collisions
    var oldLocation = locationCache[o.uuid];
    if (!oldLocation){
        locationCache[o.uuid] = o.position.clone()
        return; // no old location (first tick), just return
    }

    // check walls
    var walls = entities.physwalls;
    var wallMotion = new Vector3(0,0,0);
    var motion = new Vector3(0,0,0).subVectors(o.position, oldLocation);
    var motion_length = motion.length();
    // make motion_length work even at small scales
    // motion_length = Math.max(motion_length, 0.1)
    var motion_normal = new Vector3().copy(motion).normalize();

    ray_origin.copy(o.position);
    ray_origin.add(CAST_OFFSET);
    ray_origin.addScaledVector(motion, -1);
    raycaster.set(ray_origin, motion_normal);
    var intersections = raycaster.intersectObjects( walls, true );
    if (intersections.length > 0){
        // only check closest
        if (intersections[0].distance < motion_length * 2 + object_radius){
            // move out of object in the direction of the face normal
            wallMotion.addScaledVector(intersections[0].face.normal,  -1*intersections[0].face.normal.dot(motion) )
            console.log(wallMotion, motion)
        }
    }
    o.position.add(wallMotion)

    
    locationCache[o.uuid].copy(o.position)
}

export {physicsUpdate}