import { Material, NormalMapTypes, Vector3, Texture, TextureLoader } from "three";

var distortFacX = '0.03'
var distortFacZ = '0.03'

var snippet = `

vec4 position = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
    position = instanceMatrix * position;
#endif

// CAMERAPOSITION ISN'T ALWAYS AVAILABLE, but it's always defined! MeshLambertMaterial doesn't have it?
// compare https://github.com/mrdoob/three.js/blob/cf065b67ccbd0991c577e97a0c7c04dfe2cbd33e/src/renderers/shaders/ShaderLib/meshphong_vert.glsl.js
// with https://github.com/mrdoob/three.js/blob/cf065b67ccbd0991c577e97a0c7c04dfe2cbd33e/src/renderers/shaders/ShaderLib/meshlambert_vert.glsl.js
// also see https://github.com/mrdoob/three.js/blob/3c13d929f8d9a02c89f010a487e73ff0e57437c4/src/renderers/WebGLRenderer.js#L1728
// vec4 camPositionWorld = vec4(cameraPosition.xyz, 1.0);

vec4 mvPosition = viewMatrix * modelMatrix * position;
float dist = length(vec2(${distortFacX} * mvPosition.x, ${distortFacZ} * mvPosition.z));
float yOffset = -pow(abs(dist),2.0);
mvPosition.y += yOffset;
gl_Position = projectionMatrix * mvPosition;

`

var distortSnippet = `
vec4 mvPosition = viewMatrix * modelMatrix * vec4(position,1.0);
float dist = length(vec2(${distortFacX} * mvPosition.x, ${distortFacZ} * mvPosition.z));
float yOffset = -pow(abs(dist),2.0);
mvPosition.y += yOffset;
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

export {globeDistortNewShader, distortSnippet}