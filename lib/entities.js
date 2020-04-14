var assert = require('assert')

import { 
    MeshToonMaterial, 
    AnimationMixer, 
    HemisphereLight, 
    HemisphereLightHelper, 
    DirectionalLight, 
    DirectionalLightHelper, 
    Object3D,
    MeshBasicMaterial,
    MeshPhongMaterial,
    AmbientLight,
    Vector3,
    Color,
    Group,
    LinearMipmapLinearFilter,
    NearestFilter
} from "three";
import { waterMaterial } from "./waterShader";
import { customToonMaterial } from "./ToonShader";
import { interactivizeScene } from "./interactables";
import {Player} from "./player"

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
    var water = null;


    gltf.scene.traverse(o=>{
        if (o.name.toLowerCase() == 'armature'){character = o}
        if (o.name.toLowerCase() == 'clothes'){clothes = o}
        if (o.name.toLowerCase() == 'eyes'){eyes = o}


        if (o.name.indexOf('water') > -1){
            water = o;
            o.material = waterMaterial()
        }
        else if (o.material && o.name){// pbr material from export, make it toony
            o.material = customToonMaterial(o.material);
            // o.material.map.minFilter = NearestFilter
            if (o.material.map){
                o.material.map.magFilter = NearestFilter

            }
        }

        if (o.name.toLowerCase().indexOf('env_') > -1){
            o.traverse(m=>m.receiveShadow = true);
        }
        else if (o.name.toLowerCase() == 'armature'){
            o.traverse(m=>m.castShadow = true);
            // o.traverse(m=>m.receiveShadow = true);
        }
        else if (o.name.indexOf('prop_') > -1){
            o.castShadow = true
            o.receiveShadow = true;
        }

        

    })

    var player = new Player(character, gltf.scene, gltf.animations)

    var playerFollower = new Group();
    playerFollower.userData.update = (function(){
        character.getWorldPosition(playerFollower.position);
        // character.getWorldQuaternion(playerFollower.quaternion);
    }).bind(playerFollower);

    var dampedPlayerFollower = new Group();
    dampedPlayerFollower.userData.update = (function(){
        character.getWorldPosition(playerFollower.position);
        character.getWorldQuaternion(playerFollower.quaternion);
    }).bind(dampedPlayerFollower);

    scene.add(playerFollower)
    scene.add(dampedPlayerFollower)

    var ret = {
        scene,
        character,
        clothes, 
        eyes,
        player,
        water,
        playerFollower,
        dampedPlayerFollower
    }
    Object.keys(ret).forEach(k=>assert(ret[k]))
    interactivizeScene(scene);

    _entities = ret;

    return ret;
}


function getOutdoorLighting(){
        
    // var hemiLight = new HemisphereLight( 0xffffff, 0xffffff, 0.0 );
    // hemiLight.color.setHSL( 0.6, 0, 0 );
    // hemiLight.groundColor.setHSL( 0.095, 0.7, 0.75 );
    // hemiLight.position.set( 0, 50, 0 );

    // var hemiLightHelper = new HemisphereLightHelper(hemiLight);

    // dir light

    var dirLight = new DirectionalLight( 0xffffff, 2.0 );
    dirLight.color.setHSL( 0.1, 1, 0.75 );
    var dirLightOffset = new Vector3(0.3, 1, 0.5)
    dirLightOffset.multiplyScalar( 50 );
    dirLight.position.copy(dirLightOffset);

    dirLight.castShadow = true;

    dirLight.shadow.mapSize.width = dirLight.shadow.mapSize.height = 1024;

    var d = 20;

    dirLight.shadow.camera.left = - d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = - d;

    dirLight.shadow.camera.far = 3500;
    dirLight.shadow.bias = - 0.0001;
    dirLight.shadow.radius = 2;

    dirLight.userData.update = (function(){
        dirLight.position.copy(entities.playerFollower.position);
        dirLight.position.add(dirLightOffset)
        dirLight.target.position.copy(entities.playerFollower.position)
        dirLight.target.updateMatrixWorld()
        dirLightHeper.update()
    }).bind(dirLight)

    var dirLightHeper = new DirectionalLightHelper( dirLight, 10 );
    var ambientLight = new AmbientLight(0xddeeff, 1.0);

    return [/* hemiLight, hemiLightHelper ,*/ dirLight, dirLightHeper, ambientLight]

}


export {getOutdoorLighting, getEntity, readGltf, entities }