
import {
  Account,
  AccountInfo,
  Commitment,
  Connection,
  PublicKey,
  RpcResponseAndContext,
  SimulatedTransactionResponse,
  Transaction,
} from '@solana/web3.js';


import { Order } from '@project-serum/serum/lib/market';
import { Buffer } from 'buffer';
import assert from 'assert';
import { struct } from 'superstruct';


function jsonRpcResult(resultDescription: any) {
  const jsonRpcVersion = struct.literal('2.0');
  return struct.union([
    struct({
      jsonrpc: jsonRpcVersion,
      id: 'string',
      error: 'any',
    }),
    struct({
      jsonrpc: jsonRpcVersion,
      id: 'string',
      error: 'null?',
      result: resultDescription,
    }),
  ]);
}

function jsonRpcResultAndContext(resultDescription: any) {
  return jsonRpcResult({
    context: struct({
      slot: 'number',
    }),
    value: resultDescription,
  });
}

const AccountInfoResult = struct({
  executable: 'boolean',
  owner: 'string',
  lamports: 'number',
  data: 'any',
  rentEpoch: 'number?',
});

export const GetMultipleAccountsAndContextRpcResult = jsonRpcResultAndContext(
  struct.array([struct.union(['null', AccountInfoResult])]),
);

export async function getMultipleSolanaAccounts(
  connection: Connection,
  publicKeys: PublicKey[],
): Promise<
  RpcResponseAndContext<{ [key: string]: AccountInfo<Buffer> | null }>
> {
  const args = [publicKeys.map((k) => k.toBase58()), { commitment: 'recent' }];
  // @ts-ignore
  const unsafeRes = await connection._rpcRequest('getMultipleAccounts', args);
  const res = GetMultipleAccountsAndContextRpcResult(unsafeRes);
  if (res.error) {
    throw new Error(
      'failed to get info about accounts ' +
      publicKeys.map((k) => k.toBase58()).join(', ') +
      ': ' +
      res.error.message,
    );
  }
  assert(typeof res.result !== 'undefined');
  const accounts: Array<{
    executable: any;
    owner: PublicKey;
    lamports: any;
    data: Buffer;
  } | null> = [];
  for (const account of res.result.value) {
    let value: {
      executable: any;
      owner: PublicKey;
      lamports: any;
      data: Buffer;
    } | null = null;
    if (res.result.value) {
      const { executable, owner, lamports, data } = account;
      assert(data[1] === 'base64');
      value = {
        executable,
        owner: new PublicKey(owner),
        lamports,
        data: Buffer.from(data[0], 'base64'),
      };
    }
    accounts.push(value);
  }
  return {
    context: {
      slot: res.result.context.slot,
    },
    value: Object.fromEntries(
      accounts.map((account, i) => [publicKeys[i].toBase58(), account]),
    ),
  };
}

/** Copy of Connection.simulateTransaction that takes a commitment parameter. */
async function simulateTransaction(
  connection: Connection,
  transaction: Transaction,
  commitment: Commitment,
): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
  // @ts-ignore
  transaction.recentBlockhash = await connection._recentBlockhash(
    // @ts-ignore
    connection._disableBlockhashCaching,
  );

  const signData = transaction.serializeMessage();
  // @ts-ignore
  const wireTransaction = transaction._serialize(signData);
  const encodedTransaction = wireTransaction.toString('base64');
  const config: any = { encoding: 'base64', commitment };
  const args = [encodedTransaction, config];

  // @ts-ignore
  const res = await connection._rpcRequest('simulateTransaction', args);
  if (res.error) {
    throw new Error('failed to simulate transaction: ' + res.error.message);
  }
  return res.result;
}
