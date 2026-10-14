import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
test('unknown receipt preserves payload across challenge failure and retry; confirmed receipt clears warning',async()=>{
 const handlers={},send={disabled:true},status={},fieldset={disabled:false},nodes=[fieldset,send];
 const form={addEventListener:(name,fn)=>handlers[name]=fn,reportValidity:()=>true,querySelectorAll:selector=>selector==='fieldset'?[fieldset]:nodes};
 const values={name:'Original',countryCode:'us',state:'wa',timeZone:'America/Los_Angeles',otherTimeZone:'',venueAuthorized:'on',conductAccepted:'on',flyerFile:{size:100,type:'image/jpeg'},flyerDescription:'Demo',flyerCredit:'Club',flyerPermission:'on'};
 const requests=[],answers=[{status:503,error:'Unconfirmed'},{status:400,error:'Expired challenge'},{status:202,received:true,message:'Received'}];
 const receipt={hidden:true,scrollIntoView(){}},title={focus(){this.focused=true;}},eventName={};
 const window={turnstile:{reset(){}},addEventListener:(name,fn)=>handlers[name]=fn};
 vm.runInNewContext(readFileSync(new URL('../event-submission.js',import.meta.url),'utf8'),{document:{querySelector:s=>s==='#organizer-submission'?form:s==='#submission-send'?send:s==='#submission-received'?receipt:s==='#received-heading'?title:s==='#received-event-name'?eventName:s==='#other-zone-field'?null:status},window,FileReader:class{readAsDataURL(){this.result='data:image/jpeg;base64,AAAA';this.onload();}},FormData:class{[Symbol.iterator](){return Object.entries(values)[Symbol.iterator]();}},crypto:{randomUUID:()=> 'same-request-id'},AbortSignal,fetch:async(_url,options)=>{requests.push(JSON.parse(options.body));const next=answers.shift();return {status:next.status,json:async()=>next};}});
 for(let i=0;i<3;i++){window.submissionChallengeReady('token'+i);await handlers.submit({preventDefault(){}});if(i<2){assert.equal(fieldset.disabled,true);assert.equal(send.textContent,'Retry same submission');values.name='Changed after timeout';}}
 assert.equal(requests.length,3);assert(requests.every(r=>r.requestId==='same-request-id'&&r.name==='Original'));assert.equal(status.textContent,'Received');assert.equal(send.hidden,true);assert.equal(form.hidden,true);assert.equal(receipt.hidden,false);assert.equal(title.focused,true);assert.equal(eventName.textContent,'Original');
 let prevented=false;handlers.beforeunload({preventDefault(){prevented=true;}});assert.equal(prevented,false);
});

test('flyer fields become required only for an upload; removing it permits a submission without file reads', async () => {
 const handlers={}, file={files:[],addEventListener:(n,fn)=>handlers.fileChange=fn};
 const fields=[{},{}], details={hidden:false,querySelectorAll:()=>fields};
 const send={},status={},form={addEventListener:(n,fn)=>handlers[n]=fn,reportValidity:()=>true,querySelector:s=>s==='[name="flyerFile"]'?file:null,querySelectorAll:()=>[]};
 const values={name:'No artwork',organizerName:'Club',countryCode:'us',state:'wa',timeZone:'America/Los_Angeles',venueAuthorized:'on',conductAccepted:'on',flyerFile:{size:0,type:''}};
 const requests=[],window={addEventListener(){},turnstile:{reset(){}}};
 vm.runInNewContext(readFileSync(new URL('../event-submission.js',import.meta.url),'utf8'),{document:{querySelector:s=>s==='#organizer-submission'?form:s==='#submission-send'?send:s==='#submission-status'?status:s==='#flyer-details'?details:null},window,FileReader:class{constructor(){throw Error('No file should be read');}},FormData:class{[Symbol.iterator](){return Object.entries(values)[Symbol.iterator]();}},crypto:{randomUUID:()=> 'no-art-id'},AbortSignal,fetch:async(_url,options)=>{requests.push(JSON.parse(options.body));return {status:202,json:async()=>({received:true,message:'Received'})};}});
 assert.equal(details.hidden,true);assert(fields.every(f=>f.disabled&&!f.required));
 file.files=[{size:100}];handlers.fileChange();
 assert.equal(details.hidden,false);assert(fields.every(f=>!f.disabled&&f.required));
 file.files=[];handlers.fileChange();
 assert.equal(details.hidden,true);assert(fields.every(f=>f.disabled&&!f.required));
 window.submissionChallengeReady('token');await handlers.submit({preventDefault(){}});
 assert.equal(requests.length,1);assert.equal(Object.hasOwn(requests[0],'flyer'),false);assert.equal(status.textContent,'Received');
});
