import {parseFit} from './fit.js';
self.onmessage=async({data})=>{try{self.postMessage({id:data.id,result:await parseFit(data.buffer,data.name)})}catch(error){self.postMessage({id:data.id,error:error.message})}};
