import {Object3D, AnimationMixer, Vector3} from 'three'
import {input, UP, ZERO} from './input'
import {entities} from "./entities"
import {Interactable} from "./interactables"
// define Player class and handle movement etc

class Player{

    /**
     * 
     * @param {Object3D} armature 
     */
    constructor(armature, animationRoot, animations){
        {
            this.armature = armature;
            this.initialPosition = armature.position;
            this.animationRoot = animationRoot;
            this.animationMixer = new AnimationMixer( animationRoot );
            this.walk = this.animationMixer.clipAction( animations.find(a=>a.name == "walk") )
            this.idle = this.animationMixer.clipAction( animations.find(a=>a.name == "idle") )
            this.run = this.animationMixer.clipAction( animations.find(a=>a.name == "run") )
            this.walk.play();
            this.idle.play();
            this.run.play();
            armature.userData.update = this.update.bind(this);
            this.setMoveAnimationForSpeed(0)
            this.garbageVec3 = new Vector3();
            this.garbageVec32 = new Vector3();
            this.movementSc = new Vector3(0.25, 0, -0.25);
            this.velocity = new Vector3();
            this.interactingWith = null;
        }
    }

    setMoveAnimationForSpeed(speed){
        var spd = Math.max(Math.min(Math.abs(speed), 2), 0)

        if (spd <= 1){
            this.idle.setEffectiveWeight(1 - spd)
            this.walk.setEffectiveWeight(spd)
            this.run.setEffectiveWeight(0)
            this.animationMixer.timeScale = 0.5;
        } else if (spd > 1){
            this.idle.setEffectiveWeight(0)
            this.walk.setEffectiveWeight(2 - spd)
            this.run.setEffectiveWeight(spd - 1)
            this.animationMixer.timeScale = spd / 2;
        }
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
        this.armature.position.add(this.velocity);


        var interactionDistance = 5;

        // find interactable I can talk to
        if (!this.interactingWith && input.buttons.action && !input.buttonsLastFrame.action){
            console.log('0_0')
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
                console.log(this.interactingWith.scriptName,"says",this.interactingWith.script)
                this.interactingWith.startInteraction(this.armature);
            }
        }

        // placeholder leave interaction
        else if (this.interactingWith && input.buttons.action && !input.buttonsLastFrame.action){
            this.interactingWith.stopInteraction(this.armature)
            this.interactingWith = null;
        }

        if (this.interactingWith){
            var worldPos = new Vector3();
            this.armature.getWorldPosition(worldPos);

            var interactionLoc = new Vector3();
            Interactable.objectForInteractable(this.interactingWith).getWorldPosition(interactionLoc);

            var ng = Math.atan2(interactionLoc.x - worldPos.x, interactionLoc.z - worldPos.z);
            this.armature.setRotationFromAxisAngle(UP, ng);
        }

        
        this.animationMixer.update(delta);
    }

}

export {Player}