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

export {querp, iquerp}