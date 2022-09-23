import Head from "next/head";
import Web3 from 'web3';
import styles from "../styles/Home.module.css";
import Web3Modal from "web3modal";
import { providers, Contract } from "ethers";
import { useEffect, useRef, useState } from "react";
import { CONTRACT_ADDRESS, abi } from "../constants";

export default function Home() {

  const [walletConnected, setWalletConnected] = useState(false);
  const [stakedETH, setStakedETH] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stakingValue, setStakingValue] = useState(false);
  const [clickedButton, setClickedButton] = useState(false);
  const web3ModalRef = useRef();

  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to Metamask
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Matic network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 80001) {
      changeNetwork()
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  const changeNetwork = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: Web3.utils.toHex(80001) }]
      });
    } catch (err) {
      // This error code indicates that the chain has not been added to MetaMask
      if (err.code == 4902) {
        window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x13881',
            chainName: 'Polygon Mumbai',
            nativeCurrency: {
              name: 'MATIC',
              symbol: 'MATIC',
              decimals: 18
            },
            rpcUrls: ['https://matic-mumbai.chainstacklabs.com'],
            blockExplorerUrls: ['https://mumbai.polygonscan.com/']
          }]
        })
          .catch((error) => {
            console.log(error)
          })
      }
    }
  }

  const stakeETH = async (amount) => {
    try {

      if (!amount) {
        return alert('Please add value to stake')
      }
      const signer = await getProviderOrSigner(true);
      const amountInWei = Web3.utils.toWei(amount, 'ether')
      console.log(amountInWei);
      const tokenContract = new Contract(
        CONTRACT_ADDRESS,
        abi,
        signer
      );

      const tx = await tokenContract.addStake(amountInWei, { value: amountInWei });
      setLoading(true);

      await tx.wait();
      setLoading(false);
      setStakedETH(true);
      setClickedButton(false);
    } catch (err) {
      console.error(err);
    }
  };

  const unStakeETH = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        CONTRACT_ADDRESS,
        abi,
        signer
      );

      const tx = await tokenContract.unStake();
      setLoading(true);
      clickedButtonStateTrue()

      await tx.wait();
      setLoading(false);
      setStakedETH(false);
    } catch (err) {
      console.log(err);
      alert(err);

    }
  };

  const clickedButtonStateTrue = async () => {
    setClickedButton(true);
  };

  const checkIfAddressStaked = async () => {
    try {

      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(
        CONTRACT_ADDRESS,
        abi,
        signer
      );
      const address = await signer.getAddress();
      const _stakedUser = await tokenContract.checkStaked(address);
      setStakedETH(_stakedUser);
    } catch (err) {
      console.error(err);
    }
  };


  const connectWallet = async () => {
    try {

      web3ModalRef.current = new Web3Modal({
        network: "mumbai",
        providerOptions: {},
        disableInjectedProvider: false,
      })

      await getProviderOrSigner();
      setWalletConnected(true);

      checkIfAddressStaked();
    } catch (err) {
      console.error(err);
    }
  };

  const renderButton = () => {
    if (walletConnected) {
      if (stakedETH) {
        return (
          <button onClick={() => {
            unStakeETH()
          }} className={styles.button} disabled={clickedButton ? true : false}>
            Unstake ETH
          </button>
        );
      } else if (loading) {
        return <button className={styles.button}>Loading...</button>;
      } else {
        return (
          <button onClick={() => stakeETH(stakingValue)}
            // disabled={!stakingValue?true:false} 
            className={styles.button}>
            Stake ETH
          </button>
        );
      }
    } else {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }
  };

  const addTokenToWallet = async () => {

    try {
      const wasAdded = await ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: '0x3343d423E3cE50B9DeB1481F83FC125946a109Dd',
            symbol: 'RTK',
            decimals: 18,
          },
        },
      });

      if (wasAdded) {
        alert('Token has been added to the MetaMask');
      } else {
        alert('ERROR: Please Try Again!');
      }
    } catch (error) {
      console.log(error);
    }
  };

  // useEffect(() => {

  //   if (!walletConnected) {

  //     web3ModalRef.current = new Web3Modal({
  //       network: "mumbai",
  //       providerOptions: {},
  //       disableInjectedProvider: false,
  //     });
  //     connectWallet();
  //   }
  // }, [walletConnected]);

  return (
    <div>
      <Head>
        <title>Staking MVP</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>MATIC Staking Platform!</h1>
          <div className={styles.description}>
            User can stake MATIC and upon Unstaking, users will get Rewarded in Native Token based on the Staking Time.
          </div>
          {
            !stakedETH && walletConnected ? (
              <>
                <input onChange={(e) => setStakingValue(e.target.value)} className={styles.text} type="number" placeholder="MATIC to Stake" /><br />
              </>
            ) : null
          }

          {renderButton()} <br />
          <button onClick={addTokenToWallet} className={styles.button}>
            Add to MetaMask
          </button>
        </div>
        <div>
          <img className={styles.image} src="./crypto-devs.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        MVP of Staking Platform
      </footer>
    </div>
  );
}