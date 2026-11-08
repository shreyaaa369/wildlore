(function () {
 const escapeHtml=value=>String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function gradeSymbol(level,color,count=1,name=''){
  const size=window.JinyunGrades?.size(level)||18;
  const star='12,1 15.3,8.3 23.3,9 17.2,14.4 19.1,22.5 12,18.2 4.9,22.5 6.8,14.4 0.7,9 8.7,8.3';
  const shape=level===1?`<svg class="grade-symbol" viewBox="0 0 24 24" aria-hidden="true"><polygon points="${star}" fill="#bd3f3f" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/></svg>`:level===2?`<svg class="grade-symbol" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="#e8bf45" stroke="#fff" stroke-width="2.5"/></svg>`:`<svg class="grade-symbol" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="${escapeHtml(color)}" stroke="#fff" stroke-width="3"/></svg>`;
  return `<span class="resource-map-marker graded-symbol" data-grade="${level||'unknown'}" style="--point-size:${size}px" aria-label="${escapeHtml(name)}">${shape}${count>1?`<b>${count}</b>`:''}</span>`;
 }
 function gradeDetails(grade){return grade?`<section class="resource-popup-section resource-grade-description"><b>资源分级</b><p class="grade-label-text">${escapeHtml(grade.label)}</p><p>${escapeHtml(grade.description)}</p><details class="grade-source"><summary>分级来源</summary><p>${escapeHtml(grade.source.file)} · ${escapeHtml(grade.source.sheet)} · 第 ${grade.source.row} 行</p></details></section>`:'';}
 window.MapPointUI={escapeHtml,gradeSymbol,gradeDetails,markerContent(name,count,color,kind,grade){
  if(kind==='resource'&&grade){const size=window.JinyunGrades.size(grade.level);return `<div class="map-point resource-marker graded-point" data-grade="${grade.level}" style="--marker-color:${escapeHtml(color)};--point-size:${size}px">${gradeSymbol(grade.level,color,count,name+' · '+grade.label)}<span class="map-point-name"><i class="grade-category-dot" aria-hidden="true"></i>${escapeHtml(name)}${count>1?` · ${count}`:''}</span></div>`;}
  return `<div class="map-point ${kind==='nearby'?'nearby-marker':'resource-marker'}" style="--marker-color:${escapeHtml(color)}"><span class="resource-map-marker" aria-label="${escapeHtml(name)}"><span></span>${count>1?`<b>${count}</b>`:''}</span><span class="map-point-name">${escapeHtml(name)}${count>1?` · ${count}`:''}</span></div>`;
 }};
})();
