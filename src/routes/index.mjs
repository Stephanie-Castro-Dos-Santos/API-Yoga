import { Router } from "express";
import users from "../routes/users.mjs";
import products from "../routes/products.mjs";
import auth from "../routes/auth.mjs";
import cart from "../routes/cart.mjs";

const router = Router();

router.use(users);
router.use(products);
router.use(auth);
router.use(cart);

export default router;
