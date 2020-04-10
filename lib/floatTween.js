
function FloatTween(start, end, duration){
    var n = 0;
    return function(delta){
        n+= delta;
        n = Math.min(n,duration);
        return start + (end - start) * (n/duration);
    }
}


export {FloatTween}