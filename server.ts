import express from "express";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const cleanSupabaseUrl = process.env.SUPABASE_URL
  ? process.env.SUPABASE_URL.replace(/\/rest\/v1\/?$/, '')
  : '';

const supabase = (cleanSupabaseUrl && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(cleanSupabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Run PHP version diagnostic
  try {
    const { execSync } = await import("child_process");
    const { writeFileSync } = await import("fs");
    const phpVer = execSync("php -v").toString();
    writeFileSync(path.join(process.cwd(), "php-status.txt"), "PHP IS INSTALLED:\n" + phpVer);
  } catch (e: any) {
    try {
      const { writeFileSync } = await import("fs");
      writeFileSync(path.join(process.cwd(), "php-status.txt"), "PHP NOT INSTALLED:\n" + e.message);
    } catch (fsErr) {
      console.error("FS error:", fsErr);
    }
  }

  app.use(express.json());

  // API routes
  app.get("/api/health", async (req, res) => {
    let phpVersion = "not found";
    try {
      const { execSync } = await import("child_process");
      phpVersion = execSync("php -v").toString();
    } catch (e: any) {
      phpVersion = "Error: " + e.message;
    }
    res.json({ status: "ok", phpVersion });
  });

  app.get("/api/audit_logs", async (req, res) => {
    if (!supabase) {
      res.json([]);
      return;
    }
    const { data: logs, error: logsError } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (logsError) {
      console.error('Error fetching audit logs:', logsError);
      res.status(500).json({ error: 'Failed to fetch logs' });
      return;
    }

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, fullname, email, role');

    const userMap = new Map();
    if (users) {
      users.forEach(u => userMap.set(u.id, u));
    }

    const mappedLogs = (logs || []).map(l => {
      const u = userMap.get(l.user_id);
      return {
        id: l.id,
        action_by: u ? `${u.fullname} (${u.email})` : (l.user_id || 'System'),
        role: u ? u.role : 'Admin',
        action: l.action,
        target_type: l.target_type,
        target_id: l.target_id,
        details: l.details,
        created_at: l.created_at
      };
    });

    res.json(mappedLogs);
  });

  app.post("/api/audit_logs", async (req, res) => {
    const { userId, action, targetType, targetId, details } = req.body;
    
    if (!supabase) {
      console.log(`[AuditLog - Fallback] User: ${userId}, Action: ${action}, Target: ${targetType} (${targetId}), Details: ${details}`);
      res.json({ success: true, message: 'Logged to console' });
      return;
    }

    const isValidUUID = (str: any) => {
      if (typeof str !== 'string') return false;
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    };
    const safeUserId = isValidUUID(userId) ? userId : '657229df-fb36-4978-bf94-4a52e04f7ae0';

    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: safeUserId,
        action,
        target_type: targetType,
        target_id: targetId,
        details
      });

    if (error) {
      console.error('Error inserting audit log:', error);
      res.status(500).json({ error: 'Failed to insert log' });
    } else {
      res.json({ success: true });
    }
  });

  app.post("/api/opportunities", (req, res) => {
    const { payload, userId } = req.body;
    // Log to audit_logs (simulated DB call for now)
    console.log(`[AuditLog] User: ${userId}, Action: Create Opportunity, Details: ${JSON.stringify(payload)}`);
    // ... proceed to save to DB ...
    res.json({ success: true, id: "new-id" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
