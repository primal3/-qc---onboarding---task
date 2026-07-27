const session = sessionStorage.getItem(' qc_token');
//console.log("getting jwt",session);
if(session === null)window.location.replace('index.html'); 

(async () =>{

    try {
  const {applications, institutions} =  await getApplication();

    console.log(applications);
    const applicationTable= document.getElementById('applicationTable');
    const applicationInstitution = document.getElementById('applicationInstitution');
    console.log(institutions);
    
    applicationTable.innerHTML =`

        <thead>
                <tr>
                <th>
                    Institution
                </th>
                <th>
                    Course
                </th>
                <th>
                    Academic year
                </th>
                <th>
                    Status
                </th>
                <th>
                    Notes
                </th>


            </tr>
            
             </thead>
            <tbody id="applicationsBody">

            </tbody>             
             `;

    applications.forEach(element => {
    const row = document.createElement("tr");
    row.className = 'application-row';
    const statusClass = element.status === 'draft'? 'status-draft':'status-submitted';
    row.innerHTML =`
    
                <td>
                    ${element.institution}
                </td>
                <td>
                    ${element.course}
                </td>
                <td>
                    ${element.academic_year}
                </td>
                <td>
                   <span class="status-badge" id= "${statusClass}"> ${element.status} </span>
                </td>
                <td>
                    ${element.notes}
                </td>
    
    
    `
    document.getElementById('applicationsBody').appendChild(row);
        
    });    
    
    applicationInstitution.innerHTML ="";

    institutions.forEach(element => {
    const option = document.createElement("option");
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
    const status = document.querySelector('input[name="Status"]:checked').value;
   alert(status);
    const notes = document.getElementById('applicationNotes').value.trim();
    const applicationTable= document.getElementById('applicationTable');    

    if(!institution || !course || !year || !status) {alert('Please fill all fields note (optional)');
        return;
    }

    add(institution,course,year,status,notes);
    
   const row = document.createElement('tr');
   row.className = 'application-row';

   const statusClass = status === 'draft'? 'status-draft':'status-submitted'; 
   row.innerHTML =`
                <td>
                    ${institution}
                </td>
                <td>
                    ${course}
                </td>
                <td>
                    ${year}
                </td>
                <td>
                    <span class="status-badge" id= "${statusClass}">${status}</span>
                </td>
                <td>
                    ${notes || '-'}
                </td>
   `

    document.getElementById('applicationsBody').appendChild(row);

   this.reset()
;});


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
    const data = await response.json();


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
    return {applications:Array.isArray(applications)?applications:[]
        ,institutions:Array.isArray(institutions)?institutions:[]}
                    

        
    } catch (error) {
        alert(error);
        return {applications:[],institutions:[]}
    }
}
