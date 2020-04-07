import { ShaderMaterial, Mesh, PlaneGeometry } from "three"

// demo from https://github.com/mrdoob/three.js/blob/master/examples/webgl_shader.html
const frag = `
vec4 BLUE = vec4(0.1, 0.3, 1.0, 1.0);
vec4 WHITE = vec4(1.0, 1.0, 1.0, 1.0);
vec4 TRANSPARENT = vec4(1.0, 1.0, 1.0, 0.0);
#define STEPS 10.0
uniform float time;

varying vec2 vUv;

float round(float n){
    return floor(n + 0.5);
}

// sine but goes from 0 to 1 on interval 0..1
float sin01(float n){
    return sin(n*3.14159*2.0)/2.0 + 0.5;
}


// swoosy repeating function
float swoos01(float n){
    return sin01(sin01(n*5.0)) * 0.5 + sin01(n * 3.0 + 0.432) * 0.5;
}

// step only on the number (TODO make non-branching)
float stamp(float n, float threshold, float w){
    if (n < threshold - w){return 0.0;}
    if (n > threshold + w){return 0.0;}
    return 1.0;    
}

void main(void) {
    vec2 uv = vec2(vUv.x, vUv.y);// uv.y is the end

    float rampX = swoos01(uv.x + 10.0 + sin01(time*0.01)*0.1)*0.25 + swoos01(uv.y/5.0 + time*0.01)*0.25;
    float rampY = (uv.y - sin01(time/4.0) * 0.2);

    float roundAmnt = round( rampY * STEPS + rampX )/STEPS;
    gl_FragColor = mix(WHITE, BLUE, uv.y);
    gl_FragColor = mix(gl_FragColor, WHITE, stamp(fract( rampX + rampY* STEPS), 0.45, 0.05));
    gl_FragColor = mix(gl_FragColor, TRANSPARENT, pow(1.0 - roundAmnt, 8.0));

}

`

const vert = `
varying vec2 vUv;

void main()
{
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    gl_Position = projectionMatrix * mvPosition;
}
`
var uniforms = {time: {value: 1.0}}


function waterMaterial(){
    return new ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true
    })
}


export {waterMaterial}