import {
  ConnectButton,
  useActiveAccount,
  useActiveWalletChain,
  useSwitchActiveWalletChain,
} from "thirdweb/react";
import {
  createThirdwebClient,
  getContract,
  NATIVE_TOKEN_ADDRESS,
} from "thirdweb";
import { Account } from "thirdweb/wallets";
import { avalancheFuji } from "thirdweb/chains";
import { resolveContractAbi } from "thirdweb/contract";
import { useState } from "react";
import { useWriteContract } from "wagmi";

/**
 * In this example, we will be connecting wallet to the app using thirdweb
 * and then mint the NFTs using wagmi
 *
 * The purpose of this demo is to showcase how you can use thirdweb sdk with wagmi
 */
function App() {
  const activeAccount = useActiveAccount();
  return (
    <div className="flex flex-col p-4 pt-12 justify-center gap-3">
      <div className="text-center mx-auto max-w-[600px]">
        In this example, we will be connecting wallet to the app using thirdweb
        and then mint the NFTs using wagmi{"'"}useContractWrite hook.
      </div>
      <div className="mx-auto">
        <ConnectButton client={thirdwebClient} />
      </div>

      {activeAccount ? (
        <MintNftWithWagmi thirdwebAccount={activeAccount} />
      ) : (
        <div className="mx-auto">Connect wallet to mint</div>
      )}
    </div>
  );
}

export default App;

const contractAddress = "0x6829f1b35a8b8F00334e6eb9737057C584C73aD5";
export const thirdwebClient = createThirdwebClient({
  // If not using Vite, then use `process.env.NEXT_PUBLIC_CLIENT_ID`
  clientId: import.meta.env.VITE_CLIENT_ID,
});

const MintNftWithWagmi = ({
  thirdwebAccount,
}: {
  thirdwebAccount: Account;
}) => {
  const switchChain = useSwitchActiveWalletChain();
  const walletChain = useActiveWalletChain();
  const [isLoading, setIsLoading] = useState(false);
  const { writeContractAsync } = useWriteContract();

  // Once the wallet is connected (using thirdweb Connect)
  // this wagmi hook should automatically pick up the connected account!
  // const account = useAccount();

  const claimNFT = async () => {
    setIsLoading(true);
    // Make sure user is on the right chain
    if (walletChain?.id !== avalancheFuji.id) await switchChain(avalancheFuji);

    /**
     * Step 1: Preparing contract call params (we will be calling the `claim` function)
     * To keep a lean scope for this demo, we will be hard-coding a few variables
     * For example: you will be able to claim (for free) only 1 NFT (quantity = 1) at a time
     * However in most real world scenario you need to make things "dynamic"
     */
    const quantity = 1;
    const tokenId = 0; // The Edition contract in this repo has only 1 token
    const currency = NATIVE_TOKEN_ADDRESS;
    const receiver = thirdwebAccount.address;
    const pricePerToken = 0;
    const data = "0x";
    const allowListProof = {
      proof: [
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      ],
      quantityLimitPerWallet: 0,
      pricePerToken,
      currency: NATIVE_TOKEN_ADDRESS,
    };

    /**
     * Step 2: Use thirdweb sdk to get the ABI of the contract
     */
    const thirdwebContract = getContract({
      address: contractAddress,
      chain: avalancheFuji,
      client: thirdwebClient,
    });
    const abi = await resolveContractAbi(thirdwebContract);

    /**
     * Step 3: Execute the transaction using wagmi
     */
    try {
      const hash = await writeContractAsync({
        abi,
        address: contractAddress,
        functionName: "claim",
        args: [
          receiver,
          tokenId,
          quantity,
          currency,
          pricePerToken,
          allowListProof,
          data,
        ],
      });
      console.log({ hash });
      alert("Transaction submitted: " + hash);
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };
  return (
    <div className="mx-auto mt-10 lg:w-[600px] flex flex-col gap-4">
      <img
        src="/thirdweb-logo.jpeg"
        alt=""
        width={300}
        height={300}
        className="mx-auto border rounded-2xl"
      />
      <button
        className="bg-purple-700 text-white rounded-2xl py-3 w-[250px] mx-auto hover:bg-purple-500"
        onClick={claimNFT}
      >
        {isLoading ? "Claiming..." : "Claim an NFT"}
      </button>
    </div>
  );
};
