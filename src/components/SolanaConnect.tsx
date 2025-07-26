"use client";

import { FC } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

const SolanaConnect: FC = () => {
	return (
		<WalletMultiButton
			style={{
				height: "36px",
				borderRadius: "8px",
				marginLeft: "2px",
			}}
		/>
	);
};

export default SolanaConnect;
