/* Shared, bounded canvas state. Panel dimensions belong to the product, not saved data. */
(function(root,factory){
  var api=factory();
  if(typeof module==='object' && module.exports)module.exports=api;
  if(root)root.OpenBotCanvasLayout=api;
})(typeof window!=='undefined'?window:null,function(){
  'use strict';
  var WIDTH=312,HEIGHT=360,GAP=24,MIN_ZOOM=.2,MAX_ZOOM=1.6,LIMIT=100000;
  function finite(n){return typeof n==='number' && Number.isFinite(n);}
  function clamp(n,a,b){return Math.min(b,Math.max(a,n));}
  function point(value){return value && finite(value.x) && finite(value.y)?{x:clamp(value.x,-LIMIT,LIMIT),y:clamp(value.y,-LIMIT,LIMIT)}:null;}
  function normalize(value,ids){
    var source=value && typeof value==='object'?value:{},camera=point(source.camera);
    if(!camera || !finite(source.camera.zoom))camera=null;
    else camera.zoom=clamp(source.camera.zoom,MIN_ZOOM,MAX_ZOOM);
    var entries=[];
    (ids || []).forEach(function(id){
      if(!source.positions || !Object.prototype.hasOwnProperty.call(source.positions,id))return;
      var p=point(source.positions[id]);if(p)entries.push([id,p]);
    });
    return {version:1,camera:camera,positions:Object.fromEntries(entries)};
  }
  function bounds(positions,ids){
    var points=ids.map(function(id){return positions[id];}).filter(Boolean);
    if(!points.length)return {x:0,y:0,width:WIDTH,height:HEIGHT};
    var x=Math.min.apply(null,points.map(function(p){return p.x;})),y=Math.min.apply(null,points.map(function(p){return p.y;}));
    return {x:x,y:y,width:Math.max.apply(null,points.map(function(p){return p.x+WIDTH;}))-x,height:Math.max.apply(null,points.map(function(p){return p.y+HEIGHT;}))-y};
  }
  function fit(box,width,height){
    var zoom=clamp(Math.min(1,(Math.max(80,width)-48)/box.width,(Math.max(80,height)-48)/box.height),MIN_ZOOM,MAX_ZOOM);
    return {x:24-box.x*zoom,y:24-box.y*zoom,zoom:zoom};
  }
  function columns(count,width,height){
    var best=1,score=-1;
    for(var cols=1;cols<=Math.min(Math.max(1,count),12);cols++){
      var rows=Math.ceil(count/cols),w=cols*WIDTH+(cols-1)*GAP,h=rows*HEIGHT+(rows-1)*GAP;
      var scale=Math.min((width-48)/w,(height-48)/h);
      if(scale>score){score=scale;best=cols;}
    }
    return best;
  }
  function arrange(ids,width,height){
    var cols=columns(ids.length,width,height);
    return Object.fromEntries(ids.map(function(id,i){return [id,{x:(i%cols)*(WIDTH+GAP),y:Math.floor(i/cols)*(HEIGHT+GAP)}];}));
  }
  return {WIDTH:WIDTH,HEIGHT:HEIGHT,GAP:GAP,MIN_ZOOM:MIN_ZOOM,MAX_ZOOM:MAX_ZOOM,LIMIT:LIMIT,clamp:clamp,normalize:normalize,bounds:bounds,fit:fit,columns:columns,arrange:arrange};
});
