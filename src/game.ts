export const places = [
 {id:'cafe',name:'午后咖啡馆',icon:'☕',x:25,y:31,clueA:'空气里有烘焙的香气，附近有人在喝热饮。',clueB:'找一找西北边，有一把橘色遮阳伞的地方。'},
 {id:'park',name:'心动公园',icon:'🌳',x:69,y:27,clueA:'它在草地上打滚，旁边有一棵大大的树。',clueB:'它去了地图东北边，一个适合野餐的地方。'},
 {id:'bakery',name:'猫爪面包房',icon:'🥐',x:30,y:69,clueA:'有个小馋猫正盯着刚出炉的可颂。',clueB:'西南边的粉色小屋里，藏着我们的小家伙。'},
 {id:'harbor',name:'落日码头',icon:'⛵',x:74,y:70,clueA:'耳边传来水声，它好像在看小船。',clueB:'沿着河往东南走，在木栈桥旁边找找。'},
];
export type Diary = {id:number;text:string;date:string};
export type Game = {adopted:boolean;name:string;cat:number;xp:number;target:string|null;attempts:number;diaries:Diary[];found:number;dateCard:number|null};
export const initial:Game={adopted:false,name:'奶盖',cat:0,xp:0,target:null,attempts:0,diaries:[],found:0,dateCard:null};
export function randomTarget(previous:string|null=null,random=Math.random){const pool=places.filter(p=>p.id!==previous);return pool[Math.floor(random()*pool.length)].id;}
export function findPet(state:Game,id:string,now=Date.now()):Game {if(!state.target)return state;if(id!==state.target)return {...state,attempts:state.attempts+1};const place=places.find(p=>p.id===id)!;return {...state,target:null,attempts:0,xp:state.xp+30,found:state.found+1,diaries:[{id:now,date:new Date(now).toLocaleDateString('zh-CN'),text:`今天溜去${place.name}考察了一下。${state.name}我只是想给你们一点二人约会的空间，才不是迷路！两位铲屎官找了${state.attempts+1}次才接到本喵，罚你们明天多给一根猫条。`},...state.diaries]};}
export const dates=[{icon:'🌅',title:'一起收集一场日落',text:'带上喜欢的饮料，在傍晚散步 20 分钟，为彼此拍一张今日最喜欢的照片。',tag:'户外约会 · 30 分钟'},{icon:'🍳',title:'双人厨房大作战',text:'各自挑选一种食材，一起做一道没尝试过的菜。摆盘后让奶盖担任云评委！',tag:'居家约会 · 60 分钟'},{icon:'🎧',title:'交换一首心动歌曲',text:'各选三首有故事的歌，分享第一次听到它的心情，制作属于你们的迷你歌单。',tag:'随时随地 · 20 分钟'},{icon:'📷',title:'城市寻色小旅行',text:'挑一个你们都喜欢的颜色，出门寻找并拍下 5 件同色的小事物。',tag:'城市探索 · 45 分钟'}];
