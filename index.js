
import {Scene, PerspectiveCamera, WebGLRenderer, HemisphereLight, AnimationMixer, Clock, HemisphereLightHelper, DirectionalLight, DirectionalLightHelper, ACESFilmicToneMapping, NoToneMapping, LinearToneMapping, ReinhardToneMapping, Uncharted2ToneMapping, CineonToneMapping, MeshToonMaterial, MeshBasicMaterial, OrthographicCamera, AmbientLight, PCFSoftShadowMap, VSMShadowMap, Vector3} from "three"
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {GUI} from 'three/examples/jsm/libs/dat.gui.module'
import {OutlineEffect} from "three/examples/jsm/effects/OutlineEffect.js"
import {getOutdoorLighting} from "./lib/entities"

var scene = new Scene();
var camera = new PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 2000 );

var renderer = new WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );


var loader = new GLTFLoader();
var mixer;
loader.load('scene.glb', function ( gltf ) {
    console.log(gltf)
    scene.add( gltf.scene );
    scene.traverse(function(o){
        if (o.material && o.name){// pbr material from export
            o.material = new MeshToonMaterial({
                map: o.material.map,
                shininess: 15,
                // specular: 0,
                transparent: !!o.material.transparent,
                skinning: !!o.material.skinning
            });
        }
        if (o.name == 'Plane'){
            o.receiveShadow = true;
        }
        else if (o.name == "Armature"){
            o.traverse(function(m){
                if (m.material){m.castShadow = true; m.receiveShadow = true;}
            })
        }
        console.log(o)
    })
    mixer = new AnimationMixer( gltf.scene );
    var action = mixer.clipAction(  gltf.animations.find(a=>a.name == "walk") );
    action.play()
    ready = true;
    
    render();
}, undefined, function ( error ) {
    console.error('dammit')
	console.error( error );

} );

var controls = new OrbitControls( camera, renderer.domElement );
// controls.addEventListener( 'change', render ); // use if there is no animation loop
controls.minDistance = 10;
controls.maxDistance = 20;
controls.target.set( 0, 0, - 0.2 );
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

    renderer.setSize( window.innerWidth, window.innerHeight );

    // render();

}
var clock = new Clock();
var ready = false;
function render(){
    if (!ready){return}
    var delta = clock.getDelta();

    mixer.update(delta);
    // console.log(scene)

    scene.traverse(function(o){
        if (o.name == 'Armature'){
            o.position.z = Math.sin(clock.getElapsedTime()) * 3
            o.position.x = Math.cos(clock.getElapsedTime()) * 3
            o.setRotationFromAxisAngle(new Vector3(0, 1, 0), -clock.getElapsedTime())
        }
    })
    effect.render(scene, camera);


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
renderer.toneMappingExposure = 1.3;