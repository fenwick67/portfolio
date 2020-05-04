
import {Scene, PerspectiveCamera, WebGLRenderer, HemisphereLight, AnimationMixer, Clock, HemisphereLightHelper, DirectionalLight, DirectionalLightHelper, ACESFilmicToneMapping, NoToneMapping, LinearToneMapping, ReinhardToneMapping, CineonToneMapping, MeshToonMaterial, MeshBasicMaterial, OrthographicCamera, AmbientLight, PCFSoftShadowMap, VSMShadowMap, Vector3, sRGBEncoding, Vector2, FogExp2, Color} from "three"
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {GUI} from 'three/examples/jsm/libs/dat.gui.module'
import {getOutdoorLighting, getEntity, entities} from "./lib/entities"
import { loadAll } from "./lib/loader";
// import { waterMaterial } from "./lib/waterShader";
import {input} from './lib/input'
import {playerCam} from './lib/playerCam'
import {updateObjects} from './lib/updatable'
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer'
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass'
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass'
import { LuminosityShader } from 'three/examples/jsm/shaders/LuminosityShader';
import { SobelOperatorShader } from 'three/examples/jsm/shaders/SobelOperatorShader';
import {FancyRenderer, CheapRenderer, NormalRenderer} from './lib/post-processing/renderer'
import {confettiUpdate} from "./lib/post-processing/confetti"

const ALT_TIME = true;

var assetsLoaded = false;

function init(){
    loadAll(function(err){
        if(err){console.error(err)}
        assetsLoaded = true;
    })
}

function run(quality){

    var scene = new Scene();

    // to make debugging easier
    window.scene = scene;
    window.input = input;

    scene.add(playerCam.camera)

    // fog
    scene.fog = new FogExp2( 0xb4d7ee, 0.008 );
    scene.background = new Color( 0xb4d7ee );
    
    var renderer;
    if (quality == 0){
        renderer = CheapRenderer(scene, playerCam.camera)
    } else if (quality == 1) {
        renderer = NormalRenderer(scene, playerCam.camera);
    } else if (quality == 2) {
        renderer = FancyRenderer(scene, playerCam.camera);
    }
    window.renderer = renderer;


    function resizeRenderer(){
        renderer.resize();
    }

    document.body.appendChild( renderer.domElement );
    resizeRenderer();

    window.addEventListener( 'resize', onWindowResize, false );

    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.shadowMap.enabled = quality > 0;


    // set up scene
    scene.add(entities.scene)
    getOutdoorLighting().forEach(l=>scene.add(l))

    // var effect = new OutlineEffect( renderer, {defaultThickness:0.005});
    // effect.setSize(20, 20, true);

    function onWindowResize() {
        resizeRenderer()
    }
    var clock = new Clock();
    clock.start();
    var lastDelta = 0;
    var lastTime = null
    function render(){
        if (!window.started){
            window.requestAnimationFrame(render)
            return;
        }

        var delta;

        if (ALT_TIME){
            var t = clock.getElapsedTime()
            if (!lastTime){
                lastTime = t - 0.016;
            }
            delta = (t - lastTime);
            lastTime += delta;
        } else {
            delta = clock.getDelta()
        }

        // clamp to 20FPS.
        delta = Math.min(delta,.05);

        
        // console.log(delta.toFixed(10))

        // this block limits rendered FPS (good for testing to see where I forget to use delta)
        // if (delta + lastDelta < 1/10){
        //     console.log(delta + lastDelta)
        //     lastDelta += delta;
        //     window.requestAnimationFrame(render)
        //     return;
        // } else {
        //     delta += lastDelta;
        //     lastDelta = 0;
        // }

        // console.log(scene)

        confettiUpdate(scene, delta)
        renderer.doRender(scene, playerCam.camera, delta);
        

        entities.water.material.uniforms.time.value = clock.getElapsedTime()
        entities.streams.forEach(s=>s.material.uniforms.time.value = clock.getElapsedTime())

        var nUpdates = 1;

        for (var i = 0; i < nUpdates; i++){
            input.update(delta/nUpdates);
        }

        updateObjects(scene, delta)

        requestAnimationFrame( render );

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


}

export {run, init}