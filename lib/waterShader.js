import { ShaderMaterial, Mesh, PlaneGeometry, Side, DoubleSide, UniformsUtils, UniformsLib, ShaderChunk } from "three"
import {distortSnippet} from './globeDistortion'
// demo from https://github.com/mrdoob/three.js/blob/master/examples/webgl_shader.html
const frag = `

varying vec2 vUv;
uniform float time;
uniform float uCurrentSpeed;

#define iTime time*0.999
#define fragColor gl_FragColor

vec4 BLUE = vec4(0.1, 0.3, 1.0, 1.0);
vec4 WHITE = vec4(1.0, 1.0, 1.0, 1.0);
vec4 TRANSPARENT = vec4(0.5, 1.0, 1.0, 0.0);
#define STEPS 15.0

#define pi 3.14159
#define pi2 2.0*pi

// scale is length of the waves.  1 / power of 2
#define scale 1.0
// amount is the deflection amount
#define amount 10.0
// speed 
#define speed 0.1

${ShaderChunk.common}
${ShaderChunk.packing}
${ShaderChunk.fog_pars_fragment}
${ShaderChunk.bsdfs}
${ShaderChunk.lights_pars_begin}
${ShaderChunk.shadowmap_pars_fragment}
${ShaderChunk.shadowmask_pars_fragment}

// sine but goes from 0 to 1 on interval 0..1
float sin01(float n){
    return sin(n*3.14159*2.0)/2.0 + 0.5;
}


// swoosy repeating function
float swoos01(float n){
    return sin01(sin01(n*5.0)) * 0.5 + sin01(n * 3.0 + 0.432) * 0.5;
}

// returns looping function from 0..1
// phase is 0..1 as well
float sloop (int freqMult, float phase, float t){
	return sin01( float(freqMult) * (phase+t) )*2.0 - 1.0;
}


vec2 waveCoords(in vec2 uv){
    float t = speed * iTime;
	return vec2(
        uv.x
        	+ .0073*sloop(8, 0.3, t+uv.x)
       		+ .0011*sloop(4, 0.6, t+uv.x)
        ,
        uv.y 
        	+ .0073*sloop(4, 0.3, t+uv.y)
       		+ .0011*sloop(2, 0.6, t+uv.y)
    );
}

float round(float n){
    return floor(n + 0.5);
}

// step only on the number (TODO make non-branching)
float stamp(float n, float threshold, float w, float theta){
    float wHigh = w * (1.0 + theta);
    float wLow = w * (1.0 - theta);
    return smoothstep(threshold - wHigh, threshold - wLow, n) * (1.0 - smoothstep(threshold + wLow, threshold + wHigh, n));   
}

void main(void) {
    vec3 outgoingLight = vec3(0.0);
    vec2 uv = vec2(vUv.x, vUv.y);// uv.y is the end
    //vec2 uv = fragCoord/iResolution.xy;


    // this is really the screen-space scale of the texture coordinate space
    float pxSize = max(
        length(vec2(dFdx(uv.y), dFdy(uv.y))),
        length(vec2(dFdx(uv.x), dFdy(uv.x)))
    );
    
    uv = waveCoords(waveCoords(uv));// add a little bit o time

    float rampX = swoos01(uv.x + 10.0 + sin01(iTime*0.01)*0.1)*0.5 + swoos01(uv.y/5.0 + iTime*0.01)*0.5 - 0.5*sin01(sin01(uv.x)*sin(iTime* 0.2) + iTime * 0.1);
    float rampY = (uv.y - sin01(iTime/4.0) * 0.05);

    float roundAmnt = round( rampY * STEPS + rampX )/STEPS;
    roundAmnt = min(roundAmnt, 1.0);
    if (uCurrentSpeed < 0.1){
        fragColor = mix(WHITE, BLUE, uv.y);
    } else {
        fragColor = mix(WHITE, BLUE, 0.8);
    }

    float lineSize = 0.05;
    fragColor = mix(fragColor,
        WHITE,//                                                      VV use pixel size to blur lines (i.e. fake anisotropic filtering)
        stamp(fract( rampX + rampY* STEPS + uCurrentSpeed * iTime), 0.5 - lineSize, lineSize, 10.0*pxSize / lineSize)
    );
    // transparency
    if (uCurrentSpeed < 0.1){
        fragColor = mix(fragColor, TRANSPARENT, pow(1.0 - roundAmnt, 8.0));
    } else {
        fragColor = mix(fragColor, TRANSPARENT, 0.1);
    }

    #include <tonemapping_fragment>
    ${ShaderChunk[ "fog_fragment" ]}
}


`

const vert = `
varying vec2 vUv;

${ShaderChunk.fog_pars_vertex}
${ShaderChunk.shadowmap_pars_vertex}

void main()
{
    vUv = uv;

    
    ${ShaderChunk.begin_vertex}
    ${ShaderChunk.project_vertex}
    ${ShaderChunk.worldpos_vertex}
    ${ShaderChunk.fog_vertex}

}
`


var uniforms = UniformsUtils.merge([
    UniformsLib.fog,
    // UniformsLib.lights,
    {time: {value: 1.0}, uCurrentSpeed: {value: 0}}
]);

var mat = new ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
    extensions:{derivatives:true},
    fog:true
})
mat.side = DoubleSide
function waterMaterial(){
    return mat
}

function streamMaterial(speed){
    var unis = UniformsUtils.merge([
        // UniformsLib.lights,
        UniformsLib.fog,
        {time: {value: 1.0}, uCurrentSpeed: {value: Math.max(speed||0.2, 0.2)}}
    ]);

    var mat = new ShaderMaterial({
        uniforms: unis,
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        extensions:{derivatives:true},
        fog:true
    })
    mat.side = DoubleSide;
    return mat
}

export {waterMaterial, streamMaterial}