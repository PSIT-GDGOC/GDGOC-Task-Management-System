import {expect,it,vi} from 'vitest';
import {RecoveringRedisStore} from '../src/security/recovering-redis-store';
import type {Options} from 'express-rate-limit';
const options={windowMs:60000} as Options;
it('recovers from startup script loading failure without resetting rate counters',async()=>{
  let unavailable=true;
  const sendCommand=vi.fn(async(...args:string[])=>{
    if(unavailable)throw new Error('Redis is connecting');
    if(args[0]==='SCRIPT')return 'fixture-sha';
    if(args[0]==='EVALSHA')return [2,55000];
    throw new Error('Unexpected command');
  });
  const store=new RecoveringRedisStore({prefix:'fixture:',sendCommand:sendCommand as never});
  await expect(store.init(options)).rejects.toThrow('Redis is connecting');
  await expect(store.increment('user')).rejects.toThrow('Redis is connecting');
  unavailable=false;
  expect(await store.increment('user')).toMatchObject({totalHits:2});
  expect(sendCommand.mock.calls.some(args=>['DEL','FLUSHDB','FLUSHALL'].includes(args[0]))).toBe(false);
});
it('recovers after a script reload fails during a runtime outage',async()=>{
  let unavailable=false;
  const sendCommand=vi.fn(async(...args:string[])=>{
    if(unavailable)throw new Error('Redis unavailable');
    return args[0]==='SCRIPT'?'fixture-sha':[3,50000];
  });
  const store=new RecoveringRedisStore({sendCommand:sendCommand as never});
  await store.init(options);
  unavailable=true;
  await expect(store.increment('user')).rejects.toThrow('Redis unavailable');
  unavailable=false;
  expect(await store.increment('user')).toMatchObject({totalHits:3});
});
it('coalesces initialization for requests arriving together after startup failure',async()=>{
  let unavailable=true;
  const sendCommand=vi.fn(async(...args:string[])=>{
    if(unavailable)throw new Error('Starting');
    return args[0]==='SCRIPT'?'fixture-sha':[1,60000];
  });
  const store=new RecoveringRedisStore({sendCommand:sendCommand as never});
  await expect(store.init(options)).rejects.toThrow();
  sendCommand.mockClear();unavailable=false;
  await Promise.all([store.increment('a'),store.increment('b')]);
  expect(sendCommand.mock.calls.filter(args=>args[0]==='SCRIPT')).toHaveLength(2);
});
