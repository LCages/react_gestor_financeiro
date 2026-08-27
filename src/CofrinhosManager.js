import React, { useState, useEffect } from "react";
import API_URL, { apiFetch } from "./config";
import AddCofrinho from "./AddCofrinho";
import CofrinhoChart from "./CofrinhoChart";
import DepositarCofrinho from "./DepositarCofrinho";
import RetirarCofrinho from "./RetirarCofrinho";
import EditCofrinho from "./EditCofrinho";

export default function CofrinhosManager() {

    const [cofrinhos, setCofrinhos] = useState([]);
    const [historicoSelecionado, setHistoricoSelecionado] = useState([]);
    const [cofrinhoAtivoGrafico, setCofrinhoAtivoGrafico] = useState(null);

    const [showAddModal, setShowAddModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const [cofrinhoSelecionado, setCofrinhoSelecionado] = useState(null);

    const [mostrarDepositar, setMostrarDepositar] = useState(false);
    const [mostrarRetirar, setMostrarRetirar] = useState(false);
    const [mostrarEditar, setMostrarEditar] = useState(false);


    const formatarMoeda = (valor) =>
        new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL"
        }).format(valor || 0);



    async function carregarCofrinhos() {

        setLoading(true);

        try {

            const res = await apiFetch(`${API_URL}/cofrinhos`);

            if (res && res.ok) {

                const data = await res.json();

                setCofrinhos(data);


                const salvo = localStorage.getItem("cofrinhoSelecionado");


                if (salvo) {

                    const encontrado = data.find(
                        c => c.id === Number(salvo)
                    );

                    buscarHistoricoRendimentos(
                        Number(salvo),
                        encontrado?.nome
                    );

                } else if (data.length > 0) {

                    localStorage.setItem(
                        "cofrinhoSelecionado",
                        data[0].id
                    );

                    buscarHistoricoRendimentos(
                        data[0].id,
                        data[0].nome
                    );
                }

            }

        } catch (err) {

            console.error(
                "Erro ao carregar cofrinhos",
                err
            );

        } finally {

            setLoading(false);

        }

    }



    async function buscarHistoricoRendimentos(id, nome) {

        try {

            localStorage.setItem(
                "cofrinhoSelecionado",
                id
            );


            const res = await apiFetch(
                `${API_URL}/cofrinhos/${id}/rendimentos`
            );


            if (res && res.ok) {

                const data = await res.json();

                setHistoricoSelecionado(
                    data.historico || []
                );


                setCofrinhoAtivoGrafico({
                    id,
                    nome
                });

            }


        } catch(err){

            console.error(
                "Erro ao obter histórico do cofrinho",
                err
            );

        }

    }




    async function deletarCofrinho(id) {

        if(
            !window.confirm(
                "Deseja mesmo remover esse cofrinho? Todo o saldo e históricos serão apagados."
            )
        ) return;


        try {


            const res = await apiFetch(
                `${API_URL}/cofrinhos/${id}`,
                {
                    method:"DELETE"
                }
            );


            if(res && res.ok){


                if(cofrinhoAtivoGrafico?.id === id){

                    setCofrinhoAtivoGrafico(null);
                    setHistoricoSelecionado([]);

                }


                carregarCofrinhos();

            }


        } catch(err){

            console.error(
                "Erro ao remover cofrinho",
                err
            );

        }

    }




    useEffect(()=>{

        carregarCofrinhos();

    },[]);




    return (

        <div 
        style={{
            display:"flex",
            flexDirection:"column",
            gap:"24px",
            margin:"20px 0"
        }}
        >


            <div
            style={{
                display:"flex",
                justifyContent:"space-between",
                alignItems:"center"
            }}
            >

                <div>

                    <h3
                    style={{
                        fontSize:"20px",
                        fontWeight:700,
                        margin:0
                    }}
                    >
                        Meus Cofrinhos
                    </h3>


                    <span
                    style={{
                        fontSize:"12px",
                        color:"var(--color-muted)"
                    }}
                    >
                        Rendimento diário baseado no CDI real
                    </span>

                </div>



                {
                cofrinhos.length < 2 && (

                    <button
                    className="btn-investimento-add"
                    onClick={()=>setShowAddModal(true)}
                    >
                        + Criar Cofrinho
                    </button>

                )
                }


            </div>





            {
            loading && cofrinhos.length === 0 ?

            (

                <div>
                    Carregando seus investimentos...
                </div>

            )

            :

            (

            <div
            style={{
                display:"flex",
                gap:"16px",
                flexWrap:"wrap"
            }}
            >


            {
            cofrinhos.map((cofrinho)=>{


                const selecionado =
                cofrinhoAtivoGrafico?.id === cofrinho.id;



                return (

                <div

                key={cofrinho.id}

                onClick={()=>{

                    buscarHistoricoRendimentos(
                        cofrinho.id,
                        cofrinho.nome
                    );

                }}


                style={{

                    background:
                    selecionado
                    ?
                    "rgba(76,175,80,0.08)"
                    :
                    "var(--glass-bg)",


                    border:
                    selecionado
                    ?
                    "1px solid #4CAF50"
                    :
                    "1px solid rgba(255,255,255,0.07)",


                    padding:"20px",
                    borderRadius:"16px",
                    minWidth:"280px",
                    flex:1,
                    cursor:"pointer"

                }}

                >


                <div>


                    <button
                    onClick={(e)=>{

                        e.stopPropagation();

                        setCofrinhoSelecionado(cofrinho);
                        setMostrarEditar(true);

                    }}
                    >
                        Editar
                    </button>



                    <button
                    onClick={(e)=>{

                        e.stopPropagation();

                        setCofrinhoSelecionado(cofrinho);
                        setMostrarDepositar(true);

                    }}
                    >
                        Depositar
                    </button>




                    <button
                    onClick={(e)=>{

                        e.stopPropagation();

                        setCofrinhoSelecionado(cofrinho);
                        setMostrarRetirar(true);

                    }}
                    >
                        Retirar
                    </button>



                    <button
                    onClick={(e)=>{

                        e.stopPropagation();

                        deletarCofrinho(cofrinho.id);

                    }}
                    >
                        Remover
                    </button>



                </div>





                <div style={{marginTop:"20px"}}>

                    <span>
                        Saldo Atualizado
                    </span>


                    <strong
                    style={{
                        display:"block",
                        fontSize:"22px",
                        color:"#4CAF50"
                    }}
                    >

                    {
                        formatarMoeda(
                            cofrinho.saldo_atual
                        )
                    }

                    </strong>

                </div>





                </div>

                );


            })
            }



            </div>

            )

            }




            {
            cofrinhoAtivoGrafico && (

                <CofrinhoChart

                historico={historicoSelecionado}

                nomeCofrinho={
                    cofrinhoAtivoGrafico.nome
                }

                />

            )
            }






            {
            showAddModal && (

                <AddCofrinho

                onClose={()=>
                    setShowAddModal(false)
                }

                onCreated={
                    carregarCofrinhos
                }

                />

            )
            }






            {
            mostrarDepositar && (

                <DepositarCofrinho

                cofrinho={cofrinhoSelecionado}

                onClose={()=>{

                    setMostrarDepositar(false);
                    setCofrinhoSelecionado(null);

                }}

                onUpdated={carregarCofrinhos}

                />

            )
            }





            {
            mostrarRetirar && (

                <RetirarCofrinho

                cofrinho={cofrinhoSelecionado}

                onClose={()=>{

                    setMostrarRetirar(false);
                    setCofrinhoSelecionado(null);

                }}

                onUpdated={carregarCofrinhos}

                />

            )
            }





            {
            mostrarEditar && (

                <EditCofrinho

                cofrinho={cofrinhoSelecionado}

                onClose={()=>{

                    setMostrarEditar(false);
                    setCofrinhoSelecionado(null);

                }}

                onUpdated={carregarCofrinhos}

                />

            )
            }




        </div>

    );

}