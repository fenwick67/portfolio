
import {Scene, PerspectiveCamera, WebGLRenderer, HemisphereLight, AnimationMixer, Clock, HemisphereLightHelper, DirectionalLight, DirectionalLightHelper, ACESFilmicToneMapping, NoToneMapping, LinearToneMapping, ReinhardToneMapping, Uncharted2ToneMapping, CineonToneMapping, MeshToonMaterial, MeshBasicMaterial, OrthographicCamera, AmbientLight, PCFSoftShadowMap, VSMShadowMap, Vector3, sRGBEncoding, Vector2} from "three"
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {GUI} from 'three/examples/jsm/libs/dat.gui.module'
import {OutlineEffect} from "three/examples/jsm/effects/OutlineEffect.js"
import {getOutdoorLighting, getEntity, entities} from "./lib/entities"
import { loadAll } from "./lib/loader";
import { waterMaterial } from "./lib/waterShader";


var scene = new Scene();
var camera = new PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 2000 );

var renderer = new WebGLRenderer();
// THIS is why my stuff all looked different than in Blender
renderer.outputEncoding = sRGBEncoding;

function resizeRenderer(){
    var targetResolutionY = 300// target Y resolution
    var pixelSize = window.innerHeight / targetResolutionY;
    pixelSize = Math.floor(pixelSize);
    pixelSize = Math.max(pixelSize, 1);

    var rendererX = Math.ceil(window.innerWidth / pixelSize);
    var rendererY = Math.ceil(window.innerHeight / pixelSize);

    renderer.setSize( rendererX, rendererY);
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
    renderer.domElement.style = `width: ${styleW}; height: ${styleH}; ${styleImRendering}`;

}

document.body.appendChild( renderer.domElement );
resizeRenderer();

var loader = new GLTFLoader();
loadAll(function(err){
    if(err){console.error(err)}
    // set up scene
    scene.add(entities.scene)
    getOutdoorLighting().forEach(l=>scene.add(l))
    render();
})

var controls = new OrbitControls( camera, renderer.domElement );
// controls.addEventListener( 'change', render ); // use if there is no animation loop
controls.minDistance = 10;
controls.maxDistance = 100;
controls.target.set( 0, 0, - 0.2 );
controls.maxPolarAngle = 1.0
controls.update();

window.addEventListener( 'resize', onWindowResize, false );

getOutdoorLighting().forEach(l=>scene.add(l))

renderer.shadowMap.type = VSMShadowMap;
renderer.shadowMap.enabled = true;

var effect = new OutlineEffect( renderer, {defaultThickness:0.005});
// effect.setSize(20, 20, true);

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    resizeRenderer()

}
var clock = new Clock();
clock.start(); 
function render(){
    var delta = clock.getDelta();

    entities.playerMixer.update(delta);
    // console.log(scene)

    entities.player.setMoveAnimationForSpeed(2 * Math.sin(clock.getElapsedTime()/5) * Math.sin(clock.getElapsedTime()/5) );
    effect.render(scene, camera);

    entities.water.material.uniforms.time.value = clock.getElapsedTime()

    window.requestAnimationFrame(render);
}

// var toneMappingOptions = {
//     None: NoToneMapping,
//     Linear: LinearToneMapping,
//     Reinhard: ReinhardToneMapping,
//     Uncharted2: Uncharted2ToneMapping,
//     Cineon: CineonToneMapping,
//     ACESFilmic: ACESFilmicToneMapping
// };
// var params = {exposure: 1.5, whitePoint: 1.0, toneMapping:'ACESFilmic'};
// var gui = new GUI();

// gui.add(params, 'toneMapping', Object.keys(toneMappingOptions))
//     .onChange(function(){
//         renderer.toneMapping = toneMappingOptions[params.toneMapping]
        
//         scene.traverse(function(o){
//             if (o.material){
//                 o.material.needsUpdate = true;
//             }
//         })
//     })
// gui.add(params, 'exposure', 0, 2)
//     .onChange(function(){
//         renderer.toneMappingExposure = params.exposure;
//     })
// gui.add(params, 'whitePoint', 0, 2)
// .onChange(function(){
//     renderer.toneMappingWhitePoint = params.whitePoint;
// })
// gui.open()

renderer.toneMapping = Uncharted2ToneMapping;
renderer.toneMappingWhitePoint = 1.0;
renderer.toneMappingExposure = 1.0;