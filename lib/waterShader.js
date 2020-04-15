import { ShaderMaterial, Mesh, PlaneGeometry } from "three"
import {distortSnippet} from './globeDistortion'
// demo from https://github.com/mrdoob/three.js/blob/master/examples/webgl_shader.html
const frag = `

varying vec2 vUv;
uniform float time;

#define iTime time*0.7
#define fragColor gl_FragColor

vec4 BLUE = vec4(0.1, 0.3, 1.0, 1.0);
vec4 WHITE = vec4(1.0, 1.0, 1.0, 1.0);
vec4 TRANSPARENT = vec4(0.5, 1.0, 1.0, 0.0);
#define STEPS 10.0

#define pi 3.14159
#define pi2 2.0*pi

// scale is length of the waves.  1 / power of 2
#define scale 1.0
// amount is the deflection amount
#define amount 10.0
// speed 
#define speed 0.1


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
    vec2 uv = vec2(vUv.x, vUv.y);// uv.y is the end
    //vec2 uv = fragCoord/iResolution.xy;


    // this is really the screen-space scale of the texture coordinate space
    float pxSize = max(
        length(vec2(dFdx(uv.y), dFdy(uv.y))),
        length(vec2(dFdx(uv.x), dFdy(uv.x)))
    );
    
    uv = waveCoords(waveCoords(uv));// add a little bit o time

    float rampX = swoos01(uv.x + 10.0 + sin01(iTime*0.01)*0.1)*0.5 + swoos01(uv.y/5.0 + iTime*0.01)*0.5 - 0.5*sin01(uv.x*sin(iTime* 0.2) + iTime * 0.1);
    float rampY = (uv.y - sin01(iTime/4.0) * 0.05);

    float roundAmnt = round( rampY * STEPS + rampX )/STEPS;
    fragColor = mix(WHITE, BLUE, uv.y);
    float lineSize = 0.05;
    fragColor = mix(fragColor,
        WHITE,//                                                      VV use pixel size to blur lines (i.e. fake anisotropic filtering)
        stamp(fract( rampX + rampY* STEPS), 0.5 - lineSize, lineSize, 10.0*pxSize / lineSize)
    );
    fragColor = mix(fragColor, TRANSPARENT, pow(1.0 - roundAmnt, 8.0));
    #include <tonemapping_fragment>

}


`

const vert = `
varying vec2 vUv;

void main()
{
    vUv = uv;

    
    ${distortSnippet}

}
`
var uniforms = {time: {value: 1.0}}


function waterMaterial(){
    return new ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        derivatives:true
    })
}


export {waterMaterial}