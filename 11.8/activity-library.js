(function () {
  const teaching = window.JINYUN_TEACHING;
  const seasons = window.JINYUN_SEASONAL_COURSES.seasons;
  const directionNames = Object.fromEntries(window.JINYUN_NATURE_COURSES.map(course => [course.id, course.title]));
  directionNames.support = '场地服务与活动组织';

  const groups = window.JINYUN_RESOURCE_POINTS.map(resource => ({
    resource,
    direction: window.jinyunActivityDirection(resource),
    activities: window.jinyunActivities(resource).map(activity => ({
      ...activity, timing: window.jinyunActivityTiming(resource, activity)
    }))
  })).filter(group => group.activities.length);
  const allCount = groups.reduce((sum, group) => sum + group.activities.length, 0);
  window.jinyunActivityCoverage = {resources: groups.length, activities: allCount};

  const form = document.getElementById('activityFilters');
  const direction = document.getElementById('activityDirection');
  const search = document.getElementById('activitySearch');
  const seasonInput = document.getElementById('activitySeason');
  const index = document.getElementById('activityIndex');
  const detail = document.getElementById('activityDetail');
  const more = document.getElementById('activityMore');
  const stats = document.getElementById('activityStats');
  let limit = 12;
  let visibleGroups = [];
  let selectedId = '';

  for (const [id, name] of Object.entries(directionNames)) direction.add(new Option(name, id));
  seasonInput.innerHTML = [{id: '', name: '全部季节'}, ...seasons].map(season => {
    const period = season.id === 'winter' ? '12月至次年2月' : season.months && season.months[0] + '—' + season.months.at(-1) + '月';
    return `<label><input type="radio" name="activitySeason" value="${season.id}" ${season.id ? '' : 'checked'}>
      <span>${season.name}${period ? '<small>' + period + '</small>' : ''}</span></label>`;
  }).join('');

  const currentSeason = () => seasonInput.querySelector('input:checked')?.value || '';

  function timeLabel(timing, seasonId) {
    if (!timing) return '适用时间待完善';
    if (timing.yearRound) return '全年可开展';
    const season = seasons.find(item => item.id === seasonId);
    if (timing.months) {
      const months = season ? season.months.filter(month => timing.months.includes(month)) : timing.months;
      if (months.length > 1 && months.every((month, i) => !i || month === months[i - 1] % 12 + 1)) {
        const first = months[0];
        const last = months.at(-1);
        return first > last ? first + '月至次年' + last + '月' : first + '—' + last + '月';
      }
      return months.join('、') + '月';
    }
    return season?.name || seasons.filter(item => timing.seasons.includes(item.id)).map(item => item.name).join('、');
  }

  function renderIndex() {
    const query = search.value.trim().toLowerCase();
    const season = currentSeason();
    visibleGroups = groups.flatMap(group => {
      if (direction.value && group.direction !== direction.value) return [];
      const {resource} = group;
      const matchesResource = [resource.id, resource.name, resource.educationTheme].join(' ').toLowerCase().includes(query);
      const activities = group.activities.filter(activity => (!season || activity.timing?.seasons.includes(season))
        && (matchesResource || activity.text.toLowerCase().includes(query)));
      return activities.length ? [{...group, activities}] : [];
    });
    const matchCount = visibleGroups.reduce((sum, group) => sum + group.activities.length, 0);
    stats.textContent = `已衔接 ${groups.length} 个资源点的 ${allCount} 个活动条目。当前匹配 ${visibleGroups.length} 个资源点、${matchCount} 个活动。`;
    index.className = 'activity-index';
    index.innerHTML = visibleGroups.slice(0, limit).map(({resource, activities, direction}) =>
      `<a href="courses.html?resource=${encodeURIComponent(resource.id)}#${encodeURIComponent(activities[0].id)}"
        data-resource="${esc(resource.id)}">${esc(resource.name)}（${esc(resource.id)}）
        <small>${activities.length} 个活动 · ${esc(directionNames[direction])}</small></a>`
    ).join('') || (season
      ? '<p>本季暂无匹配活动。<button type="button" data-all-seasons>查看全部季节</button></p>'
      : '<p>未找到匹配资源。</p>');
    more.hidden = visibleGroups.length <= limit;
  }

  function renderResource(id, anchor = '', focus = false) {
    const group = visibleGroups.find(item => item.resource.id === id);
    if (!group) {
      detail.replaceChildren();
      return;
    }
    const {resource, activities} = group;
    const refs = (teaching.notes[group.direction]?.refs || []).map(key => teaching.refs[key]);
    detail.innerHTML = `<article class="activity-focus">
      <h3>${esc(resource.name)} · 活动详解</h3>
      <p>方向归组：${esc(directionNames[group.direction])}（仅用于检索）</p>
      ${resource.educationTheme ? '<p>资料中的教育主题：' + esc(resource.educationTheme) + '</p>' : ''}
      <a class="map-link" href="resources.html?resource=${encodeURIComponent(id)}">查看资源图鉴 ↗</a>
      ${activities.map(activity => {
        const guide = window.jinyunActivityGuide(resource, activity);
        return `<section class="activity-example" id="${esc(activity.id)}" tabindex="-1">
          <h4>${esc(guide.title)}</h4><p>活动条目：${esc(activity.text)}</p>
          <p class="source-note">${esc(guide.kind)}。资料不足处留待核实。</p>
          <p><strong>适用时间</strong> · ${esc(timeLabel(activity.timing, currentSeason()))}</p>
          ${activity.timing ? '<p class="source-note">时间依据 · ' + esc(activity.timing.source) + '「' + esc(activity.timing.raw) + '」</p>' : ''}
          <ol>${guide.steps.map(step => '<li>' + esc(step) + '</li>').join('')}</ol>
          <p><b>材料：</b>${esc(guide.materials)}</p><p><b>学习成果：</b>${esc(guide.output)}</p>
          ${resource.audience ? '<p>资料中的人群条件：' + esc(resource.audience) + '</p>' : ''}
          ${resource.season && resource.season !== activity.timing?.raw ? '<p>资源记录中的时间条件：' + esc(resource.season) + '</p>' : ''}
          ${resource.safety ? '<p>资料中的安全提示：' + esc(resource.safety) + '</p>' : ''}
        </section>`;
      }).join('')}
      ${refs.length ? '<p class="source-note reference-links">通用方法参考 ' + refs.map(ref =>
        `<a href="${esc(ref.url)}" target="_blank" rel="noopener noreferrer">${esc(ref.name)} ↗</a>`).join('') + '</p>' : ''}
      <p class="source-note">开展前请核对资料中的时间、人群和准入条件。</p>
    </article>`;
    if (focus) requestAnimationFrame(() => {
      const target = document.getElementById(anchor) || detail;
      target.scrollIntoView({block: 'start'});
      target.focus({preventScroll: true});
    });
  }

  function applyFilters() {
    limit = 12;
    renderIndex();
    renderResource(selectedId);
  }

  function restoreLink() {
    if (location.hash.startsWith('#catalog?')) return;
    const query = new URLSearchParams(location.search);
    const hash = location.hash.slice(1);
    const id = query.get('resource') || hash.match(/^activity-(.+)-\d+$/)?.[1];
    if (!id && !query.has('direction')) return;
    direction.value = Object.hasOwn(directionNames, query.get('direction')) ? query.get('direction') : '';
    search.value = '';
    seasonInput.querySelector('input[value=""]').checked = true;
    selectedId = id || '';
    renderIndex();
    renderResource(selectedId, hash, !!id);
    if (!id && hash === 'activityLibrary') requestAnimationFrame(() => document.getElementById('activityLibrary').scrollIntoView());
  }

  index.addEventListener('click', event => {
    if (event.target.closest('[data-all-seasons]')) {
      seasonInput.querySelector('input[value=""]').checked = true;
      applyFilters();
      return;
    }
    const link = event.target.closest('a[data-resource]');
    if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    selectedId = link.dataset.resource;
    renderResource(selectedId, link.hash.slice(1), true);
  });
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('reset', () => setTimeout(() => {
    selectedId = '';
    applyFilters();
  }, 0));
  search.addEventListener('input', applyFilters);
  direction.addEventListener('change', applyFilters);
  seasonInput.addEventListener('change', applyFilters);
  more.addEventListener('click', () => {
    limit += 24;
    renderIndex();
  });
  window.addEventListener('popstate', restoreLink);
  window.addEventListener('hashchange', restoreLink);
  renderIndex();
  restoreLink();
})();
