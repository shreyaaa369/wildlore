(function () {
  const {seasons, recommendations, yearRound} = window.JINYUN_SEASONAL_COURSES;
  const teaching = window.JINYUN_TEACHING;
  const records = new Map(window.JINYUN_RESOURCE_POINTS.map(record => [record.id, record]));
  const source = Object.fromEntries(recommendations.map(item => [item.id, item]));
  const evidenceValue = item => item.source === 'season'
    ? records.get(item.id)?.season
    : records.get(item.id)?.details?.[item.field];
  const isVerified = item => evidenceValue(item) === item.expected;

  const seasonEvidence = (id, expected) => ({
    id, field: '推荐季节及时间', source: 'season', expected
  });
  const noteFor = category => teaching.notes[category];
  const standard = (id, category, title, goal, point, evidence, task, materials, output, conditions) => ({
    id, category, title, goal, summary: noteFor(category).basis, materials, output,
    allYear: {pointIds: [point], evidence: [evidence], task, conditions},
    versions: {}
  });

  const forest = standard('bamboo-structure', 'course-1', '楠竹林群落结构观察',
    '绘制林分简图，比较竹株分布、林下光照和可见植被。',
    'ST-002', seasonEvidence('ST-002', '全年（春季观笋、夏秋纳凉）'),
    '沿开放步道选择可停留的位置，记录竹株疏密和林下可见植被，画出分布简图。记录日期与天气，供之后同点复访。',
    '记录卡、铅笔', '带日期和站位的林分简图', '从步道观察。春季可记录现场可见的竹笋，不采挖。');
  const birdExample = teaching.examples['DW-006'].steps[0];
  const birds = standard('forest-sound-map', 'course-2', birdExample.title,
    '根据方向和远近记录声源，区分鸟声、环境声和待确认的声音。',
    'DW-006', seasonEvidence('DW-006', '全年清晨傍晚'),
    birdExample.text, birdExample.materials, birdExample.output,
    '资料推荐清晨或傍晚，安排时核对步道开放时间和能见度。');
  const soilExample = teaching.examples['DZ-002'].steps[0];
  const soil = standard('soil-profile', 'course-3', '土壤立面与根系观察',
    '用剖面图表达颜色分带与根系的相对位置。',
    'DZ-002', yearRound.find(item => item.course === 'course-3').evidence,
    soilExample.text, soilExample.materials, soilExample.output,
    yearRound.find(item => item.course === 'course-3').note);
  const rocks = standard('rock-weathering', 'course-3', '岩面观察与风化线索',
    '在岩面素描上标记色带、裂隙和积存物，区分观察与解释。',
    'DZ-006', seasonEvidence('DZ-006', '全年（雨后色彩更艳）'),
    '从安全站位画出岩壁色带与可见裂隙。比较另一处岩面，记录岩面、裂隙和少量积存物的空间关系，再提出有关风化的待查问题。',
    '观察卡、铅笔', '岩面素描及观察证据与解释表', '从开放步道观察，避开不稳定边坡，不敲击或采集岩石。');
  rocks.allYear.pointIds.push('ST-001');
  rocks.allYear.evidence.push(seasonEvidence('ST-001', '全年（雨后及春秋季最佳）'));
  const history = standard('stele-evidence', 'course-5', '碑刻观察与地方资料核对',
    '区分碑刻可辨文字、个人解释与需要查证的问题。',
    'LS-003', yearRound.find(item => item.course === 'course-5').evidence,
    noteFor('course-5').plan, '记录卡、铅笔、允许使用的拍摄设备',
    '按原文、推测和待查问题分栏的记录表',
    yearRound.find(item => item.course === 'course-5').note);
  const weather = standard('forest-weather-log', 'course-6', '林间天气记录与比较',
    '用一致的记录方法比较不同时间的林间天气。',
    'POI-102', seasonEvidence('POI-102', '全年白昼'),
    noteFor('course-6').plan, '天气记录卡、铅笔；条件允许时使用便携温湿度计',
    '至少包含时间、天气和可见度的观测表', '白昼在开放位置观察，不触碰站点设备。');
  const restoration = standard('daihu-restoration', 'course-4', '黛湖生态修复措施解读',
    '根据展示牌和现场观察，辨别水体、岸线和植被的修复措施。',
    'POI-153', seasonEvidence('POI-153', '全年白昼'),
    '先阅读总览与过程展示牌，按水体、岸线和植被分类记录措施。沿开放步道观察相应景观，用三栏分别记录标牌说明、现场所见和待核对问题。',
    '记录卡、铅笔', '修复措施分类与现场观察对照表', '白昼在开放步道观察，春夏可结合可见植被状态，不凭景观判断水质。');
  restoration.allYear.pointIds.push('POI-147');
  restoration.allYear.evidence.push(seasonEvidence('POI-147', '全年白昼；春夏可结合植被生长观察'));

  const birdObservationEvidence = seasonEvidence('DW-003', '10月至翌年3月');
  const birdObservation = {
    id: 'bird-canopy', category: 'course-2', title: '鸟类树冠层位观察',
    goal: '记录鸟类活动的树冠层位和可见行为，比较个体如何利用树冠。',
    materials: '记录卡、铅笔、可选用望远镜',
    output: '注明日期、层位与辨认把握的观察记录',
    versions: Object.fromEntries(Object.entries({spring: [3], autumn: [10, 11], winter: [12, 1, 2]}).map(([season, months]) => [
      season, {
        months, pointIds: ['DW-003'], evidence: [birdObservationEvidence],
        task: '在开放步道固定站位静立，绘出树冠轮廓并记录鸟出现的位置。能辨认时附上可见喙形与行为，未辨认的个体保留观察描述。',
        conditions: '月份来自该点位的观察建议。以当日实际观察为准，保持距离，不追逐鸟类。'
      }
    ]))
  };

  function fromRecommendation(item) {
    const season = seasons.find(entry => entry.id === item.season);
    // This comparison needs both trees in flower; other activities allow separate observations.
    const requireAll = item.id === 'spring-trees';
    return {
      sourceId: item.id,
      evidence: item.evidence,
      months: season.months.filter(month => requireAll
        ? item.evidence.every(entry => entry.months.includes(month))
        : item.evidence.some(entry => entry.months.includes(month))),
      pointIds: [...new Set(item.evidence.map(entry => entry.id))],
      task: item.task,
      conditions: requireAll ? '两种树木的资料花期在5月重叠，实际是否同时开花以当日观察为准。' : item.note
    };
  }

  const lake = {
    id: 'daihu-shore', category: 'course-4', title: '黛湖湖岸生境观察',
    goal: '用同一套图例记录岸带植被、水陆边界和设施，并比较复访结果。',
    summary: '每次在开放步道记录观察位置、日期和天气，使用同一图例绘制生境简图。保留前次简图供复访比较。',
    materials: '空白纸或底图、铅笔、观察记录卡',
    output: '一份标注日期、站位和图例的生境简图；复访后补充对照记录',
    versions: {
      spring: {...fromRecommendation(source['spring-lakeshore']), focus: '建立湖岸生境简图'},
      summer: {...fromRecommendation(source['summer-lakeshore']), focus: '复查岸带植被和水陆边界'},
      autumn: {
        focus: '比较秋季岸带生境结构', months: [9, 10, 11], pointIds: ['POI-168'],
        evidence: source['winter-lakeshore'].evidence,
        task: '从同一处开放步道使用原图例重绘湖面、岸带植被和设施，标记结构变化以及观察位置、日期和天气。',
        conditions: '根据点位的秋冬生境结构建议编写。白昼观察，水位和植被变化的原因留待复核。'
      },
      winter: {...fromRecommendation(source['winter-lakeshore']), focus: '对照冬季生境结构'}
    }
  };

  const seasonalGoals = {
    'spring-flowers': ['区分花期观察和果期复访，记录同株变化。', '分日期的花果对照卡'],
    'spring-trees': ['比较两种树木的花与叶形态。', '标注树种和日期的对照素描'],
    'summer-blooms': ['描述夏花形态，区分已观察和未确认的访花行为。', '花形记录及访花观察表'],
    'summer-ginger': ['用素描区分叶片与花序，为复访留下依据。', '标注位置和日期的姜花自然笔记'],
    'autumn-flowers': ['比较两种秋花的可见形态与开花状态。', '秋花形态和状态比较表'],
    'autumn-fruits': ['根据果实结构提出有观察依据的传播假设。', '果实素描及证据与假设记录'],
    'autumn-loquat': ['用跨年日历区分花期、果期和实际观察记录。', '枇杷跨年物候日历'],
    'winter-flowers': ['对照冬季花期资料与当日观察。', '注明开花状态的物候记录表'],
    'winter-earlyflowers': ['记录冬末可见花部，并设计下一次复访。', '花部观察卡与复访问题']
  };

  const seasonalCourses = recommendations.filter(item => seasonalGoals[item.id]).map(item => {
    const [goal, output] = seasonalGoals[item.id];
    return {
      id: item.id,
      category: 'course-1',
      related: item.id === 'summer-blooms' ? ['course-2'] : [],
      title: item.title, goal, output,
      materials: '观察记录卡、铅笔；按任务需要准备拍摄设备',
      versions: {[item.season]: {...fromRecommendation(item), focus: goal}}
    };
  });

  const courses = [forest, birds, birdObservation, soil, rocks, lake, restoration, history, weather, ...seasonalCourses];
  window.JINYUN_COURSE_CATALOG = {seasons, courses, records, isVerified, evidenceValue};
})();
