import BigNumber from 'bignumber.js';
import { Request, Response } from "express";
import { parsePriceData } from '@pythnetwork/client';
import { Connection, PublicKey } from "@solana/web3.js";

export class PythController {
  public prices(req: Request, res: Response) {
    (async () => {
      const connection = new Connection("https://api.mainnet-beta.solana.com");
      async function getPrice(tokenName: String, pricePublicKey: PublicKey) {
        const result = await connection.getAccountInfo(pricePublicKey);
        const { price } = parsePriceData(result!.data);
        return {
          token: tokenName,
          price: new BigNumber(price!),
        };
      }
      res.status(200).json(await Promise.all([
        getPrice("BTC",  new PublicKey("GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU")),
        getPrice("ETH",  new PublicKey("JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB")),
        getPrice("SOL",  new PublicKey("H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG")),
      ]));
    })();
  }
}

export const pythController = new PythController();
