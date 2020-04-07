import {assert} from "assert"
import { 
    MeshToonMaterial, 
    AnimationMixer, 
    HemisphereLight, 
    HemisphereLightHelper, 
    DirectionalLight, 
    DirectionalLightHelper 
} from "three";

var entities_singleton = null;

// load entities from the gltf
function getEntity(name){
    assert(entities_singleton[name])
    return entities_singleton[name];
}


function loadGltf(gltf){
    var character = null;
    var clothes = null;
    var eyes = null;

    gltf.scene.traverse(o=>{
        if (o.name.toLowerCase() == 'armature'){character = o}
        if (o.name.toLowerCase() == 'clothes'){clothes = o}
        if (o.name.toLowerCase() == 'eyes'){eyes = o}

        if (o.material && o.name){// pbr material from export
            o.material = new MeshToonMaterial({
                map: o.material.map,
                shininess: 15,
                // specular: 0,
                transparent: !!o.material.transparent,
                skinning: !!o.material.skinning
            });
        }

    })
    
    var playerMixer = mixer = new AnimationMixer( gltf.scene );
    var playerWalk = mixer.clipAction( gltf.animations.find(a=>a.name == "walk") )
    var playerIdle = mixer.clipAction( gltf.animations.find(a=>a.name == "idle") )

    var ret = {
        character,
        clothes, 
        eyes,
        walkAnim,
        idleAnim,
        playerMixer,
        playerWalk,
        playerIdle
    }
    Object.keys(ret).forEach(k=>assert(ret[k]))

    entities_singleton = ret;

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

export {getOutdoorLighting, getEntity, loadGltf }