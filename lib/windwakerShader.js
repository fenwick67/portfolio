import { ShaderMaterial, Mesh, PlaneGeometry, ImageUtils, Color, MeshBasicMaterial, MeshLambertMaterial, Texture, TextureLoader, MeshToonMaterial, MeshPhongMaterial } from "three"
import {UniformsLib} from 'three/src/renderers/shaders/UniformsLib'
import {mergeUniforms} from 'three/src/renderers/shaders/UniformsUtils'
import {globeDistortNewShader} from './globeDistortion'

function windwakerMaterial(inputMat){

    if (inputMat.isWindwakerMaterial){return inputMat}
    
    var mat = new MeshLambertMaterial({
        map: inputMat.map,
        skinning:!!inputMat.skinning,
        transparent:!!inputMat.transparent,
        morphTargets:true,
        name:inputMat.name
    })

    mat.onBeforeCompile = function(s){
        // console.log(s.fragmentShader);
        s.fragmentShader = s.fragmentShader.replace('#include <aomap_fragment>',`
        
        // THIS IS SO CHEATING! OH WELL YOLO
        vec3 whicheverVLight;

        #ifdef DOUBLE_SIDED
            whicheverVLight = ( gl_FrontFacing ) ? vLightFront : vLightBack;
        #else
            whicheverVLight = vLightFront;
        #endif


        // these are hard coded. Could be better.
        float lightOn = smoothstep(4.0,4.1,length(whicheverVLight));
        // you can mix to whicheverVLight * 1.8 forsome softness, otherwise I'll do this
        // vec3 normed = normalize(whicheverVLight);

        // if (normed.r <= 0.0 || normed.g <= 0.0 || normed.b <= 0.0){
        //     normed = vec3(1000000000000000.0);
        // }
        vec3 light = mix(vec3(0.0,0.0,0.0), whicheverVLight * 1.8, lightOn);

        reflectedLight.directDiffuse = light * BRDF_Diffuse_Lambert( diffuseColor.rgb ) * getShadowMask();
        #include <aomap_fragment>
        `)
        // console.log('new:');
        // console.log(s.fragmentShader)
    }

    globeDistortNewShader(mat);
    mat.isWindwakerMaterial = true;

    return mat
}


export {windwakerMaterial}