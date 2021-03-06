import { ShaderMaterial, Mesh, Material, PlaneGeometry, MeshBasicMaterial, ShaderChunk, MeshToonMaterial, MeshPhongMaterial, MeshLambertMaterial, NearestFilter } from "three"
import {globeDistortNewShader} from './globeDistortion'
// TODO make this look more WindWakery

/**
 * 
 * @param {Material} material 
 */
function customToonMaterial(material){

    if (material.isCustomToonMaterial){return material}
    // console.log(material)
    var mat =  new MeshLambertMaterial({
        map: material.map,
        skinning:!!material.skinning,
        transparent:!!material.transparent,
        side: material.side,
        color:material.color,
        // shininess: (1.0 - material.roughness)*15.0,
        // specular: material.specular,
        name:material.name
    })
    // return new MeshPhongMaterial({
    //         map: material.map,
    //         skinning:!!material.skinning,
    //         transparent:!!material.transparent,
    //         shininess: (1.0 - material.roughness)*15.0,
    //         specular: material.specular,
    //         aoMap: material.aoMap
    //     })

    if (mat.map){
        mat.map.magFilter = NearestFilter
    }

    
    globeDistortNewShader(mat);

    mat.isCustomToonMaterial = true;

    return mat
}


export {customToonMaterial}