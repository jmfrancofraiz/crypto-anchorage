
# Configuración

Toda la configuración está en los archivos `environment.dev` y `environment.prod`.

# Construcción y ejecución

Para arrancar el servicio:

- En modo **DESARROLLO**: 

        sudo docker-compose up

- En modo **PRODUCCIÓN**: 

        sudo docker-compose -f docker-compose.prod-yml up

# Uso

El servicio se levanta en el puerto 3000 y acepta peticiones POST contra el endpoint ```/anchor```, al cual se
le debe pasar un JSON como el siguiente:

```
{
    "signature": "hash a anclar en la ethereum"
}
```

Por ejemplo, si queremos anclar el texto "Esto es un texto a hashear con sha256", enviaríamos algo tal que así:

```
curl --header "Content-Type: application/json" --request POST --data '{"signature":"942bef2ed938f7df4443055b043d305fbdca960a219b6979a0c3901ed5d868a0"}' http://52.232.114.250:3000/anchor
```

Como respuesta obtendremos el recibo de la transacción:

```
{
   "blockHash":"0x5aa86a6f693e372c0e92186ea0f071d6c23fe112be2f3a75406bd80cf44bc32a",
   "blockNumber":5850393,
   "contractAddress":null,
   "cumulativeGasUsed":3015321,
   "from":"0x90fb017c92c4715008b81b94e05a088fd3ad41a6",
   "gasUsed":25352,
   "logs":[

   ],
   "logsBloom":"0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
   "status":true,
   "to":"0x90fb017c92c4715008b81b94e05a088fd3ad41a6",
   "transactionHash":"0xd63f6ecdc7fbcc8aa075be7b0fd0f44a278527c0f3714c72becf901fc9358cae",
   "transactionIndex":41
}
````

# Referencias:

- Entorno docker: https://dev.to/alex_barashkov/using-docker-for-nodejs-in-development-and-production-3cgp
