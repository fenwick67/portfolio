// physics agents are things like the player, which move around the environment and get pushed by walls.

import {entities} from "./entities.js"
import { Raycaster, Vector3, Object3D } from "three";
import {forEach, maxBy, minBy} from "lodash"

const DOWN = new Vector3(0, -1, 0)
const CAST_OFFSET = new Vector3(0,3,0)
const CAST_OFFSET_GROUND = new Vector3(0,30,0)
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
 * @param {number} delta 
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

    var cast_offset_l = new Vector3(0,1,0).cross(motion_normal).multiplyScalar(object_radius / 4);
    var cast_offset_center = new Vector3();
    var cast_offset_r = cast_offset_l.clone().multiplyScalar(-1);
    var cast_offsets = [cast_offset_center, cast_offset_l, cast_offset_r];

    var pushes = []
    forEach(cast_offsets,function(offset, i){
            
        var motionAwayFromWall = new Vector3();
        ray_origin.copy(o.position);
        ray_origin.add(CAST_OFFSET);
        ray_origin.add(offset);
        ray_origin.addScaledVector(motion_normal, -0.5*object_radius);
        raycaster.set(ray_origin, motion_normal);
        var intersections = raycaster.intersectObjects( walls, true );

        if (intersections.length > 0){
            if (intersections[0].distance < object_radius){
                // get face normal in world space
                var faceNormal = intersections[0].face.normal.applyNormalMatrix(intersections[0].object.normalMatrix)
                // move out of object in the direction of the face normal
                motionAwayFromWall.addScaledVector(faceNormal, object_radius - intersections[0].distance )
                pushes.push(motionAwayFromWall)
                return false;// prioritize first collision
            }
        }
    })

    if (pushes.length > 0){
        var biggestPush = maxBy(pushes, p=>p.length())
        o.position.add(biggestPush);
    }

    // check floor
    var floors = entities.physfloors;
    ray_origin.addVectors(o.position, CAST_OFFSET_GROUND)
    raycaster.set(ray_origin, DOWN);
    var intersects = raycaster.intersectObjects( floors, true );
    if (intersects.length > 0){
        o.position.setY(ray_origin.y - intersects[0].distance)
    } else {
        o.position.setY(0)
    }

    
    locationCache[o.uuid].copy(o.position)
}

export {physicsUpdate}