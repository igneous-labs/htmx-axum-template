/* eslint-disable no-underscore-dangle, max-classes-per-file */
// import {
//   EthereumClient,
//   w3mConnectors,
//   w3mProvider,
// } from "@web3modal/ethereum";
// import { Web3Modal } from "@web3modal/html";
// import { configureChains, createConfig } from "@wagmi/core";
// import { WalletConnectModal } from "@walletconnect/modal";
// import { WalletConnectModalSign } from "@walletconnect/modal-sign-html";
// import { mainnet } from "@wagmi/core/chains";
import QRCodeModal from "@walletconnect/qrcode-modal";
import WalletConnectClient from "@walletconnect/sign-client";
import { getSdkError, parseAccountId } from "@walletconnect/utils";
import base58 from "base58";

// Errors
// Taken from https://stackoverflow.com/a/41429145/2247097
export class ClientNotInitializedError extends Error {
  constructor() {
    super();

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, ClientNotInitializedError.prototype);
  }
}

export class QRCodeModalError extends Error {
  constructor() {
    super();

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, QRCodeModalError.prototype);
  }
}

// WalletConnect
/**
 * @typedef {Object} WalletConnectWalletAdapterConfig
 * @property {string} network The network ID.
 * @property {import('@walletconnect/types').SignClientTypes.Options} options The options for the client.
 */

/**
 * @typedef {Object} WalletConnectWalletInit
 * @property {string} [publicKey] The public key.
 */

/**
 * @enum {string}
 */
const WalletConnectChainID = {
  Mainnet: "solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ",
  Devnet: "solana:8E9rvCKLFQia2Y35HXjjpWzj8weVo44K",
};

/**
 * @enum {string}
 */
const WalletConnectRPCMethods = {
  sendTransaction: "solana_sendTransaction",
  signAndSendTransaction: "solana_signAndSendTransaction",
  signTransaction: "solana_signTransaction",
  signMessage: "solana_signMessage",
};

/**
 * Returns the connection parameters based on the chain ID.
 *
 * @param {string[]} chains The chains IDs.
 * @returns {import('@walletconnect/types').EngineTypes.FindParams} The connection parameters.
 */
const getConnectParams = (chains) => ({
  requiredNamespaces: {
    solana: {
      chains,
      methods: [
        WalletConnectRPCMethods.signAndSendTransaction,
        WalletConnectRPCMethods.signTransaction,
        WalletConnectRPCMethods.signMessage,
      ],
      events: [],
    },
  },
});

class WalletConnectWalletAccount {
  /**
   * @param {import('@walletconnect/types').SessionTypes.Struct} [session] connected Wallet session.
   * @param {string[]} chains WalletConnect chains.
   */
  constructor(
    session,
    chains = [WalletConnectChainID.Mainnet, WalletConnectChainID.Devnet],
  ) {
    this.address = session
      ? parseAccountId(session.namespaces.solana.accounts[0]).address
      : "";
    // this.publicKey = new Uint8Array();
    this.chains = chains;
    this.features = [
      WalletConnectRPCMethods.signAndSendTransaction,
      WalletConnectRPCMethods.signTransaction,
      WalletConnectRPCMethods.signMessage,
    ];
  }
}

export class WalletConnectWallet {
  /**
   * @param {WalletConnectWalletAdapterConfig} config The configuration for the WalletConnect.
   */
  constructor(config) {
    /**
     * @private
     * @type {WalletConnectClient | undefined}
     */
    this._client = undefined;

    /**
     * @private
     * @type {import('@walletconnect/types').SessionTypes.Struct | undefined}
     */
    this._session = undefined;

    /**
     * @private
     * @type {string}
     */
    this._network = config.network;

    /**
     * @private
     * @type {import('@walletconnect/types').SignClientTypes.Options}
     */
    this._options = config.options;
  }

  version = "1.0.0";

  name = "WalletConnect";

  icon = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIGhlaWdodD0iMzMyIiB2aWV3Qm94PSIwIDAgNDgwIDMzMiIgd2lkdGg9IjQ4MCI+PHBhdGggZD0ibTEyNi42MTMgOTMuOTg0MmM2Mi42MjItNjEuMzEyMyAxNjQuMTUyLTYxLjMxMjMgMjI2Ljc3NSAwbDcuNTM2IDcuMzc4OGMzLjEzMSAzLjA2NiAzLjEzMSA4LjAzNiAwIDExLjEwMmwtMjUuNzgxIDI1LjI0MmMtMS41NjYgMS41MzMtNC4xMDQgMS41MzMtNS42NyAwbC0xMC4zNzEtMTAuMTU0Yy00My42ODctNDIuNzczNC0xMTQuNTE3LTQyLjc3MzQtMTU4LjIwNCAwbC0xMS4xMDcgMTAuODc0Yy0xLjU2NSAxLjUzMy00LjEwMyAxLjUzMy01LjY2OSAwbC0yNS43ODEtMjUuMjQyYy0zLjEzMi0zLjA2Ni0zLjEzMi04LjAzNiAwLTExLjEwMnptMjgwLjA5MyA1Mi4yMDM4IDIyLjk0NiAyMi40NjVjMy4xMzEgMy4wNjYgMy4xMzEgOC4wMzYgMCAxMS4xMDJsLTEwMy40NjMgMTAxLjMwMWMtMy4xMzEgMy4wNjUtOC4yMDggMy4wNjUtMTEuMzM5IDBsLTczLjQzMi03MS44OTZjLS43ODMtLjc2Ny0yLjA1Mi0uNzY3LTIuODM1IDBsLTczLjQzIDcxLjg5NmMtMy4xMzEgMy4wNjUtOC4yMDggMy4wNjUtMTEuMzM5IDBsLTEwMy40NjU3LTEwMS4zMDJjLTMuMTMxMS0zLjA2Ni0zLjEzMTEtOC4wMzYgMC0xMS4xMDJsMjIuOTQ1Ni0yMi40NjZjMy4xMzExLTMuMDY1IDguMjA3Ny0zLjA2NSAxMS4zMzg4IDBsNzMuNDMzMyA3MS44OTdjLjc4Mi43NjcgMi4wNTEuNzY3IDIuODM0IDBsNzMuNDI5LTcxLjg5N2MzLjEzMS0zLjA2NSA4LjIwOC0zLjA2NSAxMS4zMzkgMGw3My40MzMgNzEuODk3Yy43ODMuNzY3IDIuMDUyLjc2NyAyLjgzNSAwbDczLjQzMS03MS44OTVjMy4xMzItMy4wNjYgOC4yMDgtMy4wNjYgMTEuMzM5IDB6IiBmaWxsPSIjMzM5NmZmIi8+PC9zdmc+`;

  chains = [WalletConnectChainID.Mainnet, WalletConnectChainID.Devnet];

  /**
   * @returns {WalletConnectClient}
   */
  get client() {
    if (this._client) {
      return this._client;
    }
    throw new ClientNotInitializedError();
  }

  /**
   * @returns {string}
   */
  get publicKey() {
    if (this._client && this._session) {
      const chainIndex = this.chains.indexOf(this._network);
      const { address } = parseAccountId(
        this._session.namespaces.solana.accounts[chainIndex],
      );
      return address;
    }
    throw new ClientNotInitializedError();
  }

  features = {
    "standard:connect": {
      /**
       * Connects the wallet.
       * @returns {Promise<WalletConnectWalletInit>}
       */
      connect: async () => {
        const client =
          this._client ?? (await WalletConnectClient.init(this._options));

        const connectParams = getConnectParams(this.chains);

        const sessions = client
          .find(connectParams)
          .filter((s) => s.acknowledged);
        if (sessions.length) {
          this._session = sessions.at(-1);
          this._client = client;
          this.accounts = [
            new WalletConnectWalletAccount(this._session, this.chains),
          ];

          return {
            publicKey: this.publicKey,
          };
        }

        const { uri, approval } = await client.connect(connectParams);
        return new Promise((resolve, reject) => {
          if (uri) {
            QRCodeModal.open(uri, () => {
              reject(new QRCodeModalError());
            });
          }

          approval()
            .then((session) => {
              this._session = session;
              this._client = client;
              this.accounts = [
                new WalletConnectWalletAccount(this._session, this.chains),
              ];

              resolve({ publicKey: this.publicKey });
            })
            .catch(reject)
            .finally(() => {
              QRCodeModal.close();
            });
        });
      },
    },
    "standard:disconnect": {
      /**
       * Disconnects the wallet.
       * @throws {ClientNotInitializedError}
       */
      disconnect: async () => {
        if (this._client && this._session) {
          await this._client.disconnect({
            topic: this._session.topic,
            reason: getSdkError("USER_DISCONNECTED"),
          });
          this._session = undefined;
        } else {
          throw new ClientNotInitializedError();
        }
      },
    },
    /**
     * Signs and sends transaction.
     * @param {string} transaction - The transaction to sign.
     * @returns {Promise<string>} signature
     * @throws {ClientNotInitializedError}
     */
    "solana:signAndSendTransaction": {
      signAndSendTransaction: async (transaction) => {
        if (this._client && this._session) {
          const tx =
            await this.features["solana:signTransaction"].signTransaction(
              transaction,
            );
          const { signature } = await this._client.request({
            chainId: this._network,
            topic: this._session.topic,
            request: {
              method: WalletConnectRPCMethods.sendTransaction,
              params: [tx],
            },
          });

          return base58.decode(signature);
        }
        throw new ClientNotInitializedError();
      },
    },
    "solana:signTransaction": {
      /**
       * Signs a transaction.
       * @param {string} transaction - The transaction to sign.
       * @returns {Promise<string>} signature
       * @throws {ClientNotInitializedError}
       */
      signTransaction: async (transaction) => {
        if (this._client && this._session) {
          try {
            const { signature } = await this._client.request({
              chainId: this._network,
              topic: this._session.topic,
              request: {
                method: WalletConnectRPCMethods.signTransaction,
                params: {
                  transaction,
                },
              },
            });

            console.log({ signature });

            return base58.decode(signature);
          } catch (err) {
            console.log({ err });
          }
        }
        throw new ClientNotInitializedError();
      },
    },
    "solana:signMessage": {
      /**
       * Signs a message.
       * @param {Uint8Array} message The message to sign.
       * @returns {Promise<Uint8Array>}
       * @throws {ClientNotInitializedError}
       */
      signMessage: async (message) => {
        if (this._client && this._session) {
          const { signature } = await this._client.request({
            chainId: this._network,
            topic: this._session.topic,
            request: {
              method: WalletConnectRPCMethods.signMessage,
              params: {
                pubkey: this.publicKey,
                message: base58.encode(message),
              },
            },
          });

          return base58.decode(signature);
        }
        throw new ClientNotInitializedError();
      },
    },
  };

  accounts = [new WalletConnectWalletAccount(this._session, this.chains)];
}

window.addEventListener(
  "wallet-standard:app-ready",
  ({ detail: { register } }) =>
    register(
      new WalletConnectWallet({
        network: WalletConnectChainID.Devnet,
        options: {
          projectId: "4374d1c29d9988dcea189594474af595",
          metadata: {
            name: "My Dapp",
            description: "My Dapp description",
            url: "https://my-dapp.com",
            icons: ["https://my-dapp.com/logo.png"],
          },
        },
      }),
    ),
);
