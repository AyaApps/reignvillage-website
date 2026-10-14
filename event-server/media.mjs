// Match the app's EventFlyer / EventFlyerAsset contract. Never render arbitrary imageUrl.
const asset = (value) => {
  if (!value || !/^[a-f0-9]{64}$/.test(value.sha256)) return null;
  if (value.url !== `https://images.revvradar.com/events/flyers/${value.sha256}.jpg?quality=90`) return null;
  if (![value.width,value.height,value.bytes].every(Number.isInteger) ||
      value.width < 1 || value.width > 2160 || value.height < 1 || value.height > 2160 ||
      value.bytes < 1 || value.bytes > 2_000_000) return null;
  return {url:value.url,width:value.width,height:value.height,bytes:value.bytes};
};
export function approvedFlyer(value, event, now = new Date()) {
  if (!value || value.schemaVersion !== 1 || value.state !== 'approved' || value.eventID !== event.id ||
      typeof value.revision !== 'string' || !value.revision || value.revision.length > 100 ||
      ['cancelled','postponed','ended'].includes(event.status)) return null;
  const start = Date.parse(event.startDate)/1000, end = Date.parse(event.endDate)/1000;
  if (![value.occurrenceStart,value.occurrenceEnd,value.displayUntil].every(Number.isFinite) ||
      Math.abs(start-value.occurrenceStart) >= 1 || Math.abs(end-value.occurrenceEnd) >= 1 ||
      value.displayUntil > end || value.displayUntil <= now.getTime()/1000 || end <= start) return null;
  if (typeof value.accessibleDescription !== 'string' || !value.accessibleDescription.trim() ||
      value.accessibleDescription.length > 1000 || typeof value.credit !== 'string' || value.credit.length > 160) return null;
  const preview = asset(value.preview), full = asset(value.full);
  if (!preview || !full || preview.bytes > 600_000 || Math.max(preview.width,preview.height) > 1080 ||
      Math.abs(preview.width/preview.height-full.width/full.height) >= .01) return null;
  return {preview,full,description:value.accessibleDescription,credit:value.credit,
    displayUntil:value.displayUntil, discovery:Math.abs(preview.width/preview.height-.8)<.002};
}
// Decode only the public flyer metadata used above; rights evidence is never projected.
export function decodeFlyer(value) {
  const fields=value?.mapValue?.fields;
  if(!fields) return null;
  const scalar=v=>v?.stringValue ?? (v?.integerValue!==undefined?Number(v.integerValue):v?.doubleValue);
  const keys=['schemaVersion','revision','state','eventID','occurrenceStart','occurrenceEnd','displayUntil','accessibleDescription','credit'];
  const result=Object.fromEntries(keys.map(key=>[key,scalar(fields[key])]));
  for(const name of ['preview','full']) {
    const data=fields[name]?.mapValue?.fields;
    if(data) result[name]=Object.fromEntries(['url','sha256','width','height','bytes'].map(key=>[key,scalar(data[key])]));
  }
  return result;
}

// Preparation for the server-owned, privacy-filtered capture projection. Raw
// capture documents must never be passed here or exported to the browser.
export function selectEventArtwork(flyer, captures, event, now = new Date()) {
  if (flyer?.discovery) return {kind:'flyer',url:flyer.preview.url,description:flyer.description};
  const start=Date.parse(event.startDate), end=Date.parse(event.endDate);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  const eligible=(Array.isArray(captures)?captures:[]).filter(capture=>{
    if(capture.websiteEligible!==true || capture.eventID!==event.id ||
       typeof capture.description!=='string' || !capture.description.trim()) return false;
    const taken=Date.parse(capture.capturedAt);
    if(!Number.isFinite(taken) || taken<start || taken>end || taken>now.getTime()) return false;
    try {const url=new URL(capture.url);return url.protocol==='https:' && url.hostname==='images.revvradar.com' && !url.username && !url.password && !url.port;}catch{return false;}
  }).sort((a,b)=>b.capturedAt.localeCompare(a.capturedAt)||a.url.localeCompare(b.url));
  if(!eligible.length) return null;
  const url=new URL(eligible[0].url);url.searchParams.set('quality','90');
  return {kind:'capture',url:url.href,description:eligible[0].description};
}
