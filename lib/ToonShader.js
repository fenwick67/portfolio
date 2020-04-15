import { ShaderMaterial, Mesh, PlaneGeometry, MeshBasicMaterial, ShaderChunk, MeshToonMaterial, MeshPhongMaterial, MeshLambertMaterial } from "three"
import {globeDistortNewShader} from './globeDistortion'
// TODO make this look more WindWakery
function customToonMaterial(material){
    // console.log(material)
    var mat =  new MeshLambertMaterial({
        map: material.map,
        skinning:!!material.skinning,
        transparent:!!material.transparent,
        shininess: (1.0 - material.roughness)*15.0,
        specular: material.specular
    })
    // return new MeshPhongMaterial({
    //         map: material.map,
    //         skinning:!!material.skinning,
    //         transparent:!!material.transparent,
    //         shininess: (1.0 - material.roughness)*15.0,
    //         specular: material.specular,
    //         aoMap: material.aoMap
    //     })

    
    globeDistortNewShader(mat);

    return mat
}


export {customToonMaterial}