(function () {
  const {seasons, courses, records, isVerified, evidenceValue} = window.JINYUN_COURSE_CATALOG;
  const categories = window.JINYUN_NATURE_COURSES;
  const teaching = window.JINYUN_TEACHING;
  const root = document.getElementById('courseCatalog');
  const belongsTo = (course, id) => course.category === id || course.related?.includes(id);
  const verified = version => version && version.evidence.every(isVerified);

  function render() {
    const hash = location.hash.slice(1);
    const search = new URLSearchParams(hash.startsWith('catalog?') ? hash.slice(8) : location.search);
    const category = categories.find(item => item.id === (search.get('category') || hash));
    const requestedSeason = search.get('season') || (hash.startsWith('season-') ? hash.slice(7) : '');
    const season = seasons.find(item => item.id === requestedSeason);
    const lesson = category && courses.find(item => item.id === search.get('lesson') && belongsTo(item, category.id));
    const hasLegacyFrom = lesson && search.has('from');
    const listSeason = hasLegacyFrom ? seasons.find(item => item.id === search.get('from')) : season;
    const detailSeason = search.get('lessonSeason') === 'all'
      ? undefined
      : seasons.find(item => item.id === search.get('lessonSeason')) || season;
    const versionFor = (course, key) => {
      if (verified(course.versions[key])) return course.versions[key];
      if (verified(course.allYear)) return course.allYear;
      return null;
    };

    function courseUrl(categoryId, seasonId, lessonId, lessonSeason) {
      const query = new URLSearchParams();
      if (categoryId) query.set('category', categoryId);
      if (seasonId) query.set('season', seasonId);
      if (lessonId) query.set('lesson', lessonId);
      if (lessonSeason) query.set('lessonSeason', lessonSeason);
      return 'courses.html' + (query.size ? '?' + query : '');
    }

    function pointList(ids) {
      return '<ul class="course-point-list">' + [...new Set(ids)].filter(id => records.has(id)).map(id => {
        const point = records.get(id);
        const fields = [
          ['所属区域', point.area], ['资源简介', point.summary], ['教育主题', point.educationTheme],
          ['教育价值', point.educationValue], ['建议活动', point.suggestedActivity], ['适用人群', point.audience],
          ['推荐季节及时间', point.season], ['现场注意事项', point.safety]
        ].filter(([, value]) => value);
        const visible = new Set(fields.map(([label]) => label));
        const values = new Set(fields.map(([, value]) => String(value)));
        const extra = Object.entries(point.details || {}).filter(([label, value]) =>
          value && !visible.has(label) && !values.has(String(value)));
        const activities = window.jinyunActivities(point).map(activity => {
          const guide = window.jinyunActivityGuide(point, activity);
          return `<section class="activity-example"><h4>${esc(guide.title)}</h4>
            <ol>${guide.steps.map(step => '<li>' + esc(step) + '</li>').join('')}</ol>
            <p><strong>准备材料</strong> · ${esc(guide.materials)}<br><strong>学习成果</strong> · ${esc(guide.output)}</p></section>`;
        }).join('');
        return `<li><details class="course-point" data-point="${esc(id)}">
          <summary>${esc(point.name)}（${esc(id)}）</summary>
          <dl>${fields.concat(extra).map(([label, value]) => '<dt>' + esc(label) + '</dt><dd>' + esc(value) + '</dd>').join('')}</dl>
          ${activities ? '<h4>资源活动详解</h4>' + activities : ''}
          ${inlineMap('地图中查看此点', {points: id})}
        </details></li>`;
      }).join('') + '</ul>';
    }

    function inlineMap(label, params) {
      const url = 'resource-map.html?' + new URLSearchParams(params);
      return `<details class="inline-course-map" data-map-url="${esc(url)}">
        <summary>${esc(label)}</summary>
        <div class="course-map-frame"></div>
        <a href="${esc(url)}" target="_blank" rel="noopener">在新标签页打开完整地图 ↗</a>
      </details>`;
    }

    function monthLabel(months) {
      if (months.length === 1) return months[0] + '月';
      if (months.some((month, i) => i && month !== months[i - 1] % 12 + 1)) return months.join('、') + '月';
      const first = months[0];
      const last = months.at(-1);
      return first > last ? first + '月至次年' + last + '月' : first + '—' + last + '月';
    }

    function timings(course, version) {
      if (version?.months?.length) return '建议 ' + monthLabel(version.months);
      if (verified(course.allYear)) return '全年可开展';
      const times = seasons.flatMap(item => {
        const version = course.versions[item.id];
        return verified(version) ? [item.name + ' ' + monthLabel(version.months)] : [];
      });
      return times.join(' · ') || '适用时间待完善';
    }

    function card(course, version) {
      const primary = categories.find(item => item.id === course.category);
      return `<article class="lesson-card" data-lesson="${esc(course.id)}">
        <p class="course-time">${esc(timings(course, version))}</p>
        <h3>${esc(course.title)}</h3>
        <p>${esc(course.goal)}</p>
        ${version?.focus && version.focus !== course.goal ? '<p>本季重点 · ' + esc(version.focus) + '</p>' : ''}
        <p class="source-note">${esc(primary.area)}${primary !== category ? ' · 关联课程' : ''}</p>
        <a class="map-link" href="${esc(courseUrl(category.id, listSeason?.id, lesson === course ? null : course.id))}"
          ${lesson === course ? 'aria-current="true"' : ''}>${lesson === course ? '收起课程详情' : '查看课程'}</a>
      </article>`;
    }

    function seasonNav(detail) {
      const tabs = detail
        ? seasons.filter(item => verified(lesson.versions[item.id]))
        : seasons;
      if (detail && tabs.length < 2) return '';
      const overview = detail ? '课程总览' : '全部课程';
      const options = [{name: overview, id: ''}, ...tabs];
      return '<nav class="course-times" aria-label="按季节浏览">' + options.map(item => {
        const active = item.id === ((detail ? detailSeason : listSeason)?.id || '');
        const url = detail
          ? courseUrl(category.id, listSeason?.id, lesson.id, item.id || 'all')
          : courseUrl(category.id, item.id);
        return `<a href="${esc(url)}" ${detail ? 'data-detail-season' : 'data-list-season'}
          ${active ? 'aria-current="page"' : ''}>${item.name}${item.months ? '<small>' + monthLabel(item.months) + '</small>' : ''}</a>`;
      }).join('') + '</nav>';
    }

    function teachingVersion(version, label) {
      const pointIds = version.pointIds.filter(id => records.has(id));
      const map = pointIds.length ? inlineMap('查看活动点位地图', {points: pointIds.join(',')}) : '';
      return `<section class="lesson-version">
        <h3>${esc(label)} · ${esc(timings(lesson, version))}</h3>
        ${version.focus && version.focus !== lesson.goal ? '<p><strong>观察重点</strong> · ' + esc(version.focus) + '</p>' : ''}
        <h4>活动安排</h4><p>${esc(version.task)}</p>
        <h4>准备材料与学习成果</h4><p>${esc(lesson.materials)}<br>${esc(lesson.output)}</p>
        <h4>本次活动的观察点位</h4>${pointList(pointIds)}
        ${map}
        <div class="lesson-evidence"><h4>时间依据与开展条件</h4>
          <p>${esc(version.conditions)}</p>
          <ul>${version.evidence.map(item => {
            const relevantMonths = version.months?.filter(month => item.months?.includes(month)) || [];
            return `<li><strong>${esc(records.get(item.id)?.name || item.id)} · ${esc(item.field)}</strong>：
              ${esc(evidenceValue(item))}${relevantMonths.length ? '（本活动窗口内 ' + monthLabel(relevantMonths) + '）' : ''}</li>`;
          }).join('')}</ul>
        </div>
      </section>`;
    }

    function directory() {
      const intro = season
        ? '已选择' + season.name + '，进入任一类别查看适合该季的课程。'
        : '选择一个课程类别，查看四季可开展的观察和学习活动。';
      return `<section aria-labelledby="directoryTitle"><h2 id="directoryTitle">课程类别</h2>
        <p class="catalog-intro">${intro}</p>
        <div class="catalog-grid">${categories.map(item => {
          const example = courses.find(course => course.category === item.id);
          return `<a class="category-card" href="${esc(courseUrl(item.id, season?.id))}">
            <h3>${esc(item.title)}</h3><p>${esc(item.description)}</p><small>例如 · ${esc(example.title)}</small>
            <span class="catalog-arrow" aria-hidden="true">↗</span></a>`;
        }).join('')}</div>
      </section>`;
    }

    function categoryContent() {
      const related = courses.filter(item => belongsTo(item, category.id));
      const listed = listSeason ? related.filter(item => versionFor(item, listSeason.id)) : related;
      const cards = listed.length
        ? '<div class="catalog-grid">' + listed.map(item => card(item, listSeason && versionFor(item, listSeason.id))
          + (item === lesson ? lessonContent() : '')).join('') + '</div>'
        : `<div class="empty-note">该类别本季暂无已整理课程。 <a href="${esc(courseUrl(category.id))}">查看全部课程</a></div>`;
      const note = teaching.notes[category.id];
      const refs = note.refs.map(key => teaching.refs[key]);
      return `<section class="category-content" aria-labelledby="categoryTitle" id="${esc(category.id)}">
        <nav class="catalog-breadcrumb" aria-label="当前位置"><a href="courses.html">六类课程</a> <span aria-hidden="true">›</span> ${esc(category.title)}</nav>
        <h2 id="categoryTitle">${esc(category.title)}</h2>
        <p class="catalog-intro">${esc(category.description)} · ${esc(category.area)}</p>
        <section class="category-overview">
          <h3>类别关联点位（${category.pointIds.length}）</h3>
          ${pointList(category.pointIds)}
          <h3>教学依据与活动参考</h3>
          <p><strong>教学依据</strong> · ${esc(note.basis)}</p>
          <p><strong>活动安排</strong> · ${esc(note.plan)}</p>
          <p class="source-note reference-links">参考来源 ${refs.map(ref =>
            `<a href="${esc(ref.url)}" target="_blank" rel="noopener">${esc(ref.name)} ↗</a>`).join('')}</p>
          <a class="map-link" href="resource-map.html?course=${encodeURIComponent(category.id)}">查看参考路线 ↗</a>
        </section>
        <h3 id="categoryCourses">本类别课程</h3>
        ${seasonNav(false)}
        <p class="course-result-count">${listSeason?.name || '全部课程'} · ${listed.length} 门课程</p>
        ${cards}
        ${lesson && !listed.includes(lesson) ? lessonContent() : ''}
        <div class="category-resources">
          <button type="button" data-activity-direction="${esc(category.id)}">查看类别相关资源活动</button>
        </div>
        <nav class="catalog-other" aria-label="切换其他课程类别">${categories.filter(item => item !== category).map(item =>
          `<a href="${esc(courseUrl(item.id, season?.id))}">${esc(item.title)}</a>`).join('')}</nav>
      </section>`;
    }

    function lessonContent() {
      const chosenVersion = detailSeason && versionFor(lesson, detailSeason.id);
      let content = '';
      if (chosenVersion) {
        content = teachingVersion(chosenVersion, detailSeason.name);
      } else if (verified(lesson.allYear)) {
        content = teachingVersion(lesson.allYear, '教学安排');
      } else {
        const available = seasons.filter(item => verified(lesson.versions[item.id]));
        content = available.map(item => teachingVersion(lesson.versions[item.id], item.name)).join('')
          || '<p class="empty-note">适用时间待完善。资料复核后更新教学安排。</p>';
      }
      const refs = teaching.notes[lesson.category].refs.map(key => teaching.refs[key]);
      return `<article class="lesson-detail" id="lessonDetail" data-lesson="${esc(lesson.id)}" tabindex="-1">
        <h3>${esc(lesson.title)}</h3>
        <p class="catalog-intro">${esc(lesson.summary || lesson.goal)}</p>
        ${lesson.summary ? '<p><strong>学习目标</strong> · ' + esc(lesson.goal) + '</p>' : ''}
        ${seasonNav(true)}
        ${content}
        <p class="source-note reference-links">教学参考 ${refs.map(ref =>
          `<a href="${esc(ref.url)}" target="_blank" rel="noopener noreferrer">${esc(ref.name)} ↗</a>`).join('')}</p>
        <a href="${esc(courseUrl(category.id, listSeason?.id))}" class="map-link">收起课程详情</a>
      </article>`;
    }

    root.innerHTML = directory() + (category ? categoryContent() : '');
  }

  render();
  root.addEventListener('click', event => {
    const button = event.target.closest('[data-activity-direction]');
    if (button) {
      const library = document.getElementById('activityLibrary');
      const direction = document.getElementById('activityDirection');
      direction.value = button.dataset.activityDirection;
      direction.dispatchEvent(new Event('change'));
      library.scrollIntoView();
      direction.focus({preventScroll: true});
      return;
    }
    const link = event.target.closest('a[href^="courses.html"]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const url = new URL(link.href);
    const hadLesson = !!document.getElementById('lessonDetail');
    const openPoints = new Set([...root.querySelectorAll('.category-overview .course-point[open]')].map(point => point.dataset.point));
    const previousCategory = root.querySelector('.category-content')?.id;
    event.preventDefault();
    history.pushState(null, '', location.protocol === 'file:' ? '#catalog?' + url.search.slice(1) : url.href);
    render();
    const currentCategory = root.querySelector('.category-content');
    if (currentCategory?.id === previousCategory) {
      currentCategory.querySelectorAll('.category-overview .course-point').forEach(point => {
        point.open = openPoints.has(point.dataset.point);
      });
    }
    const target = document.getElementById('lessonDetail')
      || ((link.hasAttribute('data-list-season') || hadLesson) && currentCategory?.id === previousCategory
        ? document.getElementById('categoryCourses') : currentCategory)
      || document.getElementById('directoryTitle');
    target.tabIndex = -1;
    target.scrollIntoView({block: 'start'});
    target.focus({preventScroll: true});
  });
  root.addEventListener('toggle', event => {
    const details = event.target;
    if (!details.matches('.inline-course-map[open]') || details.querySelector('iframe')) return;
    const frame = document.createElement('iframe');
    frame.title = details.querySelector('summary').textContent;
    frame.src = details.dataset.mapUrl;
    details.querySelector('.course-map-frame').append(frame);
  }, true);
  window.addEventListener('popstate', render);
  window.addEventListener('hashchange', render);
})();
