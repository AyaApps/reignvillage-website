import {test} from 'node:test';
import assert from 'node:assert/strict';
import {approvedFlyer,decodeFlyer} from '../event-server/media.mjs';
const now=new Date('2026-10-11T12:00:00Z');
const event={id:'sample',startDate:'2026-10-12T12:00:00Z',endDate:'2026-10-12T15:00:00Z',status:'upcoming'};
const asset={url:`https://images.revvradar.com/events/flyers/${'a'.repeat(64)}.jpg?quality=90`,sha256:'a'.repeat(64),width:800,height:1000,bytes:100000};
const flyer={schemaVersion:1,revision:'1',state:'approved',eventID:'sample',occurrenceStart:Date.parse(event.startDate)/1000,occurrenceEnd:Date.parse(event.endDate)/1000,displayUntil:Date.parse(event.endDate)/1000,accessibleDescription:'Sample flyer',credit:'Organizer',preview:asset,full:asset};
test('flyer requires approved matching occurrence, unexpired display and validated immutable assets',()=>{
  assert.equal(approvedFlyer(flyer,event,now).discovery,true);
  for(const patch of [{state:'withdrawn'},{eventID:'other'},{occurrenceStart:0},{displayUntil:0},{accessibleDescription:''},{preview:{...asset,url:'https://evil.example/a.jpg'}},{preview:{...asset,bytes:600001}}])
    assert.equal(approvedFlyer({...flyer,...patch},event,now),null);
  assert.equal(approvedFlyer(flyer,{...event,status:'cancelled'},now),null);
  assert.equal(approvedFlyer(flyer,event,new Date(event.endDate)),null);
  const landscape={...asset,width:1000,height:800};
  assert.equal(approvedFlyer({...flyer,preview:landscape,full:landscape},event,now).discovery,false);
});
test('Firestore flyer decoder excludes private evidence and unknown properties',()=>{
  const decoded=decodeFlyer({mapValue:{fields:{schemaVersion:{integerValue:'1'},credit:{stringValue:'Club'},permissionEvidence:{stringValue:'PRIVATE'},preview:{mapValue:{fields:{url:{stringValue:asset.url},privateNotes:{stringValue:'PRIVATE'}}}}}}});
  assert.equal(decoded.schemaVersion,1);
  assert(!JSON.stringify(decoded).includes('PRIVATE'));
  assert.equal(decodeFlyer({stringValue:'bad'}),null);
});

test('prepared fallback chooses flyer, then eligible exact-occurrence capture, then no artwork',async()=>{
  const {selectEventArtwork}=await import('../event-server/media.mjs');
  const time=new Date('2026-10-12T13:00:00Z');
  const capture={websiteEligible:true,eventID:'sample',capturedAt:'2026-10-12T12:15:00Z',url:'https://images.revvradar.com/captures/example.jpg',description:'A vehicle at the event'};
  assert.equal(selectEventArtwork(approvedFlyer(flyer,event,time),[capture],event,time).kind,'flyer');
  assert.equal(selectEventArtwork(null,[capture],event,time).kind,'capture');
  for(const patch of [{websiteEligible:false},{eventID:'other'},{capturedAt:'2025-10-12T12:15:00Z'},{capturedAt:'2026-10-12T14:15:00Z'},{url:'https://evil.example/x.jpg'}])
    assert.equal(selectEventArtwork(null,[{...capture,...patch}],event,time),null);
  assert.equal(selectEventArtwork(null,[],event,time),null);
});

test('capture adapter bypasses event cache; missing media falls back without hiding listings',async()=>{
  const {loadCatalog}=await import('../event-server/source.mjs');
  const {renderListing}=await import('../event-server/render.mjs');
  const now=new Date('2026-10-12T13:00:00Z');
  const doc={id:'capture-demo',data:{...event,id:undefined,name:'Demo',description:'Example',city:'Tacoma',state:'WA',countryCode:'US',address:'1 Main St',timeZone:'America/Los_Angeles',isVerified:true,websiteApproved:true,sourceUrl:'https://example.com',organizerName:'Demo',isFree:true,cost:0}};
  const cache={match:async()=>Response.json({fetchedAt:now.getTime(),documents:[doc]})};
  let calls=0;
  const fetcher=async()=>{calls++;return Response.json({captures:calls===1?[{websiteEligible:true,eventID:'capture-demo',capturedAt:'2026-10-12T12:15:00Z',url:'https://images.revvradar.com/captures/demo.jpg',description:'Demo capture'}]:[]});};
  const first=await loadCatalog({cache,now,fetcher,includeMedia:true});
  assert.equal(first.events[0].artwork.kind,'capture');
  assert.match(renderListing(first,new URL('https://reignvillage.com/events/'),now).html,/Demo capture/);
  const removed=await loadCatalog({cache,now,fetcher,includeMedia:true});
  assert.equal(removed.events[0].artwork,null);assert.equal(removed.events.length,1);assert.equal(calls,2);
  const outage=await loadCatalog({cache,now,fetcher:async()=>{throw Error('offline');},includeMedia:true});
  assert.equal(outage.events[0].artwork,undefined);assert.equal(outage.events.length,1);
});
