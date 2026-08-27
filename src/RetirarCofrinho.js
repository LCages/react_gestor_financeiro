import React, {useState} from "react";
import API_URL,{apiFetch} from "./config";


export default function RetirarCofrinho({
  cofrinho,
  onClose,
  onUpdated
}){


const [valor,setValor]=useState("");
const [erro,setErro]=useState("");
const [loading,setLoading]=useState(false);



async function handleSubmit(e){

e.preventDefault();


const retirada=Number(String(valor).replace(",","."));


if(!retirada || retirada<=0){
 setErro("Digite um valor válido.");
 return;
}


if(retirada > Number(cofrinho.saldo_atual)){
 setErro("Saldo insuficiente.");
 return;
}



setLoading(true);


try{


const res=await apiFetch(
`${API_URL}/cofrinhos/${cofrinho.id}/retirar`,
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
valor:retirada
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
finally{
setLoading(false);
}


}



return (

<div className="modal-overlay">

<div className="modal-card">

<h3>Retirar do Cofrinho</h3>

<p>
Saldo:
<strong>
 R$ {Number(cofrinho.saldo_atual).toFixed(2)}
</strong>
</p>



<form onSubmit={handleSubmit}>


<div className="modal-card-group">

<label>
Valor da retirada
</label>


<input
type="number"
step="0.01"
value={valor}
onChange={e=>setValor(e.target.value)}
/>

</div>


{erro &&
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
disabled={loading}
>
{loading?"Retirando...":"Retirar"}

</button>


</div>



</form>



</div>

</div>

)

}