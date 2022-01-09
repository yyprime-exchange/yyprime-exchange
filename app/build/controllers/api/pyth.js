"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pythController = exports.PythController = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const client_1 = require("@pythnetwork/client");
const web3_js_1 = require("@solana/web3.js");
class PythController {
    prices(req, res) {
        (() => __awaiter(this, void 0, void 0, function* () {
            const connection = new web3_js_1.Connection("https://api.mainnet-beta.solana.com");
            function getPrice(tokenName, pricePublicKey) {
                return __awaiter(this, void 0, void 0, function* () {
                    const result = yield connection.getAccountInfo(pricePublicKey);
                    const { price } = (0, client_1.parsePriceData)(result.data);
                    return {
                        token: tokenName,
                        price: new bignumber_js_1.default(price),
                    };
                });
            }
            res.status(200).json(yield Promise.all([
                getPrice("BTC", new web3_js_1.PublicKey("GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU")),
                getPrice("ETH", new web3_js_1.PublicKey("JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB")),
                getPrice("SOL", new web3_js_1.PublicKey("H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG")),
            ]));
        }))();
    }
}
exports.PythController = PythController;
exports.pythController = new PythController();
