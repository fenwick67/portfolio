// physics agents are things like the player, which move around the environment and get pushed by walls.

import {entities} from "./entities.js"
import { Raycaster, Vector3, Object3D } from "three";
import {forEach} from "lodash"

const DOWN = new Vector3(0, -1, 0)
const CAST_OFFSET = new Vector3(0,1,0)
var raycaster = new Raycaster;
var ray_origin = new Vector3()

var object_radius = 4;

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

    // get old location for wall collisions
    var oldLocation = locationCache[o.uuid];
    if (!oldLocation){
        locationCache[o.uuid] = o.position.clone()
        return; // no old location (first tick), just return
    }

    // check walls
    var walls = entities.physwalls;
    var motion = new Vector3(0,0,0).subVectors(o.position, oldLocation);
    motion.set(motion.x, 0, motion.z);// remove motion Y component
    var motion_length = motion.length();
    var motion_normal = new Vector3().copy(motion).normalize();

    ray_origin.copy(o.position);
    ray_origin.add(CAST_OFFSET);
    ray_origin.addScaledVector(motion_normal, -0.5*object_radius);
    raycaster.set(ray_origin, motion_normal);
    var intersections = raycaster.intersectObjects( walls, true );

    var motionAwayFromWall = new Vector3();
    if (intersections.length > 0){
        // only check closest
        if (intersections[0].distance < object_radius){
            // get face normal in world space
            var faceNormal = intersections[0].face.normal.applyNormalMatrix(intersections[0].object.normalMatrix)
            // move out of object in the direction of the face normal
            motionAwayFromWall.addScaledVector(faceNormal, object_radius - intersections[0].distance )
        }
    }
    o.position.add(motionAwayFromWall);

    // check floor
    var floors = entities.physfloors;
    ray_origin.addVectors(o.position, CAST_OFFSET)
    raycaster.set(ray_origin, DOWN);
    var intersects = raycaster.intersectObjects( floors, true );
    if (intersects.length > 0){
        o.position.setY(ray_origin.y - intersects[0].distance)
    }

    
    locationCache[o.uuid].copy(o.position)
}

export {physicsUpdate}