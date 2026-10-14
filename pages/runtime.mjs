import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';
import { createCloudApi } from './transport.mjs';
import { validatePublicConfig } from './public-config.mjs';
export const backendReady = validatePublicConfig(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
let cloud;
export async function cloudApi(path,method='GET',data) {
  if(!backendReady){if(path==='/api/session')return{authenticated:false};throw Object.assign(new Error('Account sign-in is being configured. Please try again later.'),{status:503});}
  if(!cloud){
    const client=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce',storageKey:'e-survey-auth'}});
    cloud=createCloudApi(client,{appUrl:new URL('./app.html',location.href).href});
    client.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'&&location.pathname.endsWith('/app.html'))location.replace('./index.html');});
  }
  return cloud(path,method,data);
}
