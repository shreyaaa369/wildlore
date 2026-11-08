(function () {
  'use strict';
  const escapeHtml = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  window.initializeNearbyPlaces = function ({map, AMap, toAmapPoint, selectDestination}) {
    const statusEl = document.getElementById('placesStatus');
    const listEl = document.getElementById('placesList');
    const reload = document.getElementById('reloadPlaces');
    const toggle = document.getElementById('togglePlaces');
    const center = toAmapPoint([29.839, 106.383]);
    const radius = 4000;
    let markers = [], shown = true, loading = false, info = new AMap.InfoWindow({offset: new AMap.Pixel(0, -25)});
    function setVisibility() {
      markers.forEach(marker => shown ? marker.show() : marker.hide());
      toggle.checked = shown;
      if (!shown) info.close();
    }
    toggle.addEventListener('change', () => { shown = toggle.checked; setVisibility(); });
    document.getElementById('nearbyNames').addEventListener('change', event => { document.querySelector('.mapwrap').classList.toggle('nearby-names-off', !event.target.checked); });
    function query(pageIndex) {
      return new Promise((resolve, reject) => {
        const search = new AMap.PlaceSearch({
          type: '110000|140100|140200|140300|140400|080100',
          pageSize: 50, pageIndex, extensions: 'base'
        });
        const timer = setTimeout(() => reject(new Error('查询超时，请稍后重试')), 20000);
        search.searchNearBy('', center, radius, (status, result) => {
          clearTimeout(timer);
          if (status === 'complete' && result.poiList) resolve(result.poiList);
          else if (status === 'no_data') resolve({pois: [], count: 0});
          else {
            const reason = typeof result === 'string' && !result.startsWith('[object ')
              ? result : result && (result.info || result.message) || '高德查询接口连接失败，请检查网络后重试';
            console.warn('景点场馆查询失败：', status, reason || '未知服务错误');
            reject(new Error(String(reason || '地点服务暂不可用')));
          }
        });
      });
    }
    async function load() {
      if (loading) return;
      loading = true; reload.disabled = true; statusEl.textContent = '正在查询缙云山周边 4 公里的景点与场馆…';
      try {
        await new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('地点查询组件加载超时')), 20000);
          AMap.plugin('AMap.PlaceSearch', () => { clearTimeout(timer); resolve(); });
        });
        const first = await query(1);
        const results = first.pois.slice();
        const pageCount = Math.min(3, Math.ceil(Number(first.count || 0) / 50));
        for (let page = 2; page <= pageCount; page++) results.push(...(await query(page)).pois);
        const unique = new Map();
        results.forEach(poi => { if (poi.location) unique.set(poi.id || `${poi.name}|${poi.location}`, poi); });
        info.close(); map.remove(markers); markers = []; listEl.replaceChildren();
        unique.forEach(poi => {
          // 高德搜索结果已是 GCJ-02，不再进行 GPS 坐标转换。
          const marker = new AMap.Marker({position: poi.location, title: poi.name, zIndex: 125,
            content: window.MapPointUI.markerContent(poi.name, 1, '#567b65', 'nearby'),
            offset: new AMap.Pixel(-10, -10),
            map});
          const open = () => {
            selectDestination({name: poi.name, position: [poi.location.getLng(), poi.location.getLat()], marker});
            info.setContent(`<div class="resource-popup-wrap"><article class="resource-popup-card"><div class="resource-popup-heading"><span class="resource-category">景点与场馆</span></div><h3>${escapeHtml(poi.name)}</h3><div class="resource-popup-section"><b>地点类型</b><p>${escapeHtml(poi.type)}</p></div><div class="resource-popup-section"><b>地址</b><p>${escapeHtml(poi.address || '暂无详细地址')}</p></div><div class="resource-coordinates">来源：高德地图 · 开放情况请向场馆确认</div></article></div>`);
            info.open(map, poi.location);
          };
          marker.on('click', open); markers.push(marker);
          const button = document.createElement('button'); button.className = 'poi-list-item'; button.textContent = poi.name;
          button.addEventListener('click', () => { shown = true; setVisibility(); map.setZoomAndCenter(17, poi.location); open(); });
          listEl.appendChild(button);
        });
        setVisibility();
        statusEl.textContent = `已标注 ${markers.length} 个地点 · 缙云山周边 4 公里` + (Number(first.count) > 150 ? '（仅展示前 150 条，可放大查看底图其他地点）' : '');
      } catch (error) {
        statusEl.textContent = `景点场馆查询失败：${error.message}。${markers.length ? '已保留上次标注。' : '仍可使用 Excel 点位。'}请稍后点击刷新。`;
      } finally {loading = false; reload.disabled = false;}
    }
    reload.addEventListener('click', load);
    load();
  };
})();
