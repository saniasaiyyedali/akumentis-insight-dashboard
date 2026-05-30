const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const users = [];

users.push({
  id: "1",
  name: "Admin User",
  email: "admin@akumentis.com",
  password: bcrypt.hashSync("admin123", 10),
  role: "admin",
});

users.push({
  id: "2",
  name: "Manager User",
  email: "manager@akumentis.com",
  password: bcrypt.hashSync("manager123", 10),
  role: "manager",
});

users.push({
  id: "3",
  name: "Viewer User",
  email: "viewer@akumentis.com",
  password: bcrypt.hashSync("viewer123", 10),
  role: "viewer",
});

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    const user = users.find((u) => u.email === email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials." });
    }
    const token = generateToken(user);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: "Login failed." });
  }
}

async function signup(req, res) {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }
    if (users.find((u) => u.email === email)) {
      return res.status(409).json({ error: "User already exists." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: String(users.length + 1),
      name,
      email,
      password: hashedPassword,
      role: role || "viewer",
    };
    users.push(newUser);
    const token = generateToken(newUser);
    res.status(201).json({
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
    });
  } catch (err) {
    res.status(500).json({ error: "Signup failed." });
  }
}

function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { login, signup, me };
