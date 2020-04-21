console.log('loading')

import('./main').then(main=>console.log('loaded js bundle')).catch((e)=>{
    console.error(e);
    alert('error loading javascript bundle')
})