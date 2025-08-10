const express = require('express');
const { ethers } = require('ethers');
const compression = require('compression');

const app = express();
app.disable('x-powered-by');
app.use(compression());
app.use(express.json({ limit: '2kb' }));

app.post('/anchor', async function (req, res) {
  try {
    const signature = req.body && req.body.signature;
    if (!signature) {
      res.status(400).send('Se espera un JSON con un atributo "signature" que contenga el dato a anclar en la blockchain');
      return;
    }

    const fromAccount = process.env.WALLET_ADDRESS;
    const toAccount = process.env.DESTINATION_WALLET_ADDRESS;
    const infuraToken = process.env.INFURA_ACCESS_TOKEN;
    const privateKey = process.env.WALLET_PRIVATE_KEY;

    if (!fromAccount || !toAccount || !infuraToken || !privateKey) {
      res.status(500).send('Faltan variables de entorno requeridas (WALLET_ADDRESS, DESTINATION_WALLET_ADDRESS, INFURA_ACCESS_TOKEN, WALLET_PRIVATE_KEY)');
      return;
    }

    const provider = new ethers.providers.JsonRpcProvider(`https://ropsten.infura.io/v3/${infuraToken}`);
    const wallet = new ethers.Wallet(privateKey, provider);

    const balanceWei = await provider.getBalance(wallet.address);
    const balanceEth = ethers.utils.formatEther(balanceWei);
    console.log(`Saldo actual del wallet ${wallet.address}: ${balanceEth} ETH`);

    const nonce = await provider.getTransactionCount(wallet.address, 'pending');
    console.log(`Nonce del wallet: ${nonce}`);

    const dataHex = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(signature));

    // Estimar gas para la transacción
    const gasEstimate = await provider.estimateGas({ from: wallet.address, to: toAccount, data: dataHex });

    const txRequest = {
      nonce,
      to: toAccount,
      value: 0,
      data: dataHex,
      gasLimit: gasEstimate,
    };

    const sentTx = await wallet.sendTransaction(txRequest);
    console.log(`Enviada transacción: ${sentTx.hash}`);

    // Espera hasta 30s por el recibo; si no llega, devolvemos el hash para que el cliente consulte más tarde
    const receiptOrNull = await Promise.race([
      sentTx.wait(1),
      new Promise((resolve) => setTimeout(() => resolve(null), 30_000)),
    ]);

    if (receiptOrNull) {
      console.log(`Recibo: ${JSON.stringify(receiptOrNull)}`);
      res.status(201).json(receiptOrNull);
    } else {
      console.log('Timeout esperando recibo; devolviendo el hash para consulta posterior');
      res.status(206).json({ transactionHash: sentTx.hash });
    }
  } catch (error) {
    console.error('Error en /anchor:', error);
    res.status(500).send('Error procesando la solicitud');
  }
});

app.listen(3000, () => console.log('Anchor service listening on port 3000!'));