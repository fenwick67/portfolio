
import {Scene, PerspectiveCamera, WebGLRenderer, HemisphereLight, AnimationMixer, Clock} from "three"
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

var scene = new Scene();
var camera = new PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 2000 );

var renderer = new WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );


var loader = new GLTFLoader();
var mixer;
loader.load('character.glb', function ( gltf ) {
    console.log(gltf)
    scene.add( gltf.scene );
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