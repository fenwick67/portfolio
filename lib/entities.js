var assert = require('assert')

import { 
    MeshToonMaterial, 
    AnimationMixer, 
    HemisphereLight, 
    HemisphereLightHelper, 
    DirectionalLight, 
    DirectionalLightHelper 
} from "three";
import { waterMaterial } from "./waterShader";

var _entities = {}
var entities = new Proxy({}, 
    {
        get: function(obj, prop){
            if (_entities[prop]){return _entities[prop]}
            console.error('no entity named: '+prop)
        }
    }
);


// load entities from the gltf
function getEntity(name){
    return entities[name];
}

// load and assign everything from GLTF into entity list
function readGltf(gltf){
    var character = null;
    var clothes = null;
    var eyes = null;
    var scene = gltf.scene;


    gltf.scene.traverse(o=>{
        if (o.name.toLowerCase() == 'armature'){character = o}
        if (o.name.toLowerCase() == 'clothes'){clothes = o}
        if (o.name.toLowerCase() == 'eyes'){eyes = o}

        if (o.material && o.name){// pbr material from export, make it toony
            o.material = new MeshToonMaterial({
                map: o.material.map,
                shininess: 15,
                // specular: 0,
                transparent: !!o.material.transparent,
                skinning: !!o.material.skinning
            });
        }

        if (o.name.toLowerCase() == 'plane'){
            o.receiveShadow = true;
        }
        else if (o.name.toLowerCase() == "armature"){
            o.traverse(function(m){
                if (m.material){m.castShadow = true; m.receiveShadow = true;}
            })
        }
        else if (o.name.toLowerCase() == "water"){
            o.traverse(function(m){
                if (m.material){m.material = waterMaterial}
            })
        }

    })
    
    var playerMixer = new AnimationMixer( gltf.scene );
    var playerWalk = playerMixer.clipAction( gltf.animations.find(a=>a.name == "walk") )
    var playerIdle = playerMixer.clipAction( gltf.animations.find(a=>a.name == "idle") )
    var playerRun = playerMixer.clipAction( gltf.animations.find(a=>a.name == "run") )
    playerWalk.play();
    playerIdle.play();
    playerRun.play();


    var player = {
        setMoveAnimationForSpeed:function(speed){
            var spd = Math.max(Math.min(Math.abs(speed), 2), 0)

            if (spd <= 1){
                playerIdle.setEffectiveWeight(1 - spd)
                playerWalk.setEffectiveWeight(spd)
                playerRun.setEffectiveWeight(0)
                playerMixer.timeScale = 0.5;
            } else if (spd > 1){
                playerIdle.setEffectiveWeight(0)
                playerWalk.setEffectiveWeight(2 - spd)
                playerRun.setEffectiveWeight(spd - 1)
                playerMixer.timeScale = spd / 2;
            }
        },
        armature: character,
        initialPosition: character.position
    }

    var ret = {
        scene,
        character,
        clothes, 
        eyes,
        playerMixer,
        playerWalk,
        playerIdle,
        playerRun,
        player
    }
    Object.keys(ret).forEach(k=>assert(ret[k]))

    _entities = ret;

    return ret;
}


function getOutdoorLighting(){
        
    var hemiLight = new HemisphereLight( 0xffffff, 0xffffff, 0.9 );
    hemiLight.color.setHSL( 0.6, 1, 0.6 );
    hemiLight.groundColor.setHSL( 0.095, 0.7, 0.75 );
    hemiLight.position.set( 0, 50, 0 );

    var hemiLightHelper = new HemisphereLightHelper(hemiLight);

    // dir light

    var dirLight = new DirectionalLight( 0xffffff, 0.7 );
    dirLight.color.setHSL( 0.1, 1, 0.75 );
    dirLight.position.set( -0.1, 1.75, 1 );
    dirLight.position.multiplyScalar( 50 );

    dirLight.castShadow = true;

    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;

    var d = 200;

    dirLight.shadow.camera.left = - d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = - d;

    dirLight.shadow.camera.far = 3500;
    dirLight.shadow.bias = - 0.0001;
    dirLight.shadow.radius = 5;

    var dirLightHeper = new DirectionalLightHelper( dirLight, 10 );

    return [hemiLight, hemiLightHelper, dirLight, dirLightHeper]

}

export {getOutdoorLighting, getEntity, readGltf, entities }