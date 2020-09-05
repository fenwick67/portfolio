import { entities } from "./entities"
import { Vector3 } from "three"
import {exponentialEase} from './utils'

class Dolly{
    constructor(){
    }

    init(characterWorldPosition){
        this.initialized = true;
        this.rotations = []
        this.scales = []
        this.positions = entities.dollyObjects.map((o,idx)=>{
            var v = new Vector3();
            o.getWorldPosition(v);
            this.scales.push(o.scale.x);
            var q = o.quaternion.clone();
            // q.inverse();
            this.rotations.push(q)
            return v
        })
        this.targetPosition = new Vector3();
        this._diffVec = new Vector3();
        this.smoothOffset = new Vector3();
        var pos = this.calculateCamTargetPosition(characterWorldPosition);
        this.smoothOffset.subVectors(pos, characterWorldPosition);
    }

    calculateCamTargetPosition(characterWorldPosition){
        // need to defer init until entities are ready!
        if (!this.initialized){this.init(characterWorldPosition)}

        var idx = 0;
        var closestDist = Infinity;
        // weigh the camera positions by 1/distancesquared
        this.positions.forEach((position, i) => {
            var distSq = position.distanceToSquared(characterWorldPosition);
            if (distSq < closestDist){
                idx = i;
                closestDist = distSq;
            }
        });

        // idx is now the index of the closest point
        // orient to angle and go scale away from characterworldposition
        this.targetPosition.set(0,this.scales[idx],0);
        this.targetPosition.applyQuaternion(this.rotations[idx]);
        this.targetPosition.add(characterWorldPosition);
        return this.targetPosition;

    }

    getCamPosition(characterWorldPosition, delta){
        this.calculateCamTargetPosition(characterWorldPosition);

        // now update smooth position by smoothing the offset from the player
        var targetOffset = new Vector3();
        targetOffset.subVectors(this.targetPosition, characterWorldPosition);

        this._diffVec.subVectors(targetOffset, this.smoothOffset);
        this.smoothOffset.addScaledVector(this._diffVec, exponentialEase(delta, .0001) );

        return new Vector3().addVectors(this.smoothOffset, characterWorldPosition);
    }
}

export {Dolly}