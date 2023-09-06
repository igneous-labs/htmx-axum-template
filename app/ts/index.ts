/* eslint-disable */
import * as htmx from "htmx.org";
// the import is a IIFE that sets global var `htmx`
// @ts-ignore
window.htmx = htmx;

import {
  defineCustomElement,
  WALLET_CONNECTED_EVENT_TYPE,
  WALLET_DISCONNECTED_EVENT_TYPE,
  type WalletStandardList,
} from "wallet-standard-list";
// import {
//   EthereumClient,
//   w3mConnectors,
//   w3mProvider,
//   WagmiCore,
//   WagmiCoreChains,
//   WagmiCoreConnectors,
// } from "@web3modal/ethereum";
import { Web3Modal } from "@web3modal/html";
console.log({ Web3Modal });

// Wallet standard list
defineCustomElement();

// @ts-ignore
window.addEventListener(WALLET_CONNECTED_EVENT_TYPE, ({ detail: wallet }) => {
  document.getElementById("connected-wallet")!.innerText = wallet.name;
  document.getElementById("first-account")!.innerText =
    wallet.accounts[0].address;
  document.getElementById("stake-button")!.removeAttribute("disabled");
  document.getElementById("disconnect-button")!.removeAttribute("disabled");
});

window.addEventListener(WALLET_DISCONNECTED_EVENT_TYPE, () => {
  document.getElementById("connected-wallet")!.innerText = "None";
  document.getElementById("first-account")!.innerText = "None";
  document.getElementById("stake-button")!.setAttribute("disabled", "1");
  document.getElementById("disconnect-button")!.setAttribute("disabled", "1");
});

document.getElementById("disconnect-button")!.onclick = () => {
  const wsl = document.querySelector(
    "wallet-standard-list",
  )! as WalletStandardList;
  wsl.disconnect();
};

// WalletConnect
