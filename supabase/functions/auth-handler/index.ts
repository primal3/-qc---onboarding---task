import {serve} from "https://deno.land/std@0.177.0/http/server.ts";
import {createClient} from "@supabase/supabase-js";
import validator from "validator";
import axios from "axios";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ??"";

const supabase = createClient(supabaseUrl,supabaseAnonKey);
//8KB
const MAX_BODY_SIZE = 8*1024;
const MINUTE = 60000;
const MINUTES_10 = 10*MINUTE;
const HOUR = 60*MINUTE;

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
    const {action,first_name,last_name,email,phone,password,user_id} = await req.json();
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

    if(!user_id){
        return new Response(
            JSON.stringify(
                {error:"user_id field is required"}
            ),{
                status:400,headers:{...corsHeaders,"Content-Type":"application/json"}
            }
        );
    }    

    //validate
    validateNames(first_name);
    validateNames(last_name);
    validatePhone(phone);
    validateEmail(email);
    validatePassword(password);

    //Handle authentication
    switch(action){

        case"signup":
           return await handleSignUp(first_name,last_name,email,password,phone);
        case "login":
            return await handleLogIn(email,password,user_id);
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
        const {data,error} = await supabase.auth.admin.createUser(
            {
                email,
                password,
                /**
                 * 
                options:{
                    emailRedirectTo:Deno.env.get("SIGNUP_REDIRECT"),

                },
                */

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
        //add profile data
        addProfile(data.user.id,first_name,last_name,phone );

        return new Response(
            JSON.stringify(
                {
                    success:true,
                    message:"Signup successful.",
                    user:data.user,
                    user_id:data.user.id,
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

    


}
async function addProfile(user_id:string,first_name: string,last_name: string,phone: string ){
    const { data, error } = await supabase
    .from('profiles')
    .insert([
        {id:user_id , first_name: first_name,last_name: last_name,phone: phone },
    ])
    .select()

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
                    message:"profile added successful.",
                    data:data,

                    
                }
            ),
            {
                status:200,
                headers:{...corsHeaders,"Content-Type":"application/json"}
            }
        );    

}
async function handleLogIn(email:string,password:string,user_id:string) {
     /**
     * todo
     */
    try {

       // check for locked out account
        isAccountLocked(email);


        const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
        });

        if(error){
            /**
             * add lockout timing logic
             */
            


            const ip = await getPublicIP();
            addLogInAttempts(email,user_id,ip,false, Date.now());

            return new Response(
                JSON.stringify(
                    {
                        error: error?.message
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
                    message:"Login successful.",
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
        console.error("Login error:",error);
        return new Response(
            JSON.stringify(
                {
                    error:"Login failed"
                }
            ),
            {
                status:500,
                headers:{...corsHeaders,"Content-Type":"application/json"}
            }
        );
    }


}

//get ip_address
async function getPublicIP(){
    try{
      const response = await axios.get("https://api.ipify.org?format=json");
      return response.data.ip;
    }catch(error){
        /**
         * 
         *         return new Response(
            JSON.stringify(
                {
                    error: "Failed to fetch IP error: "+error
                }
            ),
            {
                status:400,
                headers:{...corsHeaders,"Content-Type":"application/json"}
            }
        );


         */
        console.error("Failed to fetch IP error: ",error)
    }
}
//validate functions
function validateNames(name:string){
    let message ="";
    if(!name)message="Name is empty" 

    if(!(/^[A-Za-z ]+$/.test(name) )) message = "only letters and space are allowed" ;

    return new Response(
    JSON.stringify(
        {
            error:message
        }
    ),
    {
        status:500,
        headers:{...corsHeaders,"Content-Type":"application/json"}
    }
);
        
}

function validatePhone(phone:string){
    let message ="";
    if(!phone)message="phone is empty" 

    else if(!(/^[0-9 ]+$/.test(phone) )) message = "digits are allowed" ;
    else if(phone[0] !=='0'){message="the first digit must be 0"}
    return new Response(
    JSON.stringify(
        {
            error:message
        }
    ),
    {
        status:500,
        headers:{...corsHeaders,"Content-Type":"application/json"}
    }
);
        
}

function  validateEmail(email:string){
    let message ="";
    if(!email)message="email is empty" 
    else if(!validator.isEmail(email)) message = "email pattern invaild"
    return new Response(
    JSON.stringify(
        {
            error:message
        }
    ),
    {
        status:500,
        headers:{...corsHeaders,"Content-Type":"application/json"}
    }
);

}

function  validatePassword(password:string){
 if(!password)return new Response(
    JSON.stringify(
        {
            error:"password is empty"
        }
    ),
    {
        status:500,
        headers:{...corsHeaders,"Content-Type":"application/json"}
    }
);
}
async function isAccountLocked(email:string) {
    
        const { data: account_lockouts, error } = await supabase
        .from('account_lockouts')
        .select('email')
        
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
        if(account_lockouts){
            if(account_lockouts?.length>0){
            account_lockouts?.forEach((account,_index)=>{
            if(account.email === email){

                
            validateAccountLockOut(email);

            }
            });
        
            }

        }


}
async function validateAccountLockOut(email:string){

        try{ 
            const { data: account_lockouts, error } = await supabase
            .from('account_lockouts')
            .select('locked_until')
            .eq("email",email)
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
            
            account_lockouts?.forEach((account,_index)=>{
            if(account.locked_until >Date.now()){
                return new Response(
                    JSON.stringify(
                        {
                            error: "Your account is temporarily locked. Please try again in ${math.floor((account.locked_until -Date.now()) /1000/60)} minutes. "
                        }
                    ),
                    {
                        status:400,
                        headers:{...corsHeaders,"Content-Type":"application/json"}
                    }
                );

            }
            });


        } catch(error){
        console.error("acount_lockout validation error:",error);
        return new Response(
            JSON.stringify(
                {
                    error:"acount_lockout validation failed"
                }
            ),
            {
                status:500,
                headers:{...corsHeaders,"Content-Type":"application/json"}
            }
        );

        
    }            

}
async function addLogInAttempts(email:string ,user_id:string,ip_address:string,success:boolean,attempted_at:number) {
            
   try {

             const { data, error } = await supabase
            .from('login_attempts')
            .insert([
                { id: user_id, email: email, ip_address: ip_address  , success: success, attempted_at:attempted_at },
            ])
            .select()

            if(error){
            return new Response(
                JSON.stringify(
                    {
                        error: error?.message
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
                    message:"addLogInAttempts successful.",

                    
                }
            ),
            {
                status:200,
                headers:{...corsHeaders,"Content-Type":"application/json"}
            }
        );
    
   } catch (error) {

        return new Response(
            JSON.stringify(
                {
                    error:"adding  log attempts   failed"+error
                }
            ),
            {
                status:500,
                headers:{...corsHeaders,"Content-Type":"application/json"}
            }
        );    

   }


}

async function getLogInAttempts(email:string,user_id:string) {
    
    try {
        
    const { data: login_attempts, error } = await supabase
    .from('login_attempts')
    .select('attempted_at')
    .eq('id',user_id)

    if(error){
    return new Response(
        JSON.stringify(
            {
                error: error?.message
            }
        ),
        {
            status:400,
            headers:{...corsHeaders,"Content-Type":"application/json"}
        }
    );    

    }


    getLastLockType(user_id);
    if(login_attempts){
    if(login_attempts?.length ===3){
        if(login_attempts[-1].attempted_at < MINUTES_10 && login_attempts[-1].attempted_at < MINUTES_10 && login_attempts[-1].attempted_at < MINUTES_10)
         
         addAccountLocked(email,user_id,Date.now()+MINUTES_10,"short");            
        }
    else if(){

    }
    }


    } catch (error) {
        
        return new Response(
            JSON.stringify(
                {
                    error:"getting  log attempts   failed"+error
                }
            ),
            {
                status:500,
                headers:{...corsHeaders,"Content-Type":"application/json"}
            }
        );

    }




}

async function addAccountLocked( email:string,user_id:string,locked_until: number ,lockout_type:string) {
try {

    const { data, error } = await supabase
    .from('account_lockouts')
    .insert([
        { id: user_id, email: email,locked_until:locked_until ,lockout_type:lockout_type},
    ])
    .select()


    if(error){
    return new Response(
        JSON.stringify(
            {
                error: error?.message
            }
        ),
        {
            status:400,
            headers:{...corsHeaders,"Content-Type":"application/json"}
        }
    );    

    }    

    
} catch (error) {
    
        return new Response(
            JSON.stringify(
                {
                    error:"adding  account locked   failed"+error
                }
            ),
            {
                status:500,
                headers:{...corsHeaders,"Content-Type":"application/json"}
            }
        );


}        


}

async function getLastLockType(user_id:string)  {
  try {
    
    const { data: account_lockouts, error } = await supabase
    .from('account_lockouts')
    .select('lockout_type')
    .eq('id',user_id)
    
    if(account_lockouts){
        return account_lockouts[-1].lockout_type
    }

    
  } catch (error) {
    
  }

}