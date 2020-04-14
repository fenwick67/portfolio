import {input} from "./input"
import _ from 'lodash'

var c = document.getElementById('dialog-canvas')
var ctx = c.getContext('2d');

const delay = 300;

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
        else if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}


function showDialog(name, nameColor, text, options){
    return new Promise(function(resolve, reject){
        c.classList.add('active')
        ctx.imageSmoothingEnabled=false;
        
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
        stripeImage.src ='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAMAAABhq6zVAAAAAXNSR0IArs4c6QAAAGBQTFRFAAAAIiA0RSg8Zjkxj1Y733Em2aBm7sOa+/I2meVQar4wN5RuS2kvUkskMjw5Pz90MGCCW27hY5v/X83ky9v8////m623hH6HaWpqWVZSdkKKrDIy2Vdj13u6j5dKim8w+2O8zwAAACB0Uk5TAP////////////////////////////////////////+Smq12AAAAM0lEQVQImU3NsQEAMAgCQRpGYP9VE5UYqO4bhdhTDWHHmAh3PFesb3wTYYfvI9yxfxHWATsaB1EpURS2AAAAAElFTkSuQmCC';
        var stripePattern
        
        var arrowImage = document.createElement('img');
        arrowImage.onload = onLoad
        arrowImage.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAHCAMAAAD3eXfcAAAAAXNSR0IArs4c6QAAAGBQTFRFAAAAIiA0RSg8Zjkxj1Y733Em2aBm7sOa+/I2meVQar4wN5RuS2kvUkskMjw5Pz90MGCCW27hY5v/X83ky9v8////m623hH6HaWpqWVZSdkKKrDIy2Vdj13u6j5dKim8w+2O8zwAAACB0Uk5TAP////////////////////////////////////////+Smq12AAAAHElEQVQImWMQFGQAAkEhQTAJooAkkIKxweIgAgAiDgGRYtUzFgAAAABJRU5ErkJggg==';
        
        ctx.font = '12px sans-serif'
        ctx.textBaseline='center'
        
        var lines = getLines(ctx, text, boxW - border*4)
        
        var linesChunks = _.chunk(lines, nLines);
        var linesChunkIndex = 0
        
        var loadCount = 0;
        var imageCount = 2;
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
            ctx.translate(0,-25)
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
            
            drawBox(10,35,boxW, boxH)
            
            ctx.fillStyle='black';
            var m = 0;
            var charCount = linesChunks[linesChunkIndex].join('').length
            textDone = false;
            ctx.font = '12px sans-serif'
            for (var i = 0; i < linesChunks[linesChunkIndex].length; i++){
                var s = linesChunks[linesChunkIndex][i].slice(0,Math.round(Math.max(n,0))-m);
                m+= s.length;
                ctx.strokeStyle='white'
                ctx.strokeText(s, 10+centerX - boxW/2 + border*2, border * 2 + centerY - boxH/2 + (i+0.65)*(boxH-border/4)/(nLines+1), boxW)
                ctx.fillText(s, 10+centerX - boxW/2 + border*2, border * 2 + centerY - boxH/2 + (i+0.65)*(boxH-border/4)/(nLines+1), boxW)
                
                // console.log(m,charCount)
                if (m >= charCount){
                    textDone = true;
                }
            }
            if(textDone && !optionsShowing){
                ctx.drawImage(arrowImage, boxW/2 - border*3 + centerX, boxH/2 - border*4 + centerY)
            }
            
            if(name){
                ctx.font = '12px sans-serif'
                var w = ctx.measureText(name).width
                ctx.fillStyle=nameColor;
                ctx.strokeStyle="white"
                ctx.lineWidth = 2
                roundRect(3.5,27.5,w+8,20, 7)
                roundRect(3.5,26.5,w+8,20, 7)
                ctx.fillStyle='rgba(0,0,0,0.999)'
                // ctx.strokeStyle='rgba(255,255,255,0.5)'
                // ctx.strokeText(name, 7,40)
                ctx.fillText(name, 7,40)
            }
            
            if (optionsShowing){
                var w = 0;
                ctx.font = '12px sans-serif'
                ctx.fillStyle='rgba(255,255,255,0.7)'
                ctx.strokeStyle="rgba(0,0,0,0.3)"
                
                options.forEach(s=>w = Math.max(w,ctx.measureText(s).width));
                ctx.save()
                ctx.translate(190-w,35)
                roundRect(5,11,w+23,options.length * 15+10, 10)
                roundRect(5,10,w+23,options.length * 15+10, 10)
                ctx.fillStyle = 'black'
                ctx.strokeStyle='white'
                options.forEach((s,idx)=>{
                    ctx.strokeText(s,20,idx*15 + 25)
                    ctx.fillText(s,20,idx*15 + 25)
                })
                ctx.drawImage(arrowImage, 10, optionPos*15+18)
                ctx.restore()
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
                return resolve(optionPos)        
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
                    return resolve(null);
                } else {
                    optionsShowing = true;
                }
            }
            
        }
        
        function onArrowDown(){
            if (optionsShowing){
                optionPos ++;
                optionPos = Math.min(optionPos,options.length - 1);
            }
        }
        
        function onArrowUp(){
            if (optionsShowing){
                optionPos --;
                optionPos = Math.max(optionPos,0);
                
            }
        }
        
        function drawBox(x,y,w,h){
            var animScale = 0.03
            ctx.save()
            ctx.translate(t*animScale,0);
            ctx.fillStyle=stripePattern;
            
            ctx.fillRect(x-t*animScale, y, w, h);
            ctx.restore()
            ctx.fillStyle="rgba(255,255,255,0.8)";
            ctx.fillRect(x + border, y + border, w-border*2, h-border*2);
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
        //
    })
}

export {showDialog}