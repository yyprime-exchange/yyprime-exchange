"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const pyth_1 = require("./routes/api/pyth");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use(express_1.default.static('public'));
app.use("/api/pyth", pyth_1.pythRoutes);
app.use((req, res, next) => { res.status(404).json({ status: 404, error: 'Not found' }); });
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ err: { status: err.status || 500, message: err.message || 'Internal Server Error' } });
});
const port = process.env.PORT || 8080;
app.listen(port);
