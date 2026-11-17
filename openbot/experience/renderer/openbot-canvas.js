/* DOM canvas: native text selection/forms inside uniformly sized, movable windows. */
(function(root){
  'use strict';
  var L=root.OpenBotCanvasLayout;
  function create(viewport,world,options){
    var ids=[],frame=0,saveTimer=0,gesture=null,space=false,lastSize=null,layer=1;
    var pointers=new Map();
    function state(){return options.state();}
    function freeCanvas(){return typeof options.mode!=='function' || options.mode()==='canvas';}
    function camera(){return state().camera || {x:0,y:0,zoom:1};}
    function size(){return {width:viewport.clientWidth,height:viewport.clientHeight};}
    function save(){clearTimeout(saveTimer);options.save(state());}
    function saveSoon(){clearTimeout(saveTimer);saveTimer=setTimeout(save,180);}
    function editable(el){return !!el.closest('input,textarea,select,[contenteditable="true"]');}
    function interactive(el){return !!el.closest('button,input,textarea,select,a,summary,[contenteditable="true"]');}
    function panel(id){return Array.from(world.children).find(function(el){return el.dataset.botId===id;});}
    function paint(){
      frame=0;var c=camera();
      world.style.transform=freeCanvas()?'translate('+c.x+'px,'+c.y+'px) scale('+c.zoom+')':'none';
      viewport.style.backgroundSize=(24*c.zoom)+'px '+(24*c.zoom)+'px';
      viewport.style.backgroundPosition=c.x+'px '+c.y+'px';
      Array.from(world.children).forEach(function(el){var p=state().positions[el.dataset.botId];if(p){el.style.left=p.x+'px';el.style.top=p.y+'px';}});
      viewport.dataset.zoom=String(c.zoom);
      options.changed(c);
    }
    function schedule(){if(!frame)frame=requestAnimationFrame(paint);}
    function boundedCamera(c){return {x:L.clamp(c.x,-L.LIMIT,L.LIMIT),y:L.clamp(c.y,-L.LIMIT,L.LIMIT),zoom:L.clamp(c.zoom,L.MIN_ZOOM,L.MAX_ZOOM)};}
    function setCamera(c,persist){state().camera=boundedCamera(c);schedule();if(persist)saveSoon();}
    function zoomTo(value,anchor){
      var c=camera(),s=size(),a=anchor || {x:s.width/2,y:s.height/2},z=L.clamp(value,L.MIN_ZOOM,L.MAX_ZOOM);
      setCamera({x:a.x-(a.x-c.x)*z/c.zoom,y:a.y-(a.y-c.y)*z/c.zoom,zoom:z},true);
    }
    function fit(){var s=size();setCamera(L.fit(L.bounds(state().positions,ids),s.width,s.height),false);save();}
    function arrange(){var s=size();state().positions=L.arrange(ids,s.width,s.height);fit();}
    function sync(nextIds){
      ids=nextIds.slice();var s=size();if(!s.width || !s.height)return;
      if(!ids.length){lastSize=s;paint();return;}
      if(gesture && gesture.id && !ids.includes(gesture.id))finish(true);
      var changed=false,positions=state().positions;
      Object.keys(positions).forEach(function(id){if(!ids.includes(id)){delete positions[id];changed=true;}});
      if(!Object.keys(positions).length && ids.length){state().positions=L.arrange(ids,s.width,s.height);positions=state().positions;changed=true;}
      var cols=L.columns(ids.length,s.width,s.height);
      ids.forEach(function(id){
        if(Object.prototype.hasOwnProperty.call(positions,id))return;
        for(var i=0;i<=ids.length*4;i++){
          var p={x:(i%cols)*(L.WIDTH+L.GAP),y:Math.floor(i/cols)*(L.HEIGHT+L.GAP)};
          var collision=Object.values(positions).some(function(other){return Math.abs(other.x-p.x)<L.WIDTH+L.GAP/2 && Math.abs(other.y-p.y)<L.HEIGHT+L.GAP/2;});
          if(!collision){positions[id]=p;changed=true;break;}
        }
        // Freely moved windows can occupy every nearby slot; append at the right edge.
        if(!Object.prototype.hasOwnProperty.call(positions,id)){var b=L.bounds(positions,ids);positions[id]={x:Math.min(L.LIMIT,b.x+b.width+L.GAP),y:b.y};changed=true;}
      });
      if(!state().camera && freeCanvas()){state().camera=L.fit(L.bounds(positions,ids),s.width,s.height);changed=true;}
      lastSize=s;if(freeCanvas())paint();else options.changed(camera());if(changed)save();
    }
    function raise(el){if(el)el.style.zIndex=String(++layer);}
    function revealElement(el){
      if(!el || !world.contains(el))return;
      var r=el.getBoundingClientRect(),v=viewport.getBoundingClientRect(),c=camera(),dx=0,dy=0;
      if(r.left<v.left+16)dx=v.left+16-r.left;else if(r.right>v.right-16)dx=v.right-16-r.right;
      if(r.top<v.top+16)dy=v.top+16-r.top;else if(r.bottom>v.bottom-16)dy=v.bottom-16-r.bottom;
      if(dx || dy)setCamera({x:c.x+dx,y:c.y+dy,zoom:c.zoom},true);
    }
    function focusBot(id){
      var el=panel(id),p=state().positions[id],s=size();if(!el || !p)return;
      var z=L.clamp(Math.min(1,(s.width-40)/L.WIDTH,(s.height-40)/L.HEIGHT),L.MIN_ZOOM,L.MAX_ZOOM);
      raise(el);setCamera({x:(s.width-L.WIDTH*z)/2-p.x*z,y:(s.height-L.HEIGHT*z)/2-p.y*z,zoom:z},false);paint();save();
      el.querySelector('textarea').focus({preventScroll:true});
    }
    function localPoint(e){var r=viewport.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
    function pinchData(){var p=Array.from(pointers.values());return {x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2,d:Math.max(1,Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y))};}
    function finish(cancel){
      if(!gesture)return;
      var old=gesture;gesture=null;
      if(cancel){state().camera=old.originalCamera;if(old.id && state().positions[old.id])state().positions[old.id]=old.originalPosition;}
      viewport.classList.remove('is-panning','is-dragging');
      world.querySelectorAll('.is-moving').forEach(function(el){el.classList.remove('is-moving');});
      pointers.forEach(function(_,id){if(viewport.hasPointerCapture(id))viewport.releasePointerCapture(id);});pointers.clear();
      schedule();save();
    }
    viewport.addEventListener('pointerdown',function(e){
      if(!freeCanvas())return;
      if(e.button!==0 && e.button!==1)return;
      var el=e.target.closest('.ob-board-panel'),head=e.target.closest('.ob-board-panel-head');
      if(gesture && e.pointerType==='touch' && pointers.size===1){
        e.preventDefault();pointers.set(e.pointerId,localPoint(e));viewport.setPointerCapture(e.pointerId);
        if(gesture.id){world.querySelectorAll('.is-moving').forEach(function(n){n.classList.remove('is-moving');});gesture.id=null;save();}
        gesture={type:'pinch',originalCamera:{...camera()},startCamera:{...camera()},startPinch:pinchData()};return;
      }
      if(gesture)return;
      if(el)raise(el);
      var pan=e.button===1 || (space && !editable(e.target)) || !el;
      if(!pan && (!head || interactive(e.target)))return;
      e.preventDefault();var start=localPoint(e),c={...camera()};
      gesture={type:pan?'pan':'node',pointer:e.pointerId,start:start,startCamera:c,originalCamera:{...c}};
      if(!pan){gesture.id=el.dataset.botId;gesture.originalPosition={...state().positions[gesture.id]};head.focus({preventScroll:true});el.classList.add('is-moving');}
      else viewport.focus({preventScroll:true});
      pointers.set(e.pointerId,start);viewport.setPointerCapture(e.pointerId);viewport.classList.add(pan?'is-panning':'is-dragging');
    });
    viewport.addEventListener('pointermove',function(e){
      if(!gesture || !pointers.has(e.pointerId))return;e.preventDefault();var p=localPoint(e);pointers.set(e.pointerId,p);
      if(gesture.type==='pinch'){
        var pinch=pinchData(),start=gesture.startPinch,c=gesture.startCamera,z=L.clamp(c.zoom*pinch.d/start.d,L.MIN_ZOOM,L.MAX_ZOOM);
        setCamera({x:pinch.x-(start.x-c.x)*z/c.zoom,y:pinch.y-(start.y-c.y)*z/c.zoom,zoom:z},false);return;
      }
      var dx=p.x-gesture.start.x,dy=p.y-gesture.start.y;
      if(gesture.type==='pan')setCamera({x:gesture.startCamera.x+dx,y:gesture.startCamera.y+dy,zoom:gesture.startCamera.zoom},false);
      else {var old=gesture.originalPosition;state().positions[gesture.id]={x:L.clamp(old.x+dx/gesture.startCamera.zoom,-L.LIMIT,L.LIMIT),y:L.clamp(old.y+dy/gesture.startCamera.zoom,-L.LIMIT,L.LIMIT)};schedule();}
    });
    viewport.addEventListener('pointerup',function(e){if(pointers.has(e.pointerId))finish(false);});
    viewport.addEventListener('pointercancel',function(){finish(true);});
    viewport.addEventListener('lostpointercapture',function(){if(gesture)finish(true);});
    viewport.addEventListener('wheel',function(e){
      if(!freeCanvas())return;
      if(e.ctrlKey || e.metaKey){e.preventDefault();zoomTo(camera().zoom*Math.exp(-e.deltaY*.008),localPoint(e));return;}
      if(e.target.closest('.ob-board-transcript,.ob-board-progress,textarea,.tool-approval-details'))return;
      e.preventDefault();var c=camera(),unit=e.deltaMode===1?16:e.deltaMode===2?viewport.clientHeight:1;
      setCamera({x:c.x-(e.shiftKey && !e.deltaX?e.deltaY:e.deltaX)*unit,y:c.y-(e.shiftKey && !e.deltaX?0:e.deltaY)*unit,zoom:c.zoom},true);
    },{passive:false});
    viewport.addEventListener('keydown',function(e){
      if(!freeCanvas())return;
      if(e.isComposing || editable(e.target))return;
      if(e.key==='Escape' && gesture){e.preventDefault();finish(true);return;}
      if(e.key===' ' && !interactive(e.target)){e.preventDefault();space=true;viewport.classList.add('space-pan');return;}
      var head=e.target.closest('.ob-board-panel-head'),el=e.target.closest('.ob-board-panel');
      var arrows={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
      if(arrows[e.key] && ((head && e.target===head) || e.target===viewport)){
        e.preventDefault();var step=e.shiftKey?100:20,move=arrows[e.key];
        if(head){var p=state().positions[el.dataset.botId];state().positions[el.dataset.botId]={x:L.clamp(p.x+move[0]*step,-L.LIMIT,L.LIMIT),y:L.clamp(p.y+move[1]*step,-L.LIMIT,L.LIMIT)};raise(el);schedule();}
        else {var c=camera();setCamera({x:c.x-move[0]*step*4,y:c.y-move[1]*step*4,zoom:c.zoom},false);}
        save();return;
      }
      if(e.target!==viewport)return;
      if(e.key==='+' || e.key==='='){e.preventDefault();zoomTo(camera().zoom*1.2);}
      else if(e.key==='-'){e.preventDefault();zoomTo(camera().zoom/1.2);}
      else if(e.key==='0'){e.preventDefault();zoomTo(1);}
      else if(e.key==='Home'){e.preventDefault();fit();}
    });
    function releaseSpace(){space=false;viewport.classList.remove('space-pan');}
    root.addEventListener('keyup',function(e){if(e.key===' ')releaseSpace();});
    root.addEventListener('blur',function(){releaseSpace();finish(true);});
    viewport.addEventListener('focusin',function(e){if(gesture)return;raise(e.target.closest('.ob-board-panel'));if(freeCanvas())revealElement(e.target);});
    viewport.addEventListener('scroll',function(){if(!freeCanvas())options.changed(camera());},{passive:true});
    var resizeObserver=new ResizeObserver(function(){
      var s=size();if(!s.width || !s.height || !ids.length)return;
      if(!freeCanvas()){lastSize=s;options.changed(camera());return;}
      if(!state().camera){sync(ids);return;}
      if(lastSize && (lastSize.width!==s.width || lastSize.height!==s.height)){
        var c=camera();setCamera({x:c.x+(s.width-lastSize.width)/2,y:c.y+(s.height-lastSize.height)/2,zoom:c.zoom},true);
        paint();revealElement(document.activeElement);
      }
      lastSize=s;
    });resizeObserver.observe(viewport);
    return {sync:sync,fit:fit,arrange:arrange,zoom:zoomTo,focusBot:focusBot,cancel:function(){releaseSpace();finish(true);},visibleIds:function(){
      if(!freeCanvas()){
        var bounds=viewport.getBoundingClientRect();
        return ids.filter(function(id){
          var el=panel(id);if(!el)return false;var r=el.getBoundingClientRect();
          if(r.right<=bounds.left || r.left>=bounds.right || r.bottom<=bounds.top || r.top>=bounds.bottom)return false;
          var x=Math.max(bounds.left+1,Math.min(bounds.right-1,(r.left+r.right)/2));
          var y=Math.max(bounds.top+1,Math.min(bounds.bottom-1,(r.top+r.bottom)/2));
          var top=root.document.elementFromPoint(x,y);
          return top===el || el.contains(top);
        });
      }
      var c=camera(),s=size();return ids.filter(function(id){var p=state().positions[id];return p && (p.x+L.WIDTH)*c.zoom+c.x>-80 && p.x*c.zoom+c.x<s.width+80 && (p.y+L.HEIGHT)*c.zoom+c.y>-80 && p.y*c.zoom+c.y<s.height+80;});
    }};
  }
  root.OpenBotCanvas={create:create};
})(window);
