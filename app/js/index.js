/* eslint-disable */
import * as htmx from "htmx.org";
// the import is a IIFE that sets global var `htmx`
// @ts-ignore
window.htmx = htmx;
import {
  defineCustomElement,
  WALLET_CONNECTED_EVENT_TYPE,
  WALLET_DISCONNECTED_EVENT_TYPE,
} from "wallet-standard-list";
// import {
//   EthereumClient,
//   w3mConnectors,
//   w3mProvider,
// } from "@web3modal/ethereum";
// import { Web3Modal } from "@web3modal/html";
// import { configureChains, createConfig } from "@wagmi/core";
// import { mainnet } from "@wagmi/core/chains";

// Wallet standard list
defineCustomElement();

window.addEventListener(WALLET_CONNECTED_EVENT_TYPE, ({ detail: wallet }) => {
  console.log(wallet);
  document.getElementById("connected-wallet").innerText = wallet.name;
  document.getElementById("first-account").innerText =
    wallet.accounts[0].address;
  document.getElementById("stake-button").removeAttribute("disabled");
  document.getElementById("disconnect-button").removeAttribute("disabled");
});

window.addEventListener(WALLET_DISCONNECTED_EVENT_TYPE, () => {
  document.getElementById("connected-wallet").innerText = "None";
  document.getElementById("first-account").innerText = "None";
  document.getElementById("stake-button").setAttribute("disabled", "1");
  document.getElementById("disconnect-button").setAttribute("disabled", "1");
});

document.getElementById("stake-button").onclick = async () => {
  const wallet = document.querySelector("wallet-standard-list").connectedWallet;
  const url = `https://stakedex-api.fly.dev/v1/swap?inputMint=So11111111111111111111111111111111111111112&outputMint=LAinEtNLgpmCP9Rvsf5Hn8W6EhNiKLZQti1xfWMLy6X&inAmount=1000000000&user=${wallet.publicKey}`;
  const resp = await fetch(url);
  const { tx } = await resp.json();
  console.log(tx);
  console.log(wallet);
  await wallet.features["solana:signTransaction"].signTransaction(tx);
};

document.getElementById("disconnect-button").onclick = () => {
  document.querySelector("wallet-standard-list").disconnect();
};

// WalletConnect
// const projectId = "4374d1c29d9988dcea189594474af595";
// const chains = [mainnet];

// const { publicClient } = configureChains(chains, [w3mProvider({ projectId })]);
// const wagmiConfig = createConfig({
//   autoConnect: true,
//   connectors: w3mConnectors({ projectId, chains }),
//   publicClient,
// });
// const ethereumClient = new EthereumClient(wagmiConfig, chains);
// const web3modal = new Web3Modal({ projectId }, ethereumClient);
