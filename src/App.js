// ============================================================
// MAVILLESAINE — Back-office Superviseur (React Web)
// ============================================================
// INSTALLATION :
//   npx create-react-app backoffice
//   cd backoffice
//   npm install axios react-router-dom @tanstack/react-query
//              jspdf react-hot-toast lucide-react
//
// Remplacez API_URL par l'URL de votre backend
// ============================================================

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

const API_URL = "https://mavillesaine-backend.onrender.com/api";

// ── Helpers ───────────────────────────────────────────────────
const api = axios.create({ baseURL: API_URL });
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem("mvp_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

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

function BadgeUrgence({ urgence, ia }) {
  const u = URGENCES[urgence] || URGENCES.normal;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 8px",
      borderRadius:20, background:u.bg, color:u.color, fontSize:11, fontWeight:700,
      border:`1px solid ${u.border}`, whiteSpace:"nowrap" }}>
      {u.icon} {u.label}{ia && <span style={{ fontSize:9, opacity:0.7 }}> ·IA</span>}
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
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("mvp_token", data.token);
      localStorage.setItem("mvp_user",  JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err.response?.data?.error || "Identifiants incorrects");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(135deg,${G.g900},#1a3a2a)`,
      display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Outfit',system-ui,sans-serif" }}>
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
            { label:"Email", type:"email",    val:email,    set:setEmail,    ph:"admin@mavillesaine.fr" },
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
              fontSize:15, fontWeight:700, cursor:loading?"wait":"pointer",
              boxShadow:!loading&&email&&password?`0 6px 20px ${G.vert}44`:"none" }}>
            {loading ? "Connexion…" : "Se connecter →"}
          </button>
        </form>
        <div style={{ textAlign:"center", fontSize:12, color:G.g400, marginTop:16 }}>
          Démo : admin@mavillesaine.fr / Admin123!
        </div>
      </div>
    </div>
  );
}

// ── Modal TECHNICIENS ─────────────────────────────────────────

function ModalTechniciens({ techniciens, onSave, onClose }) {
  const [liste, setListe]   = useState([...techniciens]);
  const [form, setForm]     = useState({ nom:"", specialite:"", telephone:"", email:"", couleur:"#2563eb" });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const couleurs = ["#e05c00","#2a9d3a","#2563eb","#9333ea","#d4a000","#0891b2","#dc2626","#64748b"];

  const handleSave = async () => {
    if (!form.nom.trim()) return;
    setLoading(true);
    try {
      if (editId) {
        const { data } = await api.put(`/techniciens/${editId}`, form);
        setListe(p => p.map(t => t.id===editId ? data : t));
        setEditId(null);
      } else {
        const { data } = await api.post("/techniciens", form);
        setListe(p => [...p, data]);
      }
      setForm({ nom:"", specialite:"", telephone:"", email:"", couleur:"#2563eb" });
      toast.success(editId ? "Technicien modifié" : "Technicien ajouté");
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur");
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce technicien ?")) return;
    try {
      await api.delete(`/techniciens/${id}`);
      setListe(p => p.filter(t => t.id!==id));
      toast.success("Technicien supprimé");
    } catch { toast.error("Erreur lors de la suppression"); }
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
          {/* Formulaire */}
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

          {/* Liste */}
          <div style={{ fontSize:14, fontWeight:700, color:G.g900, marginBottom:12 }}>
            Techniciens ({liste.length})
          </div>
          {liste.length === 0 && (
            <div style={{ textAlign:"center", padding:"24px", color:G.g400, fontSize:13 }}>
              Aucun technicien — ajoutez-en un ci-dessus
            </div>
          )}
          {liste.map(t => (
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
          <button onClick={()=>onSave(liste)}
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
  const [telLibre, setTelLibre]     = useState("");
  const [modeEnvoi, setModeEnvoi]   = useState("tech");
  const [selectedTech, setSelectedTech] = useState(null);
  const [showEnvoi, setShowEnvoi]   = useState(false);
  const [loadingStatut, setLoadingStatut] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);

  const cat = CATEGORIES.find(c=>c.id===sig.categorie) || CATEGORIES[5];
  const urg = URGENCES[sig.urgence] || URGENCES.normal;

  const updateStatut = async (statut) => {
    setLoadingStatut(true);
    try {
      const { data } = await api.patch(`/signalements/${sig.id}`, { statut });
      onUpdate(data.signalement);
      toast.success(`Statut mis à jour : ${STATUTS[statut].label}`);
    } catch { toast.error("Erreur lors de la mise à jour"); }
    finally { setLoadingStatut(false); }
  };

  const updateUrgence = async (urgence) => {
    try {
      const { data } = await api.patch(`/signalements/${sig.id}`, { urgence });
      onUpdate(data.signalement);
      toast.success("Urgence mise à jour");
    } catch { toast.error("Erreur"); }
  };

  const genererEtEnvoyer = async () => {
    setLoadingPDF(true);
    try {
      // Générer PDF
      if (!window.jspdf) {
        await new Promise((res,rej) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
          s.onload=res; s.onerror=rej; document.head.appendChild(s);
        });
      }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
      const W=210, M=15;

      doc.setFillColor(10,22,40); doc.rect(0,0,W,38,"F");
      doc.setTextColor(255,255,255); doc.setFontSize(18); doc.setFont("helvetica","bold");
      doc.text("MaVilleSaine",M,16);
      doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.setTextColor(150,200,150);
      doc.text("BON D'INTERVENTION TECHNIQUE",M,23);
      doc.setTextColor(180,180,180);
      doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`,M,29);
      doc.setTextColor(255,255,255); doc.setFontSize(11); doc.setFont("helvetica","bold");
      doc.text(sig.ref,W-M,16,{align:"right"});

      let y=48;
      const urgColors={normal:[22,163,74],genant:[180,83,9],dangereux:[220,38,38]};
      const [r,g,b]=urgColors[sig.urgence]||urgColors.normal;
      doc.setFillColor(r,g,b); doc.roundedRect(M,y-5,60,10,2,2,"F");
      doc.setTextColor(255,255,255); doc.setFontSize(9); doc.setFont("helvetica","bold");
      doc.text(`URGENCE : ${urg.label.toUpperCase()}`,M+4,y+1);
      y+=14;

      doc.setFillColor(248,250,252); doc.rect(M,y,W-M*2,30,"F");
      doc.setDrawColor(226,232,240); doc.rect(M,y,W-M*2,30,"S");
      doc.setTextColor(100,116,139); doc.setFontSize(7); doc.setFont("helvetica","bold");
      doc.text("LOCALISATION",M+4,y+6);
      doc.setTextColor(15,23,42); doc.setFontSize(11); doc.setFont("helvetica","bold");
      doc.text(sig.adresse||"",M+4,y+14);
      doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(100,116,139);
      doc.text(`Catégorie : ${cat.label}   |   Date : ${sig.created_at?.slice(0,10)}   |   Votes : ${sig.votes||0}`,M+4,y+21);
      doc.text(`GPS : ${sig.latitude}, ${sig.longitude}`,M+4,y+27);
      y+=36;

      if (sig.description) {
        doc.setFillColor(255,255,255); doc.rect(M,y,W-M*2,22,"F");
        doc.setDrawColor(226,232,240); doc.rect(M,y,W-M*2,22,"S");
        doc.setTextColor(100,116,139); doc.setFontSize(7); doc.setFont("helvetica","bold");
        doc.text("DESCRIPTION",M+4,y+6);
        doc.setTextColor(51,65,85); doc.setFontSize(9); doc.setFont("helvetica","normal");
        doc.text(doc.splitTextToSize(sig.description,W-M*2-8).slice(0,2),M+4,y+13);
        y+=28;
      }

      // Photos placeholder
      doc.setTextColor(100,116,139); doc.setFontSize(7); doc.setFont("helvetica","bold");
      doc.text("PHOTOS",M,y+5); y+=10;
      const pW=(W-M*2-6)/2, pH=55;
      for (let i=0;i<2;i++) {
        const photoUrl = i===0 ? sig.photo_detail_url : sig.photo_large_url;
        doc.setFillColor(241,245,249); doc.rect(M+i*(pW+6),y,pW,pH,"F");
        doc.setDrawColor(226,232,240); doc.rect(M+i*(pW+6),y,pW,pH,"S");
        doc.setFillColor(0,0,0); doc.rect(M+i*(pW+6),y+pH-8,pW,8,"F");
        doc.setTextColor(255,255,255); doc.setFontSize(7);
        doc.text(i===0?"Photo détail":"Vue d'ensemble",M+i*(pW+6)+3,y+pH-3);
        if (!photoUrl) {
          doc.setTextColor(148,163,184); doc.setFontSize(8);
          doc.text(i===0?"Photo détail":"Vue large",M+i*(pW+6)+pW/2,y+pH/2,{align:"center"});
        }
      }
      y+=pH+10;

      // Technicien assigné
      const tech = selectedTech || techniciens.find(t=>t.id===sig.technicien_id);
      if (tech) {
        doc.setFillColor(232,245,238); doc.rect(M,y,W-M*2,30,"F");
        doc.setDrawColor(134,239,172); doc.rect(M,y,W-M*2,30,"S");
        doc.setTextColor(100,116,139); doc.setFontSize(7); doc.setFont("helvetica","bold");
        doc.text("TECHNICIEN ASSIGNÉ",M+4,y+6);
        doc.setTextColor(15,23,42); doc.setFontSize(11); doc.setFont("helvetica","bold");
        doc.text(tech.nom,M+4,y+14);
        doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(51,65,85);
        if (tech.specialite) doc.text(`Spécialité : ${tech.specialite}`,M+4,y+20);
        doc.text([tech.telephone,tech.email].filter(Boolean).join("   |   "),M+4,y+26);
        y+=36;
      } else if (telLibre) {
        doc.setFillColor(232,245,238); doc.rect(M,y,W-M*2,20,"F");
        doc.setTextColor(15,23,42); doc.setFontSize(11); doc.setFont("helvetica","bold");
        doc.text(`Destinataire : ${telLibre}`,M+4,y+12);
        y+=26;
      }

      // Actions
      doc.setFillColor(255,255,255); doc.rect(M,y,W-M*2,34,"F");
      doc.setDrawColor(226,232,240); doc.rect(M,y,W-M*2,34,"S");
      doc.setTextColor(100,116,139); doc.setFontSize(7); doc.setFont("helvetica","bold");
      doc.text("ACTIONS À RÉALISER",M+4,y+6);
      ["☐  Vérifier et sécuriser le site","☐  Réaliser les travaux nécessaires",
       "☐  Documenter l'intervention","☐  Mettre à jour le statut dans MaVilleSaine"].forEach((l,i)=>{
        doc.setTextColor(51,65,85); doc.setFontSize(8); doc.setFont("helvetica","normal");
        doc.text(l,M+4,y+13+i*5);
      });
      y+=40;

      // Signatures
      doc.setFillColor(248,250,252); doc.rect(M,y,W-M*2,28,"F");
      doc.setDrawColor(226,232,240); doc.rect(M,y,W-M*2,28,"S");
      const cW=(W-M*2)/3;
      ["Superviseur","Technicien","Date d'intervention"].forEach((l,i)=>{
        doc.setTextColor(100,116,139); doc.setFontSize(7); doc.setFont("helvetica","bold");
        doc.text(l.toUpperCase(),M+4+i*cW,y+6);
        doc.setDrawColor(203,213,225);
        doc.line(M+4+i*cW,y+20,M+4+i*cW+cW-8,y+20);
      });

      doc.setFillColor(10,22,40); doc.rect(0,282,W,15,"F");
      doc.setTextColor(100,100,100); doc.setFontSize(7);
      doc.text("MaVilleSaine © 2026 · Document confidentiel · mavillesaine.fr",W/2,291,{align:"center"});

      doc.save(`bon-intervention-${sig.ref}.pdf`);
      setShowEnvoi(true);
      toast.success("PDF généré avec succès !");
    } catch(err) {
      toast.error("Erreur lors de la génération du PDF : " + err.message);
    } finally { setLoadingPDF(false); }
  };

  const destinataire = modeEnvoi==="tech" ? selectedTech : (telLibre ? { nom:null, tel:telLibre } : null);
  const msgTexte = `🔧 BON D'INTERVENTION ${sig.ref}\n📍 ${sig.adresse}\n🏷️ ${cat.label} — ${urg.label}\n📅 ${sig.created_at?.slice(0,10)}\n👷 ${destinataire?.nom||telLibre||"Non assigné"}\n📝 ${sig.description||"Aucune description"}\n🌐 MaVilleSaine`;
  const tel = (destinataire?.telephone||destinataire?.tel||"").replace(/\s/g,"").replace(/^0/,"+33");

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:200, backdropFilter:"blur(2px)" }}/>
      <div style={{ position:"fixed", top:0, right:0, bottom:0, width:"min(700px,94vw)", background:"#fff",
        zIndex:201, display:"flex", flexDirection:"column", boxShadow:"-8px 0 40px rgba(0,0,0,0.2)",
        animation:"slideIn 0.22s ease-out", fontFamily:"'Outfit',system-ui,sans-serif" }}>
        <style>{`@keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

        {/* Header */}
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
            <BadgeUrgence urgence={sig.urgence} ia={sig.urgence_ia}/>
            <Badge statut={sig.statut}/>
          </div>
          <div onClick={onClose} style={{ color:"rgba(255,255,255,0.5)", cursor:"pointer", fontSize:22, padding:"0 4px", flexShrink:0 }}>✕</div>
        </div>

        {/* Corps */}
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
              {icon:"📍",label:"Adresse",value:sig.adresse},
              {icon:"📅",label:"Date",value:`${sig.created_at?.slice(0,10)} à ${sig.created_at?.slice(11,16)}`},
              {icon:"🧭",label:"GPS",value:`${sig.latitude}°N · ${sig.longitude}°E`},
              {icon:"👍",label:"Confirmations",value:`${sig.votes||0} citoyen${(sig.votes||0)>1?"s":""}${(sig.votes||0)>=5?" — ⚠️ Priorité haute":""}`},
            ].map((it,i)=>(
              <div key={i} style={{ display:"flex", gap:12, marginBottom:i<3?12:0, alignItems:"flex-start" }}>
                <span style={{ fontSize:16, width:22, flexShrink:0, marginTop:2 }}>{it.icon}</span>
                <div>
                  <div style={{ fontSize:11, color:G.g400, fontWeight:600, textTransform:"uppercase", letterSpacing:0.3 }}>{it.label}</div>
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
            <div style={{ fontSize:12, color:G.g500, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8, display:"flex", alignItems:"center", gap:8 }}>
              Urgence
              {sig.urgence_ia && <span style={{ background:"#eff6ff", color:"#2563eb", fontSize:10, fontWeight:600, padding:"2px 7px", borderRadius:8 }}>🤖 IA</span>}
            </div>
            <div style={{ display:"flex", gap:10 }}>
              {Object.entries(URGENCES).map(([key,u])=>(
                <div key={key} onClick={()=>updateUrgence(key)}
                  style={{ flex:1, padding:"12px 8px", borderRadius:12, border:`2px solid ${sig.urgence===key?u.border:G.g200}`,
                    background:sig.urgence===key?u.bg:"#fff", cursor:"pointer", textAlign:"center", transition:"all 0.15s" }}>
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
                    fontSize:13, fontWeight:700, cursor:"pointer", transition:"all 0.15s" }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Assigner technicien */}
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:12, color:G.g500, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5, marginBottom:12 }}>
              Assigner / Envoyer à
            </div>
            {/* Tabs */}
            <div style={{ display:"flex", background:G.g100, borderRadius:10, padding:"3px", marginBottom:14 }}>
              {[["tech","👷 Technicien enregistré"],["libre","📱 Numéro libre"]].map(([id,label])=>(
                <div key={id} onClick={()=>setModeEnvoi(id)}
                  style={{ flex:1, padding:"8px", textAlign:"center", borderRadius:8, cursor:"pointer",
                    background:modeEnvoi===id?"#fff":"transparent", color:modeEnvoi===id?G.g900:G.g500,
                    fontSize:12, fontWeight:600, transition:"all 0.15s",
                    boxShadow:modeEnvoi===id?"0 1px 4px rgba(0,0,0,0.1)":"none" }}>
                  {label}
                </div>
              ))}
            </div>

            {modeEnvoi==="tech" && (
              techniciens.length===0
                ? <div style={{ background:"#fffbeb", borderRadius:12, padding:16, border:"1px solid #fcd34d", textAlign:"center", fontSize:13, color:"#92400e" }}>
                    Aucun technicien — utilisez le bouton "Gérer les techniciens"
                  </div>
                : <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {techniciens.map(t=>(
                      <div key={t.id} onClick={()=>setSelectedTech(selectedTech?.id===t.id?null:t)}
                        style={{ background:selectedTech?.id===t.id?G.vertClair:"#fff",
                          border:`2px solid ${selectedTech?.id===t.id?G.vert:G.g200}`,
                          borderRadius:12, padding:"13px 14px", display:"flex", alignItems:"center", gap:12, cursor:"pointer", transition:"all 0.15s" }}>
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
                <div style={{ fontSize:12, color:G.g400, marginBottom:10, lineHeight:1.5 }}>
                  Envoyez à n'importe quel numéro, même sans technicien enregistré.
                </div>
                <input type="tel" value={telLibre} onChange={e=>setTelLibre(e.target.value)}
                  placeholder="06 00 00 00 00"
                  style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:`2px solid ${telLibre?G.vert:G.g200}`,
                    fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"inherit" }}
                  onFocus={e=>e.target.style.borderColor=G.vert}
                  onBlur={e=>e.target.style.borderColor=telLibre?G.vert:G.g200}
                />
                {telLibre && <div style={{ fontSize:12, color:G.vert, marginTop:8, fontWeight:600 }}>✓ Numéro prêt</div>}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:"16px 24px", borderTop:`1px solid ${G.g200}`, background:"#fff", flexShrink:0 }}>
          <button onClick={genererEtEnvoyer} disabled={loadingPDF}
            style={{ width:"100%", padding:16, borderRadius:14, border:"none",
              background:loadingPDF?G.g200:G.g900, color:loadingPDF?G.g400:"#fff",
              fontSize:15, fontWeight:700, cursor:loadingPDF?"wait":"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
            {loadingPDF ? <><span style={{ width:18, height:18, borderRadius:"50%", border:"2px solid #94a3b8", borderTopColor:"transparent", display:"inline-block", animation:"spin 0.7s linear infinite" }}/> Génération…</> : "🚧 Générer le bon d'intervention & Envoyer"}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Modal canaux envoi */}
      {showEnvoi && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:1000,
          display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(4px)" }}>
          <div style={{ background:"#fff", borderRadius:20, width:500, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 32px 80px rgba(0,0,0,0.4)" }}>
            <div style={{ background:G.g900, borderRadius:"20px 20px 0 0", padding:"18px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ fontSize:16, fontWeight:800, color:"#fff" }}>📤 Envoyer le bon d'intervention</div>
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
              <div style={{ fontSize:13, fontWeight:700, color:G.g700, marginBottom:12 }}>Envoyer via :</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {[
                  {label:"Email",     icon:"📧", color:"#2563eb", action:()=>window.open(`mailto:${destinataire?.email||""}?subject=Bon d'intervention ${sig.ref}&body=${encodeURIComponent(msgTexte)}`)},
                  {label:"SMS",       icon:"💬", color:"#16a34a", action:()=>window.open(`sms:${tel}?body=${encodeURIComponent(msgTexte)}`)},
                  {label:"WhatsApp",  icon:"🟢", color:"#25D366", action:()=>window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msgTexte)}`)},
                  {label:"Telegram",  icon:"✈️", color:"#2AABEE", action:()=>window.open(`https://t.me/share/url?url=mavillesaine.fr&text=${encodeURIComponent(msgTexte)}`)},
                  {label:"Messenger", icon:"💙", color:"#0084FF", action:()=>window.open(`https://m.me/?text=${encodeURIComponent(msgTexte)}`)},
                  {label:"Copier",    icon:"📋", color:"#64748b", action:()=>{navigator.clipboard?.writeText(msgTexte);toast.success("Copié !");}},
                ].map(c=>(
                  <div key={c.label} onClick={c.action}
                    style={{ background:"#fff", border:`2px solid ${G.g200}`, borderRadius:12, padding:"12px 14px",
                      display:"flex", alignItems:"center", gap:10, cursor:"pointer", transition:"all 0.15s" }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=c.color;e.currentTarget.style.background=c.color+"0a";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=G.g200;e.currentTarget.style.background="#fff";}}>
                    <span style={{ fontSize:20 }}>{c.icon}</span>
                    <div style={{ fontSize:13, fontWeight:700, color:G.g900 }}>{c.label}</div>
                    <div style={{ marginLeft:"auto", fontSize:14, color:G.g300 }}>›</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize:11, color:G.g400, marginTop:12, textAlign:"center", lineHeight:1.5 }}>
                SMS et WhatsApp ouvrent votre app native avec le message pré-rempli.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── APPLICATION BACK-OFFICE ───────────────────────────────────

export default function BackOffice() {
  const [user, setUser]                   = useState(() => {
    const u = localStorage.getItem("mvp_user");
    return u ? JSON.parse(u) : null;
  });
  const [signalements, setSignalements]   = useState([]);
  const [techniciens, setTechniciens]     = useState([]);
  const [stats, setStats]                 = useState(null);
  const [selected, setSelected]           = useState(null);
  const [activeTab, setActiveTab]         = useState("liste");
  const [filterStatut, setFilterStatut]   = useState("tous");
  const [filterCat, setFilterCat]         = useState("tous");
  const [filterUrgence, setFilterUrgence] = useState("tous");
  const [showTech, setShowTech]           = useState(false);
  const [loading, setLoading]             = useState(false);

  const charger = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [sigRes, techRes, statsRes] = await Promise.all([
        api.get("/signalements"),
        api.get("/techniciens"),
        api.get("/stats"),
      ]);
      setSignalements(sigRes.data.signalements || []);
      setTechniciens(techRes.data || []);
      setStats(statsRes.data);
    } catch (err) {
      toast.error("Erreur de chargement : " + (err.response?.data?.error || err.message));
    } finally { setLoading(false); }
  }, [user]);

  useEffect(() => { charger(); }, [charger]);

  if (!user) return <LoginScreen onLogin={u => { setUser(u); charger(); }} />;

  const filtered = signalements.filter(s=>
    (filterStatut==="tous"  || s.statut===filterStatut) &&
    (filterCat==="tous"     || s.categorie===filterCat) &&
    (filterUrgence==="tous" || s.urgence===filterUrgence)
  ).sort((a,b)=>{
    const scores={dangereux:3,genant:2,normal:1};
    if ((scores[b.urgence]||0)!==(scores[a.urgence]||0)) return (scores[b.urgence]||0)-(scores[a.urgence]||0);
    return (b.votes||0)-(a.votes||0);
  });

  const selectedSig = signalements.find(s=>s.id===selected);

  const handleUpdate = (updated) => {
    setSignalements(p => p.map(s => s.id===updated.id ? updated : s));
  };

  const logout = () => {
    localStorage.removeItem("mvp_token");
    localStorage.removeItem("mvp_user");
    setUser(null);
  };

  return (
    <div style={{ width:"100vw", height:"100vh", display:"flex", flexDirection:"column",
      fontFamily:"'Outfit','DM Sans',system-ui,sans-serif", background:G.g50, overflow:"hidden" }}>
      <Toaster position="top-right" />

      {/* Header */}
      <div style={{ background:G.g900, height:56, padding:"0 24px", display:"flex",
        alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:28, height:28, background:G.vert, borderRadius:8,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>🏙️</div>
          <span style={{ color:"#fff", fontWeight:800, fontSize:15 }}>MaVilleSaine</span>
          <span style={{ background:"rgba(255,255,255,0.1)", color:"rgba(255,255,255,0.5)",
            fontSize:11, padding:"2px 8px", borderRadius:6 }}>Superviseur</span>
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
          {label:"Total",    value:stats?.total||0,    color:G.g700,                    bg:G.g100},
          {label:"Nouveaux", value:stats?.recu||0,     color:STATUTS.recu.color,        bg:STATUTS.recu.bg},
          {label:"En cours", value:stats?.en_cours||0, color:STATUTS.en_cours.color,    bg:STATUTS.en_cours.bg},
          {label:"Résolus",  value:stats?.resolu||0,   color:STATUTS.resolu.color,      bg:STATUTS.resolu.bg},
          {label:"⚠️ Danger",value:stats?.danger||0,   color:"#dc2626",                 bg:"#fef2f2"},
          {label:"Ce mois",  value:stats?.ce_mois||0,  color:"#9333ea",                 bg:"#faf5ff"},
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

      {/* Contenu */}
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
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                        marginBottom:4, gap:6, flexWrap:"wrap" }}>
                        <div style={{ fontSize:14, fontWeight:700, color:G.g900 }}>
                          {cat.label}
                        </div>
                        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                          <BadgeUrgence urgence={sig.urgence} ia={sig.urgence_ia}/>
                          <Badge statut={sig.statut}/>
                        </div>
                      </div>
                      <div style={{ fontSize:12, color:G.g500, marginBottom:4,
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        📍 {sig.adresse}
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:12, fontSize:12, color:G.g400 }}>
                        <span>{sig.ref} · {sig.created_at?.slice(0,10)} {sig.created_at?.slice(11,16)}</span>
                        {(sig.votes||0)>0 && (
                          <span style={{ background:"#fef3c7", color:"#92400e",
                            padding:"1px 7px", borderRadius:10, fontWeight:700, fontSize:11 }}>
                            👍 {sig.votes}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ color:G.g300, fontSize:18, flexShrink:0, alignSelf:"center" }}>›</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Panneau détail */}
      {selectedSig && (
        <PanneauDetail
          sig={selectedSig}
          techniciens={techniciens}
          onClose={()=>setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}

      {/* Modal techniciens */}
      {showTech && (
        <ModalTechniciens
          techniciens={techniciens}
          onSave={liste=>{ setTechniciens(liste); setShowTech(false); }}
          onClose={()=>setShowTech(false)}
        />
      )}
    </div>
  );
}
