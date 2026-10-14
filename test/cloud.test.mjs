import test from 'node:test';
import assert from 'node:assert/strict';
import { createCloudApi } from '../pages/transport.mjs';
import { validatePublicConfig } from '../pages/public-config.mjs';
const ids=Array.from({length:6},(_,i)=>`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`);
const member=(name,relativeTo=null,connection=null)=>({name,relativeTo,connection,gender:'male',age:30,place:'Springfield',doorNumber:'5',occupation:'Engineer'});
function fakeClient(){let user=null,record={members:[],revision:0},confirmation=false,seen=[];const client={
  auth:{getSession:async()=>({data:{session:user?{}:null}}),getUser:async()=>({data:{user}}),signInWithPassword:async input=>{seen.push(input);if(input.password==='invalid-pass')return{error:{status:400,message:'Invalid login credentials'}};user={id:ids[0],email:input.email,user_metadata:{name:'Tester'}};return{data:{user}};},signUp:async input=>{seen.push(input);user=confirmation?null:{id:ids[0],email:input.email,user_metadata:input.options.data};return{data:{user,session:user?{}:null}};},signOut:async()=>{user=null;return{data:{}};}},
  rpc:async(name,input)=>{if(!user)return{error:{code:'PT401',message:'Sign in required'}};if(name==='esurvey_get_family')return{data:structuredClone(record)};if(input.p_revision!==record.revision)return{error:{code:'PT409',message:'Refresh and try again'}};record={members:structuredClone(input.p_members),revision:record.revision+1};return{data:structuredClone(record)};}
};return{client,seen,setConfirmation(value){confirmation=value;}};}
test('cloud transport requires real authentication and delegates password checks to Supabase',async()=>{
  const fake=fakeClient(),api=createCloudApi(fake.client);assert.deepEqual(await api('/api/session'),{authenticated:false});await assert.rejects(()=>api('/api/family'),e=>e.status===401);await assert.rejects(()=>api('/api/login','POST',{email:'tester@example.test',password:'invalid-pass'}),/Invalid login/);
  await api('/api/login','POST',{email:'tester@example.test',password:'strong-password'});assert.equal((await api('/api/session')).authenticated,true);await api('/api/logout','POST');assert.equal((await api('/api/session')).authenticated,false);
});
test('email-confirmation signup reports confirmation required rather than opening an authenticated tree',async()=>{
  const fake=fakeClient();fake.setConfirmation(true);const api=createCloudApi(fake.client),result=await api('/api/register','POST',{name:'Tester',email:'tester@example.test',password:'strong-password'});assert.equal(result.confirmationRequired,true);assert.equal((await api('/api/session')).authenticated,false);assert.equal(fake.seen[0].options.emailRedirectTo,'https://nikhil41-coder.github.io/E-Survey/app.html');
});
test('cloud family saves preserve shared-parent connections and detect stale writes',async()=>{
  const fake=fakeClient();let sequence=0;const api=createCloudApi(fake.client,{createId:()=>ids[sequence++]});await api('/api/login','POST',{email:'tester@example.test',password:'strong-password'});
  const first=await api('/api/members','POST',{...member('Head'),revision:0}),head=first.members[0].id;
  const pair=await api('/api/members','POST',{...member('Spouse',head,'spouse'),revision:1}),spouse=pair.members[1].id;
  const child=await api('/api/members','POST',{...member('Son',head,'child'),secondParent:spouse,revision:2});assert.equal(child.members[2].relationship,'Son');assert.equal(child.members[2].secondParent,spouse);
  await assert.rejects(()=>api('/api/members','POST',{...member('Stale',head,'child'),revision:2}),e=>e.status===409);
  await assert.rejects(()=>api(`/api/members/${spouse}`,'DELETE',{revision:3}),e=>e.status===409);assert.equal((await api('/api/export')).members.length,3);
});
test('cloud transport validates records before sending and preserves error status for the UI',async()=>{
  const fake=fakeClient(),api=createCloudApi(fake.client,{createId:()=>ids[0]});await api('/api/login','POST',{email:'tester@example.test',password:'strong-password'});await assert.rejects(()=>api('/api/members','POST',{...member('Bad age'),age:-1,revision:0}),e=>e.status===400);await assert.rejects(()=>api('/api/members','POST',{...member('Missing place'),place:'',revision:0}),e=>e.status===400);
});
test('browser configuration rejects service-role and secret keys before publication',()=>{
  assert.equal(validatePublicConfig('',''),false);assert.equal(validatePublicConfig('https://test.supabase.co','sb_publishable_example'),true);
  assert.throws(()=>validatePublicConfig('https://test.supabase.co','sb_secret_example'),/secret/);
  const forbidden='header.'+Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url')+'.signature';assert.throws(()=>validatePublicConfig('https://test.supabase.co',forbidden),/publishable/);
  assert.throws(()=>validatePublicConfig('http://test.supabase.co','sb_publishable_example'),/HTTPS/);
});
