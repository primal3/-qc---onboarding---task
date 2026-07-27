//import { log } from "node:console";
//import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import validator from "validator";
//import validator from "https://cdn.jsdelivr.net/npm/validator@latest/validator.min.js";

 (function(){

        const loginPanel = document.getElementById('panel-login');
        const registerPanel = document.getElementById('panel-register');        
        const switchToRegister = document.getElementById('switchToRegister');
        const switchToLogin = document.getElementById('switchToLogin');

        
        function setActiveTab (tabId){
        loginPanel.classList.toggle('hidden',tabId !=='login');
        registerPanel.classList.toggle('hidden',tabId !=='register');

        }
        if(switchToRegister){
   
            
            switchToRegister.addEventListener('click',function(e){
                e.preventDefault();
                setActiveTab('register');
            });
        }        
        if(switchToLogin){
            
            switchToLogin.addEventListener('click',function(e){
                e.preventDefault();
                setActiveTab('login');
            });
        }

    
        

    setActiveTab('login');
    })();   

// form submission auth.js
document.getElementById('loginForm').addEventListener('submit',function(e){
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    if(!validator.isEmail(email)) {alert("email pattern invaild");
        return;
    }
    if(email && password){
        //alert("it works")
        logIn(email,password);
     
        window.location.replace('dashboard.html'); 
    }else {alert('Please fill both fields');
        return;
    }


});

document.getElementById('registerForm').addEventListener('submit',function(e){
    e.preventDefault();
    const first_name = document.getElementById('regFName').value.trim();
    const last_name = document.getElementById('regLName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value.trim();

    if(!first_name || !last_name || !email || !phone || !password){
        alert('All fields are required.');
        return;
    }
    if(!(/^[a-zA-Z]+$/.test(first_name))){alert("first name can only contain letters and space");
        return;
    }
    if(!(/^[a-zA-Z]+$/.test(last_name))){alert("last name can only contain letters and space");
        return;
    }
    if(!(/^[0-9]+$/.test(phone)) ){alert("phone can only contain digits");
        return;
    }
    if(phone.length <10){alert('phone can have minimum length of 10 , you entered :'+phone.length);
        return;
    }
    if(!validator.isEmail(email)) {alert("email pattern invaild");
        return;
    }

    singUp(first_name,last_name,email,phone,password);

});

async function logIn(email ,password) {
    try {
    const response =  await fetch("https://enwcriemptvzraasamya.supabase.co/functions/v1/auth-handler",{
        method:"POST",
        headers:{
            "Content-Type":"application/json",
            //"Authorization":'Bearer ${accessToken} ',
        },
        body:JSON.stringify(
            {
                action:"login",
                first_name:"",
                last_name:"",
                email:email,
                phone:"",
                password:password,
                user_id:""
            }
        )

    });
    const data = await response.json();
    if(data){//console.log(data);
    const session = data.session.access_token;
    sessionStorage.setItem(' qc_token',session);

    if(data.error)    alert(data.error);
    } 
    } catch (error) {
        alert(error);
    }
}
async function singUp(first_name,last_name,email,phone,password,user_id) {
    try {
    const response = await fetch("https://enwcriemptvzraasamya.supabase.co/functions/v1/auth-handler",{
        method:"POST",
        headers:{
            "Content-Type":"application/json",

        },
        body:JSON.stringify(
            {
                action:"signup",
                first_name:first_name,
                last_name:last_name,
                email:email,
                phone:phone,
                password:password
            }
        )

    });

    const data = await response.json();
    alert(data.error)    

    } catch (error) {
        alert(error);
    }
}