// use this to load all the assets for the app

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import {readGltf} from "./entities"

function loadAll(callback){

    var spent = false;
    function _cb(){
        if(spent){return}
        spent = true;
        callback(...arguments);
    }

    new GLTFLoader().load('scene.glb',function(gltf){
        console.info('gltf loaded')
        readGltf(gltf);
        callback(null);
    }, undefined, _cb)

}


export {loadAll}