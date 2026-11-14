(function () {
  const seasons = window.JINYUN_SEASONAL_COURSES.seasons;
  const seasonIds = {春: 'spring', 夏: 'summer', 秋: 'autumn', 冬: 'winter'};
  const allSeasons = seasons.map(season => season.id);

  function monthPrefix(text) {
    const expression = /^(1[0-2]|[1-9])(?:月?(?:[-—–～~至到])(?:翌年|次年)?(1[0-2]|[1-9]))?月/;
    const months = new Set();
    let remaining = text;
    while (remaining) {
      const match = remaining.match(expression);
      if (!match) break;
      const first = Number(match[1]);
      const last = Number(match[2] || first);
      for (let month = first; ; month = month % 12 + 1) {
        months.add(month);
        if (month === last) break;
      }
      remaining = remaining.slice(match[0].length);
      if (!/^[、，及和或]/.test(remaining)) break;
      remaining = remaining.slice(1);
    }
    return [...months];
  }

  function calendarPrefix(text) {
    const value = text.replace(/\s/g, '').replace(/^(?:建议|推荐|适宜在|安排在|在|于)/, '');
    const months = monthPrefix(value);
    if (months.length) {
      return {months, seasons: seasons.filter(season => season.months.some(month => months.includes(month))).map(season => season.id)};
    }
    if (/^全年/.test(value)) return {seasons: allSeasons, yearRound: true};
    const words = value.match(/^(?:初|早|晚)?[春夏秋冬](?:末|初|季)?(?:(?:至|到|和|及|、|或|，)?(?:初|早|晚)?[春夏秋冬](?:末|初|季)?)*/)?.[0];
    if (!words) return null;
    const ids = [...words].filter(char => seasonIds[char]).map(char => seasonIds[char]);
    if (/至|到/.test(words) && ids.length === 2) {
      for (let i = allSeasons.indexOf(ids[0]); allSeasons[i] !== ids[1]; i = (i + 1) % 4) {
        if (!ids.includes(allSeasons[i])) ids.push(allSeasons[i]);
      }
    }
    return {seasons: [...new Set(ids)]};
  }

  const flower = /观花|找花|看花|拍花|花期|查花|记录花|补拍花|开花|花序|花色|花部|花形|花叶|球花/;
  const fruit = /观果|看果|找熟果|熟果|果期|果实|果序|蒴果|球果|种子|结实|散种/;
  const phases = [
    [flower, /花序|花色|花部|花形|观花|看花|查花|拍花|找花|记录花|开花|花叶|球花/],
    [fruit, /果实|果序|果皮|熟果|蒴果|球果|种子|结实|散种|观果|看果/]
  ];
  const uncertain = /候选|异地|非本株确定|若鉴定|月份待|未确认|尚未核实/;
  const recorded = /已有.{0,8}(?:照片|记录)|实拍|拍摄日期/;

  function activityTiming(resource, activity) {
    const raw = String(resource.season || '').trim();
    const text = activity.text;
    const explicit = !uncertain.test(text) && !recorded.test(text) && calendarPrefix(text);
    if (explicit) {
      const parts = text.split(/[、，,]/).map(calendarPrefix).filter(Boolean);
      if (explicit.months && parts.length > 1 && parts.every(part => part.months)) {
        const months = [...new Set([...explicit.months, ...parts.flatMap(part => part.months)])];
        return {
          months, seasons: seasons.filter(season => season.months.some(month => months.includes(month))).map(season => season.id),
          source: '活动条目', raw: text
        };
      }
      return {...explicit, source: '活动条目', raw: text};
    }
    if (!raw || uncertain.test(raw) || recorded.test(raw)) return null;

    // Match the relevant part of a combined flower/fruit recommendation to each activity.
    const clauses = raw.split(/[、，；;（）()]/).map(part => part.trim()).filter(Boolean);
    if (flower.test(raw) || fruit.test(raw)) {
      const selected = phases.filter(([scope, focus]) => scope.test(raw) && focus.test(text));
      if (selected.length === 1) {
        const clause = clauses.find(part => selected[0][0].test(part) && calendarPrefix(part));
        const time = clause && calendarPrefix(clause);
        if (time && !time.yearRound) return {...time, source: '资源推荐时间', raw: clause};
      }
      if (selected.length || /花果|吸蜜|访花/.test(text) || !/^全年/.test(raw)) return null;
    }

    const time = calendarPrefix(raw);
    if (!time) return null;
    if (raw === '春秋迁徙季及冬季') {
      return {seasons: ['spring', 'autumn', 'winter'], source: '资源推荐时间', raw};
    }
    if (/复拍.*[；;].*雨季变化/.test(raw) && /取样|补测/.test(text)) return null;
    if (/春季可体验采茶/.test(raw) && /体验采茶|实际采茶|采摘茶叶/.test(text)) {
      return {seasons: ['spring'], source: '资源推荐时间', raw};
    }
    // A subtask without matching time cannot inherit a mixed recommendation.
    if (/春夏观叶|春季观察新梢|冬季不将休眠|加密记录新笋|访谈春秋|补记落叶/.test(raw)) return null;
    if (/秋冬侧重生境结构|春夏可结合植被生长观察/.test(raw) && !/^(POI-168|POI-147)$/.test(resource.id)) return null;
    if (resource.id === 'POI-168' && !/绘制生境简图/.test(text)) return null;
    return {...time, source: '资源推荐时间', raw};
  }

  window.jinyunActivityTiming = activityTiming;
})();
