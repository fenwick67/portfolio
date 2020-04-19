import {PerspectiveCamera, Vector3, AudioListener, PositionalAudio} from 'three'
import {entities} from './entities'

class PlayerCam{

    constructor(){
        this.camera = new PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 2000 );
        this.camera.userData.update = this.update.bind(this)
        this.baseOffset = new Vector3(0,7.5,15);
        this.zoomTimer = 0;
        this.zoomSpeed = 1;
        this.zoomFromPos = new Vector3(0);
        this.zoomToPos = new Vector3(0);
        this.zoomCurrentPos = new Vector3(0);
        this.zoomDuration = 1.0;
        window.addEventListener('resize',this.onResize.bind(this), false)
        this.onResize()

    }

    onResize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.fov = Math.min(Math.max(50, 50/this.camera.aspect),70)
        this.camera.updateProjectionMatrix();
    }

    zoomTo(focusPositionFromPlayer){
        this.zoomTimer = 0;
        this.zoomFromPos.copy(this.zoomCurrentPos);
        this.zoomToPos.copy(focusPositionFromPlayer);
    }

    update(delta){
        this.zoomTimer+= delta;
        this.zoomTimer = Math.min(this.zoomTimer, this.zoomDuration)
        this.camera.position.addVectors(this.baseOffset, entities.boxedPlayerFollower.position)
        this.zoomCurrentPos.set(0,0,0)
        this.zoomCurrentPos.addScaledVector(this.zoomFromPos, 1.0 - this.zoomTimer / this.zoomDuration);
        this.zoomCurrentPos.addScaledVector(this.zoomToPos, this.zoomTimer / this.zoomDuration);
        this.camera.lookAt(new Vector3().addVectors(this.zoomCurrentPos,entities.boxedPlayerFollower.position));
        this.camera.zoom = this.zoomCurrentPos.length()*0.1  +1
        this.camera.updateProjectionMatrix();
    }

}

var playerCam = new PlayerCam()

export {playerCam}