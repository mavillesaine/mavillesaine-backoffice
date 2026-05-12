// ============================================================
// MAVILLESAINE — Back-office Superviseur (React Web)
// Architecture : Supabase Auth direct (sans backend Railway)
// ============================================================
// DÉPLOIEMENT :
//   1. Remplace src/App.js par ce fichier dans mavillesaine-backoffice
//   2. npm install @supabase/supabase-js
//   3. git add . && git commit -m "migrate to supabase direct" && git push
//   Vercel redéploie automatiquement
// ============================================================

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import toast, { Toaster } from "react-hot-toast";

// ── Config Supabase ───────────────────────────────────────────
const SUPABASE_URL  = "https://yemtwkylcankpopwrpav.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllbXR3a3lsY2Fua3BvcHdycGF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNTY3NDEsImV4cCI6MjA5MzgzMjc0MX0.yHopBYugcAjOxdt7HeMcRlK7xnrW5rur0_7A9sWeJ_E";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ── Constantes ────────────────────────────────────────────────
const CATEGORIES = [
  { id:"voirie",    label:"Voirie",         icon:"🛣️", color:"#e05c00" },
  { id:"proprete",  label:"Propreté",        icon:"🗑️", color:"#2a9d3a" },
  { id:"mobilier",  label:"Mobilier urbain", icon:"🪑", color:"#2563eb" },
  { id:"eclairage", label:"Éclairage",       icon:"💡", color:"#d4a000" },
  { id:"graffiti",  label:"Graffiti",        icon:"🖌️", color:"#9333ea" },
  { id:"autre",     label:"Autre",           icon:"📍", color:"#64748b" },
];

const URGENCES = {
  normal:    { label:"Normal",    icon:"🟢", color:"#16a34a", bg:"#f0fdf4", border:"#86efac" },
  genant:    { label:"Gênant",    icon:"🟡", color:"#b45309", bg:"#fffbeb", border:"#fcd34d" },
  dangereux: { label:"Dangereux", icon:"🔴", color:"#dc2626", bg:"#fef2f2", border:"#fca5a5" },
};

const STATUTS = {
  recu:     { label:"Reçu",     color:"#64748b", bg:"#f1f5f9", dot:"#94a3b8" },
  en_cours: { label:"En cours", color:"#b45309", bg:"#fffbeb", dot:"#f59e0b" },
  resolu:   { label:"Résolu",   color:"#16a34a", bg:"#f0fdf4", dot:"#22c55e" },
};

const G = {
  vert:"#1a6b3c", vertClair:"#e8f5ee",
  g50:"#f8fafc", g100:"#f1f5f9", g200:"#e2e8f0",
  g400:"#94a3b8", g500:"#64748b", g700:"#334155", g900:"#0f172a",
};

// ── Composants UI ─────────────────────────────────────────────
function Badge({ statut }) {
  const s = STATUTS[statut] || STATUTS.recu;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px",
      borderRadius:20, background:s.bg, color:s.color, fontSize:12, fontWeight:600, whiteSpace:"nowrap" }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:s.dot, display:"inline-block" }}/>
      {s.label}
    </span>
  );
}

function BadgeUrgence({ urgence }) {
  const u = URGENCES[urgence] || URGENCES.normal;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 8px",
      borderRadius:20, background:u.bg, color:u.color, fontSize:11, fontWeight:700,
      border:`1px solid ${u.border}`, whiteSpace:"nowrap" }}>
      {u.icon} {u.label}
    </span>
  );
}

function CatIcon({ id, size=36 }) {
  const cat = CATEGORIES.find(c=>c.id===id) || CATEGORIES[5];
  return (
    <div style={{ width:size, height:size, borderRadius:size*0.28, background:cat.color+"22",
      display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*0.46, flexShrink:0 }}>
      {cat.icon}
    </div>
  );
}

// ── Écran LOGIN ───────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      // 1. Auth Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw new Error("Identifiants incorrects");

      // 2. Récupérer le profil superviseur
      const { data: sup, error: supError } = await supabase
        .from("superviseurs")
        .select("id, nom, email, role, commune_id, actif, communes(nom, couleur)")
        .eq("id", authData.user.id)
        .single();

      if (supError || !sup) throw new Error("Compte superviseur introuvable");
      if (!sup.actif) throw new Error("Compte désactivé — contactez l'administrateur");

      onLogin(sup);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(135deg,${G.g900},#1a3a2a)`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"'Outfit',system-ui,sans-serif" }}>
      <div style={{ background:"#fff", borderRadius:20, padding:"40px 36px", width:380,
        boxShadow:"0 24px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ width:52, height:52, background:G.vert, borderRadius:14,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, margin:"0 auto 12px" }}>🏙️</div>
          <div style={{ fontSize:22, fontWeight:800, color:G.g900 }}>MaVilleSaine</div>
          <div style={{ fontSize:13, color:G.g500, marginTop:4 }}>Espace superviseur</div>
        </div>
        {error && (
          <div style={{ background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:10,
            padding:"10px 14px", marginBottom:18, fontSize:13, color:"#dc2626" }}>
            ⚠️ {error}
          </div>
        )}
        <form onSubmit={handleLogin}>
          {[
            { label:"Email",        type:"email",    val:email,    set:setEmail,    ph:"superviseur@mairie.fr" },
            { label:"Mot de passe", type:"password", val:password, set:setPassword, ph:"••••••••" },
          ].map(f => (
            <div key={f.label} style={{ marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:600, color:G.g700, marginBottom:6 }}>{f.label}</div>
              <input type={f.type} value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph}
                style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:`2px solid ${G.g200}`,
                  fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}
                onFocus={e=>e.target.style.borderColor=G.vert}
                onBlur={e=>e.target.style.borderColor=G.g200}
              />
            </div>
          ))}
          <button type="submit" disabled={loading || !email || !password}
            style={{ width:"100%", padding:"14px", borderRadius:12, border:"none",
              background:loading||!email||!password?G.g200:G.vert,
              color:loading||!email||!password?G.g400:"#fff",
              fontSize:15, fontWeight:700, cursor:loading?"wait":"pointer" }}>
            {loading ? "Connexion…" : "Se connecter →"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Modal TECHNICIENS ─────────────────────────────────────────
function ModalTechniciens({ communeId, techniciens, setTechniciens, onClose }) {
  const [form, setForm]     = useState({ nom:"", specialite:"", telephone:"", email:"", couleur:"#2563eb" });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const couleurs = ["#e05c00","#2a9d3a","#2563eb","#9333ea","#d4a000","#0891b2","#dc2626","#64748b"];

  const handleSave = async () => {
    if (!form.nom.trim()) return;
    setLoading(true);
    try {
      if (editId) {
        const { data, error } = await supabase
          .from("techniciens")
          .update({ ...form })
          .eq("id", editId)
          .select()
          .single();
        if (error) throw error;
        setTechniciens(p => p.map(t => t.id===editId ? data : t));
        setEditId(null);
      } else {
        const { data, error } = await supabase
          .from("techniciens")
          .insert([{ ...form, commune_id: communeId }])
          .select()
          .single();
        if (error) throw error;
        setTechniciens(p => [...p, data]);
      }
      setForm({ nom:"", specialite:"", telephone:"", email:"", couleur:"#2563eb" });
      toast.success(editId ? "Technicien modifié" : "Technicien ajouté");
    } catch (err) {
      toast.error("Erreur : " + err.message);
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce technicien ?")) return;
    try {
      const { error } = await supabase.from("techniciens").delete().eq("id", id);
      if (error) throw error;
      setTechniciens(p => p.filter(t => t.id!==id));
      toast.success("Technicien supprimé");
    } catch (err) { toast.error("Erreur : " + err.message); }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:500,
      display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(3px)" }}>
      <div style={{ background:"#fff", borderRadius:20, width:560, maxHeight:"88vh",
        overflowY:"auto", boxShadow:"0 32px 80px rgba(0,0,0,0.3)" }}>
        <div style={{ background:G.g900, borderRadius:"20px 20px 0 0", padding:"18px 24px",
          display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:16, fontWeight:800, color:"#fff" }}>👷 Gestion des techniciens</div>
          <div onClick={onClose} style={{ color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:20 }}>✕</div>
        </div>
        <div style={{ padding:22 }}>
          <div style={{ background:G.g50, borderRadius:14, padding:18, marginBottom:20, border:`1px solid ${G.g200}` }}>
            <div style={{ fontSize:14, fontWeight:700, color:G.g900, marginBottom:14 }}>
              {editId ? "✏️ Modifier" : "➕ Ajouter un technicien"}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
              {[
                { l:"Nom complet *", k:"nom",        p:"Jean Dupont" },
                { l:"Spécialité",    k:"specialite", p:"Voirie & Signalisation" },
                { l:"Téléphone",     k:"telephone",  p:"06 00 00 00 00" },
                { l:"Email",         k:"email",      p:"j.dupont@mairie.fr" },
              ].map(f => (
                <div key={f.k}>
                  <div style={{ fontSize:12, fontWeight:600, color:G.g700, marginBottom:5 }}>{f.l}</div>
                  <input value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))}
                    placeholder={f.p}
                    style={{ width:"100%", padding:"10px 12px", borderRadius:9, border:`2px solid ${G.g200}`,
                      fontSize:13, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}
                    onFocus={e=>e.target.style.borderColor=G.vert}
                    onBlur={e=>e.target.style.borderColor=G.g200}
                  />
                </div>
              ))}
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:12, fontWeight:600, color:G.g700, marginBottom:8 }}>Couleur avatar</div>
              <div style={{ display:"flex", gap:8 }}>
                {couleurs.map(c => (
                  <div key={c} onClick={()=>setForm(p=>({...p,couleur:c}))}
                    style={{ width:28, height:28, borderRadius:"50%", background:c, cursor:"pointer",
                      border:`3px solid ${form.couleur===c?"#0f172a":"transparent"}`, boxSizing:"border-box" }}/>
                ))}
              </div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={handleSave} disabled={!form.nom.trim()||loading}
                style={{ flex:2, padding:"12px", borderRadius:10, border:"none",
                  background:form.nom.trim()&&!loading?G.vert:G.g200,
                  color:form.nom.trim()&&!loading?"#fff":G.g400,
                  fontSize:13, fontWeight:700, cursor:form.nom.trim()&&!loading?"pointer":"not-allowed" }}>
                {loading ? "…" : editId ? "✓ Enregistrer" : "➕ Ajouter"}
              </button>
              {editId && (
                <button onClick={()=>{setEditId(null);setForm({nom:"",specialite:"",telephone:"",email:"",couleur:"#2563eb"});}}
                  style={{ flex:1, padding:"12px", borderRadius:10, border:`2px solid ${G.g200}`,
                    background:"#fff", color:G.g700, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                  Annuler
                </button>
              )}
            </div>
          </div>
          <div style={{ fontSize:14, fontWeight:700, color:G.g900, marginBottom:12 }}>
            Techniciens ({techniciens.length})
          </div>
          {techniciens.length === 0 && (
            <div style={{ textAlign:"center", padding:"24px", color:G.g400, fontSize:13 }}>
              Aucun technicien — ajoutez-en un ci-dessus
            </div>
          )}
          {techniciens.map(t => (
            <div key={t.id} style={{ background:"#fff", borderRadius:12, padding:"13px 14px",
              marginBottom:10, border:`1px solid ${G.g200}`, display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:40, height:40, background:t.couleur||"#64748b", borderRadius:12,
                display:"flex", alignItems:"center", justifyContent:"center",
                color:"#fff", fontSize:16, fontWeight:800, flexShrink:0 }}>
                {t.nom?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:700, color:G.g900 }}>{t.nom}</div>
                {t.specialite && <div style={{ fontSize:12, color:G.g500 }}>{t.specialite}</div>}
                <div style={{ fontSize:11, color:G.g400 }}>{[t.telephone,t.email].filter(Boolean).join(" · ")}</div>
              </div>
              <div style={{ display:"flex", gap:6 }}>
                <button onClick={()=>{setEditId(t.id);setForm({nom:t.nom,specialite:t.specialite||"",telephone:t.telephone||"",email:t.email||"",couleur:t.couleur||"#2563eb"});}}
                  style={{ padding:"6px 12px", borderRadius:8, border:`1px solid ${G.g200}`,
                    background:"#fff", color:G.g700, fontSize:12, fontWeight:600, cursor:"pointer" }}>✏️</button>
                <button onClick={()=>handleDelete(t.id)}
                  style={{ padding:"6px 12px", borderRadius:8, border:"1px solid #fca5a5",
                    background:"#fef2f2", color:"#dc2626", fontSize:12, fontWeight:600, cursor:"pointer" }}>🗑️</button>
              </div>
            </div>
          ))}
          <button onClick={onClose}
            style={{ width:"100%", padding:"14px", borderRadius:12, border:"none",
              background:G.g900, color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", marginTop:8 }}>
            ✓ Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Panneau DÉTAIL ────────────────────────────────────────────
function PanneauDetail({ sig, techniciens, onClose, onUpdate }) {
  const [telLibre, setTelLibre]         = useState("");
  const [modeEnvoi, setModeEnvoi]       = useState("tech");
  const [selectedTech, setSelectedTech] = useState(null);
  const [showEnvoi, setShowEnvoi]       = useState(false);
  const [loadingStatut, setLoadingStatut] = useState(false);
  const [loadingPDF, setLoadingPDF]     = useState(false);

  const cat = CATEGORIES.find(c=>c.id===sig.categorie) || CATEGORIES[5];
  const urg = URGENCES[sig.urgence] || URGENCES.normal;

  const updateStatut = async (statut) => {
    setLoadingStatut(true);
    try {
      const { data, error } = await supabase
        .from("signalements")
        .update({ statut, updated_at: new Date().toISOString() })
        .eq("id", sig.id)
        .select()
        .single();
      if (error) throw error;
      onUpdate(data);
      toast.success(`Statut : ${STATUTS[statut].label}`);

      // Notifier le citoyen via push si token disponible
      if (sig.expo_push_token) {
        const messages = {
          en_cours: { title:"🔧 Signalement pris en charge", body:`Votre signalement ${sig.ref} est en cours de traitement.` },
          resolu:   { title:"✅ Signalement résolu !", body:`Votre signalement ${sig.ref} a été résolu. Merci !` },
        };
        if (messages[statut]) {
          fetch("https://exp.host/--/api/v2/push/send", {
            method:"POST",
            headers:{ "Content-Type":"application/json" },
            body: JSON.stringify({ to: sig.expo_push_token, ...messages[statut] })
          }).catch(() => {});
        }
      }
    } catch (err) { toast.error("Erreur : " + err.message); }
    finally { setLoadingStatut(false); }
  };

  const updateUrgence = async (urgence) => {
    try {
      const { data, error } = await supabase
        .from("signalements")
        .update({ urgence })
        .eq("id", sig.id)
        .select()
        .single();
      if (error) throw error;
      onUpdate(data);
      toast.success("Urgence mise à jour");
    } catch (err) { toast.error("Erreur : " + err.message); }
  };

  const genererPDF = async () => {
    setLoadingPDF(true);
    try {
      const tech = selectedTech || techniciens.find(t=>t.id===sig.technicien_id);
      const urgColors = { normal:"#16a34a", genant:"#b45309", dangereux:"#dc2626" };
      const urgColor  = urgColors[sig.urgence] || urgColors.normal;

      const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<title>Bon d'intervention ${sig.ref||""}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Outfit',sans-serif; background:#fff; color:#0f172a; font-size:13px; }
  @media print {
    body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    .no-print { display:none !important; }
    @page { margin:10mm; size:A4; }
  }

  .header { background:#0f172a; color:#fff; padding:20px 24px; display:flex; justify-content:space-between; align-items:flex-start; border-radius:0 0 0 0; }
  .header-left h1 { font-size:22px; font-weight:900; color:#fff; }
  .header-left p  { font-size:11px; color:#86efac; margin-top:3px; }
  .header-left small { font-size:10px; color:#94a3b8; }
  .header-right { text-align:right; }
  .ref { font-size:18px; font-weight:900; color:#fff; }
  .date { font-size:10px; color:#94a3b8; margin-top:4px; }

  .body { padding:20px 24px; }

  .urgence-badge { display:inline-block; background:${urgColor}; color:#fff; font-size:11px; font-weight:700; padding:5px 14px; border-radius:20px; margin-bottom:16px; letter-spacing:0.5px; }

  .section { background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px 16px; margin-bottom:14px; }
  .section-title { font-size:9px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:8px; }
  .section-value { font-size:14px; font-weight:700; color:#0f172a; }
  .section-meta  { font-size:11px; color:#64748b; margin-top:4px; }

  .photos { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px; }
  .photo-box { border-radius:10px; overflow:hidden; border:1px solid #e2e8f0; position:relative; }
  .photo-box img { width:100%; height:180px; object-fit:cover; display:block; }
  .photo-label { background:rgba(0,0,0,0.6); color:#fff; font-size:11px; font-weight:600; padding:6px 10px; }
  .photo-placeholder { height:180px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; color:#94a3b8; font-size:12px; }

  .tech-box { background:#e8f5ee; border:1px solid #86efac; border-radius:10px; padding:14px 16px; margin-bottom:14px; }
  .tech-name { font-size:16px; font-weight:800; color:#0f172a; margin-bottom:4px; }
  .tech-meta  { font-size:12px; color:#64748b; }

  .actions { border:1px solid #e2e8f0; border-radius:10px; padding:14px 16px; margin-bottom:14px; }
  .action-item { font-size:12px; color:#334155; margin-bottom:6px; display:flex; align-items:center; gap:8px; }
  .checkbox { width:14px; height:14px; border:2px solid #94a3b8; border-radius:3px; display:inline-block; flex-shrink:0; }

  .signatures { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:14px; }
  .sig-box { border:1px solid #e2e8f0; border-radius:8px; padding:12px; }
  .sig-title { font-size:9px; font-weight:700; color:#94a3b8; text-transform:uppercase; margin-bottom:24px; }
  .sig-line  { border-top:1px solid #cbd5e1; margin-top:8px; }

  .footer { background:#0f172a; color:#64748b; font-size:10px; text-align:center; padding:10px; border-radius:0; }

  .print-btn { position:fixed; bottom:24px; right:24px; background:#1a6b3c; color:#fff; border:none; padding:14px 24px; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; font-family:'Outfit',sans-serif; box-shadow:0 4px 16px rgba(26,107,60,0.4); }
  .print-btn:hover { background:#155c33; }
</style>
</head>
<body>

<div class="header">
  <div class="header-left">
    <h1>🏙️ MaVilleSaine</h1>
    <p>BON D'INTERVENTION TECHNIQUE</p>
    <small>Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</small>
  </div>
  <div class="header-right">
    <div class="ref">${sig.ref||""}</div>
    <div class="date">Signalement du ${sig.created_at?.slice(0,10)||""}</div>
  </div>
</div>

<div class="body">

  <div class="urgence-badge">⚡ URGENCE : ${urg.label.toUpperCase()}</div>

  <div class="section">
    <div class="section-title">📍 Localisation</div>
    <div class="section-value">${sig.adresse||"Coordonnées GPS"}</div>
    <div class="section-meta">
      Catégorie : ${cat.label} &nbsp;·&nbsp; Date : ${sig.created_at?.slice(0,10)||""} &nbsp;·&nbsp; Confirmations : ${sig.votes||0}
      ${sig.latitude ? `<br/>GPS : ${sig.latitude}, ${sig.longitude}` : ""}
    </div>
  </div>

  ${sig.description ? `
  <div class="section">
    <div class="section-title">💬 Description</div>
    <div class="section-meta" style="font-size:13px;color:#334155;">${sig.description}</div>
  </div>` : ""}

  <div class="section-title" style="margin-bottom:8px;">📸 Photos</div>
  <div class="photos">
    <div class="photo-box">
      ${sig.photo_detail_url
        ? `<img src="${sig.photo_detail_url}" alt="Photo détail"/>`
        : `<div class="photo-placeholder">📷 Photo non disponible</div>`}
      <div class="photo-label">Photo détail</div>
    </div>
    <div class="photo-box">
      ${sig.photo_large_url
        ? `<img src="${sig.photo_large_url}" alt="Vue large"/>`
        : `<div class="photo-placeholder">📷 Photo non disponible</div>`}
      <div class="photo-label">Vue d'ensemble</div>
    </div>
  </div>

  ${tech ? `
  <div class="tech-box">
    <div class="section-title">👷 Technicien assigné</div>
    <div class="tech-name">${tech.nom}</div>
    <div class="tech-meta">
      ${tech.specialite ? `${tech.specialite} &nbsp;·&nbsp; ` : ""}
      ${[tech.telephone, tech.email].filter(Boolean).join(" · ")}
    </div>
  </div>` : ""}

  <div class="actions">
    <div class="section-title">✅ Actions à réaliser</div>
    ${["Vérifier et sécuriser le site","Réaliser les travaux nécessaires","Documenter l'intervention","Mettre à jour le statut dans MaVilleSaine"]
      .map(a=>`<div class="action-item"><span class="checkbox"></span>${a}</div>`).join("")}
  </div>

  <div class="signatures">
    ${["Superviseur","Technicien","Date d'intervention"].map(l=>`
    <div class="sig-box">
      <div class="sig-title">${l}</div>
      <div class="sig-line"></div>
    </div>`).join("")}
  </div>

</div>

<div class="footer">MaVilleSaine © 2026 · Document confidentiel · mavillesaine.fr</div>

<div class="no-print" id="actions-bar" style="position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:2px solid #e2e8f0;padding:12px 16px;display:flex;gap:8px;flex-wrap:wrap;justify-content:center;z-index:100;box-shadow:0 -4px 20px rgba(0,0,0,0.1);">
  <button id="btn-print" style="background:#0f172a;color:#fff;border:none;padding:10px 18px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;">🖨️ PDF</button>
  <button id="btn-email" style="background:#2563eb;color:#fff;border:none;padding:10px 18px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;">📧 Email</button>
  <button id="btn-sms" style="background:#16a34a;color:#fff;border:none;padding:10px 18px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;">💬 SMS</button>
  <button id="btn-whatsapp" style="background:#25D366;color:#fff;border:none;padding:10px 18px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;">WhatsApp</button>
  <button id="btn-copy" style="background:#64748b;color:#fff;border:none;padding:10px 18px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;">📋 Copier</button>
</div>
<div style="height:70px"></div>
<script type="text/javascript">
  var ref      = document.title.replace("Bon intervention ","");
  var adresse  = document.querySelector(".section-value") ? document.querySelector(".section-value").textContent : "";
  var msg      = "Bon intervention " + ref + " - Adresse : " + adresse + " - MaVilleSaine";

  document.getElementById("btn-print").onclick    = function(){ window.print(); };
  document.getElementById("btn-email").onclick    = function(){ window.location.href = "mailto:?subject=Bon+intervention+" + ref + "&body=" + encodeURIComponent(msg); };
  document.getElementById("btn-sms").onclick      = function(){ window.location.href = "sms:?body=" + encodeURIComponent(msg); };
  document.getElementById("btn-whatsapp").onclick = function(){ window.open("https://wa.me/?text=" + encodeURIComponent(msg)); };
  document.getElementById("btn-copy").onclick     = function(){ navigator.clipboard.writeText(msg).then(function(){ alert("Copie !"); }); };
${"<"}/script>

</body>
</html>`;

      const w = window.open("", "_blank");
      w.document.write(html);
      w.document.close();
      setShowEnvoi(true);
      toast.success("Bon d'intervention généré !");
    } catch(err) {
      toast.error("Erreur : " + err.message);
    } finally { setLoadingPDF(false); }
  };

  const destinataire = modeEnvoi==="tech" ? selectedTech : (telLibre ? { nom:null, tel:telLibre } : null);
  const msgTexte = `🔧 BON D'INTERVENTION ${sig.ref||""}\n📍 ${sig.adresse||""}\n🏷️ ${cat.label} — ${urg.label}\n📅 ${sig.created_at?.slice(0,10)||""}\n👷 ${destinataire?.nom||telLibre||"Non assigné"}\n📝 ${sig.description||"Aucune description"}\n🌐 MaVilleSaine`;
  const tel = (destinataire?.telephone||destinataire?.tel||"").replace(/\s/g,"").replace(/^0/,"+33");

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:200, backdropFilter:"blur(2px)" }}/>
      <div style={{ position:"fixed", top:0, right:0, bottom:0, width:"min(700px,94vw)", background:"#fff",
        zIndex:201, display:"flex", flexDirection:"column", boxShadow:"-8px 0 40px rgba(0,0,0,0.2)",
        fontFamily:"'Outfit',system-ui,sans-serif" }}>

        <div style={{ background:G.g900, padding:"18px 24px", display:"flex", alignItems:"center", gap:14, flexShrink:0 }}>
          <div style={{ width:46, height:46, background:cat.color+"22", borderRadius:12,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>{cat.icon}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:17, fontWeight:800, color:"#fff" }}>{cat.label}</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {sig.ref} · {sig.adresse}
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:5, alignItems:"flex-end", flexShrink:0 }}>
            <BadgeUrgence urgence={sig.urgence}/>
            <Badge statut={sig.statut}/>
          </div>
          <div onClick={onClose} style={{ color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:22, padding:"0 4px" }}>✕</div>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:24 }}>

          {/* Photos */}
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:12, color:G.g500, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5, marginBottom:10 }}>Photos</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              {[{url:sig.photo_detail_url,label:"Détail"},{url:sig.photo_large_url,label:"Vue large"}].map((p,i)=>(
                <div key={i} style={{ position:"relative", borderRadius:14, overflow:"hidden", height:190, background:G.g100, border:`1px solid ${G.g200}` }}>
                  {p.url
                    ? <img src={p.url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                    : <div style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8 }}>
                        <span style={{ fontSize:32 }}>📷</span>
                        <span style={{ fontSize:12, color:G.g400, fontWeight:600 }}>{p.label}</span>
                      </div>
                  }
                  <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"rgba(0,0,0,0.55)", color:"#fff", fontSize:12, padding:"7px 12px", fontWeight:600 }}>{p.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Infos */}
          <div style={{ background:G.g50, borderRadius:14, padding:18, marginBottom:22, border:`1px solid ${G.g200}` }}>
            <div style={{ fontSize:12, color:G.g500, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5, marginBottom:14 }}>Informations</div>
            {[
              {icon:"📍",label:"Adresse",       value:sig.adresse||"—"},
              {icon:"📅",label:"Date",           value:sig.created_at ? `${sig.created_at.slice(0,10)} à ${sig.created_at.slice(11,16)}` : "—"},
              {icon:"🧭",label:"GPS",            value:sig.latitude ? `${sig.latitude}°N · ${sig.longitude}°E` : "—"},
              {icon:"👍",label:"Confirmations",  value:`${sig.votes||0} citoyen${(sig.votes||0)>1?"s":""}${(sig.votes||0)>=5?" — ⚠️ Priorité haute":""}`},
            ].map((it,i)=>(
              <div key={i} style={{ display:"flex", gap:12, marginBottom:i<3?12:0 }}>
                <span style={{ fontSize:16, width:22, flexShrink:0, marginTop:2 }}>{it.icon}</span>
                <div>
                  <div style={{ fontSize:11, color:G.g400, fontWeight:600, textTransform:"uppercase" }}>{it.label}</div>
                  <div style={{ fontSize:13, color:G.g700, marginTop:2 }}>{it.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Description */}
          {sig.description && (
            <div style={{ marginBottom:22 }}>
              <div style={{ fontSize:12, color:G.g500, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>Description</div>
              <div style={{ background:"#fff", borderRadius:12, padding:"14px 16px", border:`1px solid ${G.g200}`, borderLeft:`4px solid ${cat.color}`, fontSize:14, color:G.g700, lineHeight:1.7 }}>
                {sig.description}
              </div>
            </div>
          )}

          {/* Urgence */}
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:12, color:G.g500, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>Urgence</div>
            <div style={{ display:"flex", gap:10 }}>
              {Object.entries(URGENCES).map(([key,u])=>(
                <div key={key} onClick={()=>updateUrgence(key)}
                  style={{ flex:1, padding:"12px 8px", borderRadius:12, border:`2px solid ${sig.urgence===key?u.border:G.g200}`,
                    background:sig.urgence===key?u.bg:"#fff", cursor:"pointer", textAlign:"center" }}>
                  <div style={{ fontSize:22, marginBottom:4 }}>{u.icon}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:sig.urgence===key?u.color:G.g500 }}>{u.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Statut */}
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:12, color:G.g500, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>Statut</div>
            <div style={{ display:"flex", gap:10 }}>
              {Object.entries(STATUTS).map(([key,s])=>(
                <button key={key} onClick={()=>!loadingStatut&&updateStatut(key)}
                  style={{ flex:1, padding:"12px 8px", borderRadius:12, border:`2px solid ${sig.statut===key?s.dot:G.g200}`,
                    background:sig.statut===key?s.bg:"#fff", color:sig.statut===key?s.color:G.g500,
                    fontSize:13, fontWeight:700, cursor:"pointer" }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Technicien */}
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:12, color:G.g500, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5, marginBottom:12 }}>Assigner / Envoyer à</div>
            <div style={{ display:"flex", background:G.g100, borderRadius:10, padding:"3px", marginBottom:14 }}>
              {[["tech","👷 Technicien"],["libre","📱 Numéro libre"]].map(([id,label])=>(
                <div key={id} onClick={()=>setModeEnvoi(id)}
                  style={{ flex:1, padding:"8px", textAlign:"center", borderRadius:8, cursor:"pointer",
                    background:modeEnvoi===id?"#fff":"transparent", color:modeEnvoi===id?G.g900:G.g500,
                    fontSize:12, fontWeight:600, boxShadow:modeEnvoi===id?"0 1px 4px rgba(0,0,0,0.1)":"none" }}>
                  {label}
                </div>
              ))}
            </div>
            {modeEnvoi==="tech" && (
              techniciens.length===0
                ? <div style={{ background:"#fffbeb", borderRadius:12, padding:16, border:"1px solid #fcd34d", textAlign:"center", fontSize:13, color:"#92400e" }}>
                    Aucun technicien — ajoutez-en via "Techniciens"
                  </div>
                : <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {techniciens.map(t=>(
                      <div key={t.id} onClick={()=>setSelectedTech(selectedTech?.id===t.id?null:t)}
                        style={{ background:selectedTech?.id===t.id?G.vertClair:"#fff",
                          border:`2px solid ${selectedTech?.id===t.id?G.vert:G.g200}`,
                          borderRadius:12, padding:"13px 14px", display:"flex", alignItems:"center", gap:12, cursor:"pointer" }}>
                        <div style={{ width:40, height:40, background:selectedTech?.id===t.id?G.vert:(t.couleur||"#64748b"),
                          borderRadius:11, display:"flex", alignItems:"center", justifyContent:"center",
                          color:"#fff", fontSize:16, fontWeight:800, flexShrink:0 }}>
                          {t.nom?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:14, fontWeight:700, color:G.g900 }}>{t.nom}</div>
                          {t.specialite && <div style={{ fontSize:12, color:G.g500 }}>{t.specialite}</div>}
                          <div style={{ fontSize:11, color:G.g400 }}>{[t.telephone,t.email].filter(Boolean).join(" · ")}</div>
                        </div>
                        {selectedTech?.id===t.id && <div style={{ color:G.vert, fontSize:20 }}>✓</div>}
                      </div>
                    ))}
                  </div>
            )}
            {modeEnvoi==="libre" && (
              <div style={{ background:"#fff", borderRadius:12, padding:16, border:`1px solid ${G.g200}` }}>
                <div style={{ fontSize:13, fontWeight:600, color:G.g700, marginBottom:6 }}>Numéro de téléphone</div>
                <input type="tel" value={telLibre} onChange={e=>setTelLibre(e.target.value)} placeholder="06 00 00 00 00"
                  style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:`2px solid ${telLibre?G.vert:G.g200}`,
                    fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}/>
              </div>
            )}
          </div>
        </div>

        <div style={{ padding:"16px 24px", borderTop:`1px solid ${G.g200}`, background:"#fff", flexShrink:0 }}>
          <button onClick={genererPDF} disabled={loadingPDF}
            style={{ width:"100%", padding:16, borderRadius:14, border:"none",
              background:loadingPDF?G.g200:G.g900, color:loadingPDF?G.g400:"#fff",
              fontSize:15, fontWeight:700, cursor:loadingPDF?"wait":"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
            {loadingPDF ? "Génération…" : "🚧 Générer le bon d'intervention & Envoyer"}
          </button>
        </div>
      </div>

      {showEnvoi && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:1000,
          display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)" }}>
          <div style={{ background:"#fff", borderRadius:20, width:500, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 32px 80px rgba(0,0,0,0.4)" }}>
            <div style={{ background:G.g900, borderRadius:"20px 20px 0 0", padding:"18px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ fontSize:16, fontWeight:800, color:"#fff" }}>📤 Envoyer le bon</div>
              <div onClick={()=>setShowEnvoi(false)} style={{ color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:20 }}>✕</div>
            </div>
            <div style={{ padding:22 }}>
              <div style={{ background:G.vertClair, borderRadius:12, padding:14, border:"1px solid #86efac", marginBottom:18, display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontSize:24 }}>✅</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:G.vert }}>PDF généré</div>
                  <div style={{ fontSize:11, color:G.g500 }}>bon-intervention-{sig.ref}.pdf — téléchargé</div>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {[
                  {label:"Email",    icon:"📧", action:()=>window.open(`mailto:${destinataire?.email||""}?subject=Bon ${sig.ref}&body=${encodeURIComponent(msgTexte)}`)},
                  {label:"SMS",      icon:"💬", action:()=>window.open(`sms:${tel}?body=${encodeURIComponent(msgTexte)}`)},
                  {label:"WhatsApp", icon:"🟢", action:()=>window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msgTexte)}`)},
                  {label:"Copier",   icon:"📋", action:()=>{navigator.clipboard?.writeText(msgTexte);toast.success("Copié !");}},
                ].map(c=>(
                  <div key={c.label} onClick={c.action}
                    style={{ background:"#fff", border:`2px solid ${G.g200}`, borderRadius:12, padding:"12px 14px",
                      display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
                    <span style={{ fontSize:20 }}>{c.icon}</span>
                    <div style={{ fontSize:13, fontWeight:700, color:G.g900 }}>{c.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── APPLICATION PRINCIPALE ────────────────────────────────────
export default function BackOffice() {
  const [user, setUser]                   = useState(null);
  const [signalements, setSignalements]   = useState([]);
  const [techniciens, setTechniciens]     = useState([]);
  const [selected, setSelected]           = useState(null);
  const [filterStatut, setFilterStatut]   = useState("tous");
  const [filterCat, setFilterCat]         = useState("tous");
  const [filterUrgence, setFilterUrgence] = useState("tous");
  const [showTech, setShowTech]           = useState(false);
  const [loading, setLoading]             = useState(false);

  // Vérifier session au démarrage
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: sup } = await supabase
          .from("superviseurs")
          .select("id, nom, email, role, commune_id, actif, communes(nom, couleur)")
          .eq("id", session.user.id)
          .single();
        if (sup?.actif) setUser(sup);
        else supabase.auth.signOut();
      }
    });
  }, []);

  const charger = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Signalements filtrés par commune du superviseur
      let query = supabase
        .from("signalements")
        .select("*")
        .order("created_at", { ascending: false });

      if (user.role !== "admin") {
        query = query.eq("commune_id", user.commune_id);
      }

      const { data: sigs, error: sigError } = await query;
      if (sigError) throw sigError;
      setSignalements(sigs || []);

      // Techniciens de la commune
      const { data: techs } = await supabase
        .from("techniciens")
        .select("*")
        .eq("commune_id", user.commune_id);
      setTechniciens(techs || []);

    } catch (err) {
      toast.error("Erreur : " + err.message);
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { charger(); }, [charger]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSignalements([]);
  };

  if (!user) return <LoginScreen onLogin={u => setUser(u)} />;

  const filtered = signalements.filter(s=>
    (filterStatut==="tous"  || s.statut===filterStatut) &&
    (filterCat==="tous"     || s.categorie===filterCat) &&
    (filterUrgence==="tous" || s.urgence===filterUrgence)
  ).sort((a,b)=>{
    const scores={dangereux:3,genant:2,normal:1};
    if ((scores[b.urgence]||0)!==(scores[a.urgence]||0)) return (scores[b.urgence]||0)-(scores[a.urgence]||0);
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const selectedSig = signalements.find(s=>s.id===selected);

  // Stats
  const now = new Date();
  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const stats = {
    total:    signalements.length,
    recu:     signalements.filter(s=>s.statut==="recu").length,
    en_cours: signalements.filter(s=>s.statut==="en_cours").length,
    resolu:   signalements.filter(s=>s.statut==="resolu").length,
    danger:   signalements.filter(s=>s.urgence==="dangereux").length,
    ce_mois:  signalements.filter(s=>s.created_at>=debutMois).length,
  };

  const communeNom = user.communes?.nom || "Ma commune";
  const communeCouleur = user.communes?.couleur || G.vert;

  return (
    <div style={{ width:"100vw", height:"100vh", display:"flex", flexDirection:"column",
      fontFamily:"'Outfit','DM Sans',system-ui,sans-serif", background:G.g50, overflow:"hidden" }}>
      <Toaster position="top-right" />

      {/* Header */}
      <div style={{ background:G.g900, height:56, padding:"0 24px", display:"flex",
        alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:28, height:28, background:communeCouleur, borderRadius:8,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>🏙️</div>
          <span style={{ color:"#fff", fontWeight:800, fontSize:15 }}>MaVilleSaine</span>
          <span style={{ background:"rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.5)",
            fontSize:11, padding:"2px 8px", borderRadius:6 }}>Superviseur</span>
          <span style={{ background:communeCouleur+"33", color:communeCouleur,
            fontSize:11, padding:"2px 10px", borderRadius:6, fontWeight:700, border:`1px solid ${communeCouleur}55` }}>
            📍 {communeNom}
          </span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={()=>setShowTech(true)}
            style={{ background:"rgba(255,255,255,0.1)", color:"#fff", border:"1px solid rgba(255,255,255,0.2)",
              borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:600, cursor:"pointer" }}>
            👷 Techniciens ({techniciens.length})
          </button>
          <button onClick={charger} disabled={loading}
            style={{ background:"rgba(255,255,255,0.1)", color:"#fff", border:"1px solid rgba(255,255,255,0.2)",
              borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:600, cursor:"pointer" }}>
            {loading ? "…" : "🔄 Actualiser"}
          </button>
          <span style={{ color:"rgba(255,255,255,0.5)", fontSize:12 }}>{user.nom}</span>
          <button onClick={logout}
            style={{ background:"rgba(220,38,38,0.2)", color:"#fc8181", border:"1px solid rgba(220,38,38,0.3)",
              borderRadius:8, padding:"6px 12px", fontSize:12, fontWeight:600, cursor:"pointer" }}>
            Déconnexion
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ background:"#fff", padding:"10px 20px", display:"flex", gap:10,
        borderBottom:`1px solid ${G.g200}`, flexShrink:0, overflowX:"auto", alignItems:"center" }}>
        {[
          {label:"Total",    value:stats.total,    color:G.g700,                 bg:G.g100},
          {label:"Nouveaux", value:stats.recu,     color:STATUTS.recu.color,     bg:STATUTS.recu.bg},
          {label:"En cours", value:stats.en_cours, color:STATUTS.en_cours.color, bg:STATUTS.en_cours.bg},
          {label:"Résolus",  value:stats.resolu,   color:STATUTS.resolu.color,   bg:STATUTS.resolu.bg},
          {label:"⚠️ Danger",value:stats.danger,   color:"#dc2626",              bg:"#fef2f2"},
          {label:"Ce mois",  value:stats.ce_mois,  color:"#9333ea",              bg:"#faf5ff"},
        ].map((s,i)=>(
          <div key={i} style={{ background:s.bg, borderRadius:10, padding:"7px 14px",
            display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
            <span style={{ fontSize:20, fontWeight:800, color:s.color }}>{s.value}</span>
            <span style={{ fontSize:12, color:s.color, fontWeight:500 }}>{s.label}</span>
          </div>
        ))}
        <div style={{ marginLeft:"auto", display:"flex", gap:8, flexShrink:0 }}>
          {[
            {val:filterUrgence, set:setFilterUrgence, opts:[["tous","Toutes urgences"],...Object.entries(URGENCES).map(([k,v])=>[k,`${v.icon} ${v.label}`])]},
            {val:filterCat,     set:setFilterCat,     opts:[["tous","Toutes catégories"],...CATEGORIES.map(c=>[c.id,`${c.icon} ${c.label}`])]},
            {val:filterStatut,  set:setFilterStatut,  opts:[["tous","Tous statuts"],...Object.entries(STATUTS).map(([k,v])=>[k,v.label])]},
          ].map((f,i)=>(
            <select key={i} value={f.val} onChange={e=>f.set(e.target.value)}
              style={{ border:`1px solid ${G.g200}`, borderRadius:8, padding:"5px 8px",
                fontSize:12, outline:"none", background:"#fff", color:G.g700 }}>
              {f.opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
          ))}
        </div>
      </div>

      {/* Liste signalements */}
      <div style={{ flex:1, overflow:"hidden", minHeight:0, overflowY:"auto" }}>
        {loading && signalements.length===0 ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", gap:12 }}>
            <div style={{ width:24, height:24, borderRadius:"50%", border:`3px solid ${G.g200}`,
              borderTopColor:G.vert, animation:"spin 0.7s linear infinite" }}/>
            <span style={{ color:G.g500 }}>Chargement…</span>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : filtered.length===0 ? (
          <div style={{ textAlign:"center", padding:"64px 24px", color:G.g400 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
            <div style={{ fontSize:16, fontWeight:600 }}>Aucun signalement avec ces filtres</div>
          </div>
        ) : (
          <div style={{ padding:16 }}>
            {filtered.map((sig,idx)=>{
              const cat = CATEGORIES.find(c=>c.id===sig.categorie)||CATEGORIES[5];
              return (
                <div key={sig.id} onClick={()=>setSelected(sig.id)}
                  style={{ background:"#fff", borderRadius:14, padding:"14px 16px", marginBottom:10,
                    cursor:"pointer", border:`2px solid ${G.g100}`,
                    boxShadow:"0 2px 8px rgba(0,0,0,0.04)", transition:"all 0.15s", position:"relative" }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=G.vert;e.currentTarget.style.boxShadow=`0 4px 16px ${G.vert}22`;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=G.g100;e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.04)";}}>
                  {idx===0&&sig.urgence==="dangereux"&&(
                    <div style={{ position:"absolute", top:-1, right:12, background:"#dc2626",
                      color:"#fff", fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:"0 0 8px 8px" }}>PRIORITÉ</div>
                  )}
                  <div style={{ display:"flex", alignItems:"flex-start", gap:12 }}>
                    <CatIcon id={sig.categorie} size={42}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4, gap:6, flexWrap:"wrap" }}>
                        <div style={{ fontSize:14, fontWeight:700, color:G.g900 }}>{cat.label}</div>
                        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                          <BadgeUrgence urgence={sig.urgence}/>
                          <Badge statut={sig.statut}/>
                        </div>
                      </div>
                      <div style={{ fontSize:12, color:G.g500, marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        📍 {sig.adresse}
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:12, fontSize:12, color:G.g400 }}>
                        <span>{sig.ref} · {sig.created_at?.slice(0,10)}</span>
                        {(sig.votes||0)>0 && (
                          <span style={{ background:"#fef3c7", color:"#92400e", padding:"1px 7px", borderRadius:10, fontWeight:700, fontSize:11 }}>
                            👍 {sig.votes}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ color:G.g400, fontSize:18, flexShrink:0, alignSelf:"center" }}>›</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedSig && (
        <PanneauDetail
          sig={selectedSig}
          techniciens={techniciens}
          onClose={()=>setSelected(null)}
          onUpdate={updated => setSignalements(p => p.map(s => s.id===updated.id ? updated : s))}
        />
      )}

      {showTech && (
        <ModalTechniciens
          communeId={user.commune_id}
          techniciens={techniciens}
          setTechniciens={setTechniciens}
          onClose={()=>setShowTech(false)}
        />
      )}
    </div>
  );
}
