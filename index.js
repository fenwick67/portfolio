
import {Scene, PerspectiveCamera, WebGLRenderer, HemisphereLight, AnimationMixer, Clock, HemisphereLightHelper, DirectionalLight, DirectionalLightHelper, ACESFilmicToneMapping, NoToneMapping, LinearToneMapping, ReinhardToneMapping, Uncharted2ToneMapping, CineonToneMapping, MeshToonMaterial, MeshBasicMaterial} from "three"
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {GUI} from 'three/examples/jsm/libs/dat.gui.module'

var scene = new Scene();
var camera = new PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 2000 );

var renderer = new WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );


var loader = new GLTFLoader();
var mixer;
loader.load('scene.glb', function ( gltf ) {
    console.log(gltf)
    scene.add( gltf.scene );
    scene.traverse(function(o){
        if (o.name == 'Plane'){
            o.material = new MeshBasicMaterial({map:o.material.map})
        }
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
controls.addEventListener( 'change', render ); // use if there is no animation loop
controls.minDistance = 100;
controls.maxDistance = 200;
controls.target.set( 0, 0, - 0.2 );
controls.update();

window.addEventListener( 'resize', onWindowResize, false );


var hemiLight = new HemisphereLight( 0xffffff, 0xffffff, 0.6 );
hemiLight.color.setHSL( 0.6, 1, 0.6 );
hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
hemiLight.position.set( 0, 50, 0 );
scene.add( hemiLight );

var hemiLightHelper = new HemisphereLightHelper(hemiLight);
scene.add(hemiLightHelper);

// dir light

var dirLight = new DirectionalLight( 0xffffff, 1 );
dirLight.color.setHSL( 0.1, 1, 0.95 );
dirLight.position.set( -0.1, 1.75, -1 );
dirLight.position.multiplyScalar( 100 );
scene.add( dirLight );

dirLight.castShadow = true;

dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;

var d = 50;

dirLight.shadow.camera.left = - d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = - d;

dirLight.shadow.camera.far = 3500;
dirLight.shadow.bias = - 0.0001;

var dirLightHeper = new DirectionalLightHelper( dirLight, 10 );
scene.add( dirLightHeper );

renderer.shadowMap.enabled = true;

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    render();

}
var clock = new Clock();
var ready = false;
function render(){
    if (!ready){return}
    var delta = clock.getDelta();

    mixer.update(delta);
    // console.log(scene)
    renderer.render(scene, camera);


    window.requestAnimationFrame(render);
}

var toneMappingOptions = {
    None: NoToneMapping,
    Linear: LinearToneMapping,
    Reinhard: ReinhardToneMapping,
    Uncharted2: Uncharted2ToneMapping,
    Cineon: CineonToneMapping,
    ACESFilmic: ACESFilmicToneMapping
};
var params = {exposure: 1.5, whitePoint: 1.0, toneMapping:'ACESFilmic'};
var gui = new GUI();

gui.add(params, 'toneMapping', Object.keys(toneMappingOptions))
    .onChange(function(){
        renderer.toneMapping = toneMappingOptions[params.toneMapping]
        
        scene.traverse(function(o){
            if (o.material){
                o.material.needsUpdate = true;
            }
        })
    })
gui.add(params, 'exposure', 0, 2)
    .onChange(function(){
        renderer.toneMappingExposure = params.exposure;
    })
gui.add(params, 'whitePoint', 0, 2)
.onChange(function(){
    renderer.toneMappingWhitePoint = params.whitePoint;
})
gui.open()