window.assetsLoaded = false;
window.started = false;
window.quality = 0;
var loadCount = 0;
const REQUIRED_LOADS = 2;

window.debug = process.env.NODE_ENV === 'development';

window.onAssetLoad = function(str){
    console.log(str)
    loadCount++;
    document.getElementById('loader-message').innerHTML = str + '&hellip;';
    if (loadCount >= REQUIRED_LOADS){
        window.assetsLoaded = true;
        // now click to start, fullscreen
        
        document.getElementById('loader-message').innerHTML = '';
        document.getElementById('loader').removeChild(document.getElementById('loader-progress'))

        function addButton(text, alt, quality){

            var b = document.createElement('button')
            b.innerHTML=text
            b.value = alt;
            b.title = alt;
            function onButtonClick(){
                // document.documentElement.requestFullscreen()
                setTimeout(()=>{
                    
                    document.getElementById('loader').style.display="none"
                    document.getElementById('loader').innerHTML=""
                    b.removeEventListener('click',onButtonClick)
                    window.quality = quality
                    window.started = true;
                    document.documentElement.requestFullscreen()

                },100)
            }
            b.addEventListener('click',onButtonClick)
    
            document.getElementById('loader').appendChild(b)

        }
        addButton("Let's Go, Flamingo!","Start",0);
        if (window.debug){
            document.getElementById('loader').style.display="none"
            document.getElementById('loader').innerHTML=""
            window.started = true;
            window.quality = 1;
        }
    }
}
window.onAssetLoadError = function(e){
    console.error(e);
    alert('Error loading assets, try reloading. Sorry.')
}

import('./main').then((main)=>{
        window.onAssetLoad('Loading Assets')
    }
    ).catch(window.onAssetLoadError)