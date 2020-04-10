import { ShaderMaterial, Mesh, PlaneGeometry, MeshBasicMaterial, ShaderChunk, MeshToonMaterial } from "three"

// TODO make this look more WindWakery
function customToonMaterial(material){
    console.log(material)
    return new MeshToonMaterial({
        map: material.map,
        skinning:!!material.skinning,
        transparent:!!material.transparent,
        shininess: (1.0 - material.roughness)*15.0,
        specular: material.specular
    })
}


export {customToonMaterial}