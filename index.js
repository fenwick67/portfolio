
import {Scene, PerspectiveCamera, WebGLRenderer} from "three"
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';


var scene = new Scene();
var camera = new PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

var renderer = new WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );


var loader = new GLTFLoader();

loader.load( 'res/character.glb', function ( gltf ) {
    console.log(gltf)
	scene.add( gltf.scene );

}, undefined, function ( error ) {
    console.error('dammit')
	console.error( error );

} );
