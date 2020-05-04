import {Vector3} from "three"
var _ = require('lodash')
import {exponentialEase} from './utils'

/**
 * USAGE: 
 *  on frame:
 *   input.update(dt)
 *   input.buttons.jump =>false or true
 *   input.undampedMovementAxis => vec3
 *   input.movementAxis => vec3
 *   input.camX => 0 to 1
 *   input.camY => 0 to 1
 */

const DOWN = new Vector3(0,-1,0);
const UP = new Vector3(0,1,0);
const LEFT = new Vector3(1,0,0);
const RIGHT = new Vector3(-1,0,0);
const FORWARDS = new Vector3(0,0,1);
const BACKWARDS = new Vector3(0,0,-1);
const NE = new Vector3(1,0,1).normalize();
const SE = new Vector3(1,0,-1).normalize();
const SW = new Vector3(-1,0,-1).normalize();
const NW = new Vector3(-1,0,1).normalize();
const ZERO = new Vector3(0,0,0)


var keymap = {
    'up':['arrowup','w'],
    'down':['arrowdown','s'],
    'left':['arrowleft','a'],
    'right':['arrowright','d'],
    'action':[' ', 'enter', 'e'],
    'slow':['shift'],
    'speedydebug':['l']
}

var buttonmap = {
    axes:{
        'down':1,
        'right':0,
        'cameraRight':2,
        'cameraDown':3
    },
    buttons:{
        'action':0
    }  
}


function KeyController(){
  
    var gamepad = navigator.webkitGetGamepads && navigator.webkitGetGamepads()[0];
    var self = this;
    self.keys = {};
    self.keymap = keymap;
    window.addEventListener('keyup',onKeyup);
    window.addEventListener('keydown',onKeydown);

    self.touchAction = false;
  
    // read DOM elements (TODO)

    var touchLeftEl = document.getElementById('touch-left')
    var stickEl = document.getElementById('stick')
    var stickCenterEl = document.getElementById('stick-center')
          
    if(isMobile()){
      console.log('touchable')
      document.getElementById('touch-container').style.visibility='initial'
      var touchRightEl = document.getElementById('touch-right');
      touchRightEl.addEventListener('touchstart', function(e){
        touchRightEl.classList.add('pressed')
        self.touchAction = true
      })
      touchRightEl.addEventListener('touchmove', function(e){
        touchRightEl.classList.add('pressed')
        self.touchAction = true
      })
      touchRightEl.addEventListener('touchend', function(e){
        touchRightEl.classList.remove('pressed')
        self.touchAction = false
      })
      

      touchLeftEl.addEventListener('touchstart', stickMove)
      touchLeftEl.addEventListener('touchmove', stickMove)
      function stickMove(e){
        touchLeftEl.classList.add('pressed')
        // get size of stick
        var rect = stick.getBoundingClientRect();
        var deflectionMax = rect.width / 2;
        // get direction from stick
        var dY = e.touches[0].clientY - (rect.y + deflectionMax);
        dY *= -1;
        var dX = e.touches[0].clientX - (rect.x + deflectionMax);

        // normalize dx/dy
        var deflection = Math.sqrt(dX*dX+dY*dY);
        if (deflection > deflectionMax){
          dX = (dX / deflection) * deflectionMax
          dY = (dY / deflection) * deflectionMax
        }
        
        var dXNorm = dX/deflectionMax;
        var dYNorm = dY/deflectionMax;

        self.touchAxes.setZ(dYNorm);
        self.touchAxes.setX(dXNorm);

        stickCenterEl.style.left = self.touchAxes.x * dXNorm;
        stickCenterEl.style.bottom = self.touchAxes.z * dYNorm;

      }
      touchLeftEl.addEventListener('touchend',function(){
        touchLeftEl.classList.remove('pressed')
        self.touchAxes.setZ(0);
        self.touchAxes.setX(0);
      })


    }
    this.buttons = {};
    this.buttonsLastFrame = {};

    this.touchAxes = new Vector3(0,0,0);
    this.dampedTouchAxes = new Vector3(0,0,0);// damped even more!
    this.undampedMovementAxes = new Vector3(0,0,0);
    this.movementAxes = new Vector3(0,0,0);
    this.damping = 10;
    
    function onKeyup(e){
      self.keys[e.key.toLowerCase()] = false;
    }  
    function onKeydown(e){
      self.keys[e.key.toLowerCase()] = true;
    }
    
    function checkKeys(){
  
      var tmpO = {};
      self.buttonsLastFrame = self.buttons;
      self.buttons = tmpO;

      //update keymap keys
      _.each(self.keymap,function(keys,btn){
        self.buttons[btn] = false;
        _.each(keys,function(k){
          if (self.keys[k]){
            self.buttons[btn] = true;
          }
        });
      });    
      //update movement axes    
      self.undampedMovementAxes.set(0,0,0);    
      self.keymap.up.forEach(function(s){
        if (self.keys[s]){
          self.undampedMovementAxes.setZ(1); 
        }
      });
      self.keymap.down.forEach(function(s){
        if (self.keys[s]){
          self.undampedMovementAxes.setZ(-1);
        }
      });
      self.keymap.right.forEach(function(s){
        if (self.keys[s]){
          self.undampedMovementAxes.setX(1);
        }
      });
      self.keymap.left.forEach(function(s){
        if (self.keys[s]){
          self.undampedMovementAxes.setX(-1);
        }
      });
      
      // update gamepad
      gamepad = navigator.getGamepads && navigator.getGamepads()[0];
      if (gamepad){
        
        _.each(buttonmap.buttons,function(idx,name){
          self.buttons[name] = !!gamepad.buttons[idx].pressed;
        });
        
        var x = gamepad.axes[buttonmap.axes.right];
        var y = gamepad.axes[buttonmap.axes.down];
        self.buttons.camX = gamepad.axes[buttonmap.axes.cameraRight];
        self.buttons.camY = gamepad.axes[buttonmap.axes.cameraDown];
        
         //dead zones (camera)
        if (self.buttons.camX*self.buttons.camX+self.buttons.camY*self.buttons.camY < 0.1){
          self.buttons.camX = self.buttons.camY = 0;
        }
        
        //dead zones (movement)
        if (x*x+y*y > 0.1){
          self.undampedMovementAxes.setX(x);
          self.undampedMovementAxes.setZ(-y);
        }
        
      }

      if ( isMobile()){
        // NOTE: dampedTouchAxes is just for the UI.
        self.dampedTouchAxes.multiplyScalar(0.5);
        self.dampedTouchAxes.addScaledVector(self.touchAxes, 0.5);
        self.buttons.action = self.buttons.action || self.touchAction;
        self.undampedMovementAxes.add(self.touchAxes)

        var maxDeflection = stickCenterEl.getBoundingClientRect().width/2
  
        stickCenterEl.style.left = self.dampedTouchAxes.x * maxDeflection;
        stickCenterEl.style.bottom = self.dampedTouchAxes.z * maxDeflection;  
      
      }

      // now update directional "buttons" with joystick
      var THRESH = 0.9;
      self.buttons.down = self.buttons.down || self.undampedMovementAxes.z < -THRESH;
      self.buttons.up = self.buttons.up || self.undampedMovementAxes.z > THRESH;
      self.buttons.left = self.buttons.left || self.undampedMovementAxes.x < -THRESH;
      self.buttons.right = self.buttons.right || self.undampedMovementAxes.x > THRESH;

    }
        
    // update keys etc
    var distVec = new Vector3(0,0,0);// the distance from target and actual vector
    this.update = function(dt){
      checkKeys();
      self.undampedMovementAxes.clampLength(0,1);
      self.undampedMovementAxes.multiplyScalar(self.buttons.slow ? 0.6 : 1);
      distVec.subVectors(self.undampedMovementAxes,self.movementAxes);
      self.movementAxes.addScaledVector(distVec,exponentialEase(dt*15, 0.01));// todo tweak R
    }
    
    return this;
      
  }

var input = new KeyController();

var wasMobile = null;
function isMobile(){
  if (wasMobile === true || wasMobile === false){return wasMobile}
  var isMobile =  navigator.userAgent.toLowerCase().indexOf('mobi') > -1 || 'ontouchstart' in document.documentElement
  wasMobile = isMobile;
  return wasMobile;
}

export {input, UP, DOWN, LEFT, RIGHT, FORWARDS, BACKWARDS, ZERO}

