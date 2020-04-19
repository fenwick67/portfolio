import {Object3D, AnimationMixer, Vector3, Euler, Quaternion, Camera} from 'three'
import {input, UP, ZERO} from './input'
import {entities} from "./entities"
import {Interactable} from "./interactables"
import {QuatTween} from "./QuatTween"
import {FloatTween} from "./floatTween"
import {playerCam} from './playerCam'
import { physicsUpdate } from './physicsAgent'
// define Player class and handle movement etc

class Player{

    /**
     * 
     * @param {Object3D} armature 
     */
    constructor(armature, animationRoot, animations){
        {
            this.wasInteracting = false;
            this.armature = armature;
            this.mesh = armature;
            this.initialPosition = armature.position;
            this.animationRoot = animationRoot;
            this.animationMixer = new AnimationMixer( animationRoot );
            this.walk = this.animationMixer.clipAction( animations.find(a=>a.name == "walk") )
            this.idle = this.animationMixer.clipAction( animations.find(a=>a.name == "idle") )
            this.run = this.animationMixer.clipAction( animations.find(a=>a.name == "run") )
            this.animSpeed = 0;
            this.walk.play();
            this.idle.play();
            this.run.play();
            this.physicsTicker = 0;
            armature.userData.update = this.update.bind(this);
            this.setMoveAnimationForSpeed(0)
            this.garbageVec3 = new Vector3();
            this.garbageVec32 = new Vector3();
            this.movementSc = new Vector3(0.25, 0, -0.25);
            this.velocity = new Vector3();
            this.interactingWith = null;
            this.headBone = null; // the one we need to update ourselves
            this.animatedHeadBone = null;// the one animated by animations
            this.lookObject = null;// Object3d
            this.lookTargetQuat = new Quaternion();
            this.armature.traverse(o=>{
                if (o.name == 'head_look'){this.headBone = o}
            })
            this.armature.traverse(o=>{
                if (o.name == 'head'){this.animatedHeadBone = o}
            })
            this.lookTween = QuatTween(this.headBone, this.lookTargetQuat, this.lookTargetQuat, 0);
            this.objectTurnTween = FloatTween;
        }
    }

    setMoveAnimationForSpeed(speed){
        var spd = Math.max(Math.min(Math.abs(speed), 2), 0);

        this.animSpeed = this.animSpeed * 0.8 + 0.2 * spd;

        if (this.animSpeed <= 1){
            this.idle.setEffectiveWeight(1 - this.animSpeed)
            this.walk.setEffectiveWeight(this.animSpeed)
            this.run.setEffectiveWeight(0)
        } else if (this.animSpeed > 1 && this.animSpeed < 2){
            var amnt = this.animSpeed - 1
            this.idle.setEffectiveWeight(0)
            this.walk.setEffectiveWeight(1 - amnt)
            this.run.setEffectiveWeight(amnt)
        } else if (this.animSpeed >= 2){
            this.idle.setEffectiveWeight(0)
            this.walk.setEffectiveWeight(0)
            this.run.setEffectiveWeight(1)
        }
        this.animationMixer.timeScale = 0.5 + this.animSpeed /4;
    }

    update(delta){

        if (!this.interactingWith){
            this.velocity.multiplyVectors(input.movementAxes, this.movementSc);
            if (input.movementAxes.length() > 0.1){
                this.armature.setRotationFromAxisAngle(UP, Math.atan2(this.velocity.x,this.velocity.z))
            }
        } else {
            this.velocity.multiplyScalar(0.8)
        }

        this.setMoveAnimationForSpeed(2 * this.velocity.length() / this.movementSc.x);
        this.armature.position.addScaledVector(this.velocity, delta * 60);

        var interactionDistance = 5;

        // find interactable I can talk to
        if (!this.interactingWith && input.buttons.action && !input.buttonsLastFrame.action){
            var interactableFound = false;
            var worldPos = new Vector3();
            this.armature.getWorldPosition(worldPos);
            worldPos.multiplyVectors(worldPos, new Vector3(1,0,1))
            var objectPos = new Vector3();

            entities.scene.traverse(o=>{
                if (!interactableFound && Interactable.isInteractable(o)){
                    o.getWorldPosition(objectPos);
                    objectPos.multiplyVectors(objectPos, new Vector3(1,0,1))
                    if ( objectPos.distanceTo(worldPos) < interactionDistance){
                        this.interactingWith = Interactable.interactableForObject(o);
                        interactableFound = true;
                    }
                }
            })

            // got a new thing to interact with
            if (interactableFound){
                // console.log(this.interactingWith.scriptName,"says",this.interactingWith.script)
                this.interactingWith.startInteraction(this);
    
            }
        }

        // turn to the thing I'm interacting with
        if (this.interactingWith){
            var worldPos = new Vector3();
            this.armature.getWorldPosition(worldPos);

            var interactionLoc = new Vector3();
            Interactable.objectForInteractable(this.interactingWith).getWorldPosition(interactionLoc);

            var ng = Math.atan2(interactionLoc.x - worldPos.x, interactionLoc.z - worldPos.z);
            var targetQuat = new Quaternion();
            targetQuat.setFromAxisAngle(UP, ng);

            Quaternion.slerp(
                this.armature.quaternion,
                targetQuat, 
                this.armature.quaternion,
                0.1
            );

        
            if (!this.wasInteracting && interactableFound){
                playerCam.zoomTo(new Vector3(0,0,0).subVectors(interactionLoc, worldPos))
            }

        } 

        
        if (this.wasInteracting && !this.interactingWith){
            playerCam.zoomTo(new Vector3(0,0,0))
        }

        this.wasInteracting = !!this.interactingWith;

        // don't let animation mixer adjust the head bone
        var oldHeadQuat = this.headBone.quaternion.clone();
        var oldAnimatedHeadQuat = this.animatedHeadBone.quaternion.clone();
        this.animationMixer.update(delta);
        this.headBone.quaternion.copy(oldHeadQuat);


        // move head to look at stuff
         {
            var worldPos = new Vector3();
            this.armature.getWorldPosition(worldPos);
            var objectPos = new Vector3();
            var closestDist = 15;
            var closeEnough = false;
            entities.scene.traverse(o=>{
                if (Interactable.isInteractable(o)){
                    o.getWorldPosition(objectPos);
                    var dist = objectPos.distanceTo(worldPos)
                    if ( dist < closestDist){
                        // TODO determine head euler angle first to look at stuff in FOV only
                        this.lookObject = o;
                        closestDist = dist;
                        closeEnough = true;
                    }
                }
            })

            if (closeEnough){
                var oldQuat = this.headBone.quaternion.clone();
                this.headBone.lookAt(this.lookObject.position);
                this.lookTargetQuat.copy(this.headBone.quaternion)
                this.headBone.quaternion.copy(oldQuat);

                // keep head more still by blending it with prev frame
                Quaternion.slerp(this.animatedHeadBone.quaternion.clone(), oldAnimatedHeadQuat, this.animatedHeadBone.quaternion, 0.5);
            } else {
                this.lookTargetQuat.set(0,0,0,0)
                this.lookTargetQuat.normalize()
            }

            this.lookTween = QuatTween(this.headBone, this.headBone.quaternion.clone(), this.lookTargetQuat, 0.3, 1.1)
            this.lookTween(delta)

        } // end head look

        // physics update
        physicsUpdate(this.armature, delta)

        
    }

}

export {Player}