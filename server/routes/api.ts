import { Router, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { dbService } from "../services/dbService.js";
import { verifyAdminToken, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key-13579";

// Helper to send email notification
async function sendNotificationEmail(contactData: { name: string; email: string; subject: string; message: string }) {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const receiver = process.env.EMAIL_RECEIVER || user || "kommireddycharan1@gmail.com";

  if (!user || !pass) {
    console.warn("Nodemailer: EMAIL_USER and EMAIL_PASS environment variables are not set. Email notification skipped.");
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass }
    });

    const mailOptions = {
      from: `"${contactData.name}" <${user}>`,
      to: receiver,
      replyTo: contactData.email,
      subject: `New Portfolio Message: ${contactData.subject}`,
      text: `You have received a new contact submission from your portfolio website:

Name: ${contactData.name}
Email: ${contactData.email}
Subject: ${contactData.subject}

Message:
${contactData.message}
`
    };

    await transporter.sendMail(mailOptions);
    console.log("Nodemailer: Notification email sent successfully to", receiver);
  } catch (err) {
    console.error("Nodemailer: Failed to send email notification:", err);
  }
}

// DB Status Endpoint
router.get("/db-status", (req, res) => {
  res.json({ status: dbService.getMode() });
});

// Admin Authentication Route
router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  try {
    const adminUser = await dbService.admins.getByUsername(username);
    if (!adminUser) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    const isMatch = bcrypt.compareSync(password, adminUser.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    // Generate JWT Token (valid for 12 hours)
    const token = jwt.sign({ username: adminUser.username }, JWT_SECRET, { expiresIn: "12h" });
    
    return res.json({
      token,
      admin: { username: adminUser.username }
    });
  } catch (err: any) {
    console.error("Auth login error:", err);
    return res.status(500).json({ message: "Server error during authentication." });
  }
});

// Auth Verification
router.get("/auth/me", verifyAdminToken, (req: AuthenticatedRequest, res) => {
  return res.json({ admin: req.user });
});

// --- Projects CRUD ---
router.get("/projects", async (req, res) => {
  try {
    const projects = await dbService.projects.getAll();
    return res.json(projects);
  } catch (err: any) {
    console.error("Get projects error:", err);
    return res.status(500).json({ message: "Failed to fetch projects." });
  }
});

router.post("/projects", verifyAdminToken, async (req, res) => {
  const { title, description, technologies, githubLink, liveDemoLink, projectImage, category, date } = req.body;

  if (!title || !description || !category || !date) {
    return res.status(400).json({ message: "Title, description, category, and date are required fields." });
  }

  try {
    const techArray = Array.isArray(technologies) 
      ? technologies 
      : typeof technologies === "string" 
        ? technologies.split(",").map(t => t.trim()).filter(Boolean)
        : [];

    const newProject = await dbService.projects.create({
      title,
      description,
      technologies: techArray,
      githubLink,
      liveDemoLink,
      projectImage,
      category,
      date
    });

    return res.status(201).json(newProject);
  } catch (err: any) {
    console.error("Create project error:", err);
    return res.status(500).json({ message: "Failed to create project." });
  }
});

router.put("/projects/:id", verifyAdminToken, async (req, res) => {
  const { id } = req.params;
  const { title, description, technologies, githubLink, liveDemoLink, projectImage, category, date } = req.body;

  try {
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (date !== undefined) updateData.date = date;
    if (githubLink !== undefined) updateData.githubLink = githubLink;
    if (liveDemoLink !== undefined) updateData.liveDemoLink = liveDemoLink;
    if (projectImage !== undefined) updateData.projectImage = projectImage;
    if (technologies !== undefined) {
      updateData.technologies = Array.isArray(technologies)
        ? technologies
        : typeof technologies === "string"
          ? technologies.split(",").map(t => t.trim()).filter(Boolean)
          : [];
    }

    const updatedProject = await dbService.projects.update(id, updateData);
    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found." });
    }

    return res.json(updatedProject);
  } catch (err: any) {
    console.error("Update project error:", err);
    return res.status(500).json({ message: "Failed to update project." });
  }
});

router.delete("/projects/:id", verifyAdminToken, async (req, res) => {
  const { id } = req.params;
  try {
    const success = await dbService.projects.delete(id);
    if (!success) {
      return res.status(404).json({ message: "Project not found." });
    }
    return res.json({ message: "Project successfully deleted." });
  } catch (err: any) {
    console.error("Delete project error:", err);
    return res.status(500).json({ message: "Failed to delete project." });
  }
});

// --- Certificates CRUD ---
router.get("/certificates", async (req, res) => {
  try {
    const certs = await dbService.certificates.getAll();
    return res.json(certs);
  } catch (err: any) {
    console.error("Get certificates error:", err);
    return res.status(500).json({ message: "Failed to fetch certificates." });
  }
});

router.post("/certificates", verifyAdminToken, async (req, res) => {
  const { name, issuingOrganization, date, credentialLink, credentialId, category, image } = req.body;

  if (!name || !issuingOrganization || !date) {
    return res.status(400).json({ message: "Name, issuing organization, and date are required fields." });
  }

  try {
    const newCert = await dbService.certificates.create({
      name,
      issuingOrganization,
      date,
      credentialLink,
      credentialId,
      category,
      image
    });
    return res.status(201).json(newCert);
  } catch (err: any) {
    console.error("Create certificate error:", err);
    return res.status(500).json({ message: "Failed to create certificate." });
  }
});

router.put("/certificates/:id", verifyAdminToken, async (req, res) => {
  const { id } = req.params;
  const { name, issuingOrganization, date, credentialLink, credentialId, category, image } = req.body;

  try {
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (issuingOrganization !== undefined) updateData.issuingOrganization = issuingOrganization;
    if (date !== undefined) updateData.date = date;
    if (credentialLink !== undefined) updateData.credentialLink = credentialLink;
    if (credentialId !== undefined) updateData.credentialId = credentialId;
    if (category !== undefined) updateData.category = category;
    if (image !== undefined) updateData.image = image;

    const updatedCert = await dbService.certificates.update(id, updateData);
    if (!updatedCert) {
      return res.status(404).json({ message: "Certificate not found." });
    }

    return res.json(updatedCert);
  } catch (err: any) {
    console.error("Update certificate error:", err);
    return res.status(500).json({ message: "Failed to update certificate." });
  }
});

router.delete("/certificates/:id", verifyAdminToken, async (req, res) => {
  const { id } = req.params;
  try {
    const success = await dbService.certificates.delete(id);
    if (!success) {
      return res.status(404).json({ message: "Certificate not found." });
    }
    return res.json({ message: "Certificate successfully deleted." });
  } catch (err: any) {
    console.error("Delete certificate error:", err);
    return res.status(500).json({ message: "Failed to delete certificate." });
  }
});

// --- Contact Form Submissions ---
router.post("/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: "All contact fields (name, email, subject, message) are required." });
  }

  // Simple email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Please provide a valid email address." });
  }

  try {
    const newMessage = await dbService.messages.create({
      name,
      email,
      subject,
      message
    });
    
    // Send email notification in the background
    sendNotificationEmail({ name, email, subject, message });

    return res.status(201).json({
      message: "Message sent and logged successfully!",
      messageData: newMessage
    });
  } catch (err: any) {
    console.error("Post contact message error:", err);
    return res.status(500).json({ message: "Failed to save contact message." });
  }
});

router.get("/contact", verifyAdminToken, async (req, res) => {
  try {
    const msgs = await dbService.messages.getAll();
    return res.json(msgs);
  } catch (err: any) {
    console.error("Get contact messages error:", err);
    return res.status(500).json({ message: "Failed to fetch contact messages." });
  }
});

router.delete("/contact/:id", verifyAdminToken, async (req, res) => {
  const { id } = req.params;
  try {
    const success = await dbService.messages.delete(id);
    if (!success) {
      return res.status(404).json({ message: "Message not found." });
    }
    return res.json({ message: "Message successfully deleted." });
  } catch (err: any) {
    console.error("Delete contact message error:", err);
    return res.status(500).json({ message: "Failed to delete message." });
  }
});

// --- Settings/Profile CRUD ---
router.get("/settings", async (req, res) => {
  try {
    const settings = await dbService.settings.get();
    return res.json(settings);
  } catch (err: any) {
    console.error("Get settings error:", err);
    return res.status(500).json({ message: "Failed to fetch settings." });
  }
});

router.put("/settings", verifyAdminToken, async (req, res) => {
  try {
    const updatedSettings = await dbService.settings.update(req.body);
    return res.json(updatedSettings);
  } catch (err: any) {
    console.error("Update settings error:", err);
    return res.status(500).json({ message: "Failed to update settings." });
  }
});

// --- GitHub API Proxy with Cache ---
let githubCache: { data: any[]; timestamp: number } | null = null;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes cache

router.get("/github/repos", async (req, res) => {
  const username = (req.query.username as string) || "kommireddycharan1";
  
  if (githubCache && (Date.now() - githubCache.timestamp < CACHE_TTL)) {
    return res.json(githubCache.data);
  }

  try {
    const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`, {
      headers: {
        "User-Agent": "Portfolio-App"
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API returned status ${response.status}`);
    }

    const repos = await response.json();
    if (Array.isArray(repos)) {
      const formatted = repos.map((repo: any) => ({
        name: repo.name,
        description: repo.description,
        html_url: repo.html_url,
        stargazers_count: repo.stargazers_count,
        language: repo.language || "TypeScript",
        updated_at: repo.updated_at
      }));
      githubCache = { data: formatted, timestamp: Date.now() };
      return res.json(formatted);
    }
    throw new Error("Invalid response format from GitHub");
  } catch (err: any) {
    console.log("GitHub API fetch completed with fallback mock repository data:", err.message);
    const mockRepos = [
      {
        name: "ai-neural-net",
        description: "Custom NumPy-based neural network framework with backpropagation and visual loss curves.",
        html_url: `https://github.com/${username}/ai-neural-net`,
        stargazers_count: 14,
        language: "Python",
        updated_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
      },
      {
        name: "autonomous-maze-solver",
        description: "Multi-agent pathfinding simulation using Q-learning and A* search optimization.",
        html_url: `https://github.com/${username}/autonomous-maze-solver`,
        stargazers_count: 8,
        language: "Java",
        updated_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString()
      },
      {
        name: "portfolio-fullstack",
        description: "Personal React & Node portfolio with dynamic DB configuration and PWA offline support.",
        html_url: `https://github.com/${username}/portfolio-fullstack`,
        stargazers_count: 19,
        language: "TypeScript",
        updated_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
      }
    ];
    return res.json(mockRepos);
  }
});

export default router;
