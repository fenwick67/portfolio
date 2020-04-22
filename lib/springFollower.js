// this will follow a bone and waggle around on a spring
// todo parameterize

// http://allenchou.net/2015/04/game-math-precise-control-over-numeric-springing/

import {Object3D, Vector3, Euler, Quaternion, Matrix4, Mesh, BoxGeometry, MeshBasicMaterial} from "three"
import { makeUpdatable } from "./updatable";

class SpringFollower{

    /**
     * 
     * @param {Object3D} parent 
     */
    constructor(parent, scale){
        this.object = new Object3D();
        this.scale = scale || new Vector3(1,1,1)
        parent.add(this.object);

        var parentVelocity = new Vector3();
        var parentPosition = new Vector3();
        var parentOldPosition = new Vector3();
        parent.getWorldPosition(parentPosition);
        parentOldPosition.copy(parentPosition);

        var self = this;
        var velocity = new Vector3();
        var velocityOld = new Vector3();

        var deltaPosition = new Vector3();

        const k = 250;// stiffness
        const d = 0.9;// damping

        var currentPositionWorld = new Vector3();

        makeUpdatable(this.object,function(delta){
            var delta = Math.min(delta, 0.05)
            parent.getWorldPosition(parentPosition);
            parentVelocity.subVectors(parentPosition, parentOldPosition);
            parentVelocity.multiplyScalar(1/delta);

            // old velocity is velocity - parent velocity in world space
            
            // compute v(i+1) = d*v(i) + h*k*(x(t) - x(i))
            velocity.set(0,0,0);
            velocity.addScaledVector(velocityOld, d);
            var hk = delta * k;
            deltaPosition.subVectors(parentPosition, currentPositionWorld)
            velocity.addScaledVector(deltaPosition, hk)

            // compute x(i+1)
            currentPositionWorld.addScaledVector(velocity,delta);

            // now apply position 
            var posLocal = new Vector3().copy(currentPositionWorld);
            self.object.worldToLocal(posLocal);
            // this is confusing but we have to add to the position
            // instead of replace it, because the current position affects the transform.
            posLocal.multiply(self.scale)
            self.object.position.add(posLocal)

            // track old data
            parentOldPosition.copy(parentPosition);
            velocityOld.copy(velocity);
        })
        
    }
    
}

// make an bone jiggle
// the object is assumed to be static other than this (`object.position` is not updated elsewhere)
function makeJiggle(bone, localScale, up, length){
    var localUp = up.clone()
    debugger
    var proxyPositionObject = new Object3D();
    proxyPositionObject.position.copy(bone.position);
    proxyPositionObject.rotation.copy(bone.rotation);
    proxyPositionObject.scale.copy(bone.scale);
    bone.parent.add(proxyPositionObject);
    proxyPositionObject.position.add(new Vector3(0,0,length));// move target out from parent bone

    var follower = new SpringFollower(proxyPositionObject, localScale);
    proxyPositionObject.add(follower.object);
    follower.object.add(new Mesh(new BoxGeometry(10,10,10), new MeshBasicMaterial({color:0xffffff, wireframe: true, depthTest:false})))
    // bone.add(new Mesh(new BoxGeometry(10,10,10), new MeshBasicMaterial({color:0xffffff, wireframe: true, depthTest:false})))

    var followerWorldPosition = new Vector3();

    makeUpdatable(proxyPositionObject,function(){
        bone.up = up;
        follower.object.getWorldPosition(followerWorldPosition)
        bone.lookAt(followerWorldPosition)
    })

}

export {SpringFollower, makeJiggle}