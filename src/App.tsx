import React from 'react';
import { Container, Form, InputGroup, Tooltip, Button, OverlayTrigger } from 'react-bootstrap';
import { Celo, NETWORKS } from '@dexfair/celo-web-signer';
import Compiler from './components/Compiler';
import SmartContracts from './components/SmartContracts';
import { InterfaceContract } from './components/Types';

const App: React.FunctionComponent = () => {
	const [account, setAccount] = React.useState<string>('');
	const [balance, setBalance] = React.useState<string>('');
	const [network, setNetwork] = React.useState<string>('Mainnet');
	const [disabledNetSelect, setDisabledNetSelect] = React.useState<boolean>(true);
	const [busy, setBusy] = React.useState<boolean>(false);
	const [celo] = React.useState<Celo>(new Celo(NETWORKS.Mainnet));
	const [atAddress, setAtAddress] = React.useState<string>('');
	const [contracts, setContracts] = React.useState<InterfaceContract[]>([]);
	const [selected, setSelected] = React.useState<InterfaceContract | null>(null);

	React.useEffect(() => {
		updateBalance(account);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [account, network]);

	async function connect() {
		if (!celo.isConnected) {
			setBusy(true);
			const support = await celo.getSupport();

			if (support.celo) {
				const result = await celo.connectCelo(
					(type: string, accounts: string[]) => {
						setBalance('');
						setAccount(accounts[0]);
					},
					(networkName: string) => {
						setBalance('');
						setNetwork(networkName);
					}
				);
				if (result && (window as { [key: string]: any }).gtag) {
					const { gtag } = window as { [key: string]: any };
					gtag('event', 'login', {
						method: 'Celo',
					});
				}
			} else {
				const result = await celo.connectMetaMask((type: string, accounts: string[]) => {
					setAccount(accounts[0]);
				});
				if (result && (window as { [key: string]: any }).gtag) {
					const { gtag } = window as { [key: string]: any };
					gtag('event', 'login', {
						method: 'MetaMask',
					});
				}
				setDisabledNetSelect(false);
			}

			setBusy(false);
		}
	}

	async function updateBalance(address: string) {
		if (address !== '') {
			const { CELO } = await celo.kit.getTotalBalance(address);
			setBalance(celo.kit.web3.utils.fromWei(CELO.toString()));
		}
	}

	async function changeNetwork(e: React.ChangeEvent<HTMLInputElement>) {
		if (!disabledNetSelect) {
			setBusy(true);
			setContracts([]);
			const temp = e.target.value;
			await celo.changeNetwork(NETWORKS[temp]);
			setNetwork(temp);
			setBusy(false);
		}
	}

	function addNewContract(contract: InterfaceContract) {
		setContracts(contracts.concat([contract]));
	}

	function Networks() {
		const list = NETWORKS;
		const items = Object.keys(list).map((key) => (
			<option key={key} value={key}>
				{key}
			</option>
		));
		return (
			<Form.Group>
				<Form.Text className="text-muted">
					<small>NETWORK</small>
				</Form.Text>
				<Form.Control
					as="select"
					value={network}
					onChange={changeNetwork}
					disabled={!celo.isConnected || disabledNetSelect}
				>
					{items}
				</Form.Control>
			</Form.Group>
		);
	}

	return (
		<div className="App">
			<Container>
				<Form>
					<Form.Group>
						<Form.Text className="text-muted">
							<small>ACCOUNT</small>
						</Form.Text>
						<InputGroup>
							<Form.Control type="text" placeholder="Account" value={account} size="sm" readOnly />
							<InputGroup.Append hidden={account !== ''}>
								<OverlayTrigger
									placement="left"
									overlay={
										<Tooltip id="overlay-connect" hidden={account !== ''}>
											Connect to Wallet
										</Tooltip>
									}
								>
									<Button variant="warning" block size="sm" disabled={busy} onClick={connect}>
										<small>Connect</small>
									</Button>
								</OverlayTrigger>
							</InputGroup.Append>
						</InputGroup>
					</Form.Group>
					<Form.Group>
						<Form.Text className="text-muted">
							<small>BALANCE (CELO)</small>
						</Form.Text>
						<InputGroup>
							<Form.Control type="text" placeholder="Account" value={balance} size="sm" readOnly />
						</InputGroup>
					</Form.Group>
					<Networks />
				</Form>
				<hr />
				<Compiler
					celo={celo}
					network={network}
					gtag={(name: string) => {
						const { gtag } = window as { [key: string]: any };
						gtag('event', name, { network });
					}}
					busy={busy}
					setBusy={setBusy}
					addNewContract={addNewContract}
					setSelected={setSelected}
					updateBalance={updateBalance}
				/>
				<p className="text-center mt-3">
					<small>OR</small>
				</p>
				<InputGroup className="mb-3">
					<Form.Control
						value={atAddress}
						placeholder="contract address"
						onChange={(e) => {
							setAtAddress(e.target.value);
						}}
						size="sm"
						disabled={busy || account === '' || !selected}
					/>
					<InputGroup.Append>
						<OverlayTrigger
							placement="left"
							overlay={<Tooltip id="overlay-ataddresss">Use deployed Contract address</Tooltip>}
						>
							<Button
								variant="primary"
								size="sm"
								disabled={busy || account === '' || !selected}
								onClick={() => {
									setBusy(true);
									if (selected) {
										addNewContract({ ...selected, address: atAddress });
									}
									setBusy(false);
								}}
							>
								<small>At Address</small>
							</Button>
						</OverlayTrigger>
					</InputGroup.Append>
				</InputGroup>
				<hr />
				<SmartContracts celo={celo} busy={busy} setBusy={setBusy} contracts={contracts} updateBalance={updateBalance} />
			</Container>
		</div>
	);
};

export default App;
