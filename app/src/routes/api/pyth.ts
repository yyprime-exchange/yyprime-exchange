import * as express from "express";
import { pythController } from "../../controllers/api/pyth";

const router: express.Router = express.Router();
router.get("/prices", pythController.prices);

export const pythRoutes = router;
