
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

vec4 camPositionWorld = vec4(cameraPosition.xyz, 1.0);

position = modelMatrix * position;

float dist = length(camPositionWorld - position);
float yOffset = (dist) * (dist) * -0.005;
position +=  vec4(0.0, yOffset, 0.0, 0.0);
vec4 mvPosition = viewMatrix * position;
gl_Position = projectionMatrix * mvPosition;

`

function globeDistortNewShader(mat){
    var oldBeforeCompile = mat.onBeforeCompile;
    mat.onBeforeCompile = function(s){

        // TODO this needs to move back to begin_vertex so it happens before skinning???
        s.vertexShader = s.vertexShader.replace('#include <project_vertex>',`
        ${snippet}
        `)
        // call old beforeCompile
        if(oldBeforeCompile){oldBeforeCompile(s)}
    }
}

export {globeDistortNewShader, snippet}