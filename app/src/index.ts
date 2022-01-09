import express, { Request, Response, NextFunction } from "express";

import { pythRoutes } from "./routes/api/pyth";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

app.use("/api/pyth", pythRoutes);

app.use((req: Request, res: Response, next: NextFunction) => { res.status(404).json({ status: 404, error: 'Not found'}) });

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(err.status || 500).json({ err: { status: err.status || 500, message: err.message || 'Internal Server Error' } });
});

const port = process.env.PORT || 8080
app.listen(port);
