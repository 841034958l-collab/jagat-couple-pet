import {describe,it,expect} from 'vitest';
import {initial,places,findPet,randomTarget} from './game';
describe('双人寻猫回合',()=>{
it('随机地点有效，并可排除上一个地点',()=>{for(const p of places)expect(randomTarget(p.id,()=>0)).not.toBe(p.id);expect(places.some(p=>p.id===randomTarget())).toBe(true)});
it('找错记录次数，不增加奖励',()=>{const s=findPet({...initial,adopted:true,target:'park'},'cafe');expect(s.attempts).toBe(1);expect(s.xp).toBe(0);expect(s.target).toBe('park')});
it('找到宠物奖励成长值，生成带名字和地点的日记',()=>{const s=findPet({...initial,name:'团子',adopted:true,target:'park',attempts:1},'park',123456);expect(s.target).toBeNull();expect(s.xp).toBe(30);expect(s.found).toBe(1);expect(s.diaries[0].text).toContain('团子');expect(s.diaries[0].text).toContain('心动公园');expect(s.diaries[0].text).toContain('2次');expect(findPet(s,'park')).toEqual(s)});
it('多轮保留日记并累积成长',()=>{let s={...initial,adopted:true,target:'park'};s=findPet(s,'park',1) as typeof s;s=findPet({...s,target:'cafe'},'cafe',2) as typeof s;expect(s.xp).toBe(60);expect(s.diaries).toHaveLength(2)});
});
