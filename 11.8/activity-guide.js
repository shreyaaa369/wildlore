/* Teaching design helpers. Survey records remain unchanged. */
(function(){
const w=window;
w.jinyunHasValue=v=>v!==null&&v!==undefined&&String(v).trim()!==''&&!/^(?:未填写|未提供|暂无|无数据|不详|未知|待补充|未记录|[-—/]|N\/A|null|undefined)$/i.test(String(v).trim());
w.jinyunSplitActivities=text=>String(text||'').split(/[；;\r\n]|(?=[①-⑳])/).map(s=>s.replace(/^\s*(?:\d+[.．、]|[①-⑳])\s*/,'').trim()).filter(Boolean);
w.jinyunActivityGroups=r=>{const out=[],seen=new Set();const add=(label,value)=>{if(!w.jinyunHasValue(value)||seen.has(String(value).trim()))return;seen.add(String(value).trim());out.push({label,text:String(value),items:w.jinyunSplitActivities(value)});};add('建议活动',r.suggestedActivity);for(const [k,v]of Object.entries(r.details||{}))if(/建议活动|活动内容与流程/.test(k))add(k,v);return out;};
w.jinyunActivities=r=>{let index=0;return w.jinyunActivityGroups(r).flatMap(g=>g.items.map(text=>({text,label:g.label,index:index++,id:'activity-'+r.id+'-'+(index-1)})));};
w.jinyunActivityDirection=r=>{const ex=w.JINYUN_TEACHING.examples[r.id];if(ex)return ex.course;const direct=(w.JINYUN_NATURE_COURSES||[]).find(c=>c.pointIds.includes(r.id));if(direct)return direct.id;const t=[r.category,r.educationTheme,r.suggestedActivity].join(' ');if(/历史|遗产|碑|民俗|节令|手作|农事|乡土|旧址|纪念|器物/.test(t))return 'course-5';if(/水文|水环境|湖泊|湖滨|岸线|藻类|湿地|污水|供水/.test(t))return 'course-4';if(/气象|气温|天气|山雾|温湿度|降水|天文/.test(t))return 'course-6';if(/地文地质|岩石|土壤|风化|地层/.test(t))return 'course-3';if(/动物资源|鸟|昆虫|授粉|蜂|蝴蝶/.test(t))return 'course-2';if(/植物资源|生态系统|森林|植被|林|植物|生境/.test(t))return 'course-1';return 'support';};
w.jinyunActivityGuide=(r,a)=>{
const specific=w.JINYUN_TEACHING.examples[r.id]?.steps[a.index];if(specific)return {title:specific.title,steps:[specific.text],materials:specific.materials,output:specific.output,kind:'已编写的活动详解'};
const t=a.text;let method,materials='记录纸、铅笔、已有资源照片或允许使用的拍摄设备',output='活动记录卡：观察事实、资料来源、解释及待核实问题';
if(/声音|鸟鸣|静听|听音|鸣叫/.test(t)){method='在允许停留的安全位置保持安静，记录声音方向、相对远近、节律与时间；将未确认声音单独标记。不同声型或鸣叫次数不等于鸟种数，不播放鸟音诱鸟。';materials='记录纸、铅笔、计时工具';output='带时间与位置说明的声音记录或声音地图';}
else if(/水质|水样|藻|湖面|湖岸|湖滨|岸线|水体|湿地/.test(t)){method='从开放步道或已获许可的观察位记录水面、岸带植被和设施的可见状态，用简图标明位置。涉及水样或显微观察时，先由教师制定采样与鉴定方案；水色、气味和外观不能单独证明水质达标。';output='湖岸观察图或注明方法与局限的水环境记录表';}
else if(/岩石|土壤|土层|剖面|岩面|岩壁|颗粒|风化/.test(t)){method='在稳定步道上观察颜色、颗粒外观、裂隙或根系分布，先描绘可见现象，再提出解释。不到陡坡或岩壁下作业，不敲击、不掏挖；未测量不填写精确深度，不用单次观察确认年代或形成速率。';output='带方位和观察条件的岩土简图与证据表';}
else if(/历史|碑|年代|旧址|文物|铭文|抄录|档案|人物|遗迹/.test(t)){method='逐字记录现场可辨文字并注明载体和来源；无法辨认处留空。将现场文字、公开资料和个人推测分栏，与可靠出版物或管理方资料核对，不以传说替代已证实史实。';output='来源明确的文字摘录、观察图与待核实问题清单';}
else if(/气温|温湿度|气象|天气|山雾|能见度|风速/.test(t)){method='记录日期、时间、地点和近远景清晰程度；如使用仪器，保持测量方法和暴露条件一致并注明设备。将读数与主观感受分开，不以一次比较推断长期气候或确定雾的成因。不得触碰科研仪器。';output='注明时间、位置、设备与方法的天气观察表';}
else if(/鸟|蜂|昆虫|蝴蝶|取食|花粉|动物|巢/.test(t)){method='由带队人员根据现场动物行为和管理要求确定观察位置，以远观、望远镜或经许可的照片记录形态与行为。保持安静，不追逐、不投喂、不诱捕，不进入蜂群或巢位周边；未知种类注明待核实。';output='含观察条件、行为描述和鉴定把握度的动物观察卡';}
else if(/标牌|展牌|讲解|阅读|读取|识读|说明牌|导览|管理|提示|消防|通道|充电|厕所|车位/.test(t)){method='先阅读可辨标识，记录设施用途、与环境的空间关系及信息来源；从允许通行处画简图。标牌内容与实际开放状态须分别核对，不试用消防、电气或科研设施，不将旧记录当作当前服务承诺。';output='标识信息核对表或场地关系简图';}
else if(/叶|花|果|树|茎|枝|根|孢子|苔藓|地衣|真菌|植物/.test(t)){method='优先原位观察全株与局部特征，分别画出形态、着生位置和可见环境条件；显微或鉴定任务使用有出处的资料和合适设备。无法辨认的结构注明未确认，不凭一项特征断定物种或生态功能。';output='带局部特征、环境条件与待鉴定说明的自然笔记';}
else {method='在可公开进入的场地，围绕该条目选择可直接观察或可核实的信息，采用简图、文字或许可照片记录。涉及场所使用、访谈、经营活动或设备操作时先由管理方确认；无法实施时改用有出处的图片和资料讨论。';}
const restricted=/采摘|采集|采叶|食用|品尝|饮用|触摸|轻触|燃烧|烟花|试水|加工|染色|操作|实验|嗅|挖|捏|揉|揉搓/.test(t);
return {title:t.replace(/[。；;]+$/,''),kind:'依据条目编写的教学建议',materials,output,steps:[`准备：阅读“${r.name}”的资源信息，明确本条任务“${t}”涉及的对象、所需资料与观察位置；未核实的信息列为问题。`,method,'记录与讨论：注明时间、地点、观察条件和资料出处，将观察事实、可能解释与未解决问题分开。用同一记录表比较结果，讨论观察误差和证据不足之处。',restricted?'实施边界：此条涉及接触、采集、操作或实验等事项时，不直接照录实施；先确认许可、材料来源与专业指导，条件不具备则采用图片、模型或教师演示替代。':'实施边界：不离开允许通行区域、不干扰生物；个人经验或一次观察不能替代规范测定与专业鉴定。']};
};
})();
