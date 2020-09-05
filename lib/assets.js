import {TextureLoader, NearestFilter} from "three"
import {each} from "lodash"

// load assets to a map

var assets = {
    textures: {
        duk1:new TextureLoader().load("./duk_1.png"),
        duk2:new TextureLoader().load("./duk_2.png"),
    }
}

each(assets.textures, function(val, key){
    val.magFilter = NearestFilter
})


export {assets}