const session = sessionStorage.getItem(' qc_token');
//if(!session)window.location.replace('index.html'); 
//console.log(session);

(async () =>{

    try {
  const {applications, institutions} =  await getApplication();

    console.log(applications);
    const applicationInstitution = document.getElementById('applicationInstitution');
    console.log(institutions);
    applicationInstitution.innerHTML ="";

    institutions.forEach(element => {
    const option = document.createElemnte("option");
    option.text = element;
    option.value = element.toLowerCase()
    applicationInstitution.add(option);
        
    }); 
    }catch (error) {
        alert(error);
    }

//});

// form submission auth.js
document.getElementById('applicationForm').addEventListener('submit',function(e){
    e.preventDefault();
    const institution = document.getElementById('applicationInstitution').value.trim();
    const course = document.getElementById('applicationCourse').value.trim();
    const year = document.getElementById('applicationYear').value.trim();
    const status = document.getElementById('applicationStatus').value.trim();
    const notes = document.getElementById('applicationNotes').value.trim();
    

    if(!institution || !course || !year || !status) {alert('Please fill all fields note (optional)');
        return;
    }

    add(institution,course,year,status,notes);




});

//document.getElementById('registerForm').addEventListener('submit',function(e){
 //   e.preventDefault();


//});
})();

async function add(institution,course,year,status,notes) {
    try {
    const response =  await fetch("https://enwcriemptvzraasamya.supabase.co/functions/v1/applications-handler",{
        method:"POST",
        headers:{
            "Content-Type":"application/json",
            "Authorization":`Bearer ${session}`,  
        },
        body:JSON.stringify(
            {
                action:"add",
                institution:institution,
                course:course,
                academic_year:year,
                status:status,
                notes:notes,

            }
        )

    });
    //const data = await response.json();
    //const session = data.session.access_token;
    //sessionStorage.setItem(' qc_token',session);

    //console.log(data);
        
    } catch (error) {
        alert(error);
    }
}
async function getApplication() {
    try {
    const response =  await fetch("https://enwcriemptvzraasamya.supabase.co/functions/v1/applications-handler",{
        method:"POST",
        headers:{
            "Content-Type":"application/json",
            "Authorization":`Bearer ${session}`
        },
        body:JSON.stringify(
            {
                action:"load",
                institution:"",
                course:"",
                academic_year:"",
                status:"",
                notes:"",

            }
        )

    });
    
    const data = await response.json();
    console.log( data);
    const applications = data.data;
    const institutions = data.institutions;
    console.log( institutions);
    return {applications:Array.isArray(applications)?applications:["1"]
        ,institutions:Array.isArray(institutions)?institutions:["2"]}
                    

        
    } catch (error) {
        alert(error);
        return {applications:["11"],institutions:["22"]}
    }
}
