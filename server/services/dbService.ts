import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

// Define TypeScript interfaces for our models
export interface IProject {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  githubLink?: string;
  liveDemoLink?: string;
  projectImage?: string;
  category: string;
  date: string;
}

export interface ICertificate {
  id: string;
  name: string;
  issuingOrganization: string;
  date: string;
  credentialLink?: string;
  credentialId?: string;
  category?: string;
  image?: string;
}

export interface IContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
}

export interface IAdminUser {
  username: string;
  passwordHash: string;
}

// JSON file storage paths
const DATA_DIR = path.join(process.cwd(), "server", "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

// Mongoose Schemas (if MongoDB is used)
const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  technologies: [{ type: String }],
  githubLink: { type: String },
  liveDemoLink: { type: String },
  projectImage: { type: String },
  category: { type: String, required: true },
  date: { type: String, required: true }
}, { timestamps: true });

const CertificateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  issuingOrganization: { type: String, required: true },
  date: { type: String, required: true },
  credentialLink: { type: String },
  credentialId: { type: String },
  category: { type: String },
  image: { type: String }
}, { timestamps: true });

const ContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  date: { type: String, required: true }
}, { timestamps: true });

const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true }
}, { timestamps: true });

const SettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

// Create models (lazy evaluated)
let MongoProject: mongoose.Model<any>;
let MongoCertificate: mongoose.Model<any>;
let MongoContact: mongoose.Model<any>;
let MongoAdmin: mongoose.Model<any>;
let MongoSettings: mongoose.Model<any>;

// DB State
let dbMode: "mongodb" | "local" = "local";
let localDbCache: {
  projects: IProject[];
  certificates: ICertificate[];
  messages: IContactMessage[];
  admins: IAdminUser[];
  settings: Record<string, any>;
} = {
  projects: [],
  certificates: [],
  messages: [],
  admins: [],
  settings: {}
};

// Seed data
const defaultSettings = {
  fullName: "Kommireddy Charan",
  role: "B.Tech Computer Science (Artificial Intelligence) Student",
  aboutText: "I am a passionate Computer Science student specializing in Artificial Intelligence and Machine Learning. I build full-stack intelligent applications that combine cutting-edge machine learning models with elegant, high-performance user interfaces. I love solving complex algorithmic challenges and automating real-world workflows.",
  avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
  skills: [
    {
      category: "Programming",
      list: ["Python", "Java", "C / C++", "JavaScript", "TypeScript", "SQL"]
    },
    {
      category: "AI & Machine Learning",
      list: ["Machine Learning (Scikit-Learn)", "Deep Learning (PyTorch)", "NumPy & Pandas", "Computer Vision & NLP", "LLMs & Prompt Engineering"]
    },
    {
      category: "Web Development",
      list: ["React", "Express", "Node.js", "Tailwind CSS", "HTML5 & CSS3", "Vite"]
    },
    {
      category: "Databases & Tools",
      list: ["MongoDB & Mongoose", "PostgreSQL", "Git & GitHub", "Docker", "VS Code"]
    }
  ],
  resumePdf: "", // Base64 PDF file
  resumeDetails: {
    education: [
      {
        institution: "Deepmind Institute of Technology",
        degree: "B.Tech. in Computer Science & Engineering (Artificial Intelligence)",
        period: "2023 - 2027",
        details: "CGPA: 9.4/10",
        coursework: "Data Structures, Design and Analysis of Algorithms, Deep Learning Networks, Multi-Agent Systems, Neural Architecture Search, Reinforcement Learning, Computer Vision"
      },
      {
        institution: "Science Academy",
        degree: "Higher Secondary Certificate (CS Majors)",
        period: "2021 - 2023",
        details: "Grade: 95.8%",
        coursework: "Physics, Chemistry, Mathematics, Computer Science"
      }
    ],
    experience: [
      {
        company: "AI Innovation Labs",
        role: "Machine Learning Intern",
        period: "Summer 2025",
        details: "Built and evaluated computer vision pipelines for automatic image labeling. Assisted in training custom CNNs, boosting dataset preparation speeds."
      }
    ]
  },
  socialLinks: {
    linkedin: "https://linkedin.com",
    github: "https://github.com/charankommireddy",
    twitter: "https://twitter.com",
    email: "kommireddycharan1@gmail.com"
  },
  codingProfiles: {
    githubUsername: "charankommireddy",
    leetcodeUsername: "kommireddycharan1",
    hackerrankUsername: "kommireddycharan1"
  }
};
const defaultProjects: IProject[] = [
  {
    id: "p1",
    title: "AI-Powered Coding Assistant",
    description: "Developed an intelligent coding copilot using LLMs that can complete and refactor code inside code editors. It analyzes full repository context to suggest modular changes.",
    technologies: ["React", "Express", "TypeScript", "Gemini API", "Tailwind CSS"],
    githubLink: "https://github.com/example/ai-copilot",
    liveDemoLink: "https://example.com/ai-copilot",
    projectImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    category: "AI/ML",
    date: "2026-05"
  },
  {
    id: "p2",
    title: "Real-time Multi-agent Orchestration Suite",
    description: "Built a fully visual canvas to coordinate multi-agent system tasks, facilitating custom workflows, telemetry feedback loops, and secure cloud logging.",
    technologies: ["React", "D3.js", "Node.js", "MongoDB", "Socket.io"],
    githubLink: "https://github.com/example/multi-agent",
    liveDemoLink: "https://example.com/multi-agent",
    projectImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
    category: "Full Stack",
    date: "2026-03"
  }
];

const defaultCertificates: ICertificate[] = [
  {
    id: "c1",
    name: "Machine Learning Specialization",
    issuingOrganization: "DeepLearning.AI",
    date: "2025-11",
    credentialLink: "https://coursera.org/verify/specialization/ml-special"
  },
  {
    id: "c2",
    name: "TensorFlow Developer Certificate",
    issuingOrganization: "Google",
    date: "2026-02",
    credentialLink: "https://credential.net/google-tf"
  }
];

// Helper to load local db from file
function loadLocalDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      localDbCache = JSON.parse(data);
      if (!localDbCache.settings || Object.keys(localDbCache.settings).length === 0) {
        localDbCache.settings = defaultSettings;
        saveLocalDb();
      }
    } else {
      // Seed with some sample items
      const passwordHash = bcrypt.hashSync("admin123", 10);
      localDbCache = {
        projects: defaultProjects,
        certificates: defaultCertificates,
        messages: [],
        admins: [{ username: "admin", passwordHash }],
        settings: defaultSettings
      };
      saveLocalDb();
    }
  } catch (err) {
    console.error("Failed to read local JSON database, using in-memory state:", err);
  }
}

// Helper to save local db to file
function saveLocalDb() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(localDbCache, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write to local JSON database:", err);
  }
}

export const dbService = {
  async connect(): Promise<"mongodb" | "local"> {
    const mongoUri = process.env.MONGODB_URI;
    
    // Always load local DB as a backup or configuration space
    loadLocalDb();

    if (mongoUri) {
      try {
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 5000
        });
        
        dbMode = "mongodb";
        console.log("Successfully connected to MongoDB Atlas.");

        // Initialize Mongoose Models
        MongoProject = mongoose.models.Project || mongoose.model("Project", ProjectSchema);
        MongoCertificate = mongoose.models.Certificate || mongoose.model("Certificate", CertificateSchema);
        MongoContact = mongoose.models.Contact || mongoose.model("Contact", ContactSchema);
        MongoAdmin = mongoose.models.Admin || mongoose.model("Admin", AdminSchema);
        MongoSettings = mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);

        // Seed default admin in MongoDB if it doesn't exist
        const adminCount = await MongoAdmin.countDocuments();
        if (adminCount === 0) {
          const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || "admin123", 10);
          await MongoAdmin.create({
            username: process.env.ADMIN_USERNAME || "admin",
            passwordHash
          });
          console.log("Seeded default admin user to MongoDB Atlas");
        }
        
        // Seed default projects if none exist
        const projCount = await MongoProject.countDocuments();
        if (projCount === 0) {
          await MongoProject.insertMany(defaultProjects.map(p => {
            const { id, ...rest } = p;
            return rest;
          }));
          console.log("Seeded default projects to MongoDB Atlas");
        }

        // Seed default certificates if none exist
        const certCount = await MongoCertificate.countDocuments();
        if (certCount === 0) {
          await MongoCertificate.insertMany(defaultCertificates.map(c => {
            const { id, ...rest } = c;
            return rest;
          }));
          console.log("Seeded default certificates to MongoDB Atlas");
        }

        // Seed default settings if none exist
        const settingsCount = await MongoSettings.countDocuments();
        if (settingsCount === 0) {
          await MongoSettings.create({
            key: "profile_settings",
            value: defaultSettings
          });
          console.log("Seeded default settings to MongoDB Atlas");
        }

        return "mongodb";
      } catch (err) {
        console.error("MongoDB Atlas connection failed! Falling back to Local JSON database.", err);
        dbMode = "local";
        return "local";
      }
    } else {
      console.log("No MONGODB_URI found in environment variables. Running in Local JSON database mode.");
      dbMode = "local";
      return "local";
    }
  },

  getMode(): "mongodb" | "local" {
    return dbMode;
  },

  // Project CRUD
  projects: {
    async getAll(): Promise<IProject[]> {
      if (dbMode === "mongodb") {
        const mongoProjects = await MongoProject.find().sort({ createdAt: -1 });
        return mongoProjects.map(doc => ({
          id: doc._id.toString(),
          title: doc.title,
          description: doc.description,
          technologies: doc.technologies,
          githubLink: doc.githubLink,
          liveDemoLink: doc.liveDemoLink,
          projectImage: doc.projectImage,
          category: doc.category,
          date: doc.date
        }));
      } else {
        return localDbCache.projects;
      }
    },

    async getById(id: string): Promise<IProject | null> {
      if (dbMode === "mongodb") {
        try {
          const doc = await MongoProject.findById(id);
          if (!doc) return null;
          return {
            id: doc._id.toString(),
            title: doc.title,
            description: doc.description,
            technologies: doc.technologies,
            githubLink: doc.githubLink,
            liveDemoLink: doc.liveDemoLink,
            projectImage: doc.projectImage,
            category: doc.category,
            date: doc.date
          };
        } catch {
          return null;
        }
      } else {
        return localDbCache.projects.find(p => p.id === id) || null;
      }
    },

    async create(data: Omit<IProject, "id">): Promise<IProject> {
      if (dbMode === "mongodb") {
        const doc = await MongoProject.create(data);
        return {
          id: doc._id.toString(),
          title: doc.title,
          description: doc.description,
          technologies: doc.technologies,
          githubLink: doc.githubLink,
          liveDemoLink: doc.liveDemoLink,
          projectImage: doc.projectImage,
          category: doc.category,
          date: doc.date
        };
      } else {
        const newProj: IProject = {
          ...data,
          id: "proj_" + Math.random().toString(36).substr(2, 9)
        };
        localDbCache.projects.unshift(newProj);
        saveLocalDb();
        return newProj;
      }
    },

    async update(id: string, data: Partial<Omit<IProject, "id">>): Promise<IProject | null> {
      if (dbMode === "mongodb") {
        try {
          const doc = await MongoProject.findByIdAndUpdate(id, data, { new: true });
          if (!doc) return null;
          return {
            id: doc._id.toString(),
            title: doc.title,
            description: doc.description,
            technologies: doc.technologies,
            githubLink: doc.githubLink,
            liveDemoLink: doc.liveDemoLink,
            projectImage: doc.projectImage,
            category: doc.category,
            date: doc.date
          };
        } catch {
          return null;
        }
      } else {
        const idx = localDbCache.projects.findIndex(p => p.id === id);
        if (idx === -1) return null;
        localDbCache.projects[idx] = {
          ...localDbCache.projects[idx],
          ...data
        };
        saveLocalDb();
        return localDbCache.projects[idx];
      }
    },

    async delete(id: string): Promise<boolean> {
      if (dbMode === "mongodb") {
        try {
          const res = await MongoProject.findByIdAndDelete(id);
          return res !== null;
        } catch {
          return false;
        }
      } else {
        const initialLen = localDbCache.projects.length;
        localDbCache.projects = localDbCache.projects.filter(p => p.id !== id);
        if (localDbCache.projects.length !== initialLen) {
          saveLocalDb();
          return true;
        }
        return false;
      }
    }
  },

  // Certificate CRUD
  certificates: {
    async getAll(): Promise<ICertificate[]> {
      if (dbMode === "mongodb") {
        const docs = await MongoCertificate.find().sort({ date: -1 });
        return docs.map(doc => ({
          id: doc._id.toString(),
          name: doc.name,
          issuingOrganization: doc.issuingOrganization,
          date: doc.date,
          credentialLink: doc.credentialLink,
          credentialId: doc.credentialId,
          category: doc.category,
          image: doc.image
        }));
      } else {
        return localDbCache.certificates;
      }
    },

    async create(data: Omit<ICertificate, "id">): Promise<ICertificate> {
      if (dbMode === "mongodb") {
        const doc = await MongoCertificate.create(data);
        return {
          id: doc._id.toString(),
          name: doc.name,
          issuingOrganization: doc.issuingOrganization,
          date: doc.date,
          credentialLink: doc.credentialLink,
          credentialId: doc.credentialId,
          category: doc.category,
          image: doc.image
        };
      } else {
        const newCert: ICertificate = {
          ...data,
          id: "cert_" + Math.random().toString(36).substr(2, 9)
        };
        localDbCache.certificates.unshift(newCert);
        saveLocalDb();
        return newCert;
      }
    },

    async update(id: string, data: Partial<Omit<ICertificate, "id">>): Promise<ICertificate | null> {
      if (dbMode === "mongodb") {
        try {
          const doc = await MongoCertificate.findByIdAndUpdate(id, data, { new: true });
          if (!doc) return null;
          return {
            id: doc._id.toString(),
            name: doc.name,
            issuingOrganization: doc.issuingOrganization,
            date: doc.date,
            credentialLink: doc.credentialLink,
            credentialId: doc.credentialId,
            category: doc.category,
            image: doc.image
          };
        } catch {
          return null;
        }
      } else {
        const idx = localDbCache.certificates.findIndex(c => c.id === id);
        if (idx === -1) return null;
        localDbCache.certificates[idx] = {
          ...localDbCache.certificates[idx],
          ...data
        };
        saveLocalDb();
        return localDbCache.certificates[idx];
      }
    },

    async delete(id: string): Promise<boolean> {
      if (dbMode === "mongodb") {
        try {
          const res = await MongoCertificate.findByIdAndDelete(id);
          return res !== null;
        } catch {
          return false;
        }
      } else {
        const initialLen = localDbCache.certificates.length;
        localDbCache.certificates = localDbCache.certificates.filter(c => c.id !== id);
        if (localDbCache.certificates.length !== initialLen) {
          saveLocalDb();
          return true;
        }
        return false;
      }
    }
  },

  // Contact Messages
  messages: {
    async getAll(): Promise<IContactMessage[]> {
      if (dbMode === "mongodb") {
        const docs = await MongoContact.find().sort({ createdAt: -1 });
        return docs.map(doc => ({
          id: doc._id.toString(),
          name: doc.name,
          email: doc.email,
          subject: doc.subject,
          message: doc.message,
          date: doc.date
        }));
      } else {
        return localDbCache.messages;
      }
    },

    async create(data: Omit<IContactMessage, "id" | "date">): Promise<IContactMessage> {
      const date = new Date().toISOString().split("T")[0];
      if (dbMode === "mongodb") {
        const doc = await MongoContact.create({ ...data, date });
        return {
          id: doc._id.toString(),
          name: doc.name,
          email: doc.email,
          subject: doc.subject,
          message: doc.message,
          date: doc.date
        };
      } else {
        const newMessage: IContactMessage = {
          ...data,
          date,
          id: "msg_" + Math.random().toString(36).substr(2, 9)
        };
        localDbCache.messages.unshift(newMessage);
        saveLocalDb();
        return newMessage;
      }
    },

    async delete(id: string): Promise<boolean> {
      if (dbMode === "mongodb") {
        try {
          const res = await MongoContact.findByIdAndDelete(id);
          return res !== null;
        } catch {
          return false;
        }
      } else {
        const initialLen = localDbCache.messages.length;
        localDbCache.messages = localDbCache.messages.filter(m => m.id !== id);
        if (localDbCache.messages.length !== initialLen) {
          saveLocalDb();
          return true;
        }
        return false;
      }
    }
  },

  // Admin authentication
  admins: {
    async getByUsername(username: string): Promise<IAdminUser | null> {
      if (dbMode === "mongodb") {
        const doc = await MongoAdmin.findOne({ username });
        if (!doc) return null;
        return {
          username: doc.username,
          passwordHash: doc.passwordHash
        };
      } else {
        return localDbCache.admins.find(a => a.username === username) || null;
      }
    },

    async updatePassword(username: string, newPasswordPlain: string): Promise<boolean> {
      const passwordHash = await bcrypt.hash(newPasswordPlain, 10);
      if (dbMode === "mongodb") {
        const res = await MongoAdmin.findOneAndUpdate({ username }, { passwordHash });
        return res !== null;
      } else {
        const admin = localDbCache.admins.find(a => a.username === username);
        if (!admin) return false;
        admin.passwordHash = passwordHash;
        saveLocalDb();
        return true;
      }
    }
  },

  settings: {
    async get(): Promise<any> {
      if (dbMode === "mongodb") {
        const doc = await MongoSettings.findOne({ key: "profile_settings" });
        return doc ? doc.value : defaultSettings;
      } else {
        return localDbCache.settings || defaultSettings;
      }
    },

    async update(value: any): Promise<any> {
      if (dbMode === "mongodb") {
        const doc = await MongoSettings.findOneAndUpdate(
          { key: "profile_settings" },
          { value },
          { new: true, upsert: true }
        );
        return doc.value;
      } else {
        localDbCache.settings = value;
        saveLocalDb();
        return localDbCache.settings;
      }
    }
  }
};
