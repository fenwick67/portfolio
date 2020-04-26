import { entities } from "./entities"
import { Vector3 } from "three"


class Dolly{
    constructor(){
    }

    init(){
        this.initialized = true;
        this.weights = []
        this.positions = entities.camCenters.map((o,idx)=>{
            var v = new Vector3();
            o.getWorldPosition(v);
            this.weights[idx] = o.scale.x*o.scale.x;
            return v
        })
        this.interpolatedPosition = new Vector3();
    }

    getCamPosition(characterWorldPosition){
        // need to defer init until entities are ready!
        if (!this.initialized){this.init()}
        this.interpolatedPosition.set(0,0,0)
        var divisor = 0;
        // weigh the camera positions by 1/distancesquared
        this.positions.forEach((position, i) => {
            var distSq = position.distanceToSquared(characterWorldPosition);
            if (distSq > this.weights[i]){
                // not in sphere of influence
                return;
            }
            var weight =  1/(distSq) - 1/this.weights[i];
            weight = weight * Math.pow(this.weights[i],0.25);// larger have more influence
            divisor += weight;
            this.interpolatedPosition.addScaledVector(position, weight);
        });
        this.interpolatedPosition.divideScalar(divisor);
        // console.log(this.interpolatedPosition)
        // debugger
        return this.interpolatedPosition;
    }
}

export {Dolly}