import {cloneDeep, clone, forEach} from 'lodash'
import { TextureLoader, Object3D} from "three";
import {startCase, toLower, filter} from "lodash" 
import { entities } from './entities';

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
    outfits[name] = {
        texture: t,
        title: startCase(toLower(name)),
        key: name,
        name:name
    }
})

var LSKEY = 'UNLOCKS'

var unlocks_default = {
    outfits:{},
    currentOutfitName:'rubber ducky shirt'
}
// init unlocks_default 
outfitNames.forEach((name, index)=>{
    // unlock the first one
    unlocks_default.outfits[name] = (index == 0) ? true : false;
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
    target.material.map = o.texture;
    unlocks.currentOutfitName = o.key;
}

function getCurrentOutfit(){
    return getOutfitByName(unlocks.currentOutfitName);
}

function loadOutfit(){
    applyOutfit(getCurrentOutfit())
}


export {getOutfits, getOutfitByName, getUnlockedOutfits, unlockOutfitByName, applyOutfit, loadOutfit, getCurrentOutfit}