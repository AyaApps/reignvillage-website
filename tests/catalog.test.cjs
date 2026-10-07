const {test} = require('node:test');
const assert = require('node:assert/strict');
const {prepareCatalog} = require('../event-server/catalog.cjs');
const now = new Date('2026-10-07T01:00:00Z');
const event = overrides => ({id: 'reviewed-event', data: {
  name: 'Example car meet', city: 'Tacoma', state: 'WA', address: 'Example venue',
  organizerName: 'Example organizer', sourceUrl: 'https://example.com/event',
  isVerified: true, startDate: '2026-10-10T08:00:00-07:00',
  endDate: '2026-10-10T11:00:00-07:00', timeZone: 'America/Los_Angeles',
  ...overrides,
}});
const catalog = overrides => prepareCatalog([event(overrides)], ['reviewed-event'], now);

test('requires explicit selection and exports only allowlisted fields', () => {
  assert.equal(prepareCatalog([event()], [], now).events.length, 0);
  const result = catalog({createdBy: 'private-owner', reviewNotes: 'internal', imageUrl: 'unreviewed'});
  assert.equal(result.events[0].startDate, '2026-10-10T15:00:00.000Z');
  assert.deepEqual(result.browseIds, ['reviewed-event']);
  for (const key of ['createdBy', 'reviewNotes', 'imageUrl']) assert.equal(key in result.events[0], false);
});
test('cancellation and postponement remain available for details but leave browsing', () => {
  for (const [field, status] of [['isCancelled', 'cancelled'], ['isPostponed', 'postponed']]) {
    const result = catalog({[field]: true});
    assert.equal(result.events[0].status, status);
    assert.deepEqual(result.browseIds, []);
  }
});
test('expiry and ongoing status use absolute time, including exact end boundary', () => {
  const fixture = event();
  assert.equal(prepareCatalog([fixture], [fixture.id], new Date('2026-10-10T15:00:00Z')).events[0].status, 'ongoing');
  assert.equal(prepareCatalog([fixture], [fixture.id], new Date('2026-10-10T18:00:00Z')).events[0].status, 'ended');
});
test('incomplete, unverified, private and invalid schedules fail closed', () => {
  for (const change of [{isVerified: false}, {isPrivate: true}, {timeZone: ''},
    {timeZone: 'invalid'}, {endDate: null}, {startDate: '2026-10-10T08:00:00'},
    {endDate: '2026-10-01T00:00:00Z'}, {startDate: '2026-02-30T08:00:00Z'},
    {startDate: '2026-10-10T24:00:00Z'}, {sourceUrl: 'javascript:alert(1)'},
    {sourceUrl: 'https://user:password@example.com'}, {address: ''}]) {
    const result = catalog(change);
    assert.equal(result.events.length, 0);
    assert.equal(result.rejected.length, 1);
  }
});
test('legacy organizer omission uses a real source without inventing an organizer', () => {
  const result = catalog({organizerName: '', sourceUrl: null, websiteUrl: 'https://example.com/event'});
  assert.equal(result.events[0].organizerName, '');
  assert.equal(result.events[0].sourceUrl, 'https://example.com/event');
});
test('missing price stays unknown; verified free and positive paid prices survive', () => {
  assert.equal(catalog().events[0].cost, null);
  assert.equal(catalog({isFree: false, cost: 0, currency: 'USD'}).events[0].cost, null);
  assert.equal(catalog({isFree: true}).events[0].cost, 0);
  assert.equal(catalog({isFree: false, cost: 12.50, currency: 'USD'}).events[0].cost, 12.50);
});
test('deleted selection is reported and duplicate identities fail the batch', () => {
  assert.equal(prepareCatalog([], ['removed'], now).rejected[0].reason, 'missing-public-event');
  assert.throws(() => prepareCatalog([event(), event()], ['reviewed-event'], now), /Duplicate/);
  assert.throws(() => prepareCatalog([], ['same', 'same'], now), /Duplicate/);
});
test('DST offset and safe app ID encoding are retained without visitor timezone assumptions', () => {
  const fixture = event({startDate: '2026-11-01T01:00:00-07:00', endDate: '2026-11-01T01:00:00-08:00'});
  fixture.id = 'id?with#reserved';
  const result = prepareCatalog([fixture], [fixture.id], now).events[0];
  assert.equal(Date.parse(result.endDate) - Date.parse(result.startDate), 3600000);
  assert.equal(result.appUrl, 'https://revvradar.com/e/id%3Fwith%23reserved');
});
