// replaces rendering functions

import { WebGLRenderer, Uncharted2ToneMapping, sRGBEncoding, DepthFormat, UnsignedShortType, WebGLRenderTarget, DepthTexture, NearestFilter, RGBFormat, DepthStencilFormat, PlaneBufferGeometry, Mesh, Scene, ShaderMaterial, OrthographicCamera, RGBEEncoding } from "three"

// old: renderer = new Renderer(); renderer.render(camera, scene)
// new: fancyRenderer = new FancyRenderer(); fancyRenderer.render(camera, scene)

var BLUR = 4.0

// post processing material (takes color from normal renderer and depth to create outline effect)
var postFrag = `
#include <common>
#include <packing>

#define SHADOW_COLOR vec3(0.0,0.0,0.4)

varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform float cameraNear;
uniform float cameraFar;
uniform float tWidth;
uniform float tHeight;

float readDepth( sampler2D depthSampler, vec2 coord ) {
    float fragCoordZ = texture2D( depthSampler, coord ).x;
    float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
    return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
}

void make_kernel(inout float n[9], sampler2D tex, vec2 coord)
{
	float w = 1.0 / tWidth;
	float h = 1.0 / tHeight;

	n[0] = readDepth(tex, coord + vec2( -w, -h));
	n[1] = readDepth(tex, coord + vec2(0.0, -h));
	n[2] = readDepth(tex, coord + vec2(  w, -h));
	n[3] = readDepth(tex, coord + vec2( -w, 0.0));
	n[4] = readDepth(tex, coord);
	n[5] = readDepth(tex, coord + vec2(  w, 0.0));
	n[6] = readDepth(tex, coord + vec2( -w, h));
	n[7] = readDepth(tex, coord + vec2(0.0, h));
	n[8] = readDepth(tex, coord + vec2(  w, h));
}

void main() {
    vec3 diffuse = texture2D( tDiffuse, vUv ).rgb;
    float depth = readDepth( tDepth, vUv );

    float kernel[9];
    make_kernel(kernel, tDepth, vUv);
    float sobel_edge_h = kernel[2] + (2.0*kernel[5]) + kernel[8] - (kernel[0] + (2.0*kernel[3]) + kernel[6]);
    float sobel_edge_v = kernel[0] + (2.0*kernel[1]) + kernel[2] - (kernel[6] + (2.0*kernel[7]) + kernel[8]);
    float sobel = sqrt((sobel_edge_h * sobel_edge_h) + (sobel_edge_v * sobel_edge_v));

    float thresh = 0.001;
    float lineAmnt = step( thresh, abs(sobel) );
    gl_FragColor.rgb = mix(diffuse, SHADOW_COLOR, lineAmnt);
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
    
    var r = new WebGLRenderer({antialias:true});
    if(!r.extensions.get( 'WEBGL_depth_texture' )) {
        alert('please pick a lower graphics setting, this literally will not work on your device at this quality level!')
    }
    r.toneMapping = Uncharted2ToneMapping;
    r.toneMappingWhitePoint = 1.0;
    r.toneMappingExposure = 1.1;
    r.outputEncoding = sRGBEncoding;

    var depthTarget = null;//  depth / render texture target
    var postScene, postCamera, postMaterial;

    setupRenderTarget();
    function setupRenderTarget() {
        if ( depthTarget ) depthTarget.dispose();

        var format = DepthFormat;
        var type = UnsignedShortType;

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
                tWidth: {value: 100},
                tHeight: {value: 100}
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
    }

    r.doRender = function(){
        r.setRenderTarget( depthTarget );
        r.render(scene, camera);

        postMaterial.uniforms.tDiffuse.value = depthTarget.texture;
        postMaterial.uniforms.tDepth.value = depthTarget.depthTexture;
        postMaterial.uniforms.cameraNear.value = camera.near;
        postMaterial.uniforms.cameraFar.value = camera.far;
        postMaterial.uniforms.tHeight.value = depthTarget.width;
        postMaterial.uniforms.tWidth.value = depthTarget.height;

        r.setRenderTarget( null );
        r.render( postScene, postCamera );
    }

    return r;
}

function NormalRenderer(scene, camera){
    var r = new WebGLRenderer({antialias:false});
    r.toneMapping = Uncharted2ToneMapping;
    r.toneMappingWhitePoint = 1.0;
    r.toneMappingExposure = 1.1;
    r.outputEncoding = sRGBEncoding;

    r.resize = function(){
        r.setSize( window.innerWidth, window.innerHeight);
    }

    r.doRender = function(){
        r.render(...arguments)
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

    r.doRender = function(){
        r.render(...arguments)
    }

    return r;
}

export {FancyRenderer, NormalRenderer, CheapRenderer}