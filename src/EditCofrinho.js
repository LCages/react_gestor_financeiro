import React,{useState} from "react";
import API_URL,{apiFetch} from "./config";


export default function EditCofrinho({
cofrinho,
onClose,
onUpdated
}){


const [nome,setNome]=useState(cofrinho.nome);
const [percentual,setPercentual]=useState(
String(cofrinho.percentual_cdi)
);

const [erro,setErro]=useState("");



async function salvar(e){

e.preventDefault();


try{


const res=await apiFetch(
`${API_URL}/cofrinhos/${cofrinho.id}`,
{
method:"PUT",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
nome,
percentual_cdi:Number(percentual)
})
}
);



const data=await res.json();


if(!res.ok)
throw new Error(data.error);



onUpdated();
onClose();



}catch(err){
setErro(err.message);
}


}



return(

<div className="modal-overlay">

<div className="modal-card">

<h3>Editar Cofrinho</h3>


<form onSubmit={salvar}>


<div className="modal-card-group">

<label>
Nome
</label>


<input
value={nome}
onChange={e=>setNome(e.target.value)}
/>

</div>



<div className="modal-card-group">

<label>
CDI
</label>


<select
value={percentual}
onChange={e=>setPercentual(e.target.value)}
>


<option value="100">
100% CDI
</option>


<option value="115">
115% CDI
</option>


<option value="120">
120% CDI
</option>


</select>


</div>


{
erro &&
<div className="erro">
{erro}
</div>
}



<div className="modal-actions">

<button
type="button"
className="modal-btn-cancel"
onClick={onClose}
>
Cancelar
</button>


<button
className="modal-btn-confirm"
>
Salvar
</button>

</div>


</form>


</div>

</div>


)


}