import {serve} from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@^2.46.2'
//import validator from "validator";
//import axios from "axios";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SERVICE_KEY") ??"";

const supabase = createClient(supabaseUrl,supabaseServiceKey)
//8KB
const MAX_BODY_SIZE = 8*1024;


const corsHeaders = { 
'Access-Control-Allow-Origin':  '*', 
'Access-Control-Allow-Methods': 'POST, OPTIONS', 
'Access-Control-Allow-Headers': 'Content-Type, Authorization', 
}; 

const APPROVED_INSTITUTIONS = [ 
  // Traditional Universities 
  'University of Cape Town (UCT)', 
  'University of the Witwatersrand (Wits)', 
  'University of Pretoria (UP)', 
  'Stellenbosch University (SU)', 
  'University of Johannesburg (UJ)', 
  'University of KwaZulu-Natal (UKZN)', 
  'University of the Free State (UFS)', 
  'Nelson Mandela University (NMU)', 
  'Rhodes University (RU)', 
  'University of the Western Cape (UWC)', 
  'University of Limpopo (UL)', 
  'University of Zululand (UniZulu)', 
  'Walter Sisulu University (WSU)', 
  'University of Fort Hare (UFH)', 
  'University of Venda (Univen)', 
  'North-West University (NWU)', 
  'University of South Africa (UNISA)', 
  'University of Mpumalanga (UMP)', 
  'Sol Plaatje University (SPU)', 
  // Universities of Technology 
  'Tshwane University of Technology (TUT)', 
  'Cape Peninsula University of Technology (CPUT)', 
  'Durban University of Technology (DUT)', 
  'Vaal University of Technology (VUT)', 
  'Central University of Technology (CUT)', 
  'Mangosuthu University of Technology (MUT)', 
  // TVET & Other 
  'Ekurhuleni East TVET College', 
  'Tshwane North TVET College', 
  'Sedibeng TVET College', 
  'Motheo TVET College', 
  'Boland TVET College', 
  'False Bay TVET College', 
  'Coastal KZN TVET College', 
  'Umgungundlovu TVET College', 
]; 
  



serve(async (req: Request)  =>{
    // Always handle OPTIONS preflight first 
    if (req.method === 'OPTIONS') { 
    return new Response("OK", { status: 200, headers: corsHeaders }); 
    }
    try {
        
        //Only allow POST
        if(req.method !== "POST"){
            return new Response(
                JSON.stringify({error: "Method is not POST, only POST allowed"}),
                {
                    status:405,
                    headers:{...corsHeaders,"Content-Type":"application/json"}
                }
            );
        }

        //Reject any body larger than 8 KB to prevent payload attacks. 
        const body = await req.text();
        
        if(body.length > MAX_BODY_SIZE){
            return new Response( JSON.stringify({error:"Request body is too large. Max size is ${MAX_BODY_SIZE/1024} KB"}),{status:413,headers:{...corsHeaders,"Content-Type":"application/json"} });
        }

        
        // Extract token from Authorization header 
        const authHeader = req.headers.get('Authorization'); 
        if (!authHeader || !authHeader.startsWith('Bearer ')) { 
        return new Response(
        JSON.stringify(
        {
        error: 'Unauthorised. Please log in.'
        }
        ), 
        { 
        status: 401,
         headers:{...corsHeaders,"Content-Type":"application/json"} 
        }
        ); 
        
        } 
        // Verify the JWT token
        const token = authHeader.replace('Bearer ', ''); 
        const { data: { user }, error } = await supabase.auth.getUser(token); 
        if (error || !user) {

        return new Response(
        JSON.stringify(
            {
             error: 'Session expired. Please log in again.'
             }
            ), 
        { 
        status: 401,
        headers:{...corsHeaders,"Content-Type":"application/json"} }
        ); 
        } 

        //Read and parse the JSON request body. 
        const { action,institution, course, academic_year, status,notes} =JSON.parse(body);

        // Case-insensitive check 
        const normalised = APPROVED_INSTITUTIONS.map(i => i.toLowerCase()); 
        //validate institution
        if(action==="add"){
        if(institution){
        if (!normalised.includes(institution.toLowerCase())) { 
        //return error?('Institution not recognised. Please select from the approved list.') :null; 
        return new Response(
            JSON.stringify(
                {
                error: 'Institution not recognised. Please select from the approved list.' 
                }
            ), 
        { 
            status: 400,
              headers:{...corsHeaders,"Content-Type":"application/json"} });        

        }    
        }     

        if(!course){
        return new Response(
            JSON.stringify(
                {
                error: 'course  is empty . Please enter course.' 
                }
            ), 
        { 
            status: 204,
             headers:{...corsHeaders,"Content-Type":"application/json"} });
        }
        if(!academic_year){
        return new Response(
            JSON.stringify(
                {
                error: 'academic_year  is empty . Please enter academic_year.' 
                }
            ), 
        { 
            status: 204,
             headers:{...corsHeaders,"Content-Type":"application/json"}});
        }

        if(status !== 'draft' || status !== 'submitted'){
        return new Response(
            JSON.stringify(
                {
                error: 'Invalid status.' 
                }
            ), 
        { 
            status: 400,
              headers:{...corsHeaders,"Content-Type":"application/json"}});
        }

        }

        //}



        //Handle authentication
        switch(action){

            case"add":
            return await  addApplications(user.id ,institution, course, academic_year, status,notes);     

            case "load": 
                return await getApplications(user.id);
            default:
                return new Response(
                    JSON.stringify({error:"Unknown action: ${action}"}),
                    {
                        status:400,
                        headers:{...corsHeaders,"Content-Type":"application/json"}
                    }
                );           
        }


    } catch (error) {
        return new Response(
            JSON.stringify(
                {error:"Internal server error"+error}
            ),
            {
                status:500,
                headers:{...corsHeaders,"Content-Type":"application/json"}
            }
        );   
    }


});

async function addApplications(user_id : string,institution:string, course:string, academic_year:string, status:string,notes:string) {
    try{
         const { data, error } = await supabase
        .from('applications')
        .insert([
            { id:user_id,user_id : user_id,institution:institution, course:course, academic_year:academic_year, status:status,notes:notes },
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
                    message:"adding applications successful.",
                    data:data,

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
                {error:"Internal server error"+error}
            ),
            {
                status:500,
                headers:{...corsHeaders,"Content-Type":"application/json"}
            }
        ); 

    }

}



async function getApplications(user_id : string) {
    try {

    const { data: applications, error } = await supabase
        .from('applications')
        .select('*')
        .eq("user_id",user_id)
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
                    message:"getting applications successful.",
                    data:applications,
                    institutions:APPROVED_INSTITUTIONS

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
                {error:"Internal server error"+error}
            ),
            {
                status:500,
                headers:{...corsHeaders,"Content-Type":"application/json"}
            }
        ); 

    }

}
