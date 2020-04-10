// tween a quat of an object

import { Quaternion, Object3D } from "three";

/**
 * 
 * @param {Object3D} object 
 * @param {Quaternion} start 
 * @param {Quaternion} end 
 * @param {number} duration 
 * @param {number} limit the angular limit for rotating the quaternion from zero.
 */
function QuatTween(object, start, end, duration, limit){
    if (typeof limit == 'undefined'){
        limit = Infinity;
    }
    var t = 0;
    var actualEnd = new Quaternion(0,0,0,0);
    actualEnd.normalize();
    actualEnd.rotateTowards(end, limit);

    return function(delta){
        t += delta;
        t = Math.min(duration, t);
        Quaternion.slerp(start, actualEnd, object.quaternion, t/duration)
    }
}

export {QuatTween}