import { annotate, validateTree } from '../lib/tree.mjs';
const fail=(status,message)=>Object.assign(new Error(message),{status});
function checked(result){if(result.error){const error=result.error;throw fail(/^PT\d{3}$/.test(error.code||'')?Number(error.code.slice(2)):error.status||400,error.message||'Request failed.');}return result.data;}
function field(input,key,required=false,max=120){const value=input[key];if(value!=null&&typeof value!=='string')throw fail(400,`Invalid ${key}.`);const text=(value||'').trim();if(required&&!text||text.length>max)throw fail(400,`Enter a valid ${key}.`);return text;}
function person(input,id){
  const age=input.age==null||input.age===''?null:Number(input.age);
  if(age!==null&&(!Number.isInteger(age)||age<0||age>125))throw fail(400,'Age must be a whole number from 0 to 125.');
  if(!['male','female','other'].includes(input.gender))throw fail(400,'Select relationship labels.');
  return{id,name:field(input,'name',true),place:field(input,'place',true),doorNumber:field(input,'doorNumber',true,40),occupation:field(input,'occupation'),notes:field(input,'notes',false,1000),age,gender:input.gender,relativeTo:input.relativeTo||null,connection:input.relativeTo?input.connection:null,secondParent:field(input,'secondParent',false,36)||null};
}
function credentials(input){const email=field(input,'email',true,254).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw fail(400,'Enter a valid email address.');if(typeof input.password!=='string'||input.password.length<10||input.password.length>128)throw fail(400,'Use a password of 10–128 characters.');return{email,password:input.password};}
export function createCloudApi(client,{createId=()=>globalThis.crypto.randomUUID(),appUrl='https://nikhil41-coder.github.io/E-Survey/app.html'}={}){
  async function currentUser(){const session=checked(await client.auth.getSession());if(!session.session)return null;return checked(await client.auth.getUser()).user;}
  async function load(){const data=checked(await client.rpc('esurvey_get_family'));return{members:data.members||[],revision:data.revision};}
  async function save(members,revision){if(!Number.isInteger(revision)||revision<0)throw fail(400,'Provide a valid family revision.');try{validateTree(members);}catch(e){throw fail(400,e.message);}const result=checked(await client.rpc('esurvey_save_family',{p_members:members,p_revision:revision}));return{members:annotate(result.members),revision:result.revision};}
  return async function api(path,method='GET',input={}){
    if(path==='/api/login'&&method==='POST'){const data=checked(await client.auth.signInWithPassword(credentials(input)));return{user:{name:data.user.user_metadata?.name||data.user.email,email:data.user.email},csrf:''};}
    if(path==='/api/register'&&method==='POST'){const name=field(input,'name',true),data=checked(await client.auth.signUp({...credentials(input),options:{data:{name},emailRedirectTo:appUrl}}));return{confirmationRequired:!data.session,user:data.user?{name,email:data.user.email}:null,csrf:''};}
    if(path==='/api/session'){const user=await currentUser();return user?{authenticated:true,user:{name:user.user_metadata?.name||user.email,email:user.email},csrf:''}:{authenticated:false};}
    const user=await currentUser();if(!user)throw fail(401,'Please sign in to continue.');
    if(path==='/api/logout'&&method==='POST'){checked(await client.auth.signOut());return{ok:true};}
    const family=await load(),members=family.members;
    if(path==='/api/family'&&method==='GET')return{members:annotate(members),revision:family.revision};
    if(path==='/api/export'&&method==='GET')return{format:'e-survey-family-v1',members:annotate(members)};
    if(path==='/api/members'&&method==='POST'){const record=person(input,createId());if(members.length&&!record.relativeTo)throw fail(400,'Select who this person is related to.');if(!members.length&&record.relativeTo)throw fail(400,'The first person is the head of family.');return save([...members,record],input.revision);}
    const match=/^\/api\/members\/([a-f0-9-]{36})$/.exec(path);
    if(match&&['PATCH','DELETE'].includes(method)){const target=members.find(p=>p.id===match[1]);if(!target)throw fail(404,'Member not found.');
      if(method==='DELETE'){if(members.some(p=>p.relativeTo===target.id||p.secondParent===target.id))throw fail(409,'This member connects other people. Reconnect or remove those people first.');return save(members.filter(p=>p.id!==target.id),input.revision);}
      const updated=person(input,target.id);if(!target.relativeTo&&updated.relativeTo||target.relativeTo&&!updated.relativeTo)throw fail(400,'The head of family cannot be changed here.');return save(members.map(p=>p.id===target.id?updated:p),input.revision);
    }throw fail(404,'Endpoint not found.');
  };
}
