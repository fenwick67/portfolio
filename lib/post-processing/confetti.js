// create a confetti emitter and then re-trigger it whenever you want it to happen

import { exponentialEase } from "../utils";
import { Vector3, PlaneGeometry, MeshBasicMaterial, Mesh, DoubleSide, Group, Euler, Audio, AudioLoader, PositionalAudio } from "three";
import { customToonMaterial } from "../ToonShader";
import {entities} from '../entities'

var targetVelocity = new Vector3(0,-5,0);

function updateVelocity(particle, delta){
    var diff = new Vector3().subVectors(targetVelocity, particle.userData.velocity);
    particle.userData.velocity.addScaledVector(diff, exponentialEase(delta*2.0, 0.0001) )
}

var particles = [];
var particleMat =  customToonMaterial(new MeshBasicMaterial({side:DoubleSide, color:0xff55ff}))
var particleG = new PlaneGeometry(0.25,1);
var particleGroup = new Group();

var initialized = false
var audio = null;

function init(){
    
    var n = 100;
    if (window.quality > 0){
        n = 1000
    }
    for (var i = 0; i < n; i++){
        var p = new Mesh( particleG, particleMat);
        p.quaternion.setFromEuler(new Euler(Math.random(), Math.random(), Math.random()))
        p.userData.spinAxis = new Vector3(Math.random(), Math.random(), Math.random()).normalize()
        particleGroup.add(p);
        particles.push(p)
    }
    var loader = new AudioLoader().load('sound/achievement.wav',function(buf){
        audio = new PositionalAudio(entities.player.playerCam.audioListener)
        audio.setBuffer(buf)
        audio.setRefDistance(50);

    })
}


var sleeping = false;
var explodeTime = -Infinity;
var t = 0;
function sleep(){
    sleeping = true;
    particleMat.visible = false;
}
function wake(){
    explodeTime = t;
    sleeping = false;
    particleMat.visible = true;
}

function explode(position){
    wake()
    if(audio){
        audio.position.copy(position)
        audio.play()
    }
    particleGroup.position.copy(position)
    particles.forEach(p=>{
        if (!p.userData.velocity){
            p.userData.velocity = new Vector3();
        }
        p.userData.rotationSpeed = 1 * Math.random();

        var theta = Math.random()* Math.PI * 2;
        var r = Math.random()*2;
        p.userData.velocity = new Vector3(
            r*Math.cos(theta),
            1,
            r*Math.sin(theta)
        ).multiplyScalar(30 - Math.random() * 10);
        p.userData.velocity.multiplyScalar(1.0 + Math.random())
        p.position.set(0,0,0)
    })
}

function update(scene,delta){
    if (!initialized){
        init()
        initialized = true;
    }
    if (!particleGroup.parent){
        scene.add(particleGroup)
    }
    if (sleeping){return;}
    t++;
    if (t - explodeTime > 1000){
        sleep();
        return;
    }
    for (var i = 0; i < particles.length; i++){
        var p = particles[i];
        updateVelocity(p,delta)
        p.rotateOnAxis(p.userData.spinAxis, 0.1*delta*p.userData.velocity.lengthSq()*p.userData.rotationSpeed)
        p.position.addScaledVector(p.userData.velocity, delta)
    }

}



export {explode as confettiExplode, update as confettiUpdate}