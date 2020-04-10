
import {each, assign} from 'lodash'
import { Quaternion } from 'three';

/**
 * @class Interactable
 * @public {string} script
 * @public {Color} scriptColor
 * @public {string} scriptName
 */
class Interactable{

    /**
     * 
     * @param {Object3D} o3d 
     */
    constructor(o3d){
        if (o3d.userData.interactable){console.error('double init on interactable!'); return;}
        o3d.userData.interactable = this;
        this.scriptName = o3d.name;
        this._object3d = o3d;
        o3d.userData.update = this.update.bind(this)
        this.interactingWith = null;
        this.script = '';
        this.scriptColor = 0xffffff;
        this.initialRotation = o3d.quaternion.clone();
        this.turnToInteract = true;
    }

    startInteraction(player){
        this.interactingWith = player;
    }
    stopInteraction(player){
        this.interactingWith = null;
    }
    update(){
        // turn to face player if interacting
        if (this.interactingWith && this.turnToInteract){
            var oldQuat = this._object3d.quaternion.clone();
            this._object3d.lookAt(this.interactingWith.position)
            var newQuat = this._object3d.quaternion.clone();
            this._object3d.quaternion.copy(oldQuat);

            Quaternion.slerp(this._object3d.quaternion, newQuat, this._object3d.quaternion, 0.1);

        } else if (!this.interactingWith && this.turnToInteract) {
            Quaternion.slerp(this._object3d.quaternion, this.initialRotation, this._object3d.quaternion, 0.1);
        }

    }

}

Interactable.isInteractable = function(o){
    return !!o.userData.interactable
}

/**
 * @param {Object3d} o
 * @returns {Interactable}
 */
Interactable.interactableForObject = function(o){
    return o.userData.interactable
}

Interactable.objectForInteractable = function(i){
    return i._object3d;
}

// template stuff

var interactableData = [
    {scriptColor:0xffffff, objectName: 'boombox', scriptName: 'boombox', script: 'hello', turnToInteract: false},
    {scriptColor:0xff00ff, objectName: 'casette', scriptName: 'casette', script: 'I am a casette tape'}
]

// find matching objects in the scene and make them interactable

function interactivizeScene(scene){
    scene.traverse((o)=>{
        each(interactableData,(d)=>{
            if (o.name.toLowerCase().indexOf(d.objectName.toLowerCase()) > -1 ){
                // this is it
                var i = new Interactable(o);
                assign(i, d);
                // exit early on match
                return false;
            }
        })
    })
}

export {interactivizeScene, Interactable}