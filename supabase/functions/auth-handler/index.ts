import {serve} from "https://deno.land/std@0.177.0/http/server.ts";
import {createClient} from "@supabase/supabase-js";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ??"";

const supabase = createClient(supabaseUrl,supabaseAnonKey);
//8KB
const MAX_BODY_SIZE = 8*1024;

const corsHeaders = { 
'Access-Control-Allow-Origin':  '*', 
'Access-Control-Allow-Methods': 'POST, OPTIONS', 
'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
}; 

serve(async (req: Request)  =>{
// Always handle OPTIONS preflight first 
if (req.method === 'OPTIONS') { 
return new Response(null, { status: 204, headers: corsHeaders }); 
}

try {
    if(req.method !== "POST"){
        return new Response(JSON.stringify({error:"Method is not POST, only POST allowed "}),{status:405,headers:{...corsHeaders,"Content-Type":"application/json"}});
    }
    //Reject any body larger than 8 KB to prevent payload attacks. 
    const body = await req.text();
    
    if(body.length > MAX_BODY_SIZE){
        return new Response( JSON.stringify({error:"Request body is too large. Max size is ${MAX_BODY_SIZE/1024} KB"}),{status:413,headers:{...corsHeaders,"Content-Type":"application/json"} });
    }

    //Read and parse the JSON request body. 
    const {action,first_name,last_name,email,phone,password} = await req.json();
    // check for missing fields
    if(!action){
        return new Response(
            JSON.stringify(
                {error:"action field is required"}
            ),{
                status:400,headers:{...corsHeaders,"Content-Type":"application/json"}
            }
        );
    }
    if(!first_name || !last_name){
        return new Response(
            JSON.stringify(
                {error:"first_name and last_name fields are required"}
            ),{
                status:400,headers:{...corsHeaders,"Content-Type":"application/json"}
            }
        );
    }

    if(!email || !password){
        return new Response(
            JSON.stringify(
                {error:"email and password fields are required"}
            ),{
                status:400,headers:{...corsHeaders,"Content-Type":"application/json"}
            }
        );
    }    

    if(!phone){
        return new Response(
            JSON.stringify(
                {error:"phone field is required"}
            ),{
                status:400,headers:{...corsHeaders,"Content-Type":"application/json"}
            }
        );
    }    

    //Handle authentication
    switch(action){

        case"signup":
           return await handleSignUp();
        case "login":
            return await handleLogIn();
        default:
            return new Response(
                JSON.stringify({error:"Unknown action: ${action}"}),
                {
                    status:400,
                    headers:{...corsHeaders,"Content-Type":"application/json"}
                }
            );           
    }

} catch(error){
    console.error("Error in auth-handler function:",error);
    return new Response(
        JSON.stringify(
            {error:"Internal server error"}
        ),
        {
            status:500,
            headers:{...corsHeaders,"Content-Type":"application/json"}
        }
    );
}

});

//authentication functions
async function handleSignUp(first_name: string,last_name: string,email:string,password:string,phone: string ) {
    /**
     * todo
     */

    try{
        const {data,error} = await supabase.auth.signUp(
            {
                email,
                password,
                options:{
                    emailRedirectTo:Deno.env.get("SIGNUP_REDIRECT"),

                },
            }
        );
        if(error){
            return new Response(
                JSON.stringify(
                    {
                        error: error.message
                    }
                ),
                {
                    status:400,
                    headers:{...corsHeaders,"Content-Type":"application/json"}
                }
            );
        }
        return new Response(
            JSON.stringify(
                {
                    success:true,
                    message:"Signup successful.",
                    user:data.user,
                    session:data.session,
                }
            ),
            {
                status:200,
                headers:{...corsHeaders,"Content-Type":"application/json"}
            }
        );
    } catch(error){
        console.error("Signup error:",error);
        return new Response(
            JSON.stringify(
                {
                    error:"Signup failed"
                }
            ),
            {
                status:500,
                headers:{...corsHeaders,"Content-Type":"application/json"}
            }
        );
    }

    
const { data, error } = await supabase
  .from('profiles')
  .insert([
    { id: 'someValue', first_name: '${first_name}',last_name: '${last_name}',phone: '${phone}' },
  ])
  .select()

}
async function handleLogIn() {
     /**
     * todo
     */
}
