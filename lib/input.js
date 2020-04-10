import {Vector3} from "three"
var _ = require('lodash')

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
    'up':['ArrowUp','w'],
    'down':['ArrowDown','s'],
    'left':['ArrowLeft','a'],
    'right':['ArrowRight','d'],
    'action':[' ', 'Enter', 'e']
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
    this.buttons = {};
    this.buttonsLastFrame = {};
    
    this.undampedMovementAxes = new Vector3(0,0,0);
    this.movementAxes = new Vector3(0,0,0);
    this.damping = 10;
    
    function onKeyup(e){
      self.keys[e.key] = false;
    }  
    function onKeydown(e){
      self.keys[e.key] = true;
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
      
    }
        
    // update keys etc
    var distVec = new Vector3(0,0,0);// the distance from target and actual vector
    this.update = function(dt){
      checkKeys();
      self.undampedMovementAxes.clampLength(0,1);
      distVec.subVectors(self.undampedMovementAxes,self.movementAxes);
      var d = Math.min(self.damping*dt,1);    
      self.movementAxes.add(distVec.multiplyScalar(d));
    }
    
    return this;
      
  }

var input = new KeyController();
export {input, UP, ZERO}