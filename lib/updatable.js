import {sortBy} from 'lodash'

// make an object updatable
// adds an update function to the mesh's userdata for now, takes a priority that schedules when it is executed.

/**
 * make an object updatable (have a function that will be called every frame)
 * @param {Object3d} o the object to make updatable
 * @param {function(number)} func the update function to be called. Will be bound to the object o and called with frame delta
 * @param {number} priority the priority of the update function, higher means later.
 */
function makeUpdatable(o, func, priority){
    if (o.userData.update){console.error('this object already has an update function', o)}
    o.userData.update = func.bind(o);
    o.userData.updatePriority = priority || 0;
}

/**
 * update all updatables in the scene
 * @param {*} scene 
 */
function updateObjects(scene, delta){
    var updatables = []
    scene.traverse((o)=>{
        if (o.userData.update){
            updatables.push(o)
        }
    })
    updatables = sortBy(updatables, o=>o.userData?.updatePriority || 0)
    updatables.forEach(o=>o.userData.update(delta))
}

export {makeUpdatable, updateObjects}