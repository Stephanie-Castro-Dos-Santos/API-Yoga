import { Router } from "express";
import { validationResult, checkSchema, matchedData } from "express-validator";
import {
  users,
  createUserValidationSchema,
  resolveIndexById,
  setCookies,
} from "../utils/index.mjs";
import {
  User,
  Student,
  Teacher,
  Center,
  Calendar,
  Address,
} from "../models/index.js";

const router = Router();

// 1. GET Users
router.get(
  "/api/users",
  checkSchema(createUserValidationSchema(3, 10)),
  (req, res) => {
    const result = validationResult(req);
    const { filter, value } = req.query;

    if (filter && value) {
      const filteredUsers = users.filter(
        (user) => user[filter] && user[filter].includes(value)
      );
      return res.send(filteredUsers);
    } else {
      res.send(users);
    }
  }
);

// 2. GET User by ID
router.get("/api/users/:id", resolveIndexById, (req, res) => {
  const parsedId = parseInt(req.params.id);
  const findUser = users.find((user) => user.id === parsedId);

  if (!findUser) return res.sendStatus(404);
  return res.send(findUser);
});

// 3. POST (Create User)
router.post(
  "/api/users",
  checkSchema(createUserValidationSchema),
  (req, res) => {
    const result = validationResult(req);
    if (!result.isEmpty())
      return res.status(404).end({ errors: result.array() });

    const data = matchedData(req);
    const newUser = { id: users[users.length - 1].id + 1, ...data };
    users.push(newUser);
    return res.status(200).send(newUser);
  }
);

// 4. PUT (Update User)
router.put("/api/users/:id", resolveIndexById, (req, res) => {
  const { body, userIndex } = req;
  users[userIndex] = { id: users[userIndex].id, ...body };
  return res.sendStatus(200);
});

// 5. PATCH (Update Some Fields)
router.patch("/api/users/:id", resolveIndexById, (req, res) => {
  const { body, userIndex } = req;
  users[userIndex] = { ...users[userIndex], ...body };
  return res.status(200).send(users[userIndex]);
});

// 6. DELETE (Remove User)
router.delete("/api/users/:id", resolveIndexById, (req, res) => {
  const { userIndex } = req;
  users.splice(userIndex, 1);
  return res.status(200).send(users);
});

// Ruta de registro
router.post(
  "/api/register",
  checkSchema(createUserValidationSchema),
  async (req, res) => {
    try {
      const { name, email, password, role, address } = req.body;
      const dbUser = await User.findOne({ email });

      if (dbUser) {
        return res.status(401).send({ message: "ERROR. Usuario preexistente" });
      }

      const newUser = new User({ name, email, password, role });
      await newUser.save();

      const roles = [];
      if (role === "teacher" || role === "student") {
        if (role === "teacher") {
          await Teacher.create({ user: newUser._id });
          roles.push("teacher");
        }
        await Student.create({ user: newUser._id });
        roles.push("student");
      } else if (role === "center") {
        const newAddress = await Address.findOrCreate(address);
        await Center.create({ user: newUser._id, address: newAddress });
        roles.push("center");
      }

      for (const roleType of roles) {
        await Calendar.create({ roleType: roleType, user: newUser._id });
      }

      req.session.userId = newUser._id;
      req.session.role = newUser.role;
      req.session.initialRole = newUser.role;

      req.session.save((err) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Error al guardar la sesión" });
        }
      });

      console.log("SESSION REGISTER");
      console.log(req.session);

      setCookies(req, res);

      console.log(res.cookies);

      res.status(201).json({
        message: "Usuario registrado con éxito",
        user: {
          userId: req.session.userId,
          role: req.session.role,
          initialRole: req.session.role,
        },
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Ruta de login
router.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }

    if (!(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    req.session.userId = user._id;
    req.session.role = user.role;
    req.session.initialRole = user.role;

    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ message: "Error al guardar la sesión" });
      }
    });

    console.log("SESSION LOGIN");
    console.log(req.session);

    setCookies(req, res);

    console.log(res.cookies);

    res.status(200).json({
      message: "Login exitoso",
      user: {
        userId: user._id,
        role: user.role,
        initialRole: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verificar sesión
router.get("/api/session", (req, res) => {
  console.log("SESSION BEFORE GET SESSION");
  console.log(req.session);
  console.log(req.session.userId);

  if (req.session.userId) {
    setCookies(req, res);

    res.json({
      userId: req.session.userId,
      role: req.session.role,
      initialRole: req.session.initialRole,
    });
  } else {
    res.status(401).json({ message: "No hay sesión iniciada" });
  }
});

// Logout
router.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Error al cerrar sesión" });
    }
    res.clearCookie("sessionData");
    res.clearCookie("sessionId");
    res.json({ message: "Sesión cerrada con éxito" });
  });
});

router.patch("/api/switch-role", (req, res) => {
  const { role } = req.body;

  console.log("ANTES SWITCH");
  console.log(req.session);

  req.session.role = role;
  console.log("DESPUÉS SWITCH");
  console.log(req.session);

  // console.log("ROL EN SWITCH-ROLE:");
  // console.log(req.session.role);
  // console.log(req.session.initialRole);

  res.send({ role: role });
});

export default router;
