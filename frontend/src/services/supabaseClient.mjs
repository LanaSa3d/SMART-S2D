import { getAppConfig, hasSupabaseConfig } from "../config.mjs";

const SESSION_KEY = "smart-s2d.supabase.session";
const LOCAL_DB_KEY = "smart-s2d.local.database";

let client;

export function getSupabaseClient() {
  const config = getAppConfig();

  if (!config.localMode && !hasSupabaseConfig(config)) {
    throw new Error("Supabase is not configured. Create frontend/src/env.local.js first.");
  }

  if (!client) {
    client = config.localMode ? createLocalClient() : createSupabaseRestClient(config);
  }

  return client;
}

function createLocalClient() {
  return {
    auth: {
      async getSession() {
        return { data: { session: readSession() }, error: null };
      },
      async signUp({ email, password, options }) {
        const db = readLocalDb();
        const normalizedEmail = email.trim().toLowerCase();
        if (db.users.some((user) => user.email === normalizedEmail)) {
          return { data: null, error: { message: "An account with this email already exists." } };
        }
        const user = {
          id: crypto.randomUUID(),
          email: normalizedEmail,
          password_hash: await hashPassword(password),
          user_metadata: options?.data ?? {},
          created_at: new Date().toISOString(),
        };
        db.users.push(user);
        writeLocalDb(db);
        const session = createLocalSession(user);
        writeSession(session);
        return { data: { user: publicUser(user), session }, error: null };
      },
      async signInWithPassword({ email, password }) {
        const normalizedEmail = email.trim().toLowerCase();
        const user = readLocalDb().users.find((candidate) => candidate.email === normalizedEmail);
        if (!user || user.password_hash !== await hashPassword(password)) {
          return { data: null, error: { message: "Invalid email or password." } };
        }
        const session = createLocalSession(user);
        writeSession(session);
        return { data: { user: publicUser(user), session }, error: null };
      },
      async signOut() {
        clearSession();
        return { error: null };
      },
      async getUser() {
        return { data: { user: readSession()?.user ?? null }, error: null };
      },
    },
    from(table) {
      return createLocalQueryBuilder(table);
    },
    rpc(name, payload) {
      return executeLocalRpc(name, payload);
    },
  };
}

function createLocalQueryBuilder(table) {
  return {
    table,
    method: "GET",
    selectValue: "",
    filters: [],
    orderValue: null,
    body: null,
    upsertMode: false,
    singleResult: false,
    select(value = "*") { this.selectValue = value; return this; },
    eq(column, value) { this.filters.push({ column, value }); return this; },
    order(column, options = {}) { this.orderValue = { column, ascending: options.ascending !== false }; return this; },
    insert(payload) { this.method = "POST"; this.body = payload; return this; },
    upsert(payload) { this.method = "POST"; this.body = payload; this.upsertMode = true; return this; },
    update(payload) { this.method = "PATCH"; this.body = payload; return this; },
    delete() { this.method = "DELETE"; return this; },
    single() { this.singleResult = true; return this; },
    then(resolve, reject) { return executeLocalQuery(this).then(resolve, reject); },
  };
}

async function executeLocalQuery(query) {
  const db = readLocalDb();
  if (!Array.isArray(db[query.table])) db[query.table] = [];
  const table = db[query.table];
  const matches = (row) => query.filters.every(({ column, value }) => String(row[column]) === String(value));
  let rows = table.filter(matches);

  if (query.method === "POST") {
    const inputs = Array.isArray(query.body) ? query.body : [query.body];
    rows = inputs.map((input) => {
      const existingIndex = query.upsertMode && input.id ? table.findIndex((row) => row.id === input.id) : -1;
      const record = {
        id: input.id ?? crypto.randomUUID(),
        created_at: input.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...input,
      };
      if (existingIndex >= 0) table[existingIndex] = { ...table[existingIndex], ...record };
      else table.push(record);
      return existingIndex >= 0 ? table[existingIndex] : record;
    });
  } else if (query.method === "PATCH") {
    rows = rows.map((row) => {
      Object.assign(row, query.body, { updated_at: new Date().toISOString() });
      return row;
    });
  } else if (query.method === "DELETE") {
    const ids = new Set(rows.map((row) => row.id));
    db[query.table] = table.filter((row) => !ids.has(row.id));
  }

  if (query.method !== "DELETE") {
    rows = decorateLocalRelations(query.table, rows, db);
    if (query.orderValue) {
      const { column, ascending } = query.orderValue;
      rows.sort((a, b) => String(a[column] ?? "").localeCompare(String(b[column] ?? "")) * (ascending ? 1 : -1));
    }
  }
  writeLocalDb(db);
  return { data: query.singleResult ? rows[0] ?? null : rows, error: null };
}

function decorateLocalRelations(table, rows, db) {
  if (table !== "organization_members") return rows.map((row) => ({ ...row }));
  return rows.map((row) => ({
    ...row,
    organizations: db.organizations.find((organization) => organization.id === row.organization_id) ?? null,
    profiles: db.profiles.find((profile) => profile.id === row.user_id) ?? null,
  }));
}

async function executeLocalRpc(name, payload) {
  const db = readLocalDb();
  const user = readSession()?.user;
  if (!user) return { data: null, error: { message: "You must be signed in to continue." } };

  if (name === "join_organization_by_code") {
    const organization = db.organizations.find((item) => item.invite_code === payload.join_code);
    if (!organization) return { data: null, error: { message: "Invite code not found." } };
    if (!db.organization_members.some((member) => member.organization_id === organization.id && member.user_id === user.id)) {
      db.organization_members.push(localRecord({ organization_id: organization.id, user_id: user.id, role: "Software User" }));
    }
    writeLocalDb(db);
    return { data: [{ ...organization, role: "Software User" }], error: null };
  }
  if (name === "regenerate_organization_invite_code") {
    const organization = db.organizations.find((item) => item.id === payload.org_id);
    if (!organization) return { data: null, error: { message: "Company not found." } };
    organization.invite_code = payload.next_code;
    writeLocalDb(db);
    return { data: organization.invite_code, error: null };
  }
  if (name === "add_organization_member_by_email") {
    const profile = db.profiles.find((item) => item.email.toLowerCase() === payload.member_email.toLowerCase());
    if (!profile) return { data: null, error: { message: "No local account uses that email." } };
    if (!db.organization_members.some((member) => member.organization_id === payload.org_id && member.user_id === profile.id)) {
      db.organization_members.push(localRecord({ organization_id: payload.org_id, user_id: profile.id, role: payload.member_role }));
    }
    writeLocalDb(db);
    return { data: true, error: null };
  }
  return { data: null, error: { message: `Unsupported local operation: ${name}` } };
}

function readLocalDb() {
  const empty = { users: [], profiles: [], organizations: [], organization_members: [], projects: [], requirements: [], reports: [], audit_logs: [] };
  try { return { ...empty, ...JSON.parse(localStorage.getItem(LOCAL_DB_KEY) || "{}") }; }
  catch { return empty; }
}

function writeLocalDb(db) { localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db)); }
function localRecord(payload) { return { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...payload }; }
function publicUser(user) { const { password_hash, ...safeUser } = user; return safeUser; }
function createLocalSession(user) { return { access_token: `local-${crypto.randomUUID()}`, user: publicUser(user) }; }
async function hashPassword(password) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function createSupabaseRestClient(config) {
  const baseUrl = config.supabaseUrl.replace(/\/$/, "");

  return {
    auth: {
      async getSession() {
        return { data: { session: readSession() }, error: null };
      },

      async signInWithPassword({ email, password }) {
        return authRequest(baseUrl, config.supabaseAnonKey, "/auth/v1/token?grant_type=password", {
          method: "POST",
          body: { email, password },
          storeSession: true,
        });
      },

      async signUp({ email, password, options }) {
        return authRequest(baseUrl, config.supabaseAnonKey, "/auth/v1/signup", {
          method: "POST",
          body: {
            email,
            password,
            data: options?.data ?? {},
          },
          storeSession: true,
        });
      },

      async signOut() {
        const session = readSession();
        const response = await fetch(`${baseUrl}/auth/v1/logout`, {
          method: "POST",
          headers: authHeaders(config.supabaseAnonKey, session?.access_token),
        });
        clearSession();
        if (!response.ok) return { error: await readError(response) };
        return { error: null };
      },

      async getUser() {
        const session = readSession();
        if (!session?.access_token) return { data: { user: null }, error: null };

        const response = await fetch(`${baseUrl}/auth/v1/user`, {
          headers: authHeaders(config.supabaseAnonKey, session.access_token),
        });
        if (!response.ok) return { data: { user: null }, error: await readError(response) };
        return { data: { user: await response.json() }, error: null };
      },
    },

    from(table) {
      return createQueryBuilder(baseUrl, config.supabaseAnonKey, table);
    },

    rpc(name, payload) {
      return rpcRequest(baseUrl, config.supabaseAnonKey, name, payload);
    },
  };
}

function createQueryBuilder(baseUrl, anonKey, table) {
  const query = {
    table,
    method: "GET",
    selectValue: "",
    filters: [],
    orderValue: "",
    body: null,
    returnRepresentation: false,
    singleResult: false,

    select(value = "*") {
      this.selectValue = value;
      this.returnRepresentation = true;
      return this;
    },

    eq(column, value) {
      this.filters.push(`${encodeURIComponent(column)}=eq.${encodeURIComponent(value)}`);
      return this;
    },

    order(column, options = {}) {
      const direction = options.ascending === false ? "desc" : "asc";
      this.orderValue = `${encodeURIComponent(column)}.${direction}`;
      return this;
    },

    insert(payload) {
      this.method = "POST";
      this.body = payload;
      return this;
    },

    upsert(payload) {
      this.method = "POST";
      this.body = payload;
      this.upsertMode = true;
      return this;
    },

    update(payload) {
      this.method = "PATCH";
      this.body = payload;
      return this;
    },

    delete() {
      this.method = "DELETE";
      return this;
    },

    single() {
      this.singleResult = true;
      return this;
    },

    then(resolve, reject) {
      return executeQuery(baseUrl, anonKey, this).then(resolve, reject);
    },
  };

  return query;
}

async function executeQuery(baseUrl, anonKey, query) {
  const session = readSession();
  const params = [];

  if (query.selectValue) params.push(`select=${encodeURIComponent(query.selectValue)}`);
  if (query.filters.length) params.push(...query.filters);
  if (query.orderValue) params.push(`order=${query.orderValue}`);

  const url = `${baseUrl}/rest/v1/${query.table}${params.length ? `?${params.join("&")}` : ""}`;
  const headers = {
    ...authHeaders(anonKey, session?.access_token),
    "Content-Type": "application/json",
  };

  if (query.returnRepresentation) {
    headers.Prefer = query.upsertMode
      ? "resolution=merge-duplicates,return=representation"
      : "return=representation";
  }

  const response = await fetch(url, {
    method: query.method,
    headers,
    body: query.body ? JSON.stringify(query.body) : undefined,
  });

  if (!response.ok) return { data: null, error: await readError(response) };
  if (response.status === 204) return { data: null, error: null };

  const data = await response.json();
  return {
    data: query.singleResult ? data?.[0] ?? null : data,
    error: null,
  };
}

async function rpcRequest(baseUrl, anonKey, name, payload) {
  const session = readSession();
  const response = await fetch(`${baseUrl}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      ...authHeaders(anonKey, session?.access_token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload ?? {}),
  });

  if (!response.ok) return { data: null, error: await readError(response) };
  return { data: await response.json(), error: null };
}

async function authRequest(baseUrl, anonKey, path, options) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method,
    headers: {
      ...authHeaders(anonKey),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(options.body),
  });

  if (!response.ok) return { data: null, error: await readError(response) };

  const data = await response.json();
  if (options.storeSession && data.access_token) {
    const session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
      expires_at: data.expires_in ? Math.floor(Date.now() / 1000) + data.expires_in : undefined,
      user: data.user,
    };
    writeSession(session);
    return { data: { ...data, session }, error: null };
  }

  return { data, error: null };
}

function authHeaders(anonKey, accessToken) {
  return {
    apikey: anonKey,
    Authorization: `Bearer ${accessToken || anonKey}`,
  };
}

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session.expires_at && session.expires_at <= Math.floor(Date.now() / 1000)) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    clearSession();
    return null;
  }
}

function writeSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

async function readError(response) {
  try {
    const data = await response.json();
    return {
      message:
        data.msg ||
        data.message ||
        data.error_description ||
        data.error ||
        `Supabase request failed with ${response.status}.`,
    };
  } catch {
    return { message: `Supabase request failed with ${response.status}.` };
  }
}
