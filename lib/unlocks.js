import {cloneDeep, clone, forEach} from 'lodash'
import { TextureLoader, Object3D, RepeatWrapping, LinearToneMapping} from "three";
import {startCase, toLower, filter} from "lodash" 
import { entities } from './entities';
import { confettiExplode } from './post-processing/confetti';

var outfitNames = ['rubber ducky shirt','jailbird shirt',"poncho"]

/**
 * will be...
 * 
 * {
 *  "rubber ducky":{texture:Object, name:"Rubber Ducky Shirt", key:"rubber ducky"},
 *   ...
 * }
 * 
 */
var outfits = {}
outfitNames.forEach(name=>{
    var filename = 'outfits/'+name.toLowerCase().split(' ').filter(s=>s!='shirt').join('_')+'.png'
    var t = new TextureLoader().load(filename);
    t.flipY = false;
    t.wrapS = 1000
    t.wrapT = 1000
    outfits[name] = {
        texture: t,
        title: startCase(toLower(name)),
        key: name,
        name:name
    }
})

var skins = {
    flamingo:{
        name:'flamingo',
        weights:[0,0],
        texture:new TextureLoader().load('skins/flamingo.png'),
        unlocked_by_default:true
    },
    pigeon:{
        name:'pigeon',
        weights:[0.9,0],
        texture:new TextureLoader().load('skins/pigeon.png'),
    }
}

var LSKEY = 'UNLOCKS'

var unlocks_default = {
    outfits:{},
    currentOutfitName:'rubber ducky shirt',
    skins:{},
    currentSkinName:'flamingo'
}
// init unlocks_default 
outfitNames.forEach((name, index)=>{
    // unlock the first one
    unlocks_default.outfits[name] = (index == 0) ? true : false;
})
forEach(skins,(s)=>{
    unlocks_default.skins[s.name] = !!s.unlocked_by_default
    s.texture.flipY = false;
})

var unlocks = {}

function readUnlocks(){
    try{
        unlocks = JSON.parse(localStorage.getItem(LSKEY))
    } catch{
        unlocks = cloneDeep(unlocks_default)
    }
    if (!unlocks){
        unlocks = cloneDeep(unlocks_default)
    }
}

function writeUnlocks(){
    localStorage.setItem(LSKEY, JSON.stringify(unlocks));
}


// on init, read and write
readUnlocks();
writeUnlocks();


// substitute a new texture while inheriting parameters from the original one
function subTexture(mat, newTex){
    if (newTex._subbed){
        mat.map = newTex;
    }
    ['encoding','wrapS','wrapT','flipY','minFilter','magFilter'].forEach(k=>{
        newTex[k] = mat.map[k]
    })
    newTex.needsUpdate = true;
    mat.map = newTex;
    newTex._subbed = true;
}

function getOutfits(){
    var ret = outfitNames.map(k=>clone(outfits[k]));
    ret.forEach((o)=>{
        o.unlocked = unlocks.outfits[o.key];
        o.locked = !o.unlocked;
    });
    return ret;
}

function getUnlockedOutfits(){
    return filter(getOutfits(),'unlocked')
}

function unlockOutfitByName(name){
    if (unlocks.outfits[name]){
        return;
    }
    var outfit = getOutfitByName(name);
    fanfare(`You unlocked the ${outfit.title} outfit! Apply it by visiting the TBD.`);
    unlocks.outfits[name] = true;
    writeUnlocks()
}

function getOutfitByName(name){
    var o = clone(outfits[name]);
    if (!o){console.error('this is not an outfit I know about: '+name);return null;}
    o.unlocked = unlocks.outfits[o.key];
    o.locked = !o.unlocked;
    return o;
}

/**
 * apply an outfit to the player
 * @param {string} which the outfit (or outfit name) to apply
 */
function applyOutfit(which, target){
    var o;
    if (typeof which == 'string'){
        o = getOutfitByName(which)
    } else {
        o = which;
    }
    var target = target || entities.clothes;
    subTexture(target.material, o.texture)
    unlocks.currentOutfitName = o.key;
    writeUnlocks()
}

function getCurrentOutfit(){
    return getOutfitByName(unlocks.currentOutfitName);
}

function loadOutfit(){
    applyOutfit(getCurrentOutfit())
}


// skins
function getSkins(){
    var ret = [];
    forEach(skins, (val)=>{
        var o = clone(val);
        o.unlocked = unlocks.skins[val.name]
        o.locked = !o.unlocked
        ret.push(o)
    })
    return ret;
}
function getUnlockedSkins(){
    return filter(getSkins,'unlocked');
}
function getSkinByName(name){
    var o = clone(skins[name])
    o.unlocked = unlocks.skins[name];
    o.locked = !o.unlocked;
    return o
}
function getCurrentSkin(){
    return getSkinByName(unlocks.currentSkinName);
}
function applySkin(which){
    var skin;
    if (typeof which == 'string'){
        skin = getSkinByName(which)
    } else {
        skin = which;
    }
    var target = entities.character;
    target.traverse(o=>{
        if (o.morphTargetInfluences){
            for (var i = 0; i < skin.weights.length && i < o.morphTargetInfluences.length; i++){
                o.morphTargetInfluences[i] = skin.weights[i]
            }
            if (o.material.name == 'body'){
                subTexture(o.material, skin.texture)
            }
        }
    })
}

function loadSkin(){
    applySkin(getCurrentSkin())
}
function unlockSkinByName(name){
    if (unlocks.skins[name]){
        return;
    }
    var skin = getSkinByName(name);
    fanfare(`You unlocked the ${skin.name} skin! Apply it by visiting the TBD.`);
    unlocks.skins[name] = true;
    writeUnlocks()
}

function fanfare(msg){
    confettiExplode(entities.player.armature.position);
    document.getElementById('cheevo').classList.remove('show');
    // show message popup in 1s
    setTimeout(_=>{
        document.getElementById('cheevo').classList.add('show');
        document.getElementById('cheevo-text').innerHTML = msg;
        setTimeout(_=>{ // dismiss popup 6s later
            document.getElementById('cheevo').classList.remove('show');
        },6000) 
    },1000)
    
}

// C is confetti key in debug mode
if (window.debug){
    window.addEventListener('keydown',(e)=>{
        if (e.key.toLowerCase() == 'c'){
            fanfare('AAAAAAAAAAAA ASD ASD ASD ASDKNALSKDNA LKSDN ALKSDN ALKSDN ')
        }
    })
}

export {
    getOutfits,
    getOutfitByName,
    getUnlockedOutfits,
    unlockOutfitByName,
    applyOutfit,
    loadOutfit,
    getCurrentOutfit,

    getSkins,
    getSkinByName,
    getUnlockedSkins,
    unlockSkinByName,
    applySkin,
    loadSkin,
    getCurrentSkin
}