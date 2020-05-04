// replaces rendering functions

import { WebGLRenderer, Uncharted2ToneMapping, sRGBEncoding, DepthFormat, UnsignedShortType, WebGLRenderTarget, DepthTexture, NearestFilter, RGBFormat, DepthStencilFormat, PlaneBufferGeometry, Mesh, Scene, ShaderMaterial, OrthographicCamera, RGBEEncoding, MeshNormalMaterial, UnsignedIntType, Color } from "three"

// old: renderer = new Renderer(); renderer.render(camera, scene)
// new: fancyRenderer = new FancyRenderer(); fancyRenderer.render(camera, scene)

var BLUR = 4.0

// post processing material (takes color from normal renderer and depth to create outline effect)
var postFrag = `
#include <common>
#include <packing>

// dark blue
// #define SHADOW_COLOR vec3(0.0,0.0,0.4)
// #define SHADOW_COLOR vec3(0.0,0.0,0.4)
// #define SHADOW_COLOR vec3(79.0, 84.0, 130.0)/255.0
#define ORANGE vec3(1.0, 0.7, 0.2)
#define PINK vec3(1.0, 0.2, 1.0)
// #define SHADOW_COLOR (mix(PINK,ORANGE,0.7))
#define SHADOW_COLOR vec3(0.0,1.0,1.0)*0.9

#define KERNEL_SZ 1.0

varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform sampler2D tNormal;
uniform float cameraNear;
uniform float cameraFar;
uniform float tWidth;
uniform float tHeight;
uniform vec3 fogColor;
uniform float time;
uniform vec3 lineColor;


// BEGIN NOISE FUNCTIONS
// from: https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
float rand(float n){return fract(sin(n) * 43758.5453123);}
float noise1D(float p){
    float fl = floor(p);
    float fc = fract(p);
    return (mix(rand(fl), rand(fl + 1.0), fc)-.5)*2.;
}

// from: https://github.com/BrianSharpe/Wombat/blob/master/Perlin3D.glsl
float perlin( vec3 P )
{
    // establish our grid cell and unit position
    vec3 Pi = floor(P);
    vec3 Pf = P - Pi;
    vec3 Pf_min1 = Pf - 1.0;

    // clamp the domain
    Pi.xyz = Pi.xyz - floor(Pi.xyz * ( 1.0 / 69.0 )) * 69.0;
    vec3 Pi_inc1 = step( Pi, vec3( 69.0 - 1.5 ) ) * ( Pi + 1.0 );

    // calculate the hash
    vec4 Pt = vec4( Pi.xy, Pi_inc1.xy ) + vec2( 50.0, 161.0 ).xyxy;
    Pt *= Pt;
    Pt = Pt.xzxz * Pt.yyww;
    const vec3 SOMELARGEFLOATS = vec3( 635.298681, 682.357502, 668.926525 );
    const vec3 ZINC = vec3( 48.500388, 65.294118, 63.934599 );
    vec3 lowz_mod = vec3( 1.0 / ( SOMELARGEFLOATS + Pi.zzz * ZINC ) );
    vec3 highz_mod = vec3( 1.0 / ( SOMELARGEFLOATS + Pi_inc1.zzz * ZINC ) );
    vec4 hashx0 = fract( Pt * lowz_mod.xxxx );
    vec4 hashx1 = fract( Pt * highz_mod.xxxx );
    vec4 hashy0 = fract( Pt * lowz_mod.yyyy );
    vec4 hashy1 = fract( Pt * highz_mod.yyyy );
    vec4 hashz0 = fract( Pt * lowz_mod.zzzz );
    vec4 hashz1 = fract( Pt * highz_mod.zzzz );

    // calculate the gradients
    vec4 grad_x0 = hashx0 - 0.49999;
    vec4 grad_y0 = hashy0 - 0.49999;
    vec4 grad_z0 = hashz0 - 0.49999;
    vec4 grad_x1 = hashx1 - 0.49999;
    vec4 grad_y1 = hashy1 - 0.49999;
    vec4 grad_z1 = hashz1 - 0.49999;
    vec4 grad_results_0 = inversesqrt( grad_x0 * grad_x0 + grad_y0 * grad_y0 + grad_z0 * grad_z0 ) * ( vec2( Pf.x, Pf_min1.x ).xyxy * grad_x0 + vec2( Pf.y, Pf_min1.y ).xxyy * grad_y0 + Pf.zzzz * grad_z0 );
    vec4 grad_results_1 = inversesqrt( grad_x1 * grad_x1 + grad_y1 * grad_y1 + grad_z1 * grad_z1 ) * ( vec2( Pf.x, Pf_min1.x ).xyxy * grad_x1 + vec2( Pf.y, Pf_min1.y ).xxyy * grad_y1 + Pf_min1.zzzz * grad_z1 );

    // Classic Perlin Interpolation
    vec3 blend = Pf * Pf * Pf * (Pf * (Pf * 6.0 - 15.0) + 10.0);
    vec4 res0 = mix( grad_results_0, grad_results_1, blend.z );
    vec4 blend2 = vec4( blend.xy, vec2( 1.0 - blend.xy ) );
    float final = dot( res0, blend2.zxzx * blend2.wwyy );
    return ( final * 1.1547005383792515290182975610039 );  // scale things to a strict -1.0->1.0 range  *= 1.0/sqrt(0.75)
}

float perlin(vec2 pos, float time)
{
    return (perlin(vec3(pos, time))+1.)*.5;
}


// END NOISE FUNCS

float screenNoise (vec3 pos){
    return perlin(pos);
}

float readDepth( sampler2D depthSampler, vec2 coord ) {
    float fragCoordZ = texture2D( depthSampler, coord ).x;
    float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
    return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
}

// account for the fact that at further distances the same slope loops steeper in screen-space when 
// you increment by pixel
float readDepthPerspective(sampler2D depthSampler, vec2 coord){
    float d = readDepth(depthSampler, coord);
    return 1.0 - (1.0 / d);
}

void make_kernel_depth(inout vec3 n[4], sampler2D tex, vec2 coord)
{
	float w = KERNEL_SZ / tWidth;
	float h = KERNEL_SZ / tHeight;

	n[0] = vec3(readDepthPerspective(tex, coord + vec2( -w, -h)));
	n[1] = vec3(readDepthPerspective(tex, coord + vec2(  w,  h)));
	n[2] = vec3(readDepthPerspective(tex, coord + vec2( -w,  h)));
	n[3] = vec3(readDepthPerspective(tex, coord + vec2(  w, -h)));
}

void make_kernel_normal(inout vec3 n[4], sampler2D tex, vec2 coord){
    float w = KERNEL_SZ / tWidth;
    float h = KERNEL_SZ / tHeight;
    
    n[0] = texture2D(tex, coord + vec2(-w, -h)).rgb;
    n[1] = texture2D(tex, coord + vec2( w,  h)).rgb;
    n[2] = texture2D(tex, coord + vec2(-w,  h)).rgb;
    n[3] = texture2D(tex, coord + vec2( w, -h)).rgb;
}

void main() {
    vec3 diffuse = texture2D( tDiffuse, vUv ).rgb;
    float depth = readDepth( tDepth, vUv );
    float depthPersp = readDepthPerspective(tDepth, vUv);

    vec3 kernel[4];
    make_kernel_depth(kernel, tDepth, vUv);
    vec3 depthFiniteDiff0 = kernel[1] - kernel[0];
    vec3 depthFiniteDiff1 = kernel[3] - kernel[2];
    float sobel = sqrt(dot(depthFiniteDiff0, depthFiniteDiff0) + dot(depthFiniteDiff1, depthFiniteDiff1));

    float thresh = 8.0;
    vec3 normal = texture2D(tNormal, vUv).rgb;// reduce effect when facing away
    float lineAmntDepth = step( thresh, sobel * (normal.b) );

    //  sample the normals as well
    // see https://roystan.net/articles/outline-shader.html

    vec3 normal_kernel[4];
    make_kernel_normal(normal_kernel, tNormal, vUv);
    vec3 normFiniteDiff0 = normal_kernel[1] - normal_kernel[0];
    vec3 normFiniteDiff1 = normal_kernel[3] - normal_kernel[2];
    float normalEdge = sqrt(dot(normFiniteDiff0, normFiniteDiff0) + dot(normFiniteDiff1, normFiniteDiff1));
    float lineAmntNormal = step(0.75, normalEdge);

    float fogAmnt = 10.0 * depth +
    1.0 * depth * screenNoise(vec3(
        vUv * vec2(tWidth, tHeight*0.5)*0.01 + vec2(time, -time), depthPersp*0.5
    ))
    ;
    fogAmnt = clamp(fogAmnt, 0.0, 1.0);
    vec3 foggedDiffuse = mix(diffuse, fogColor, fogAmnt);

    gl_FragColor.rgb = mix(foggedDiffuse, lineColor, max(lineAmntNormal,lineAmntDepth));
    gl_FragColor.a = 1.0;
}`

var postVert = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

function FancyRenderer(scene, camera){
    
    var fogColor = scene.fog.color.clone();
    scene.fog = null;

    var r = new WebGLRenderer({antialias:true});
    if(!r.extensions.get( 'WEBGL_depth_texture' )) {
        alert('please pick a lower graphics setting, this literally will not work on your device at this quality level!')
    }
    r.toneMapping = Uncharted2ToneMapping;
    r.toneMappingWhitePoint = 1.0;
    r.toneMappingExposure = 1.1;
    r.outputEncoding = sRGBEncoding;

    var depthTarget = null;//  depth / render texture target
    var normalTarget = null;
    var postScene, postCamera, postMaterial;

    setupRenderTargets();
    function setupRenderTargets() {
        if ( depthTarget ) depthTarget.dispose();

        var format = DepthFormat;
        var type = UnsignedIntType;// UnsignedShortType led to Z-fighting artifacts :(

        depthTarget = new WebGLRenderTarget( window.innerWidth, window.innerHeight );
        depthTarget.texture.format = RGBFormat;
        depthTarget.texture.encoding = sRGBEncoding;
        depthTarget.texture.minFilter = NearestFilter;
        depthTarget.texture.magFilter = NearestFilter;
        depthTarget.texture.generateMipmaps = false;
        depthTarget.stencilBuffer = ( format === DepthStencilFormat ) ? true : false;
        depthTarget.depthBuffer = true;
        depthTarget.depthTexture = new DepthTexture();
        depthTarget.depthTexture.format = format;
        depthTarget.depthTexture.type = type;

        if ( normalTarget ) normalTarget.dispose();

        normalTarget = new WebGLRenderTarget( window.innerWidth, window.innerHeight );
        normalTarget.texture.format = RGBFormat
        normalTarget.texture.format = RGBFormat;
        normalTarget.texture.generateMipmaps = false;
    }

    setupPost();
    function setupPost(){
        // Setup post processing stage
        postCamera = new OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
        postMaterial = new ShaderMaterial( {
            vertexShader: postVert,
            fragmentShader: postFrag,
            uniforms: {
                cameraNear: { value: camera.near },
                cameraFar: { value: camera.far },
                tDiffuse: { value: null },
                tDepth: { value: null },
                tNormal: {value: null },
                tWidth: {value: 100},
                tHeight: {value: 100},
                fogColor: {value: null},
                time: {value: 1.5},
                lineColor: {value: new Color(0,0,0)}
            },
            extensions:{derivatives:true}
        } );
        var postPlane = new PlaneBufferGeometry( 2, 2 );
        var postQuad = new Mesh( postPlane, postMaterial );
        postScene = new Scene();
        postScene.add( postQuad );

    }

    r.resize = function(){
        r.setSize( window.innerWidth, window.innerHeight);
        var dpr = renderer.getPixelRatio();
        depthTarget.setSize(window.innerWidth*dpr, window.innerHeight*dpr);
        normalTarget.setSize(window.innerWidth*dpr, window.innerHeight*dpr);
    }

    r.doRender = function(s, c, delta){

        // render diffuse color and depth (pass 1)
        r.setRenderTarget( depthTarget );
        r.render(scene, camera);

        // r.clearDepth()

        // render normals (pass 2)
        r.setRenderTarget( normalTarget );

        // overridematerial sucks so this will have to do
        scene.traverse(o=>{
            if (o.material){
                o.userData.originalMaterial = o.material;
                if (!o.userData.normMaterial){
                    o.userData.normMaterial = new MeshNormalMaterial({
                        skinning: o.material.skinning,
                        morphTargets: o.material.morphTargets,
                        opacity: o.material.opacity,
                        transparent: o.material.transparent
                    })
                }
                o.material = o.userData.normMaterial;
                // skip color write sometimes (i.e. doesn't effect lines)
                // console.log(o.userData.originalMaterial.visible)
                 if ( o.userData.originalMaterial.visible === false || o.userData.originalMaterial.depthWrite === false){
                    o.material.visible = false;
                } else {
                    o.material.visible = true;
                }
                
            }
        })
        r.render(scene, camera);

        // reset materials to their originals
        scene.traverse(o=>{
            if (o.userData.originalMaterial){
                o.material = o.userData.originalMaterial;
            }
        })

        postMaterial.uniforms.tDiffuse.value = depthTarget.texture;
        postMaterial.uniforms.tDepth.value = depthTarget.depthTexture;
        postMaterial.uniforms.tNormal.value = normalTarget.texture;
        postMaterial.uniforms.cameraNear.value = camera.near;
        postMaterial.uniforms.cameraFar.value = camera.far;
        postMaterial.uniforms.tHeight.value = depthTarget.height;
        postMaterial.uniforms.tWidth.value = depthTarget.width;
        postMaterial.uniforms.fogColor.value = fogColor;
        postMaterial.uniforms.lineColor.value.setStyle(window.getComputedStyle(document.body).color);
        postMaterial.uniforms.time.value += delta;

        // composition pass
        r.setRenderTarget( null );
        r.render( postScene, postCamera );

    }

    return r;
}

function NormalRenderer(scene, camera){
    var r = new WebGLRenderer({antialias:true});
    r.toneMapping = Uncharted2ToneMapping;
    r.toneMappingWhitePoint = 1.0;
    r.toneMappingExposure = 1.1;
    r.outputEncoding = sRGBEncoding;

    r.resize = function(){
        r.setSize( window.innerWidth, window.innerHeight);
    }

    r.doRender = function(s,c){
        r.render(s,c)
    }

    return r;
}


function CheapRenderer(scene, camera){
    var r = new WebGLRenderer({antialias:false});
    r.toneMapping = Uncharted2ToneMapping;
    r.toneMappingWhitePoint = 1.0;
    r.toneMappingExposure = 1.1;
    r.outputEncoding = sRGBEncoding;

    r.resize = function(){
        var targetResolutionY = (quality == -1) ? 300 : 300;
        var pixelSize = window.innerHeight / targetResolutionY;
        pixelSize = Math.floor(pixelSize);
        pixelSize = Math.max(pixelSize, 1);

        var rendererX = Math.ceil(window.innerWidth / pixelSize);
        var rendererY = Math.ceil(window.innerHeight / pixelSize);

        // might need this
        // renderer.setPixelRatio( window.devicePixelRatio );
        r.setSize( rendererX, rendererY);
        var styleW = Math.round(rendererX * pixelSize );
        var styleH = Math.round(rendererY * pixelSize );
            
        var styleImRendering = `image-rendering:optimizeSpeed;
        image-rendering:-moz-crisp-edges; 
        image-rendering:-o-crisp-edges;
        image-rendering:-webkit-optimize-contrast;
        image-rendering:optimize-contrast;
        image-rendering:crisp-edges;
        image-rendering:pixelated;
        -ms-interpolation-mode:nearest-neighbor;`;
        if (quality == -1){styleImRendering = ''}
        r.domElement.style = `width: ${styleW}; height: ${styleH}; ${styleImRendering}`;  
    }

    r.doRender = function(s, c){
        r.render(s, c)
    }

    return r;
}

export {FancyRenderer, NormalRenderer, CheapRenderer}