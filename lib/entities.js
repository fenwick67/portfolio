var assert = require('assert')
import {makeUpdatable} from './updatable'

import { 
    DirectionalLight, 
    DirectionalLightHelper,
    MeshBasicMaterial,
    AmbientLight,
    Vector3,
    Group,
    BoxGeometry,
    Mesh,
} from "three";
import { waterMaterial, streamMaterial } from "./waterShader";
import { customToonMaterial } from "./ToonShader";
import { interactivizeScene } from "./interactables";
import {Player} from "./player"
import {windwakerMaterial} from './windwakerShader'
import { SpringFollower, makeJiggle } from './springFollower';
import { UP } from './input';

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
    var body = null;
    var scene = gltf.scene;
    var water = null;
    var whirlygig= null;
    var sock = null;
    var dollyObjects = [];

    var streams = []
    var physfloors = []
    var physwalls = []

    gltf.scene.traverse(o=>{
        if (o.name.toLowerCase() == 'armature'){character = o}
        if (o.material && o.material.name.toLowerCase().indexOf('cloth') > -1){clothes = o}
        if (o.material && o.material.name.toLowerCase().indexOf('eyes') > -1){eyes = o}
        if (o.material && o.material.name.toLowerCase().indexOf('body') > -1){body = o}
        if (o.name.toLowerCase().indexOf('sock') > -1){sock = o}
        if (o.name.toLowerCase().indexOf('whirlygig') > -1){whirlygig = o}
        if (o.name.toLowerCase().indexOf('physfloor') > -1){physfloors.push(o);physwalls.push(o)};
        if (o.name.toLowerCase().indexOf('physwall') > -1){physwalls.push(o)}
        if (o.name.toLowerCase().indexOf("dolly") > -1){dollyObjects.push(o);}
        // double-side for leafs
        var invisibleMaterial = new MeshBasicMaterial({visible: false});
        if (o.name.toLowerCase().indexOf('invis') > -1 && o.material){
            o.material = invisibleMaterial
        }


        if (o.name.indexOf('water') > -1){
            water = o;
            o.material = waterMaterial()
        }
        else if (o.material && o.name && o.material.map){// pbr material from export, make it toony
            o.material = customToonMaterial(o.material);
            o.frustumCulled = false
            // if (o.material.map){
            //     // o.material.map.magFilter = NearestFilter
            //     // o.material.map.minFilter = NearestFilter
            // }
        }

        if (o.name.toLowerCase().indexOf('env_') > -1){
            o.traverse(m=>{
                m.receiveShadow = true;
            });
        }
        // make cliff filter better
        if (o.name.toLowerCase().indexOf('env_ground') > -1){
            // o.material.map = new TextureLoader().load('grass.png')
            // o.material.map.wrapS=RepeatWrapping
            // o.material.map.wrapT=RepeatWrapping
   
            o.receiveShadow = true
            // o.material.lightMap =  new TextureLoader().load('grass_baked.png')
            // o.material.lightMap.flipY = false
            // o.material.lightMapIntensity = 20
            // o.material.color.set(0x111111)
            // o.material.aoMap.wrapS=RepeatWrapping
            // o.material.aoMap.wrapT=RepeatWrapping
            o.traverse(mesh=>{
                if (mesh.material?.name.toString().indexOf("water") > -1){
                    mesh.material = waterMaterial()
                    mesh.receiveShadow = false;
                }
                if (mesh.material?.name.toString().indexOf("stream") > -1){
                    mesh.material = streamMaterial(4.0)
                    mesh.receiveShadow = false;
                    streams.push(mesh)
                }
            })

        }

        else if (o.name.toLowerCase() == 'armature'){
            o.traverse(m=>m.castShadow = true);
        }
        else if (o.name.indexOf('prop_') > -1){
            o.castShadow = true
            o.receiveShadow = true;
        }

        if (o.material && o.material.name == "water"){
            o.material = waterMaterial()
            o.receiveShadow = false;
        }
        

    })

    // windwakery shader on player
    gltf.scene.traverse(o=>{
        if (o.name.toLowerCase() == 'armature'){
            o.traverse(m=>{
                if (m.material){
                    var mat = windwakerMaterial(m.material);
                    m.material = mat;
                }
            });
        }
    })



    var player = new Player(character, gltf.scene, gltf.animations)


    // simple updatables go here
    var playerFollower = new Group();
    makeUpdatable(playerFollower,function(){
        character.getWorldPosition(playerFollower.position);
        // character.getWorldQuaternion(playerFollower.quaternion);
    })

    var boxedPlayerFollower = new Group();
    var bX = 0.2;
    var bZ = 1;
    var bY = 0;
    makeUpdatable(boxedPlayerFollower,function(delta){
        var dt = Math.min(1,delta * 10);
        var dX = this.position.x - playerFollower.position.x;
        var dZ = this.position.z - playerFollower.position.z;
        var dY = this.position.y - playerFollower.position.y;

        // where moveZ states what the required motion is to get to the box
        var moveZ = 0;
        if (dZ > bZ){
            moveZ = bZ - dZ;
        }else if (dZ < -1* bZ){
            moveZ = -bZ -dZ;
        }
        this.position.z += moveZ * dt;

        var moveX = 0;
        if (dX > bX){
            moveX = bX - dX;
        }else if (dX < -1* bX){
            moveX = -bX -dX;
        }
        this.position.x += moveX * dt;

        var moveY = 0;
        if (dY > bY){
            moveY = bY - dY;
        }else if (dY < -1* bY){
            moveY = -bY -dY;
        }
        this.position.y += moveY * dt;

    });

    scene.add(playerFollower)
    scene.add(boxedPlayerFollower)

    makeUpdatable(whirlygig,function(delta){
        this.rotateY(delta * 10);
    })

    makeUpdatable(sock,function(delta){
        if(!this.userData.t){this.userData.t = 0;}
        this.userData.t+= delta;        
        this.setRotationFromAxisAngle(UP, Math.sin(this.userData.t)*0.5)
        this.rotateZ(-Math.PI/2)
    })

    // spring bone demo
    var tailMesh = new Mesh(new BoxGeometry(1,1,1), new MeshBasicMaterial({color:0xff0000, wireframe: true}))
    var tailMesh2 = new Mesh(new BoxGeometry(1,1,1), new MeshBasicMaterial({color:0x00ff00, wireframe: true}))
    var tailBone = scene.getObjectByName('tail2');
    var follower = new SpringFollower(tailBone, new Vector3(0,0,1));
    var follower2 = new SpringFollower(tailBone, new Vector3(1,1,1));
    follower.object.add(tailMesh);
    follower2.object.add(tailMesh2);
    tailBone.add(follower.object);
    var tailBoneMesh = new Mesh(new BoxGeometry(1,1,1), new MeshBasicMaterial({color:0x0000ff, wireframe: true}))
    tailBone.add(tailBoneMesh)
    scene.add(follower2.object);
    makeJiggle(scene.getObjectByName('mouth'), new Vector3(1,1,1), new Vector3(0,1,0), 30)

    var ret = {
        scene,
        character,
        player,
        eyes,
        clothes,
        body,
        water,
        playerFollower,
        boxedPlayerFollower,
        streams,
        physfloors,
        physwalls,
        dollyObjects,
        whirlygig,
        sock
    }
    Object.keys(ret).forEach(k=>assert(ret[k], 'missing key '+k))
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
    var dirLightOffset = new Vector3(0.01, 1, 0)
    dirLightOffset.multiplyScalar( 50 );
    dirLight.position.copy(dirLightOffset);

    dirLight.castShadow = true;

    dirLight.shadow.mapSize.width = dirLight.shadow.mapSize.height = 512;

    var d = 30;

    dirLight.shadow.camera.left = - d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = - d;

    dirLight.shadow.camera.far = 3500;
    dirLight.shadow.bias = - 0.0001;
    dirLight.shadow.radius = 0;

    makeUpdatable(dirLight,function(){
        dirLight.position.copy(entities.playerFollower.position);
        dirLight.position.add(dirLightOffset)
        dirLight.target.position.copy(entities.playerFollower.position)
        dirLight.target.updateMatrixWorld()
        dirLightHeper.update()
    })

    var dirLightHeper = new DirectionalLightHelper( dirLight, 10 );
    var ambientLight = new AmbientLight(0xddeeff, 1.0);

    return [/* hemiLight, hemiLightHelper ,*/ dirLight, /*dirLightHeper*/, ambientLight]

}


export {getOutdoorLighting, getEntity, readGltf, entities }