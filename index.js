window.assetsLoaded = false;
window.started = false;
window.quality = 0;
var loadCount = 0;
const REQUIRED_LOADS = 2;

window.debug = process.env.NODE_ENV === 'development';

var mainFunc = null;

window.onAssetLoad = function(str){
    console.log(str)
    loadCount++;
    document.getElementById('loader-message').innerHTML = str + '&hellip;';
    if (loadCount >= REQUIRED_LOADS){
        window.assetsLoaded = true;
        // now click to start, fullscreen
        
        document.getElementById('loader-message').innerHTML = 'Select graphics quality';
        document.getElementById('loader').removeChild(document.getElementById('loader-progress'))

        function addButton(text, alt, quality){

            var b = document.createElement('button')
            b.innerHTML=text
            b.value = alt;
            b.title = alt;
            function onButtonClick(){
                // document.documentElement.requestFullscreen()

                // give me 100ms for stuff to work out
                setTimeout(()=>{
                    
                    document.getElementById('loader').style.display="none"
                    document.getElementById('loader').innerHTML=""
                    b.removeEventListener('click',onButtonClick)
                    window.quality = quality
                    window.started = true;
                    mainFunc(quality)
                    document.documentElement.requestFullscreen()

                },100)
            }
            b.addEventListener('click',onButtonClick)
    
            document.getElementById('loader').appendChild(b)

        }
        // addButton("Potato 🥔&#xFE0F;","Start",-1);
        addButton("Lo-Fi 👾&#xFE0F;","Lowers render resolution",0);
        addButton("Normal 💻&#xFE0F;","Turn on shadowmaps and antialiasing",1);
        addButton("Pretty ✨&#xFE0F;💻&#xFE0F;✨&#xFE0F;","Turn on shadowmaps and antialiasing",2);
        if (window.debug){
            document.getElementById('loader').style.display="none"
            document.getElementById('loader').innerHTML=""
            window.started = true;
            window.quality = 2;
            setTimeout(_=>mainFunc(window.quality),1)
        }
    }
}
window.onAssetLoadError = function(e){
    console.error(e);
    alert('Error loading assets, try reloading. Sorry.')
}

import('./main').then((main)=>{
        mainFunc = main.run;
        window.onAssetLoad('Loading Assets')
        main.init();
    }
    ).catch(window.onAssetLoadError)