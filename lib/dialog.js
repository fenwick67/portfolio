import {input} from "./input"
import _ from 'lodash'
import { entities } from "./entities";
import { AudioLoader, Audio } from "three";

var c = document.getElementById('dialog-canvas')
var ctx = c.getContext('2d');

const delay = 300;
const fontFam = 'sans-serif'

var sc = 2;
var canvasW = Math.round(sc * 220);// only modify this for scaling!
var canvasH = Math.round(sc * 140);
c.width = canvasW;
c.height = canvasH;

// window.addEventListener('resize',updateSize, false)

// scaling on canvas
// var sc = canvasW/220;

function getLines(ctx, text, maxWidth) {
    var words = text.split(" ");
    var lines = [];
    var currentLine = words[0];
    
    for (var i = 1; i < words.length; i++) {
        var word = words[i];
        var width = ctx.measureText(currentLine + " " + word).width;
        if (word.indexOf('\n') > -1){
            lines.push(currentLine);
            currentLine = word.replace('\n','');
        }
        else if (width < maxWidth*sc) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

var sound = null;

function showDialog(name, nameColor, text, options){


    if (sound == null){
        var listener = entities.player.playerCam.audioListener;
        sound = new Audio( listener );

        var audioLoader = new AudioLoader();
        audioLoader.load('sound/blip.wav',function(buffer){
            sound.setBuffer(buffer);
            sound.setLoop(true);
	        sound.setVolume(0.5);
        })
    }

    return new Promise(function(resolve, reject){
        c.classList.add('active')
        ctx.imageSmoothingEnabled=false;
        ctx.miterLimit = 1;
        
        var done = false;
        var optionsShowing = false;
        var optionPos = 0;
        
        var boxW = 200;
        var boxH = 125;
        var border=5;
        var centerX = 100
        var centerY = 100
        var nLines = 4
        var stripeImage = document.createElement('img');
        stripeImage.onload=onLoad
        stripeImage.src ='bgstripes.png';
        var stripePattern
        
        ctx.font = `${Math.round(12*sc)}px `+fontFam
        ctx.textBaseline='center'
        
        var lines = getLines(ctx, text, boxW - border*4)
        
        var linesChunks = _.chunk(lines, nLines);
        var linesChunkIndex = 0
        
        var loadCount = 0;
        var imageCount = 1;
        function onLoad(){
            loadCount++;
            if(loadCount == imageCount){
                stripePattern = ctx.createPattern(stripeImage, 'repeat');
                requestAnimationFrame(update);
            }
        }
        
        var _lastTime = 0;
        var t = 0;
        var n = 0;
        var textDone = false;
        var scrollingFast = false;
        function clear(ctx){
            ctx.save()
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height);
            ctx.restore();
        }

        function update(_time){
            if (done){clear(ctx);return}
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.translate(0,-25*sc)
            if (_lastTime == 0){
                _lastTime = _time;
            }
            var delta = _time - _lastTime;
            _lastTime = _time;
            t += delta;
            
            if (input.buttons.action && !input.buttonsLastFrame.action){
                onClick()
            }
            if (input.buttons.up && !input.buttonsLastFrame.up){
                onArrowUp()
            }
            if (input.buttons.down && !input.buttonsLastFrame.down){
                onArrowDown()
            }
            
            if (t > delay){
                n = n + delta *(scrollingFast ? 0.1 : 0.03);
            }
            clear(ctx)
            
            drawBox(10*sc,35*sc,boxW*sc, boxH*sc)
            
            ctx.fillStyle='black';
            var m = 0;
            var charCount = linesChunks[linesChunkIndex].join('').length
            textDone = false;
            for (var i = 0; i < linesChunks[linesChunkIndex].length; i++){
                var s = linesChunks[linesChunkIndex][i].slice(0,Math.round(Math.max(n,0))-m);
                m+= s.length;
                ctx.strokeStyle='rgba(255,255,255,0.8)'
                ctx.strokeText(s, (10+centerX - boxW/2 + border*2)*sc, (border * 2 + centerY - boxH/2 + (i+0.65)*(boxH-border/4)/(nLines+1))*sc, boxW*sc)
                ctx.fillText(s, (10+centerX - boxW/2 + border*2)*sc, (border * 2 + centerY - boxH/2 + (i+0.65)*(boxH-border/4)/(nLines+1))*sc, boxW*sc)
                
                // console.log(m,charCount)
                if (m >= charCount){
                    textDone = true;
                }
            }
            if(textDone && !optionsShowing){
                drawArrow( (boxW/2 - border*3 + centerX)*sc, (boxH/2 - border*4 + centerY)*sc)
            }
            
            if(name){
                var w = ctx.measureText(name).width/sc
                ctx.fillStyle=nameColor || 'white';
                ctx.strokeStyle="white"
                ctx.lineWidth = 2*sc
                ctx.save()
                var scaleAnim = 0.0020 * (t - 250) + 0.5
                var rot = -0.05 * Math.sin(t*0.003);
                scaleAnim = Math.max(scaleAnim, 0.0);
                scaleAnim = Math.min(scaleAnim, 1);
                ctx.translate(3.5*sc + ((w+8)*sc) / 2, 32.5*sc + 20*sc/2 );
                ctx.scale(scaleAnim, scaleAnim)
                ctx.rotate(rot);
                ctx.translate(-3.5*sc - ((w+8)*sc) / 2, -32.5*sc - 20*sc/2 );
                roundRect(3.5*sc,32.5*sc,(w+8)*sc,20*sc,7*sc)
                // roundRect(3.5*sc,26.5*sc,(w+8)*sc,20*sc,7*sc)
                ctx.fillStyle='rgba(0,0,0,0.6)'
                // ctx.strokeStyle='rgba(255,255,255,0.5)'
                // ctx.strokeText(name, 7,40)
                ctx.fillText(name, 7*sc,46*sc)
                ctx.restore()
            }
            
            if (optionsShowing){
                var w = 0;
                ctx.fillStyle='white';
                ctx.strokeStyle=nameColor || "rgba(0,0,0,0.3)"
                
                options.forEach(s=>w = Math.max(w,ctx.measureText(s).width/sc));
                ctx.save()
                ctx.translate((190-w)*sc,35*sc)
                roundRect(5*sc,11*sc,(w+23)*sc,(options.length * 15+10)*sc, 10*sc)
                ctx.fillStyle = 'rgba(0,0,0,0.8)'
                // ctx.strokeStyle='white'
                options.forEach((s,idx)=>{
                    ctx.fillText(s,20*sc,(idx*15 + 26)*sc)
                })
                drawArrow(10*sc, (optionPos*15+18)*sc)
                ctx.restore()
            }

            // handle audio
            if (sound){
                if (textDone){
                    sound.setLoop(false)
                } else if (m > 0) {
                    sound.setLoop(true)
                    if (!sound.isPlaying){
                        sound.play()
                    }
                }
            }
            requestAnimationFrame(update)
        }
        
        
        function onClick(){
            if (!textDone){
                scrollingFast = true;
                return
            }

            if (textDone){
                scrollingFast = false;
            }
            
            if (optionsShowing){
                done = true;
                clear(ctx)
                c.classList.remove('active')
                if (!sound.isPlaying){
                    sound.play()
                }
                return setTimeout(()=>resolve(optionPos),delay)
            }
            
            if (linesChunkIndex < linesChunks.length - 1){
                n = 0;
                linesChunkIndex++;
            } 
            
            else if (textDone && linesChunkIndex == linesChunks.length - 1){
                if (!options){
                    done = true;
                    clear(ctx)
                    c.classList.remove('active')
                    if (!sound.isPlaying){
                        sound.play()
                    }
                    return setTimeout(()=>resolve(null),delay)
                } else {
                    optionsShowing = true;
                }
            }
            
        }
        
        function onArrowDown(){
            if (optionsShowing){
                optionPos ++;
                optionPos = Math.min(optionPos,options.length - 1);
                if (!sound.isPlaying){
                    sound.play()
                }
            }
        }
        
        function onArrowUp(){
            if (optionsShowing){
                optionPos --;
                optionPos = Math.max(optionPos,0);
                if (!sound.isPlaying){
                    sound.play()
                }
            }
        }
        
        function drawBox(x,y,w,h){
            
            ctx.strokeStyle = "white";
            // roundRect(x,y,w,h,)
            var animScale = 0.03
            ctx.save()
            ctx.translate(t*animScale,0);
            ctx.fillStyle=stripePattern;
            
            roundRect(x-t*animScale,y,w,h)
            // ctx.fillRect(x-t*animScale, y, w, h);
            ctx.restore()
            ctx.fillStyle="rgba(255,255,255,0.5)";
            ctx.strokeStyle = "transparent";
            // ctx.lineWidth = 0;
            roundRect(x,y,w,h)
            // ctx.fillRect(x + border, y + border, w-border*2, h-border*2);
        }
        
        //
        function roundRect(x, y, width, height, radius) {  
            var radius = radius || Math.min(width, height)*0.25
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
        }
        function drawArrow(x,y){
            ctx.miterLimit = 10;

            var w = 5*sc;
            var h = 7*sc;
            ctx.fillStyle="#79f";
            ctx.strokeStyle = "white";
            ctx.lineWidth = sc*2;

            ctx.beginPath();
            ctx.moveTo(x, y)
            ctx.lineTo(x + w, y + h/2);
            ctx.lineTo(x, y + h);
            ctx.closePath()
            ctx.stroke();
            ctx.fill();
            ctx.miterLimit = 1;

        }
        //
    })
}

export {showDialog}