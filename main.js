
import {Scene, PerspectiveCamera, WebGLRenderer, HemisphereLight, AnimationMixer, Clock, HemisphereLightHelper, DirectionalLight, DirectionalLightHelper, ACESFilmicToneMapping, NoToneMapping, LinearToneMapping, ReinhardToneMapping, Uncharted2ToneMapping, CineonToneMapping, MeshToonMaterial, MeshBasicMaterial, OrthographicCamera, AmbientLight, PCFSoftShadowMap, VSMShadowMap, Vector3, sRGBEncoding, Vector2} from "three"
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// import {GUI} from 'three/examples/jsm/libs/dat.gui.module'
// import {OutlineEffect} from "three/examples/jsm/effects/OutlineEffect.js"
import {getOutdoorLighting, getEntity, entities} from "./lib/entities"
import { loadAll } from "./lib/loader";
// import { waterMaterial } from "./lib/waterShader";
import {input} from './lib/input'
import {playerCam} from './lib/playerCam'
import {updateObjects} from './lib/updatable'


var scene = new Scene();

// to make debugging easier
window.scene = scene;
window.input = input;

scene.add(playerCam.camera)

var renderer = new WebGLRenderer({antialias:false});
// THIS is why my stuff all looked different than in Blender
renderer.outputEncoding = sRGBEncoding;
var loaded = false

function resizeRenderer(){
    var targetResolutionY = 600
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
    loaded = true;
})

// var controls = new OrbitControls( camera, renderer.domElement );
// // controls.addEventListener( 'change', render ); // use if there is no animation loop
// controls.minDistance = 10;
// controls.maxDistance = 100;
// controls.target.set( 0, 0, - 0.2 );
// controls.maxPolarAngle = 1.0
// controls.enableKeys = false;
// controls.panSpeed = 0;
// controls.keyPanSpeed = 0;
// controls.update();

window.addEventListener( 'resize', onWindowResize, false );


renderer.shadowMap.type = PCFSoftShadowMap;
renderer.shadowMap.enabled = true;

// var effect = new OutlineEffect( renderer, {defaultThickness:0.005});
// effect.setSize(20, 20, true);

function onWindowResize() {
    resizeRenderer()
}
var clock = new Clock();
clock.start(); 
function render(){
    if (!loaded){
        window.requestAnimationFrame(render)
        return;
    }
    var delta = clock.getDelta();

    // console.log(scene)

    renderer.render(scene, playerCam.camera);

    entities.water.material.uniforms.time.value = clock.getElapsedTime()
    entities.streams.forEach(s=>s.material.uniforms.time.value = clock.getElapsedTime())


    /*
        handle 30 or fewer FPS
        MOST update functions handle delta correctly but not all of them.
        this gives us a reasonable approximation - things that don't use delta (usually damping) will 
        get done twice, things that DO use delta should handle it appropriately since we divide by the delta.
    */
    // var nUpdates = Math.floor(delta / (1/31)) + 1;
    // nUpdates = Math.min(nUpdates,3);
    // if (nUpdates > 1){
    //     console.log("JANK",nUpdates)
    // }
    var nUpdates = 1;

    for (var i = 0; i < nUpdates; i++){
        input.update(delta/nUpdates);
    }

    updateObjects(scene, delta)

    // controls.target.set(entities.character.location)

    // camera.position.addVectors(new Vector3(0,10,15), entities.playerFollower.position)
    // camera.lookAt(entities.playerFollower.position);

    window.requestAnimationFrame(render);

}

render()


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
renderer.toneMappingExposure = 1.1;

