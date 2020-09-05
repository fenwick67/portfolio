// various numerical helper functions

import { MathUtils } from "three";


// quadratic interp (ease-in)
function querp(x, y, t){
    return MathUtils.lerp(x, y, t*t)
}

// inverse quadratic interp (ease-out)
function iquerp(x, y, t){
    return MathUtils.lerp(x, y, 1 - (1-t)*(1-t));
}

// ease stuff around
// use this in place of things like `velocity = oldVelocity * 0.9 + newVelocity`
// instead  do `velocity = (newVelocity - oldVelocity) * exponentialEase(clockDelta, 0.001)`
function exponentialEase(delta, r){
    var r = r || 0.0001;
    var clampedDelta = Math.min(delta, 1)
    return (Math.pow(r, clampedDelta)-1) / Math.log(r)
}

export {querp, iquerp, exponentialEase}