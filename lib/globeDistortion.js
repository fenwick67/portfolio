import { Material, NormalMapTypes, Vector3, Texture, TextureLoader } from "three";



var snippet = `
// // this kinda worked: 
// #define FAC_X -0.0020
// #define FAC_Z -0.0020

// vec4 worldSpacePosition = vec4( transformed, 1.0 );
// #ifdef USE_INSTANCING
//     worldSpacePosition = instanceMatrix * mvPosition;
// #endif
// vec3 worldSpacePositionFromCamera = worldSpacePosition.xyz - cameraPosition;
// worldSpacePosition.y = worldSpacePosition.y+  FAC_Z*worldSpacePositionFromCamera.z*worldSpacePositionFromCamera.z;
// worldSpacePosition.y = worldSpacePosition.y+  FAC_X*worldSpacePositionFromCamera.x*worldSpacePositionFromCamera.x;

// vec4 mvPosition = modelViewMatrix * worldSpacePosition;
// gl_Position = projectionMatrix * mvPosition;


vec4 position = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
    position = instanceMatrix * position;
#endif


// TODO! CAMERAPOSITION ISN'T ALWAYS AVAILABLE, but it's always defined! MeshLambertMaterial doesn't have it?
// compare https://github.com/mrdoob/three.js/blob/cf065b67ccbd0991c577e97a0c7c04dfe2cbd33e/src/renderers/shaders/ShaderLib/meshphong_vert.glsl.js
// with https://github.com/mrdoob/three.js/blob/cf065b67ccbd0991c577e97a0c7c04dfe2cbd33e/src/renderers/shaders/ShaderLib/meshlambert_vert.glsl.js
// also see https://github.com/mrdoob/three.js/blob/3c13d929f8d9a02c89f010a487e73ff0e57437c4/src/renderers/WebGLRenderer.js#L1728
vec4 camPositionWorld = vec4(cameraPosition.xyz, 1.0);

position = modelMatrix * position;

float dist = length(position.xyz - camPositionWorld.xyz);
float yOffset = dist * dist * -0.005;
position +=  vec4(0.0, yOffset, 0.0, 0.0);
vec4 mvPosition = viewMatrix * position;
gl_Position = projectionMatrix * mvPosition;

`


/**
 * 
 * @param {Material} mat 
 */
function globeDistortNewShader(mat){
    var oldBeforeCompile = mat.onBeforeCompile;

    mat.onBeforeCompile = function(s){
        s.uniforms.cameraPosition = {value: new Vector3()}
        s.vertexShader = s.vertexShader.replace('#include <project_vertex>',`
        ${snippet}
        `)
        // call old beforeCompile
        if(oldBeforeCompile){oldBeforeCompile(s)}
    }

}

export {globeDistortNewShader, snippet}