
import {each, assign} from 'lodash'
import { Quaternion, NearestFilter, Vector3, Euler, MathUtils, DoubleSide } from 'three';
import { showDialog } from './dialog';
import { assets } from './assets';
import { UP } from './input';
import {querp, iquerp} from "./utils"
import { unlockOutfitByName, applyOutfit, getUnlockedOutfits, getCurrentOutfit } from './unlocks';

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
        this.initialRotationZ = new Euler().setFromQuaternion(o3d.quaternion).y;
        this.lookTargetRotationY = 0;
        this.turnToInteract = true;
        this.scriptOptions = null
        this.updateFunc = null;
        this.timer = 0
        this.interactionTimer = 0;
        this.interactingWithPositionWorld = new Vector3();
        this.positionWorld = new Vector3();
    }

    startInteraction(player){
        this.interactionTimer = 0;
        this.interactingWith = player.mesh;
        showDialog(this.scriptName, this.scriptColor, this.script, (typeof this.scriptOptions == 'function')?this.scriptOptions():this.scriptOptions)
            .then(dialogResult=>this.stopInteraction(player, dialogResult))
    }
    stopInteraction(player, dialogResult){
        this.interactionTimer = 0;
        if (this.onResult != null){
            this.onResult.call(this, dialogResult);
        }
        this.interactingWith = null;
        player.interactingWith = null;
    }
    update(delta){
        this.timer+= delta;
        this.interactionTimer+= delta;
        if (this.updateFunc != null){
            this.updateFunc.call(this, delta)
        }

        var interactionTimer01 = Math.min(this.interactionTimer*2, 1);
        // turn to face player if interacting
        if (this.interactingWith && this.turnToInteract){
            this.interactingWith.getWorldPosition(this.interactingWithPositionWorld);
            this._object3d.getWorldPosition(this.positionWorld);
            this.lookTargetRotationY = Math.atan2(this.interactingWithPositionWorld.x - this.positionWorld.x, this.interactingWithPositionWorld.z - this.positionWorld.z);
            this._object3d.quaternion.setFromAxisAngle(UP,iquerp(this.initialRotationZ,this.lookTargetRotationY, interactionTimer01));
        } else if (!this.interactingWith && this.turnToInteract) {
            this._object3d.quaternion.setFromAxisAngle(UP,iquerp(this.lookTargetRotationY,this.initialRotationZ, interactionTimer01))
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
    {scriptColor:'#ff44ff', objectName: 'boombox', scriptName: 'boombox', script: 'hello', turnToInteract: false},
    {scriptColor:'#44ff44', objectName: 'casette', scriptName: 'casette', script: 'I am a casette tape', scriptOptions:['No thanks.','Sure.']},
    {
        scriptName: 'Weather Duck',
        scriptColor:'#83e571',
        objectName: 'duk',
        script: 'I am the weather duck! \n I can give you accurate information about the weather at your location, and put on cute outfits depending on the weather. I was made with PIXI.js. Want to see?',
        scriptOptions:['maybe later','show me my weather','show me Hawaii'],
        timer:0,
        turnToInteract:false,
        updateFunc:function(delta){
            this._object3d.material.transparent = true;
            this._object3d.material.side = DoubleSide;
            this._object3d.material.alphaTest = 0.5;
            this._object3d.material.depthWrite = false;
            this._object3d.renderOrder = 1000;
            this._object3d.material.magFilter = NearestFilter;
            this.timer+= delta;
            this._object3d.material.map = (this.timer % 1 < 0.5) ? assets.textures.duk1 : assets.textures.duk2
        },
        onResult: function(result){
            if (result == 1){
                window.open('https://fenwick.pizza/weather-duck/index.html')
            } else if (result == 2){
                window.open('https://fenwick.pizza/weather-duck/index.html?location=19.705556,-155.085833')
            }
            unlockOutfitByName('poncho')
        }
    },
    {
        objectName:'wardrobe',
        scriptName:'',
        script:'Would you like to put on a different outfit?',
        turnToInteract:false,
        outfitNames:[],
        scriptOptions:function(){
            var outfits = getUnlockedOutfits().filter(o=>o.key != getCurrentOutfit().key)
            this.outfitNames = outfits.map(o=>o.name)
            var ret = outfits.map(o=>o.title)
            ret.unshift('no thanks')
            return ret;
        },
        onResult:function(resultIndex){
            if (resultIndex == 0){
                return;
            }
            var outfitName = this.outfitNames[resultIndex-1]
            applyOutfit(outfitName)
        }
    }
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