export function validatePublicConfig(url,key){
  if(!url&&!key)return false;
  if(!url||!key)throw new Error('Set both the Supabase URL and its publishable key.');
  const parsed=new URL(url);
  if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.origin!==url)throw new Error('Use the exact HTTPS Supabase project origin.');
  if(key.startsWith('sb_secret_'))throw new Error('A secret Supabase key must never be published. Use a publishable key.');
  if(key.startsWith('sb_publishable_'))return true;
  try{const payload=JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));if(payload.role==='anon')return true;}catch{}
  throw new Error('Only a Supabase publishable key or legacy anon key can be used in browser code.');
}
