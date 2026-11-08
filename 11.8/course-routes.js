(function(){
 const source=window.JINYUN_RESOURCE_POINTS||[];
 const byId=new Map(source.map(x=>[x.id,x]));
 const courses=window.JINYUN_NATURE_COURSES||[];
 const select=document.getElementById('natureCourse');
 const info=document.getElementById('courseDetail');
 const status=document.getElementById('courseStatus');
 if(!select || !info || !status || !document.getElementById('clearCourse')) {
  console.warn('缺少课程控件，已跳过课程初始化。');
  window.initializeCourseRoutes = function(){ /* 页面未包含课程控件时保持地图可用 */ };
  return;
 }
 courses.forEach(c=>{const o=document.createElement('option');o.value=c.id;o.textContent=c.title;select.append(o)});
 let active=[];let activeRoute=[];let revision=0;
 const clear=()=>{active.forEach(x=>x.setMap(null));activeRoute.forEach(x=>x.setMap(null));active=[];activeRoute=[];};
 const esc=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 window.initializeCourseRoutes=function({map,AMap,toAmapPoint,selectDestination,resourcePointController}){
  function render(course){
   ++revision;const current=revision;clear();
   if(!course){info.textContent='选择课程后查看教学目标与站点。';status.textContent='';return}
   const items=course.pointIds.map(id=>byId.get(id)).filter(Boolean);
   if(items.length<2){status.textContent='该课程点位数据不足。';return}
   const positions=items.map(x=>toAmapPoint([x.latitude,x.longitude]));
   info.innerHTML=`<b>${esc(course.title)}</b><p>${esc(course.description)}</p><p>课程区域：${esc(course.area)} · ${items.length} 个教学站点</p><ol>${items.map((x,i)=>`<li><button type="button" data-course-stop="${esc(x.id)}">${i+1}. ${esc(x.name)}</button><span>${esc(x.educationTheme||x.summary||'现场观察')}</span></li>`).join('')}</ol>`;
   info.querySelectorAll('[data-course-stop]').forEach(el=>el.onclick=()=>resourcePointController.showResource(el.dataset.courseStop));
   items.forEach((item,i)=>{
    const marker=new AMap.Marker({position:positions[i],title:item.name,content:`<div class="course-pin" title="${esc(item.name)}">${i+1}</div>`,offset:new AMap.Pixel(-14,-14),zIndex:180});
    marker.on('click',()=>{selectDestination({name:item.name,position:positions[i],marker});resourcePointController.showResource(item.id)});
    marker.setMap(map);active.push(marker);
   });
   map.setFitView(active,false,[80,85,80,380],16);
   status.textContent='正在尝试沿高德步行路网规划课程路线…';
   // Each teaching leg is independently requested from the public walking route service.
   let done=0,failed=0;
   const walkLeg=(i)=>{
    if(current!==revision)return;
    if(i===positions.length-1){
     status.textContent=failed?`已连接 ${done} 段步行路网；另有 ${failed} 段仅用虚线标示教学点之间的方向，非实际可通行路线。请现场核对步道及准入条件。`:`已生成 ${done} 段步行路线。仅供课程设计参考，现场以开放步道和安全指示为准。`;
     return;
    }
    const drawLeg=(route)=>{
     if(current!==revision)return;
     const usable=route&&Array.isArray(route.steps)&&route.steps.length;
     const coords=usable?route.steps.flatMap(step=>step.path||[]):[positions[i],positions[i+1]];
     const line=new AMap.Polyline({path:coords.length>1?coords:[positions[i],positions[i+1]],strokeColor:usable?'#f28b27':'#b2a28b',strokeWeight:usable?6:3,strokeStyle:usable?'solid':'dashed',strokeOpacity:.88,zIndex:155});
     line.setMap(map);activeRoute.push(line);
     if(usable)done++;else failed++;
     walkLeg(i+1);
   };
   if(typeof AMap.Walking!=='function'){drawLeg(null);return;}
   try {
     const walk=new AMap.Walking({hideMarkers:true,autoFitView:false});
     walk.search(positions[i],positions[i+1],(state,result)=>{
       drawLeg(state==='complete'&&result&&result.routes&&result.routes[0]);
     });
   } catch(err){console.warn('步行规划不可用',err);drawLeg(null);}
   };
   walkLeg(0);
  }
  select.addEventListener('change',()=>render(courses.find(c=>c.id===select.value)));
  document.getElementById('clearCourse').onclick=()=>{select.value='';render(null)};
  const requested=new URLSearchParams(location.search).get('course');
  if(requested&&courses.some(c=>c.id===requested)){select.value=requested;select.dispatchEvent(new Event('change'))}
 };
})();
