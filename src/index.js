const Web3 = require('web3');
const axios = require('axios');
const log = require('ololog').configure({ time: true });
const ansi = require('ansicolor').nice;
const express = require('express');
const bodyParser = require('body-parser');

const app = express();

/**
 * Fetch the current transaction gas prices from https://ethgasstation.info/
 * 
 * @return {object} Gas prices at different priorities
 */
const getCurrentGasPrices = async () => {
    let response = await axios.get('https://ethgasstation.info/json/ethgasAPI.json');
    let prices = {
      low: response.data.safeLow / 10 + '',
      medium: response.data.average / 10 + '',
      high: response.data.fast / 10 + '',
      highest: response.data.fastest / 10 + ''
    }
   
    log(`Current ETH Gas Prices (in GWEI):`.cyan);
    log(`Low: ${prices.low} (transaction completes in < 30 minutes)`.green);
    log(`Standard: ${prices.medium} (transaction completes in < 5 minutes)`.yellow);
    log(`Fast: ${prices.high} (transaction completes in < 2 minutes)`.red);
   
    return prices;
}

app.post('/anchor', bodyParser.json(), async function(req,res) {

  const signature = req.body.signature;
  if (!signature) {
    res.status(400).send('Se espera un JSON con un atributo "signature" que contenga el dato a anclar en la blockchain');
    return;
  }

  log(`Vamos a anclar la siguiente firma: `.yellow + signature.red);

  const fromAccount = process.env.WALLET_ADDRESS;
  const toAccount   =  process.env.DESTINATION_WALLET_ADDRESS;
  const web3 = new Web3(new Web3.providers.HttpProvider(`https://ropsten.infura.io/v3/${process.env.INFURA_ACCESS_TOKEN}`));
  web3.eth.defaultAccount = fromAccount;

  let myBalanceWei = await web3.eth.getBalance(web3.eth.defaultAccount);
  let myBalance = web3.utils.fromWei(myBalanceWei, 'ether');
  log(`El saldo actual del wallet es ${myBalance} ETH`.green);

  let nonce = await web3.eth.getTransactionCount(web3.eth.defaultAccount,'pending');
  log(`El recuento de transacciones de este waller es: ${nonce}`.magenta);

  //let gasPrices = await getCurrentGasPrices();

  const tx = {
    nonce: nonce,
    //gasPrice: web3.utils.toWei(gasPrices.highest, 'gwei'),
    gasLimit: web3.utils.toHex(21000),
    gas: 2100000,
    to: toAccount,
    value: '0',
    //chainId: 3, //ropsten
    data: web3.utils.toHex(signature)
  }
  
  const privateKey = '0755BDE7E22A6E0E7B0B55205477A246C0EA58F5764EF04404A45396F14EE818'
  const signed = await web3.eth.accounts.signTransaction(tx, privateKey)
  const rawTx = signed.rawTransaction

  web3.eth
    .sendSignedTransaction(rawTx)
    .on('transactionHash', (txHash) => {
      var secs = 0;
      var interval = setInterval(async () => {
        receipt = await web3.eth.getTransactionReceipt(txHash);
        if (receipt) {
          clearInterval(interval);      
          log(`Recibo = `.yellow + JSON.stringify(receipt).green);
          res.status(201).send(receipt);
        } else {
          log('Esperando por el recibo...'.yellow);
          secs++;
          if (secs > 30 ) {
            clearInterval(interval);      
            res.status(206).send({
              transactionHash: txHash
            });
          } 
        }
      }, 1000);
    })
    .on('receipt', (receipt) => {
      log(`Your receipt = ${receipt}`.green);
    });

  /*
  const sendRawTx = (rawTx) =>
    new Promise((resolve, reject) =>
      web3.eth
        .sendSignedTransaction(rawTx)
        .on('transactionHash', resolve)
        .on('error', reject)
    )
  
  sendRawTx(rawTx).then(hash => console.log({hash}))
  
  res.send('OK');
  */

});


app.listen(3000, () => console.log('Anchor service listening on port 3000!'));