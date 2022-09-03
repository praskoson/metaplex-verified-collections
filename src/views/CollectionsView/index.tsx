import Link from "next/link";
import { FC, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useConnection } from "@solana/wallet-adapter-react";
import {
  createUnverifyCollectionInstruction,
  Metadata,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  PublicKey,
  Connection,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

import { SolanaLogo } from "components";
import styles from "./index.module.css";
import {
  awaitTransactionSignatureConfirmation,
  getMasterEdition,
  getMetadata,
} from "views/CandyMachineMintView/candy-machine";
import { useAlert } from "react-alert";

const unverifyCollectionNft = async (
  connection: Connection,
  nftMint: PublicKey,
  wallet: PublicKey
): Promise<TransactionInstruction> => {
  try {
    const metadata = await getMetadata(nftMint);
    const metadataInfo = await Metadata.fromAccountAddress(
      connection,
      metadata
    );
    if (!metadataInfo.collection?.key) {
      throw Error("NFT does not have a verified collection");
    }
    const collectionMint = metadataInfo.collection?.key;
    const collection = await getMetadata(collectionMint);
    const collectionMasterEditionAccount = await getMasterEdition(
      collectionMint
    );

    return createUnverifyCollectionInstruction({
      metadata,
      collectionMint,
      collection,
      collectionMasterEditionAccount,
      collectionAuthority: wallet,
    });
  } catch (err) {
    throw Error("Error creating unverifyCollectionInstruction", { cause: err });
  }
};

export const CollectionsView: FC = ({}) => {
  const alert = useAlert();
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [inputError, setInputError] = useState<string>("");
  const [nftMint, setNftMint] = useState<PublicKey | null>();
  const [isConfirming, setIsConfirming] = useState(false);

  const handleTransaction = async () => {
    try {
      if (!nftMint || !publicKey)
        throw Error("Connect your wallet | Enter the NFT mint");
      const ix = await unverifyCollectionNft(connection, nftMint, publicKey);
      setIsConfirming(true);
      alert.info("Confirming transaction...");
      // @ts-ignore
      const latestBlockhash = await connection.getLatestBlockhash();
      const recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
      const tx = new Transaction({
        feePayer: publicKey,
        recentBlockhash,
      }).add(ix);

      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(
        { signature, ...latestBlockhash },
        "confirmed"
      );
      alert.success("Confirmed!");
    } catch (err) {
      console.log(err);
      const errorObject = err as Error;
      alert.error(
        errorObject?.message ? errorObject.message : errorObject.name
      );
    } finally {
      setIsConfirming(false);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (!value) {
      setInputError("");
      setNftMint(null);
    }
    try {
      const pubkey = new PublicKey(value);
      setNftMint(pubkey);
      setInputError("");
    } catch (err) {
      setInputError("Invalid mint address");
    }
  };

  return (
    <div className="container mx-auto max-w-6xl p-8 2xl:px-0">
      <div className={styles.container}>
        <div className="navbar mb-2 shadow-lg bg-neutral text-neutral-content rounded-box">
          <div className="flex-none">
            <button className="btn btn-square btn-ghost">
              <span className="text-4xl">🏞</span>
            </button>
          </div>
          <div className="flex-1 px-2 mx-2">
            <div className="text-sm breadcrumbs">
              <ul className="text-xl">
                <li>
                  <Link href="/">
                    <a>Templates</a>
                  </Link>
                </li>
                <li>
                  <span className="opacity-40">Collections</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex-none">
            <WalletMultiButton className="btn btn-ghost" />
          </div>
        </div>

        <div className="text-center pt-2">
          <div className="hero min-h-16 p-0 pt-10">
            <div className="text-center hero-content w-full">
              <div className="w-full">
                <h1 className="mb-5 text-5xl">
                  Metaplex Collections <SolanaLogo />
                </h1>

                <div className="w-full min-w-full">
                  <p className="mb-5">
                    Use this to send specific instructions that work with
                    Metaplex collections. Use at your own peril.
                    <br />
                    Learn more about certified collections{" "}
                    <a
                      href="https://docs.metaplex.com/programs/token-metadata/certified-collections"
                      target="_blank"
                      className="link font-bold"
                      rel="noreferrer"
                    >
                      here
                    </a>
                    .
                  </p>
                  <div>
                    <div className="form-control mt-8">
                      <label className="w-full text-left">
                        <div className="flex flex-col space-y-1 mb-4">
                          <span className="font-semibold">
                            Unverify a collection item
                          </span>
                          <small className="text-gray-400">
                            This will attempt to remove an NFT from any unsized
                            collection it is in.
                          </small>
                        </div>
                        <div className="flex space-x-2 ">
                          <input
                            type="text"
                            placeholder="Enter NFT mint address"
                            className={`w-full input input-primary input-bordered ${
                              inputError ? "input-error" : ""
                            } ${nftMint ? "input-success" : ""}`}
                            onChange={onChange}
                          />
                          <button
                            className={`btn btn-primary ${
                              isConfirming ? "loading" : ""
                            } ${
                              inputError || !nftMint || !publicKey
                                ? "btn-disabled"
                                : ""
                            }`}
                            onClick={handleTransaction}
                          >
                            Unverify collection item
                          </button>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
