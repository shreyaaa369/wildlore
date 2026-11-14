(function () {
  const CATEGORY_COLORS = {
    "生态系统": "#46784f",
    "植物资源": "#2f8f5b",
    "动物资源": "#d97706",
    "地文地质": "#8a6745",
    "水文与水环境": "#2584a8",
    "气象天文": "#6875b8",
    "物质遗产": "#9a6048",
    "非物质文化遗产": "#a64f7a",
    "其他特殊活动": "#6f63a8",
    "其他已有活动": "#6f63a8",
    "历史遗迹": "#8f5442",
    "公共厕所": "#4f7f91",
    "宣教设施": "#416b8c"
  };

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function safeImageUrl(value) {
    if (!value) return "";
    try {
      const url = new URL(value, window.location.href);
      return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
    } catch (_) {
      return "";
    }
  }

  function itemCard(item) {
    const grade = window.JinyunGrades?.get(item);
    const photos = (Array.isArray(item.photos) ? item.photos : [item.photo]).map(safeImageUrl).filter(Boolean);
    const displayedFields = new Set(['教育主题','教育价值','建议活动步骤','建议活动（简略步骤）','适用年龄/人群','推荐季节及时间','安全注意事项','现场注意事项']);
    const moreDetails = Object.entries(item.details || {}).filter(([key,value]) => value && !displayedFields.has(key));
    const sections = [
      ["资源简介", item.summary],
      ["教育主题", item.educationTheme],
      ["教育价值", item.educationValue],
      ["建议活动", item.suggestedActivity],
      ["适用人群", item.audience],
      ["推荐时间", item.season],
      ["安全提示", item.safety]
    ].filter((entry) => entry[1]);

    return `<article class="resource-popup-card">
      ${photos.length ? `<div class="resource-photo-gallery">${photos.map((photo, index) => `<img src="${escapeHtml(photo)}" alt="${escapeHtml(item.name)}现场资料图 ${index+1}" loading="lazy" referrerpolicy="no-referrer">`).join("")}</div>` : ""}
      <div class="resource-popup-heading">
        <span class="resource-code">${escapeHtml(item.id)}</span>
        <span class="resource-category">${escapeHtml(item.category)}</span>
        ${item.area ? `<span class="resource-category">${escapeHtml(item.area)}</span>` : ''}
      </div>
      <h3>${escapeHtml(item.name)}</h3>
      ${grade ? `<section class="resource-popup-section resource-grade-description"><b>资源分级</b><p class="grade-label-text">${escapeHtml(grade.label)}</p><p>${escapeHtml(grade.description)}</p><details class="grade-source"><summary>分级来源</summary><p>${escapeHtml(grade.source.file)} · ${escapeHtml(grade.source.sheet)} · 第 ${grade.source.row} 行 · ${escapeHtml(grade.source.field)}</p></details></section>` : ''}
      ${sections.map(([label, value]) => `<div class="resource-popup-section"><b>${escapeHtml(label)}</b><p>${escapeHtml(value)}</p></div>`).join("")}
      ${moreDetails.length ? `<details class="resource-popup-section"><summary>更多资源信息</summary>${moreDetails.map(([label,value]) => `<div class="resource-popup-section"><b>${escapeHtml(label)}</b><p>${escapeHtml(value)}</p></div>`).join('')}</details>` : ''}
      <div class="resource-coordinates">坐标：${Number(item.latitude).toFixed(6)}, ${Number(item.longitude).toFixed(6)}</div>
    </article>`;
  }

  function popupContent(items) {
    const heading = items.length > 1
      ? `<div class="resource-group-title">此处共有 ${items.length} 项资源</div>`
      : "";
    return `<div class="resource-popup-wrap">${heading}${items.map(itemCard).join("")}</div>`;
  }

  function searchText(item) {
    return [
      item.area,
      item.id,
      item.name,
      item.primaryCategory,
      item.category,
      item.summary,
      item.educationTheme,
      item.educationValue,
      item.audience,
      item.season,
      item.safety
      ,Object.values(item.details || {}).join(' '),window.JinyunGrades?.get(item)?.raw||''
    ].join(" ").toLowerCase();
  }

  window.initializeResourcePoints = function initializeResourcePoints(options) {
    const { map, AMap, toAmapPoint, selectDestination } = options;
    const source = Array.isArray(window.JINYUN_RESOURCE_POINTS) ? window.JINYUN_RESOURCE_POINTS : [];
    const curated = new Set(window.JINYUN_CURATED_IDS || []);
    const majorColors = window.JINYUN_RESOURCE_MAJOR || {};
    const major = window.jinyunMajorCategory || (item => item.category);
    const representativeOnly = document.getElementById('representativeOnly');
    const groups = new Map();

    source.forEach((item) => {
      if (!Number.isFinite(item.longitude) || !Number.isFinite(item.latitude)) return;
      const key = `${item.longitude.toFixed(6)},${item.latitude.toFixed(6)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ ...item, _searchText: searchText(item) });
    });

    const gradeLevel = () => document.querySelector('input[name="resourceGrade"]:checked')?.value || '';
    const orderItems = items => [...items].sort((a,b)=>(window.JinyunGrades?.get(a)?.level||99)-(window.JinyunGrades?.get(b)?.level||99));
    function markerStyle(items) {const first=orderItems(items)[0];const grade=window.JinyunGrades?.get(first);const size=window.JinyunGrades?.size(grade?.level)||20;const color=majorColors[major(first)]||'#246b4a';return {first,grade,size,color};}
    const entries = [];
    groups.forEach((groupItems) => {
      const items=orderItems(groupItems);
      const style=markerStyle(items);
      const position = toAmapPoint([items[0].latitude, items[0].longitude]);
      const color = majorColors[major(items[0])] || "#246b4a";
      const marker = new AMap.Marker({
        position,
        title: items.map((item) => item.name).join("、"),
        content: window.MapPointUI.markerContent(items[0].name, items.length, color, "resource", style.grade),
        offset: new AMap.Pixel(-style.size/2, -style.size/2),
        zIndex: window.JinyunGrades?.priority(style.grade?.level)||110
      });
      const infoWindow = new AMap.InfoWindow({
        content: popupContent(items),
        offset: new AMap.Pixel(0, -13),
        autoMove: true,
        closeWhenClickMap: true
      });
      const entry = { items, visibleItems: items, marker, infoWindow, position, visible: true };
      marker.on("click", () => {
        const activeItems = entry.visibleItems.length ? entry.visibleItems : entry.items;
        const destinationName = activeItems.length === 1
          ? activeItems[0].name
          : `${activeItems[0].name}等${activeItems.length}项资源`;
        selectDestination({ name: destinationName, position, marker });
        infoWindow.setContent(popupContent(activeItems));
        infoWindow.open(map, position);
      });
      entries.push(entry);
      map.add(marker);
    });

    const categorySelect = document.getElementById("resourceCategory");
    const searchInput = document.getElementById("resourceSearch");
    const countEl = document.getElementById("resourceCount");
    const areaSelect = document.getElementById("resourceArea");
    const visibility = document.getElementById("toggleResources");
    let coursePoints = null;
    document.getElementById("resourceNames").addEventListener("change", event => {
      document.querySelector('.mapwrap').classList.toggle('resource-names-off', !event.target.checked);
    });
    const categories = Object.keys(majorColors);
    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categorySelect.appendChild(option);
    });

    function applyFilter() {
      const query = searchInput.value.trim().toLowerCase();
      const category = categorySelect.value;
      const selectedGrade=gradeLevel();
      let visibleRecordCount = 0;
      let visiblePointCount = 0;

      entries.forEach((entry) => {
        const previousIDs=entry.visibleItems.map(x=>x.id).join();
        entry.visibleItems = orderItems(entry.items.filter((item) => {
          const matchesCategory = !category || major(item) === category;
          const matchesRepresentative = !representativeOnly.checked || curated.has(item.id) || !!query;
          const matchesQuery = !query || item._searchText.includes(query);
          const matchesArea = !areaSelect.value || item.area === areaSelect.value;
          const matchesGrade=!selectedGrade || String(window.JinyunGrades?.get(item)?.level)===selectedGrade;
          return matchesCategory && matchesQuery && matchesArea && matchesGrade
            && (coursePoints ? coursePoints.has(item.id) : matchesRepresentative);
        }));
        if(previousIDs!==entry.visibleItems.map(x=>x.id).join())entry.infoWindow.close();
        const shouldShow = visibility.checked && entry.visibleItems.length > 0;
        if (shouldShow !== entry.visible) {
          entry.visible = shouldShow;
          if (shouldShow) map.add(entry.marker);
          else { map.remove(entry.marker); entry.infoWindow.close(); }
        }
        if (shouldShow) {
          const style=markerStyle(entry.visibleItems);
          entry.marker.setContent(window.MapPointUI.markerContent(style.first.name, entry.visibleItems.length, style.color, "resource", style.grade));
          entry.marker.setOffset(new AMap.Pixel(-style.size/2,-style.size/2));
          entry.marker.setzIndex(window.JinyunGrades?.priority(style.grade?.level)||110);
          entry.marker.setTitle(entry.visibleItems.map(x=>x.name+' · '+(window.JinyunGrades?.get(x)?.label||'未分级')).join('、'));
          visibleRecordCount += entry.visibleItems.length;
          visiblePointCount += 1;
        }
      });

      countEl.textContent = `${coursePoints ? '课程点位 · ' : ''}当前 ${visibleRecordCount} 项 / ${visiblePointCount} 个位置（全库 ${source.length} 项）`;
      const gradeStatus=document.getElementById('gradeStatus');
      if(gradeStatus)gradeStatus.textContent=(selectedGrade?['','一级核心典型','二级特色代表','三级普通基础'][Number(selectedGrade)]:'全部等级')+' · 当前显示 '+visibleRecordCount+' 项资源';
      options.onGradeFilterChange?.(selectedGrade,new Set(entries.filter(e=>e.visible).flatMap(e=>e.visibleItems.map(x=>x.id))));
    }

    document.querySelectorAll('input[name="resourceGrade"]').forEach(input=>input.addEventListener('change',()=>{representativeOnly.checked=false;applyFilter();fitVisible();}));
    representativeOnly.addEventListener("change", applyFilter);
    searchInput.addEventListener("input", () => { coursePoints = null; applyFilter(); });
    categorySelect.addEventListener("change", () => { coursePoints = null; applyFilter(); });
    areaSelect.addEventListener("change", () => { coursePoints = null; applyFilter(); fitVisible(); });
    visibility.addEventListener("change", applyFilter);
    document.getElementById("clearResourceFilter").addEventListener("click", () => {
      document.querySelector('input[name="resourceGrade"][value=""]').checked=true;
      searchInput.value = "";
      categorySelect.value = "";
      areaSelect.value = "";
      visibility.checked = true;
      representativeOnly.checked = true;
      coursePoints = null;
      applyFilter();
      fitVisible();
    });

    function fitVisible() {
      const visibleMarkers = entries.filter((entry) => entry.visible).map((entry) => entry.marker);
      if (visibleMarkers.length) map.setFitView(visibleMarkers, false, [45, 45, 45, 45], 18);
    }

    applyFilter();
    return {
      entries,
      records: source.length,
      uniquePoints: entries.length,
      get visibleMarkers() {
        return entries.filter((entry) => entry.visible).map((entry) => entry.marker);
      },
      fitVisible,
      showCoursePoints(ids) {
        coursePoints = new Set(ids);
        document.querySelector('input[name="resourceGrade"][value=""]').checked = true;
        representativeOnly.checked = false;
        visibility.checked = true;
        categorySelect.value = '';
        areaSelect.value = '';
        searchInput.value = '';
        applyFilter();
        fitVisible();
      },
      showResource(id) {
        const entry=entries.find(e=>e.items.some(x=>x.id===id));
        if(!entry)return false;
        const item=entry.items.find(x=>x.id===id);
        coursePoints = null;
        document.querySelector('input[name="resourceGrade"][value=""]').checked=true;
        representativeOnly.checked=false;visibility.checked=true;
        categorySelect.value='';areaSelect.value='';searchInput.value=id;applyFilter();
        entry.infoWindow.setContent(popupContent([item]));
        map.setZoomAndCenter(17,entry.position);
        entry.infoWindow.open(map,entry.position);
        selectDestination({name:item.name,position:entry.position,marker:entry.marker});
        return true;
      }
    };
  };
})();
